import { ChevronDown, Home } from 'lucide-react';
import React from 'react';

import { cn } from '../../../lib/utils';

interface RootSelectorProps {
  rootOptions: { key: string; label: string }[];
  selectedRoot: string | null;
  onSelectRoot: (rootKey: string) => void;
  className?: string;
}

export const RootSelector: React.FC<RootSelectorProps> = ({
  rootOptions,
  selectedRoot,
  onSelectRoot,
  className
}) => {
  if (rootOptions.length <= 1) {
    return null; // Don't show selector if only one or no options
  }

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700', className)}>
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Home className="h-4 w-4" />
          Root Element Selector
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {rootOptions.length} root elements found
        </div>
      </div>

      <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
        {rootOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => onSelectRoot(option.key)}
            className={cn(
              'w-full text-left p-3 rounded-lg border-2 transition-all text-sm',
              selectedRoot === option.key
                ? 'border-blue-400 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-300'
                : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-600'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium truncate">
                {option.label}
              </span>
              {selectedRoot === option.key && (
                <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Key: {option.key}
            </div>
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        Select a root element, branches will be shown from that element
      </div>
    </div>
  );
};