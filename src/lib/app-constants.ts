/**
 * Application-wide constants
 * Centralized configuration values to avoid magic numbers and repeated strings
 */

// Timing Constants
export const TIMING = {
  /** Default debounce delay for search operations (ms) */
  SEARCH_DEBOUNCE_DELAY: 300,
  /** Default toast display duration (ms) */
  TOAST_DEFAULT_DURATION: 5000,
  /** Animation duration for counters and transitions (ms) */
  ANIMATION_DURATION: 500,
  /** Default HTTP request timeout (ms) */
  HTTP_REQUEST_TIMEOUT: 10000,
  /** Maximum HTTP request timeout (ms) */
  HTTP_REQUEST_TIMEOUT_MAX: 30000,
  /** Minimum HTTP request timeout (ms) */
  HTTP_REQUEST_TIMEOUT_MIN: 1000,
} as const;

// File Size Limits
export const FILE_LIMITS = {
  /** Maximum file size for JSON uploads (bytes) - 50MB */
  MAX_FILE_SIZE: 50 * 1024 * 1024,
  /** Maximum file size for JSON uploads (bytes) - formatted for display */
  MAX_FILE_SIZE_MB: 50,
  /** Chunk size for processing large files (bytes) */
  PROCESSING_CHUNK_SIZE: 1024 * 1024, // 1MB
} as const;

// UI Layout Constants
export const UI = {
  /** Maximum component line count before refactoring required */
  MAX_COMPONENT_LINES: 200,
  /** Default virtualization window size for large datasets */
  VIRTUALIZATION_WINDOW_SIZE: 100,
  /** Maximum items to show in dropdowns before scrolling */
  MAX_DROPDOWN_ITEMS: 50,
  /** Keyboard navigation focus indicator size */
  FOCUS_RING_SIZE: '2px',
} as const;

// History Management
export const HISTORY = {
  /** Maximum number of history entries to keep */
  MAX_ENTRIES: 50,
  /** Number of quick access history items to show */
  QUICK_ACCESS_ITEMS: 10,
} as const;

// Validation Constants
export const VALIDATION = {
  /** Maximum JSON nesting depth to prevent stack overflow */
  MAX_JSON_DEPTH: 100,
  /** Maximum number of object keys to analyze for performance */
  MAX_OBJECT_KEYS: 10000,
  /** Maximum string length for preview display */
  MAX_PREVIEW_LENGTH: 100,
} as const;

// Performance Monitoring
export const PERFORMANCE = {
  /** Threshold for slow operation warning (ms) */
  SLOW_OPERATION_THRESHOLD: 1000,
  /** Memory usage warning threshold (MB) */
  MEMORY_WARNING_THRESHOLD: 100,
  /** Bundle size warning threshold (MB) */
  BUNDLE_SIZE_THRESHOLD: 2,
} as const;

// Search and Filter
export const SEARCH = {
  /** Minimum characters before triggering search */
  MIN_SEARCH_LENGTH: 2,
  /** Maximum number of search results to display */
  MAX_SEARCH_RESULTS: 1000,
  /** Default search operators */
  DEFAULT_OPERATORS: ['contains', 'equals', 'startsWith', 'endsWith', 'regex'] as const,
  /** Default search types */
  DEFAULT_TYPES: ['key', 'value', 'path', 'type'] as const,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_JSON: 'Invalid JSON format. Please check your syntax.',
  FILE_TOO_LARGE: `File size exceeds the maximum limit of ${FILE_LIMITS.MAX_FILE_SIZE_MB}MB.`,
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  TIMEOUT_ERROR: 'Request timeout - the server took too long to respond.',
  PARSE_ERROR: 'Failed to parse the provided data.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
  CORS_ERROR: 'CORS error - unable to fetch from this URL. Try enabling CORS proxy.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: 'File uploaded successfully',
  DATA_PARSED: 'JSON data parsed successfully',
  EXPORTED: 'Data exported successfully',
  COPIED: 'Copied to clipboard',
  SETTINGS_SAVED: 'Settings saved',
} as const;

// Color Schemes for JSON Types
export const JSON_TYPE_COLORS = {
  string: {
    border: 'border-blue-500',
    background: 'bg-blue-50 dark:bg-blue-950',
    text: 'text-blue-700 dark:text-blue-300',
  },
  number: {
    border: 'border-green-500',
    background: 'bg-green-50 dark:bg-green-950',
    text: 'text-green-700 dark:text-green-300',
  },
  boolean: {
    border: 'border-purple-500',
    background: 'bg-purple-50 dark:bg-purple-950',
    text: 'text-purple-700 dark:text-purple-300',
  },
  null: {
    border: 'border-gray-500',
    background: 'bg-gray-50 dark:bg-gray-950',
    text: 'text-gray-700 dark:text-gray-300',
  },
  object: {
    border: 'border-orange-500',
    background: 'bg-orange-50 dark:bg-orange-950',
    text: 'text-orange-700 dark:text-orange-300',
  },
  array: {
    border: 'border-indigo-500',
    background: 'bg-indigo-50 dark:bg-indigo-950',
    text: 'text-indigo-700 dark:text-indigo-300',
  },
} as const;

// Toast Type Colors
export const TOAST_COLORS = {
  success: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
  error: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
  warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
  info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
} as const;

// Keyboard Shortcuts
export const KEYBOARD_SHORTCUTS = {
  SEARCH: 'f',
  TOGGLE_THEME: 't',
  NEW_JSON: 'n',
  EXPAND_ALL: 'e',
  COLLAPSE_ALL: 'c',
  UNDO: 'z',
  REDO: 'y',
  VIEW_TREE: '1',
  VIEW_RAW: '2',
  VIEW_GRAPH: '3',
  VIEW_TABLE: '4',
} as const;

// API Configuration
export const API = {
  /** CORS proxy URL for cross-origin requests */
  CORS_PROXY_URL: 'https://api.allorigins.win/raw?url=',
  /** Default headers for API requests */
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
} as const;

// Export types for better type safety
export type ToastType = keyof typeof TOAST_COLORS;
export type JsonType = keyof typeof JSON_TYPE_COLORS;
export type SearchOperator = typeof SEARCH.DEFAULT_OPERATORS[number];
export type SearchType = typeof SEARCH.DEFAULT_TYPES[number];