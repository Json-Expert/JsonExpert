import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { z } from 'zod';

import { JsonValue } from '../types/json.types';

import { sanitizeJSONData } from './file-processor';
import { parseJSON } from './json-parser';

export interface URLFetchOptions {
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
  useCorsProxy?: boolean;
  authType?: 'none' | 'bearer' | 'apikey' | 'basic' | 'custom';
  authValue?: string;
  apiKeyHeader?: string;
  username?: string;
  password?: string;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface URLFetchResult {
  success: boolean;
  data?: JsonValue;
  error?: string;
  warnings?: string[];
  metadata?: {
    responseTime: number;
    statusCode: number;
    headers: Record<string, string>;
    size: number;
    usedCorsProxy: boolean;
  };
}

const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://cors-anywhere.herokuapp.com/',
  'https://thingproxy.freeboard.io/fetch/',
];

const urlFetchSchema = z.object({
  url: z.string().url('Invalid URL'),
  headers: z.record(z.string(), z.string()).optional(),
  timeout: z.number().min(1000).max(60000).optional().default(30000),
  useCorsProxy: z.boolean().optional().default(false),
  authType: z.enum(['none', 'bearer', 'apikey', 'basic', 'custom']).optional().default('none'),
  authValue: z.string().optional(),
  apiKeyHeader: z.string().optional().default('X-API-Key'),
  username: z.string().optional(),
  password: z.string().optional(),
  retryAttempts: z.number().min(0).max(3).optional().default(1),
  retryDelay: z.number().min(100).max(5000).optional().default(1000),
});

// Build authentication headers based on auth type
function buildAuthHeaders(options: URLFetchOptions): Record<string, string> {
  const headers: Record<string, string> = { ...options.headers };
  
  switch (options.authType) {
    case 'bearer':
      if (options.authValue) {
        headers['Authorization'] = `Bearer ${options.authValue}`;
      }
      break;
      
    case 'apikey':
      if (options.authValue && options.apiKeyHeader) {
        headers[options.apiKeyHeader] = options.authValue;
      }
      break;
      
    case 'basic':
      if (options.username && options.password) {
        const credentials = btoa(`${options.username}:${options.password}`);
        headers['Authorization'] = `Basic ${credentials}`;
      }
      break;
      
    case 'custom':
      // Custom auth is handled through regular headers
      break;
  }
  
  return headers;
}

// Detect if error is CORS-related
function isCorsError(error: AxiosError): boolean {
  if (!error.response && error.request) {
    // Network error without response often indicates CORS
    return true;
  }
  
  if (error.message.toLowerCase().includes('cors')) {
    return true;
  }
  
  // Check for typical CORS error patterns
  if (error.code === 'ERR_NETWORK' || error.code === 'ERR_FAILED') {
    return true;
  }
  
  return false;
}

// Try fetching with different CORS proxies
async function tryWithCorsProxies(
  url: string,
  config: AxiosRequestConfig,
  proxies: string[] = CORS_PROXIES
): Promise<any> {
  const errors: string[] = [];
  
  for (const proxy of proxies) {
    try {
      const proxyUrl = proxy + encodeURIComponent(url);
      const response = await axios.get(proxyUrl, {
        ...config,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'JSON-Hero/1.0',
        },
      });
      return { response, usedProxy: proxy };
    } catch (error) {
      errors.push((error as Error).message);
    }
  }
  
  throw new Error(`All CORS proxies failed. Last error: ${errors[errors.length - 1] ?? 'Unknown error'}`);
}

// Main fetch function with retry logic
async function fetchWithRetry(
  url: string,
  config: AxiosRequestConfig,
  options: URLFetchOptions
): Promise<any> {
  let lastError: Error | null = null;
  const maxAttempts = options.retryAttempts || 1;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      if (attempt > 0) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, options.retryDelay || 1000));
      }
      
      const response = await axios.get(url, config);
      return { response, usedProxy: false };
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (axios.isAxiosError(error) && error.response?.status && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }
    }
  }
  
  throw lastError;
}

