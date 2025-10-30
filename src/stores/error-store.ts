import React from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { AppError, JsonHeroError } from '@/lib/error-handler';

export interface ErrorEntry {
  id: string;
  error: AppError;
  timestamp: number;
  context?: string; // Where the error occurred (e.g., 'FileUpload', 'URLFetch')
  resolved: boolean; // Whether the user has dismissed/resolved this error
}

interface ErrorStore {
  // Current active errors
  errors: ErrorEntry[];

  // Error history (persisted)
  errorHistory: ErrorEntry[];

  // Max number of errors to keep in history
  maxHistorySize: number;

  // Actions
  addError: (error: JsonHeroError | AppError, context?: string) => string;
  removeError: (id: string) => void;
  resolveError: (id: string) => void;
  clearErrors: () => void;
  clearHistory: () => void;

  // Getters
  hasErrors: () => boolean;
  getErrorById: (id: string) => ErrorEntry | undefined;
  getErrorsByContext: (context: string) => ErrorEntry[];
}

export const useErrorStore = create<ErrorStore>()(
  devtools(
    persist(
      (set, get) => ({
        errors: [],
        errorHistory: [],
        maxHistorySize: 50,

        addError: (error, context) => {
          const id = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          const errorEntry: ErrorEntry = {
            id,
            error: error instanceof JsonHeroError ? {
              code: error.code,
              message: error.message,
              details: error.details,
              recoverable: error.recoverable,
              actions: error.actions,
            } : error,
            timestamp: Date.now(),
            context,
            resolved: false,
          };

          set((state) => {
            const newHistory = [errorEntry, ...state.errorHistory].slice(
              0,
              state.maxHistorySize
            );

            return {
              errors: [...state.errors, errorEntry],
              errorHistory: newHistory,
            };
          });

          return id;
        },

        removeError: (id) => {
          set((state) => ({
            errors: state.errors.filter((e) => e.id !== id),
          }));
        },

        resolveError: (id) => {
          set((state) => ({
            errors: state.errors.map((e) =>
              e.id === id ? { ...e, resolved: true } : e
            ),
            errorHistory: state.errorHistory.map((e) =>
              e.id === id ? { ...e, resolved: true } : e
            ),
          }));

          // Auto-remove after marking as resolved
          setTimeout(() => {
            get().removeError(id);
          }, 300); // Small delay for UI animations
        },

        clearErrors: () => {
          set({ errors: [] });
        },

        clearHistory: () => {
          set({ errorHistory: [] });
        },

        hasErrors: () => {
          return get().errors.length > 0;
        },

        getErrorById: (id) => {
          return get().errors.find((e) => e.id === id);
        },

        getErrorsByContext: (context) => {
          return get().errors.filter((e) => e.context === context);
        },
      }),
      {
        name: 'error-store',
        // Only persist error history, not active errors
        partialize: (state) => ({
          errorHistory: state.errorHistory,
          maxHistorySize: state.maxHistorySize,
        }),
      }
    ),
    {
      name: 'error-store',
    }
  )
);

/**
 * Hook to get error statistics
 */
export function useErrorStats() {
  const errorHistory = useErrorStore((state) => state.errorHistory);

  // Use useMemo to avoid recalculating on every render
  const stats = React.useMemo(() => {
    const now = Date.now();
    const result = {
      total: errorHistory.length,
      byCode: {} as Record<string, number>,
      byContext: {} as Record<string, number>,
      resolved: errorHistory.filter((e) => e.resolved).length,
      unresolved: errorHistory.filter((e) => !e.resolved).length,
      last24h: errorHistory.filter(
        (e) => now - e.timestamp < 24 * 60 * 60 * 1000
      ).length,
    };

    // Count by error code
    errorHistory.forEach((entry) => {
      const code = entry.error.code;
      result.byCode[code] = (result.byCode[code] || 0) + 1;

      if (entry.context) {
        result.byContext[entry.context] = (result.byContext[entry.context] || 0) + 1;
      }
    });

    return result;
  }, [errorHistory]);

  return stats;
}
