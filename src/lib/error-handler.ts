export interface AppError {
  code: string;
  message: string;
  details?: string;
  recoverable: boolean;
  actions?: ErrorAction[];
}

export interface ErrorAction {
  label: string;
  action: () => void;
}

export class JsonHeroError extends Error {
  code: string;
  details?: string;
  recoverable: boolean;
  actions?: ErrorAction[];

  constructor(error: AppError) {
    super(error.message);
    this.name = 'JsonHeroError';
    this.code = error.code;
    this.details = error.details || '';
    this.recoverable = error.recoverable;
    this.actions = error.actions || [];
  }
}

// Error codes
export const ErrorCodes = {
  // File errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_INVALID_FORMAT: 'FILE_INVALID_FORMAT',
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  
  // JSON errors
  JSON_PARSE_ERROR: 'JSON_PARSE_ERROR',
  JSON_INVALID_STRUCTURE: 'JSON_INVALID_STRUCTURE',
  JSON_TOO_DEEP: 'JSON_TOO_DEEP',
  JSON_CIRCULAR_REFERENCE: 'JSON_CIRCULAR_REFERENCE',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  CORS_ERROR: 'CORS_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  
  // Export errors
  EXPORT_FAILED: 'EXPORT_FAILED',
  EXPORT_NOT_SUPPORTED: 'EXPORT_NOT_SUPPORTED',
  
  // Memory errors
  MEMORY_ERROR: 'MEMORY_ERROR',
  
  // Unknown errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Error messages
const errorMessages: Record<string, string> = {
  [ErrorCodes.FILE_TOO_LARGE]: 'File size exceeds the maximum allowed size',
  [ErrorCodes.FILE_INVALID_FORMAT]: 'Invalid file format. Please upload a valid JSON file',
  [ErrorCodes.FILE_READ_ERROR]: 'Failed to read the file',
  [ErrorCodes.JSON_PARSE_ERROR]: 'Invalid JSON syntax',
  [ErrorCodes.JSON_INVALID_STRUCTURE]: 'JSON structure is invalid',
  [ErrorCodes.JSON_TOO_DEEP]: 'JSON nesting depth exceeds the maximum allowed',
  [ErrorCodes.JSON_CIRCULAR_REFERENCE]: 'Circular reference detected in JSON',
  [ErrorCodes.NETWORK_ERROR]: 'Network error occurred',
  [ErrorCodes.CORS_ERROR]: 'Cross-origin request blocked',
  [ErrorCodes.TIMEOUT_ERROR]: 'Request timed out',
  [ErrorCodes.AUTH_ERROR]: 'Authentication failed',
  [ErrorCodes.EXPORT_FAILED]: 'Export operation failed',
  [ErrorCodes.EXPORT_NOT_SUPPORTED]: 'Export format not supported',
  [ErrorCodes.MEMORY_ERROR]: 'Insufficient memory to process the data',
  [ErrorCodes.UNKNOWN_ERROR]: 'An unexpected error occurred',
};

// Error handler factory
export function createError(
  code: keyof typeof ErrorCodes,
  details?: string,
  actions?: ErrorAction[]
): JsonHeroError {
  const message = errorMessages[code] || errorMessages[ErrorCodes.UNKNOWN_ERROR];
  const recoverable = isRecoverableError(code);
  
  return new JsonHeroError({
    code,
    message: message || 'Unknown error',
    details,
    recoverable,
    actions,
  });
}

// Check if error is recoverable
function isRecoverableError(code: string): boolean {
  const nonRecoverableErrors = [
    ErrorCodes.MEMORY_ERROR,
    ErrorCodes.JSON_CIRCULAR_REFERENCE,
  ];
  
  return !nonRecoverableErrors.includes(code as any);
}

// Parse different error types
export function parseError(error: unknown): JsonHeroError {
  // Already a JsonHeroError
  if (error instanceof JsonHeroError) {
    return error;
  }
  
  // JSON parse error
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    const match = error.message.match(/position (\d+)/);
    const position = match ? match[1] : 'unknown';
    return createError(
      ErrorCodes.JSON_PARSE_ERROR,
      `Syntax error at position ${position}: ${error.message}`
    );
  }
  
  // Network errors
  if (error instanceof Error) {
    if (error.message.includes('CORS')) {
      return createError(
        ErrorCodes.CORS_ERROR,
        'Enable CORS proxy or check server CORS configuration',
        [
          {
            label: 'Use CORS Proxy',
            action: () => {
              // Action will be handled by the component
            },
          },
        ]
      );
    }
    
    if (error.message.includes('timeout')) {
      return createError(
        ErrorCodes.TIMEOUT_ERROR,
        'The request took too long to complete'
      );
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return createError(
        ErrorCodes.NETWORK_ERROR,
        error.message
      );
    }
  }
  
  // Default unknown error
  return createError(
    ErrorCodes.UNKNOWN_ERROR,
    error instanceof Error ? error.message : String(error)
  );
}

// Global error handler
export function setupGlobalErrorHandler(): void {
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Could send to error tracking service here
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Could send to error tracking service here
  });
}

// Error recovery strategies
export const ErrorRecovery = {
  retry: (fn: () => Promise<any>, maxAttempts = 3, delay = 1000) => {
    return async (): Promise<any> => {
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          if (attempt > 0) {
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
          }
          return await fn();
        } catch (error) {
          lastError = error as Error;
        }
      }
      
      throw lastError;
    };
  },
  
  fallback: <T>(fn: () => T, fallbackValue: T) => {
    try {
      return fn();
    } catch {
      return fallbackValue;
    }
  },
  
  timeout: <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(createError(ErrorCodes.TIMEOUT_ERROR)), ms)
      ),
    ]);
  },
};