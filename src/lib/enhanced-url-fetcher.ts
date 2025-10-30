import axios, { AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { z } from 'zod';

import { JsonValue } from '../types/json.types';

import { sanitizeJSONData } from './file-processor';
import { parseJSON } from './json-parser';

export interface EnhancedURLFetchOptions {
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
  useCorsProxy?: boolean;
  authType?: 'none' | 'bearer' | 'apikey' | 'basic' | 'oauth2' | 'custom';
  authValue?: string;
  apiKeyHeader?: string;
  username?: string;
  password?: string;
  oauth2Token?: string;
  oauth2Type?: 'header' | 'query';
  retryAttempts?: number;
  retryDelay?: number;
  followRedirects?: boolean;
  validateSSL?: boolean;
  customProxyUrl?: string;
  acceptedStatusCodes?: number[];
  responseType?: 'json' | 'text' | 'auto';
}

export interface EnhancedURLFetchResult {
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
    redirects?: string[];
    finalUrl?: string;
    contentType?: string;
    encoding?: string;
  };
}

// Enhanced CORS proxy list with health checking
const ENHANCED_CORS_PROXIES = [
  { url: 'https://api.allorigins.win/raw?url=', priority: 1, active: true },
  { url: 'https://cors.bridged.cc/', priority: 2, active: true },
  { url: 'https://proxy.cors.sh/', priority: 3, active: true },
  { url: 'https://thingproxy.freeboard.io/fetch/', priority: 4, active: true },
];

