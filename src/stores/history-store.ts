import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { JsonValue } from '@/types/json.types';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  data: JsonValue;
  rawInput: string;
  inputMethod: 'file' | 'paste' | 'url';
  fileName?: string;
  description: string;
}

interface HistoryStore {
  entries: HistoryEntry[];
  currentIndex: number;
  maxEntries: number;
  
  // Actions
  addEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  goToEntry: (index: number) => HistoryEntry | null;
  undo: () => HistoryEntry | null;
  redo: () => HistoryEntry | null;
  clearHistory: () => void;
  removeEntry: (id: string) => void;
  setMaxEntries: (max: number) => void;
  
  // Getters
  canUndo: () => boolean;
  canRedo: () => boolean;
  getCurrentEntry: () => HistoryEntry | null;
}

export const useHistoryStore = create<HistoryStore>()(
  devtools(
    (set, get) => ({
      entries: [],
      currentIndex: -1,
      maxEntries: 50,
      
      addEntry: (entry) => set((state) => {
        const newEntry: HistoryEntry = {
          ...entry,
          id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };
        
        // Remove entries after current index (when adding after undo)
        const newEntries = [...state.entries.slice(0, state.currentIndex + 1), newEntry];
        
        // Limit history size
        const limitedEntries = newEntries.length > state.maxEntries
          ? newEntries.slice(-state.maxEntries)
          : newEntries;
        
        return {
          entries: limitedEntries,
          currentIndex: limitedEntries.length - 1,
        };
      }),
      
      goToEntry: (index) => {
        const state = get();
        if (index >= 0 && index < state.entries.length) {
          set({ currentIndex: index });
          return state.entries[index] || null;
        }
        return null;
      },
      
      undo: () => {
        const state = get();
        if (state.canUndo()) {
          const newIndex = state.currentIndex - 1;
          set({ currentIndex: newIndex });
          return state.entries[newIndex] || null;
        }
        return null;
      },
      
      redo: () => {
        const state = get();
        if (state.canRedo()) {
          const newIndex = state.currentIndex + 1;
          set({ currentIndex: newIndex });
          return state.entries[newIndex] || null;
        }
        return null;
      },
      
      clearHistory: () => set({
        entries: [],
        currentIndex: -1,
      }),
      
      removeEntry: (id) => set((state) => {
        const entryIndex = state.entries.findIndex(e => e.id === id);
        if (entryIndex === -1) return state;
        
        const newEntries = state.entries.filter(e => e.id !== id);
        let newCurrentIndex = state.currentIndex;
        
        // Adjust current index if necessary
        if (entryIndex <= state.currentIndex) {
          newCurrentIndex = Math.max(-1, state.currentIndex - 1);
        }
        
        return {
          entries: newEntries,
          currentIndex: Math.min(newCurrentIndex, newEntries.length - 1),
        };
      }),
      
      setMaxEntries: (max) => set((state) => {
        if (max < state.entries.length) {
          const newEntries = state.entries.slice(-max);
          return {
            maxEntries: max,
            entries: newEntries,
            currentIndex: Math.min(state.currentIndex, newEntries.length - 1),
          };
        }
        return { maxEntries: max };
      }),
      
      canUndo: () => get().currentIndex > 0,
      
      canRedo: () => {
        const state = get();
        return state.currentIndex < state.entries.length - 1;
      },
      
      getCurrentEntry: () => {
        const state = get();
        return state.currentIndex >= 0 ? (state.entries[state.currentIndex] || null) : null;
      },
    }),
    {
      name: 'history-store',
    }
  )
);