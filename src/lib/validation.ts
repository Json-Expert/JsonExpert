import { z } from 'zod';
import { VALIDATION, ERROR_MESSAGES, FILE_LIMITS } from './app-constants';

export const fileUploadSchema = z.object({
  name: z.string(),
  size: z.number().max(50 * 1024 * 1024, 'File size must be less than 50MB'),
  type: z.string().optional(),
});

export const urlFetchSchema = z.object({
  url: z.string().url('Invalid URL'),
  headers: z.record(z.string(), z.string()).optional(),
  timeout: z.number().min(1000).max(30000).optional().default(10000),
});

export const exportOptionsSchema = z.object({
  format: z.enum(['json', 'csv', 'png', 'svg', 'pdf']),
  fileName: z.string().optional(),
  quality: z.number().min(0.1).max(1).optional().default(1),
  prettify: z.boolean().optional().default(true),
});

export function validateFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  try {
    // Basic schema validation
    fileUploadSchema.parse({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    
    // Enhanced file validation
    const extension = file.name.toLowerCase().split('.').pop();
    const validExtensions = ['json', 'geojson', 'txt', 'jsonl', 'ndjson'];
    const validMimeTypes = [
      'application/json',
      'application/geo+json',
      'text/plain',
      'application/x-ndjson',
      '', // Some systems don't set MIME type
    ];
    
    // Check extension
    if (!validExtensions.includes(extension || '')) {
      return {
        isValid: false,
        error: `File must have one of these extensions: ${validExtensions.join(', ')}`,
      };
    }
    
    // Check MIME type if provided
    if (file.type && !validMimeTypes.includes(file.type)) {
      // Allow if extension is valid even if MIME type is unusual
      if (!validExtensions.includes(extension || '')) {
        return {
          isValid: false,
          error: `Unsupported file type: ${file.type}`,
        };
      }
    }
    
    // Check for suspicious file names
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      return {
        isValid: false,
        error: 'Invalid file name',
      };
    }
    
    // Warn about very small files that might be empty
    if (file.size === 0) {
      return {
        isValid: false,
        error: 'File is empty',
      };
    }
    
    if (file.size < 3) { // {} or [] is at least 2 bytes
      return {
        isValid: false,
        error: 'File is too small to contain valid JSON',
      };
    }
    
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.issues[0]?.message || 'Validation error',
      };
    }
    return {
      isValid: false,
      error: 'Invalid file',
    };
  }
}

export const validateJsonString = (jsonString: string): { isValid: boolean; error?: string } => {
  if (!jsonString.trim()) {
    return { isValid: false, error: 'JSON string cannot be empty' };
  }

  try {
    JSON.parse(jsonString);
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : ERROR_MESSAGES.INVALID_JSON 
    };
  }
};

export const validateFileSize = (file: File): { isValid: boolean; error?: string } => {
  if (file.size > FILE_LIMITS.MAX_FILE_SIZE) {
    return { 
      isValid: false, 
      error: ERROR_MESSAGES.FILE_TOO_LARGE 
    };
  }
  return { isValid: true };
};

export const validateFileType = (file: File): { isValid: boolean; error?: string } => {
  const validTypes = ['application/json', 'text/json', 'text/plain'];
  const validExtensions = ['.json', '.txt'];
  
  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
  
  if (!hasValidType && !hasValidExtension) {
    return { 
      isValid: false, 
      error: 'Invalid file type. Please upload a JSON file.' 
    };
  }
  
  return { isValid: true };
};

export const validateUrl = (url: string): { isValid: boolean; error?: string } => {
  if (!url.trim()) {
    return { isValid: false, error: 'URL cannot be empty' };
  }

  try {
    const urlObject = new URL(url);
    if (!['http:', 'https:'].includes(urlObject.protocol)) {
      return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

export const validateTimeout = (timeout: number): { isValid: boolean; error?: string } => {
  if (timeout < 1000) {
    return { isValid: false, error: 'Timeout must be at least 1000ms' };
  }
  if (timeout > 30000) {
    return { isValid: false, error: 'Timeout cannot exceed 30000ms' };
  }
  return { isValid: true };
};

export const validateSearchQuery = (query: string): { isValid: boolean; error?: string } => {
  if (query.length > 0 && query.length < 2) {
    return { 
      isValid: false, 
      error: 'Search query must be at least 2 characters long' 
    };
  }
  return { isValid: true };
};

export const validateRegexPattern = (pattern: string): { isValid: boolean; error?: string } => {
  try {
    new RegExp(pattern);
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: `Invalid regex pattern: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

export const validateJsonDepth = (obj: unknown, depth = 0): { isValid: boolean; error?: string } => {
  if (depth > VALIDATION.MAX_JSON_DEPTH) {
    return { 
      isValid: false, 
      error: `JSON nesting depth exceeds maximum limit of ${VALIDATION.MAX_JSON_DEPTH}` 
    };
  }

  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const result = validateJsonDepth(item, depth + 1);
        if (!result.isValid) {
          return result;
        }
      }
    } else {
      for (const value of Object.values(obj)) {
        const result = validateJsonDepth(value, depth + 1);
        if (!result.isValid) {
          return result;
        }
      }
    }
  }

  return { isValid: true };
};

export const validateObjectSize = (obj: unknown): { isValid: boolean; error?: string } => {
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    const keyCount = Object.keys(obj).length;
    if (keyCount > VALIDATION.MAX_OBJECT_KEYS) {
      return { 
        isValid: false, 
        error: `Object has too many keys (${keyCount}). Maximum allowed: ${VALIDATION.MAX_OBJECT_KEYS}` 
      };
    }
  }
  return { isValid: true };
};

export const validateJsonData = (jsonString: string): { 
  isValid: boolean; 
  error?: string; 
  data?: unknown;
} => {
  const stringValidation = validateJsonString(jsonString);
  if (!stringValidation.isValid) {
    return stringValidation;
  }

  let parsedData: unknown;
  try {
    parsedData = JSON.parse(jsonString);
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : ERROR_MESSAGES.PARSE_ERROR 
    };
  }

  const depthValidation = validateJsonDepth(parsedData);
  if (!depthValidation.isValid) {
    return depthValidation;
  }

  const sizeValidation = validateObjectSize(parsedData);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  return { isValid: true, data: parsedData };
};

export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

export const isSafeString = (str: string): boolean => {
  // Basic XSS prevention - check for potentially dangerous characters
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(str));
};