// Enhanced validation schema
const enhancedUrlFetchSchema = z.object({
  url: z.string().url('Invalid URL').refine((url) => {
    // Additional URL validation
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, 'URL must use HTTP or HTTPS protocol'),
  headers: z.record(z.string(), z.string()).optional(),
  timeout: z.number().min(1000).max(120000).optional().default(30000),
  useCorsProxy: z.boolean().optional().default(false),
  authType: z.enum(['none', 'bearer', 'apikey', 'basic', 'oauth2', 'custom']).optional().default('none'),
  authValue: z.string().optional(),
  apiKeyHeader: z.string().optional().default('X-API-Key'),
  username: z.string().optional(),
  password: z.string().optional(),
  oauth2Token: z.string().optional(),
  oauth2Type: z.enum(['header', 'query']).optional().default('header'),
  retryAttempts: z.number().min(0).max(5).optional().default(2),
  retryDelay: z.number().min(100).max(10000).optional().default(1000),
  followRedirects: z.boolean().optional().default(true),
  validateSSL: z.boolean().optional().default(true),
  customProxyUrl: z.string().url().optional(),
  acceptedStatusCodes: z.array(z.number()).optional().default([200, 201, 202, 203, 204, 206]),
  responseType: z.enum(['json', 'text', 'auto']).optional().default('auto'),
});

// Enhanced authentication header builder
function buildEnhancedAuthHeaders(options: z.infer<typeof enhancedUrlFetchSchema>): Record<string, string> {
  const headers: Record<string, string> = { ...options.headers };
  
  switch (options.authType) {
    case 'bearer':
      if (options.authValue) {
        headers['Authorization'] = `Bearer ${options.authValue.trim()}`;
      }
      break;
      
    case 'apikey':
      if (options.authValue && options.apiKeyHeader) {
        headers[options.apiKeyHeader] = options.authValue.trim();
      }
      break;
      
    case 'basic':
      if (options.username && options.password) {
        const credentials = Buffer.from(`${options.username}:${options.password}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      }
      break;
      
    case 'oauth2':
      if (options.oauth2Token) {
        if (options.oauth2Type === 'header') {
          headers['Authorization'] = `Bearer ${options.oauth2Token.trim()}`;
        }
        // Query parameter oauth2 is handled separately
      }
      break;
      
    case 'custom':
      // Custom auth is handled through regular headers
      break;
  }
  
  return headers;
}

// Enhanced CORS error detection
function isEnhancedCorsError(error: AxiosError): boolean {
  if (!error.response && error.request) {
    return true;
  }
  
  const errorMessage = error.message.toLowerCase();
  const corsKeywords = ['cors', 'cross-origin', 'access-control', 'preflight'];
  
  if (corsKeywords.some(keyword => errorMessage.includes(keyword))) {
    return true;
  }
  
  if (error.code && ['ERR_NETWORK', 'ERR_FAILED', 'ECONNREFUSED'].includes(error.code)) {
    return true;
  }
  
  // Check for browser-specific CORS errors
  if (typeof window !== 'undefined' && error.request && !error.response) {
    return true;
  }
  
  return false;
}

// Health check for CORS proxies
async function checkProxyHealth(proxyUrl: string): Promise<boolean> {
  try {
    const testUrl = 'https://api.github.com/';
    const response = await axios.get(proxyUrl + encodeURIComponent(testUrl), {
      timeout: 5000,
      validateStatus: () => true,
    });
    return response.status < 500;
  } catch {
    return false;
  }
}

// Get active CORS proxy
async function getActiveProxies(): Promise<string[]> {
  const activeProxies: string[] = [];
  
  // Check proxy health in parallel
  const healthChecks = ENHANCED_CORS_PROXIES.map(async (proxy) => {
    if (proxy.active) {
      const isHealthy = await checkProxyHealth(proxy.url);
      if (isHealthy) {
        activeProxies.push(proxy.url);
      }
    }
  });
  
  await Promise.all(healthChecks);
  
  // Sort by priority
  return activeProxies.sort((a, b) => {
    const proxyA = ENHANCED_CORS_PROXIES.find(p => p.url === a);
    const proxyB = ENHANCED_CORS_PROXIES.find(p => p.url === b);
    return (proxyA?.priority || 999) - (proxyB?.priority || 999);
  });
}

// Enhanced fetch with retry and circuit breaker
async function enhancedFetchWithRetry(
  url: string,
  config: AxiosRequestConfig,
  options: EnhancedURLFetchOptions
): Promise<{ response: AxiosResponse; redirects: string[] }> {
  let lastError: Error | null = null;
  const maxAttempts = options.retryAttempts || 2;
  const redirects: string[] = [];
  
  // Add redirect interceptor
  const axiosInstance = axios.create();
  
  axiosInstance.interceptors.response.use(
    (response) => {
      if (response.request?.res?.responseUrl && response.request.res.responseUrl !== url) {
        redirects.push(response.request.res.responseUrl);
      }
      return response;
    },
    (error) => Promise.reject(error)
  );
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff
        const delay = Math.min(options.retryDelay! * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const response = await axiosInstance.request({
        ...config,
        url,
        method: 'GET',
      });
      
      return { response, redirects };
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors or specific status codes
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        if (status >= 400 && status < 500 && status !== 429) {
          throw error;
        }
      }
    }
  }
  
  throw lastError;
}

// Enhanced JSON response parser
async function parseEnhancedResponse(
  response: AxiosResponse,
  _responseType: 'json' | 'text' | 'auto'
): Promise<{ data: JsonValue; warnings: string[] }> {
  const warnings: string[] = [];
  let responseData = response.data;
  
  // Handle different content types
  const contentType = response.headers['content-type'] || '';
  
  if (contentType.includes('application/x-ndjson') || contentType.includes('application/jsonl')) {
    // Handle NDJSON/JSONL
    warnings.push('Response is in NDJSON/JSONL format, converting to array');
    const lines = responseData.split('\n').filter((line: string) => line.trim());
    const jsonArray: JsonValue[] = [];
    
    for (const line of lines) {
      try {
        jsonArray.push(JSON.parse(line));
      } catch {
        warnings.push(`Failed to parse NDJSON line: ${line.substring(0, 50)}...`);
      }
    }
    
    return { data: jsonArray, warnings };
  }
  
  // Handle response based on type
  if (typeof responseData === 'string') {
    // Check if it's actually JSON
    const trimmed = responseData.trim();
    
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      // Try to extract JSON from HTML or other formats
      const jsonMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (jsonMatch) {
        warnings.push('Extracted JSON from non-JSON response');
        responseData = jsonMatch[1];
      }
    }
    
    const parseResult = parseJSON(responseData);
    if (!parseResult.isValid) {
      throw new Error(parseResult.error || 'Invalid JSON in response');
    }
    
    return { data: parseResult.data!, warnings };
  } else if (typeof responseData === 'object') {
    // Already parsed
    return { data: responseData, warnings };
  } else {
    throw new Error(`Unexpected response type: ${typeof responseData}`);
  }
}

// Main enhanced fetch function
export async function enhancedFetchJSON(options: EnhancedURLFetchOptions): Promise<EnhancedURLFetchResult> {
  const startTime = performance.now();
  const warnings: string[] = [];
  
  try {
    // Validate and parse options
    const validatedOptions = enhancedUrlFetchSchema.parse(options);
    
    // Build headers with authentication
    const headers = buildEnhancedAuthHeaders(validatedOptions);
    
    // Add default headers
    headers['Accept'] = headers['Accept'] || 'application/json, application/x-ndjson, text/plain, */*';
    headers['User-Agent'] = headers['User-Agent'] || 'JSON-Hero/1.0';
    headers['Cache-Control'] = headers['Cache-Control'] || 'no-cache';
    
    // Handle OAuth2 query parameter
    let fetchUrl = validatedOptions.url;
    if (validatedOptions.authType === 'oauth2' && 
        validatedOptions.oauth2Token && 
        validatedOptions.oauth2Type === 'query') {
      const urlObj = new URL(fetchUrl);
      urlObj.searchParams.set('access_token', validatedOptions.oauth2Token);
      fetchUrl = urlObj.toString();
    }
    
    // Build axios config
    const config: AxiosRequestConfig = {
      timeout: validatedOptions.timeout,
      headers,
      validateStatus: (status) => 
        validatedOptions.acceptedStatusCodes?.includes(status) || false,
      maxRedirects: validatedOptions.followRedirects ? 10 : 0,
      responseType: 'text',
      httpsAgent: validatedOptions.validateSSL ? undefined : {
        rejectUnauthorized: false,
      },
    };
    
    let response: AxiosResponse;
    let redirects: string[] = [];
    let usedCorsProxy = false;
    let finalUrl = fetchUrl;
    
    try {
      if (validatedOptions.useCorsProxy || validatedOptions.customProxyUrl) {
        // Use CORS proxy
        const activeProxies = await getActiveProxies();
        const firstProxy = activeProxies?.[0];
        const proxyUrl = validatedOptions.customProxyUrl || 
                       firstProxy || 
                       ENHANCED_CORS_PROXIES[0]?.url || '';
        
        finalUrl = proxyUrl + encodeURIComponent(fetchUrl);
        const result = await enhancedFetchWithRetry(finalUrl, config, validatedOptions);
        response = result.response;
        redirects = result.redirects;
        usedCorsProxy = true;
        warnings.push(`Used CORS proxy: ${proxyUrl}`);
      } else {
        // Direct fetch
        const result = await enhancedFetchWithRetry(fetchUrl, config, validatedOptions);
        response = result.response;
        redirects = result.redirects;
      }
    } catch (error) {
      // Auto-retry with CORS proxy if needed
      if (axios.isAxiosError(error) && 
          isEnhancedCorsError(error) && 
          !validatedOptions.useCorsProxy &&
          !validatedOptions.customProxyUrl) {
        warnings.push('Direct fetch failed due to CORS, auto-retrying with proxy...');
        
        const activeProxies = await getActiveProxies();
        if (activeProxies.length === 0) {
          throw new Error('No active CORS proxies available');
        }
        
        for (const proxyUrl of activeProxies) {
          try {
            finalUrl = proxyUrl + encodeURIComponent(fetchUrl);
            const result = await enhancedFetchWithRetry(finalUrl, config, validatedOptions);
            response = result.response;
            redirects = result.redirects;
            usedCorsProxy = true;
            warnings.push(`Successfully used CORS proxy: ${proxyUrl}`);
            break;
          } catch (proxyError) {
            warnings.push(`Proxy ${proxyUrl} failed: ${(proxyError as Error).message}`);
            if (proxyUrl === activeProxies[activeProxies.length - 1]) {
              throw new Error('All CORS proxies failed');
            }
          }
        }
      } else {
        throw error;
      }
    }
    
    // Parse response
    const { data: jsonData, warnings: parseWarnings } = await parseEnhancedResponse(
      response!,
      validatedOptions.responseType
    );
    warnings.push(...parseWarnings);
    
    // Sanitize data
    const sanitizedData = sanitizeJSONData(jsonData);
    
    // Build comprehensive metadata
    const metadata = {
      responseTime: performance.now() - startTime,
      statusCode: response!.status,
      headers: response!.headers as Record<string, string>,
      size: JSON.stringify(sanitizedData).length,
      usedCorsProxy,
      redirects: redirects.length > 0 ? redirects : [],
      finalUrl: finalUrl !== fetchUrl ? finalUrl : '',
      contentType: response!.headers['content-type'] || '',
      encoding: response!.headers['content-encoding'] || '',
    };
    
    return {
      success: true,
      data: sanitizedData,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata,
    };
  } catch (error) {
    // Enhanced error handling
    const errorDetails: any = {
      success: false,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
    
    if (error instanceof z.ZodError) {
      errorDetails.error = `Validation error: ${error.issues.map((e: any) => e.message).join(', ')}`;
    } else if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        errorDetails.error = `Request timeout after ${options.timeout || 30000}ms`;
      } else if (error.code === 'ERR_NETWORK') {
        errorDetails.error = 'Network error - check your internet connection or CORS settings';
      } else if (error.response) {
        errorDetails.error = `HTTP ${error.response.status}: ${error.response.statusText}`;
        errorDetails.metadata = {
          responseTime: performance.now() - startTime,
          statusCode: error.response.status,
          headers: error.response.headers as Record<string, string>,
          size: 0,
          usedCorsProxy: false,
        };
        
        // Try to extract error message from response
        if (error.response.data) {
          try {
            const errorData = typeof error.response.data === 'string' 
              ? JSON.parse(error.response.data)
              : error.response.data;
            
            if (errorData.message) {
              errorDetails.error += ` - ${errorData.message}`;
            } else if (errorData.error) {
              errorDetails.error += ` - ${errorData.error}`;
            }
          } catch {
            // Ignore JSON parse errors
          }
        }
      } else {
        errorDetails.error = error.message || 'Unknown network error';
      }
    } else if (error instanceof Error) {
      errorDetails.error = error.message;
    } else {
      errorDetails.error = 'Unknown error occurred';
    }
    
    return errorDetails;
  }
}