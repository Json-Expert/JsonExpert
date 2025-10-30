import { useCallback } from 'react';

import { parseError, JsonHeroError, ErrorCodes } from '@/lib/error-handler';
import { useErrorStore } from '@/stores/error-store';
import { useToast } from './useToast';

interface ErrorHandlerOptions {
  /**
   * Whether to show a toast notification for this error
   * @default true
   */
  showToast?: boolean;

  /**
   * Whether to log the error to console
   * @default true in development, false in production
   */
  logError?: boolean;

  /**
   * Custom title for the toast notification
   * If not provided, uses the error code as title
   */
  toastTitle?: string;

  /**
   * Context string describing where the error occurred
   * e.g., 'FileUpload', 'URLFetch', 'JSONParser'
   */
  context?: string;

  /**
   * Whether to track this error in the error store
   * @default true
   */
  trackError?: boolean;

  /**
   * Callback to execute after error is handled
   */
  onError?: (error: JsonHeroError) => void;
}

/**
 * Centralized error handling hook
 *
 * Provides a consistent way to handle errors across the application by:
 * - Parsing raw errors into structured JsonHeroError objects
 * - Displaying user-friendly toast notifications
 * - Logging errors for debugging
 * - Supporting error recovery actions
 *
 * @example
 * ```tsx
 * const { handleError } = useErrorHandler();
 *
 * try {
 *   await fetchData();
 * } catch (error) {
 *   handleError(error, { toastTitle: 'Failed to fetch data' });
 * }
 * ```
 */
export function useErrorHandler() {
  const { error: showErrorToast, showToast } = useToast();
  const addError = useErrorStore((state) => state.addError);

  const handleError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast: shouldShowToast = true,
      logError = import.meta.env.DEV,
      toastTitle,
      context,
      trackError = true,
      onError,
    } = options;

    // Parse the error into structured format
    const parsedError = parseError(error);

    // Track error in store if enabled
    if (trackError) {
      addError(parsedError, context);
    }

    // Log to console in development or if explicitly requested
    if (logError) {
      console.error('[ErrorHandler]', {
        code: parsedError.code,
        message: parsedError.message,
        details: parsedError.details,
        recoverable: parsedError.recoverable,
        context,
        originalError: error,
      });
    }

    // Show toast notification if enabled
    if (shouldShowToast) {
      const title = toastTitle || formatErrorTitle(parsedError.code);

      showErrorToast(
        title,
        parsedError.details || parsedError.message,
        {
          duration: parsedError.recoverable ? 5000 : 8000,
          ...(parsedError.actions && parsedError.actions.length > 0 ? {
            action: {
              label: parsedError.actions[0].label,
              onClick: parsedError.actions[0].action, // Map 'action' to 'onClick'
            },
          } : {}),
        }
      );
    }

    // Execute custom callback if provided
    if (onError) {
      onError(parsedError);
    }

    return parsedError;
  }, [showErrorToast, addError]);

  /**
   * Handle errors with automatic retry logic
   */
  const handleErrorWithRetry = useCallback(async (
    fn: () => Promise<any>,
    options: ErrorHandlerOptions & { maxRetries?: number; retryDelay?: number } = {}
  ) => {
    const { maxRetries = 3, retryDelay = 1000, ...errorOptions } = options;
    let lastError: unknown;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff
          await new Promise(resolve =>
            setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1))
          );
        }
        return await fn();
      } catch (error) {
        lastError = error;

        // Only retry on recoverable errors
        const parsedError = parseError(error);
        if (!parsedError.recoverable) {
          break;
        }
      }
    }

    // All retries failed, handle the error
    return handleError(lastError, errorOptions);
  }, [handleError]);

  /**
   * Wrap an async function with error handling
   */
  const wrapAsync = useCallback(<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: ErrorHandlerOptions = {}
  ) => {
    return async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
      try {
        return await fn(...args);
      } catch (error) {
        handleError(error, options);
        return null;
      }
    };
  }, [handleError]);

  /**
   * Show a success toast notification
   */
  const showSuccess = useCallback((message: string, details?: string) => {
    showToast({
      title: message,
      description: details,
      variant: 'success',
      duration: 3000,
    });
  }, [showToast]);

  return {
    handleError,
    handleErrorWithRetry,
    wrapAsync,
    showSuccess,
    showToast,
  };
}

/**
 * Format error code into user-friendly title
 */
function formatErrorTitle(code: string): string {
  const titles: Record<string, string> = {
    [ErrorCodes.FILE_TOO_LARGE]: 'File Too Large',
    [ErrorCodes.FILE_INVALID_FORMAT]: 'Invalid File Format',
    [ErrorCodes.FILE_READ_ERROR]: 'File Read Error',
    [ErrorCodes.JSON_PARSE_ERROR]: 'JSON Parse Error',
    [ErrorCodes.JSON_INVALID_STRUCTURE]: 'Invalid JSON Structure',
    [ErrorCodes.JSON_TOO_DEEP]: 'JSON Too Deep',
    [ErrorCodes.JSON_CIRCULAR_REFERENCE]: 'Circular Reference',
    [ErrorCodes.NETWORK_ERROR]: 'Network Error',
    [ErrorCodes.CORS_ERROR]: 'CORS Error',
    [ErrorCodes.TIMEOUT_ERROR]: 'Request Timeout',
    [ErrorCodes.AUTH_ERROR]: 'Authentication Error',
    [ErrorCodes.EXPORT_FAILED]: 'Export Failed',
    [ErrorCodes.EXPORT_NOT_SUPPORTED]: 'Export Not Supported',
    [ErrorCodes.MEMORY_ERROR]: 'Memory Error',
    [ErrorCodes.UNKNOWN_ERROR]: 'Error',
  };

  return titles[code] || 'Error';
}