// Main URL fetch function
export async function fetchJSON(options: URLFetchOptions): Promise<URLFetchResult> {
  const startTime = performance.now();
  const warnings: string[] = [];
  
  try {
    // Validate options
    const validatedOptions = urlFetchSchema.parse(options);
    
    // Build headers with authentication
    const headers = buildAuthHeaders({
      ...validatedOptions,
      headers: validatedOptions.headers || {},
      authValue: validatedOptions.authValue || '',
      username: validatedOptions.username || '',
      password: validatedOptions.password || ''
    });
    
    // Add default headers
    headers['Accept'] = 'application/json, text/plain, */*';
    headers['User-Agent'] = headers['User-Agent'] || 'JSON-Hero/1.0';
    
    // Axios config
    const config: AxiosRequestConfig = {
      timeout: validatedOptions.timeout,
      headers,
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      maxRedirects: 5,
      responseType: 'text', // Get raw text to handle various encodings
    };
    
    let response: any;
    let usedCorsProxy = false;
    
    try {
      if (validatedOptions.useCorsProxy) {
        // User explicitly wants CORS proxy
        const result = await tryWithCorsProxies(validatedOptions.url, config);
        response = result.response;
        usedCorsProxy = true;
        warnings.push(`Used CORS proxy: ${result.usedProxy}`);
      } else {
        // Try direct fetch first
        const result = await fetchWithRetry(validatedOptions.url, config, {
          ...validatedOptions,
          headers: validatedOptions.headers || {},
          authValue: validatedOptions.authValue || '',
          username: validatedOptions.username || '',
          password: validatedOptions.password || ''
        });
        response = result.response;
      }
    } catch (error) {
      // If direct fetch failed due to CORS, try with proxy
      if (axios.isAxiosError(error) && isCorsError(error) && !validatedOptions.useCorsProxy) {
        warnings.push('Direct fetch failed due to CORS, trying with proxy...');
        const result = await tryWithCorsProxies(validatedOptions.url, config);
        response = result.response;
        usedCorsProxy = true;
        warnings.push(`Used CORS proxy: ${result.usedProxy}`);
      } else {
        throw error;
      }
    }
    
    // Check response status
    if (response.status >= 400) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        metadata: {
          responseTime: performance.now() - startTime,
          statusCode: response.status,
          headers: response.headers,
          size: response.data?.length || 0,
          usedCorsProxy,
        },
      };
    }
    
    // Parse response data
    let jsonData: JsonValue;
    const responseData = response.data;
    
    if (typeof responseData === 'string') {
      // Parse string response
      const parseResult = parseJSON(responseData);
      if (!parseResult.isValid) {
        return {
          success: false,
          error: parseResult.error ?? 'Invalid JSON in response',
          warnings,
        };
      }
      jsonData = parseResult.data!;
    } else {
      // Response is already parsed (axios sometimes does this)
      jsonData = responseData;
    }
    
    // Sanitize data for security
    const sanitizedData = sanitizeJSONData(jsonData);
    
    // Build metadata
    const metadata = {
      responseTime: performance.now() - startTime,
      statusCode: response.status,
      headers: response.headers,
      size: JSON.stringify(sanitizedData).length,
      usedCorsProxy,
    };
    
    return {
      success: true,
      data: sanitizedData,
      warnings: warnings.length > 0 ? warnings : [],
      metadata,
    };
  } catch (error) {
    // Handle various error types
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues[0]?.message ?? 'Invalid parameters'}`,
      };
    }
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: `Request timeout after ${options.timeout || 30000}ms`,
        };
      }
      
      if (error.response) {
        return {
          success: false,
          error: `HTTP ${error.response.status}: ${error.response.statusText}`,
          metadata: {
            responseTime: performance.now() - startTime,
            statusCode: error.response.status,
            headers: error.response.headers as Record<string, string>,
            size: 0,
            usedCorsProxy: false,
          },
        };
      }
      
      if (error.request) {
        return {
          success: false,
          error: 'Network error - please check your connection and try again',
          warnings: ['Consider enabling CORS proxy if this is a cross-origin request'],
        };
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      warnings,
    };
  }
}

// Helper function to test URL accessibility
export async function testURLAccessibility(url: string): Promise<{
  accessible: boolean;
  requiresCorsProxy: boolean;
  error?: string;
}> {
  try {
    // Try HEAD request first (lighter)
    await axios.head(url, { timeout: 5000 });
    return { accessible: true, requiresCorsProxy: false };
  } catch (error) {
    if (axios.isAxiosError(error) && isCorsError(error)) {
      // Try with CORS proxy
      try {
        await axios.head(CORS_PROXIES[0] + encodeURIComponent(url), { timeout: 5000 });
        return { accessible: true, requiresCorsProxy: true };
      } catch {
        return { 
          accessible: false, 
          requiresCorsProxy: true,
          error: 'URL is not accessible even with CORS proxy' 
        };
      }
    }
    
    return { 
      accessible: false, 
      requiresCorsProxy: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}