import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface SettingsStore {
  maxFileSize: number; // in bytes
  autoFormat: boolean;
  validateOnPaste: boolean;
  preserveComments: boolean;
  indentSize: number;
  useSpaces: boolean;
  maxHistoryItems: number;
  enableAnimations: boolean;
  compactView: boolean;
  
  // Actions
  updateSettings: (settings: Partial<SettingsStore>) => void;
  resetSettings: () => void;
}

const defaultSettings = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  autoFormat: true,
  validateOnPaste: true,
  preserveComments: false,
  indentSize: 2,
  useSpaces: true,
  maxHistoryItems: 10,
  enableAnimations: true,
  compactView: false,
};

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set) => ({
        ...defaultSettings,
        
        updateSettings: (settings) => set((state) => ({
          ...state,
          ...settings,
        })),
        
        resetSettings: () => set(defaultSettings),
      }),
      {
        name: 'app-settings',
      }
    ),
    {
      name: 'settings-store',
    }
  )
);