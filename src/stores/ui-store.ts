import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { SearchOptions } from '@/lib/json-search';
import { VisualizationType } from '@/types/visualization.types';

interface UIStore {
  activeView: VisualizationType;
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  searchQuery: string;
  searchOptions: SearchOptions;
  searchStats?: { count: number; time: number };
  filterPath: string;
  expandLevel: number;
  showLineNumbers: boolean;
  wordWrap: boolean;
  
  // Actions
  setActiveView: (view: VisualizationType) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchOptions: (options: Partial<SearchOptions>) => void;
  setSearchStats: (stats: { count: number; time: number } | undefined) => void;
  setFilterPath: (path: string) => void;
  setExpandLevel: (level: number) => void;
  setShowLineNumbers: (show: boolean) => void;
  setWordWrap: (wrap: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      immer((set) => ({
        activeView: 'tree',
        theme: 'light',
        sidebarOpen: true,
        searchQuery: '',
        searchOptions: {
          query: '',
          caseSensitive: false,
          searchInKeys: true,
          searchInValues: true,
          searchInPaths: false,
          useRegex: false,
        },
        searchStats: { count: 0, time: 0 },
        filterPath: '',
        expandLevel: 2,
        showLineNumbers: true,
        wordWrap: false,
        
        setActiveView: (view) => set({ activeView: view }),
        
        toggleTheme: () => set((state) => ({ 
          theme: state.theme === 'light' ? 'dark' : 'light' 
        })),
        
        setTheme: (theme) => set({ theme }),
        
        toggleSidebar: () => set((state) => ({ 
          sidebarOpen: !state.sidebarOpen 
        })),
        
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        
        setSearchQuery: (query) => set({ searchQuery: query }),
        
        setSearchOptions: (options) => set((state) => {
          Object.assign(state.searchOptions, options);
        }),
        
        setSearchStats: (stats) => set({ searchStats: stats || { count: 0, time: 0 } }),
        
        setFilterPath: (path) => set({ filterPath: path }),
        
        setExpandLevel: (level) => set({ expandLevel: level }),
        
        setShowLineNumbers: (show) => set({ showLineNumbers: show }),
        
        setWordWrap: (wrap) => set({ wordWrap: wrap }),
      })),
      {
        name: 'ui-settings',
        partialize: (state) => ({
          theme: state.theme,
          showLineNumbers: state.showLineNumbers,
          wordWrap: state.wordWrap,
          expandLevel: state.expandLevel,
        }),
      }
    ),
    {
      name: 'ui-store',
    }
  )
);