export const APP_NAME = 'JSON Expert';
export const APP_VERSION = '1.0.0';

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB (increased from 50MB)
export const ALLOWED_FILE_TYPES = ['.json', '.geojson'];

export const VISUALIZATION_TYPES = {
  TREE: 'tree',
  GRAPH: 'graph',
  TABLE: 'table',
  RAW: 'raw',
} as const;

export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

export const EXPORT_FORMATS = {
  JSON: 'json',
  CSV: 'csv',
  PNG: 'png',
  SVG: 'svg',
  PDF: 'pdf',
} as const;

export const DEFAULT_EXPAND_LEVEL = 2;
export const MAX_EXPAND_LEVEL = 10;

export const MONACO_EDITOR_OPTIONS = {
  theme: 'vs-dark',
  language: 'json',
  automaticLayout: true,
  minimap: { enabled: true },
  scrollBeyondLastLine: false,
  wordWrap: 'off',
  fontSize: 14,
  lineNumbers: 'on',
  renderWhitespace: 'none',
  folding: true,
  formatOnPaste: true,
  formatOnType: true,
} as const;

export const KEYBINDINGS = {
  SEARCH: 'Ctrl+F',
  FORMAT: 'Shift+Alt+F',
  EXPAND_ALL: 'Ctrl+Shift+E',
  COLLAPSE_ALL: 'Ctrl+Shift+C',
  TOGGLE_THEME: 'Ctrl+Shift+T',
} as const;