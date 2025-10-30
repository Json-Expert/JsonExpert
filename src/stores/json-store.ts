import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { AppError } from '@/lib/error-handler';
import { JsonValue, ParsedJson } from '@/types/json.types';

import { useHistoryStore } from './history-store';

interface JsonStore {
  data: JsonValue | null;
  rawInput: string;
  inputMethod: 'file' | 'paste' | 'url' | null;
  isLoading: boolean;
  error: string | null; // Keep string for backward compatibility, but also support AppError
  structuredError: AppError | null; // New field for structured errors
  parsedData: ParsedJson | null;
  history: Array<{
    timestamp: number;
    inputMethod: string;
    preview: string;
  }>;

  // Actions
  setJsonData: (data: JsonValue, raw: string) => void;
  setRawInput: (input: string) => void;
  setInputMethod: (method: 'file' | 'paste' | 'url') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStructuredError: (error: AppError | null) => void; // New action for structured errors
  clearData: () => void;
  addToHistory: (method: string, preview: string) => void;
}

export const useJsonStore = create<JsonStore>()(
  devtools(
    (set) => ({
      data: null,
      rawInput: '',
      inputMethod: null,
      isLoading: false,
      error: null,
      structuredError: null,
      parsedData: null,
      history: [],

      setJsonData: (data, raw) => set((state) => {
        // Add to history if this is a new entry (not from history navigation)
        if (state.inputMethod) {
          const historyStore = useHistoryStore.getState();
          historyStore.addEntry({
            data,
            rawInput: raw,
            inputMethod: state.inputMethod,
            description: `${state.inputMethod === 'file' ? 'File uploaded' :
                         state.inputMethod === 'paste' ? 'JSON pasted' :
                         'JSON fetched from URL'}`,
          });
        }

        return {
          data,
          rawInput: raw,
          error: null,
          structuredError: null,
          parsedData: {
            data,
            raw,
            size: new Blob([raw]).size,
            lineCount: raw.split('\n').length,
            isValid: true,
          }
        };
      }),

      setRawInput: (input) => set({ rawInput: input }),

      setInputMethod: (method) => set({ inputMethod: method }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error, isLoading: false }),

      setStructuredError: (structuredError) => set({
        structuredError,
        error: structuredError?.message || null,
        isLoading: false,
      }),

      clearData: () => set({
        data: null,
        rawInput: '',
        error: null,
        structuredError: null,
        parsedData: null,
        isLoading: false,
      }),

      addToHistory: (method, preview) => set((state) => ({
        history: [
          {
            timestamp: Date.now(),
            inputMethod: method,
            preview: preview.substring(0, 100) + '...'
          },
          ...state.history.slice(0, 9) // Keep last 10 items
        ]
      })),
    }),
    {
      name: 'json-store',
    }
  )
);