import { JSON_TYPE_COLORS, TOAST_COLORS } from './app-constants';
import type { JsonType, ToastType } from './app-constants';

/**
 * Get color classes for a specific JSON type
 */
export const getJsonTypeColors = (type: JsonType) => {
  return JSON_TYPE_COLORS[type] ?? JSON_TYPE_COLORS.string; // eslint-disable-line security/detect-object-injection
};

/**
 * Get color classes for a specific toast type
 */
export const getToastColors = (type: ToastType) => {
  return TOAST_COLORS[type] ?? TOAST_COLORS.info; // eslint-disable-line security/detect-object-injection
};

/**
 * Common checkbox classes for consistent styling
 */
export const CHECKBOX_CLASSES = 'h-4 w-4 rounded border-gray-300';

/**
 * Common input classes for consistent styling
 */
export const INPUT_CLASSES = 'rounded border border-input px-3 py-1 text-sm';

/**
 * Common select classes for consistent styling
 */
export const SELECT_CLASSES = 'rounded border border-input px-2 py-1 text-sm';

/**
 * Common button size classes
 */
export const BUTTON_SIZES = {
  sm: 'h-8 px-2 text-sm',
  md: 'h-9 px-3',
  lg: 'h-10 px-4',
  icon: 'h-8 w-8',
} as const;

/**
 * Common focus ring classes for accessibility
 */
export const FOCUS_RING_CLASSES = 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2';

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Get relative time string (e.g., "2 minutes ago")
 */
export const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  return 'Just now';
};

/**
 * Generate consistent modal overlay classes
 */
export const MODAL_OVERLAY_CLASSES = 'fixed inset-0 z-50 flex items-center justify-center p-4';

/**
 * Generate consistent modal backdrop classes
 */
export const MODAL_BACKDROP_CLASSES = 'absolute inset-0 bg-black/50';

/**
 * Generate consistent card classes
 */
export const CARD_CLASSES = 'relative w-full max-w-2xl max-h-[80vh] overflow-auto';

/**
 * Get icon size classes
 */
export const getIconSize = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return 'h-3 w-3';
    case 'md':
      return 'h-4 w-4';
    case 'lg':
      return 'h-5 w-5';
    default:
      return 'h-4 w-4';
  }
};

/**
 * Generate loading spinner classes
 */
export const SPINNER_CLASSES = 'animate-spin rounded-full border-2 border-gray-300 border-t-primary';

/**
 * Generate tooltip classes
 */
export const TOOLTIP_CLASSES = 
  'absolute z-10 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg pointer-events-none';

/**
 * Common transition classes
 */
export const TRANSITION_CLASSES = {
  default: 'transition-colors duration-200',
  fast: 'transition-colors duration-150',
  slow: 'transition-colors duration-300',
  transform: 'transition-transform duration-200',
  opacity: 'transition-opacity duration-200',
} as const;

/**
 * Generate responsive grid classes
 */
export const getGridClasses = (columns: number) => {
  const gridMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };
  
  return `grid gap-4 ${gridMap[columns as keyof typeof gridMap] || 'grid-cols-1'}`;
};

/**
 * Generate flex container classes
 */
export const FLEX_CLASSES = {
  center: 'flex items-center justify-center',
  start: 'flex items-center justify-start',
  end: 'flex items-center justify-end',
  between: 'flex items-center justify-between',
  column: 'flex flex-col',
  wrap: 'flex flex-wrap',
} as const;