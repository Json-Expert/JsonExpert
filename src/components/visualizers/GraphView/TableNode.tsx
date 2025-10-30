import { ChevronRight, ChevronDown, MoreHorizontal } from 'lucide-react';
import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

import { SimpleNodeData } from '../../../lib/simple-graph';
import { cn } from '../../../lib/utils';
import { useUIStore } from '../../../stores/ui-store';

interface TableNodeProps extends NodeProps<SimpleNodeData> {
  onToggleExpand?: (nodeId: string, path: string[], key: string) => void;
  onShowMore?: (nodeId: string, path: string[], key: string) => void;
}

export const TableNode: React.FC<TableNodeProps> = ({ 
  data, 
  selected,
  onToggleExpand,
  onShowMore
}) => {
  const { theme } = useUIStore();

  const handleToggleExpand = () => {
    if (onToggleExpand && hasChildren) {
      onToggleExpand(data.id, data.path, data.key);
    }
  };

  const handleShowMore = () => {
    if (onShowMore) {
      onShowMore(data.id, data.path, data.key);
    }
  };

  const hasChildren = data.childrenKeys && data.childrenKeys.length > 0;
  const isValue = data.type === 'value';
  const isArray = data.type === 'array';
  const isObject = data.type === 'object';

  // Get display items (first 3 or all if less)
  const getDisplayItems = () => {
    if (!data.value || isValue) return [];
    
    if (isArray && Array.isArray(data.value)) {
      return data.value.slice(0, 3).map((item, index) => ({
        key: `[${index}]`,
        value: item,
        type: getValueType(item)
      }));
    }
    
    if (isObject && typeof data.value === 'object') {
      return Object.entries(data.value as Record<string, any>)
        .slice(0, 3)
        .map(([key, value]) => ({
          key,
          value,
          type: getValueType(value)
        }));
    }
    
    return [];
  };

  const getValueType = (value: any): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return typeof value;
  };

  const formatValue = (value: any, type: string): string => {
    if (type === 'null') return 'null';
    if (type === 'undefined') return 'undefined';
    if (type === 'string') {
      const str = String(value);
      return str.length > 20 ? `"${str.substring(0, 20)}..."` : `"${str}"`;
    }
    if (type === 'boolean') return String(value);
    if (type === 'number') return String(value);
    if (type === 'array') return `Array[${value.length}]`;
    if (type === 'object') return `Object{${Object.keys(value).length}}`;
    return String(value);
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'string': return 'text-green-600 dark:text-green-400';
      case 'number': return 'text-blue-600 dark:text-blue-400';
      case 'boolean': return 'text-pink-600 dark:text-pink-400';
      case 'null': return 'text-gray-500';
      case 'array': return 'text-purple-600 dark:text-purple-400';
      case 'object': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const displayItems = getDisplayItems();
  const hasMoreItems = hasChildren && data.childrenKeys.length > 3;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          '!w-3 !h-3 !border-2',
          theme === 'dark' ? '!bg-gray-700 !border-gray-500' : '!bg-white !border-gray-400'
        )}
      />
      
      <div className={cn(
        'bg-white dark:bg-gray-900 rounded-lg shadow-lg border-2 min-w-[200px] max-w-[350px]',
        selected ? 'border-blue-500 ring-2 ring-blue-400 ring-opacity-50' : 'border-gray-300 dark:border-gray-700',
        'transition-all duration-200'
      )}>
        {/* Header */}
        <div className={cn(
          'px-3 py-2 border-b border-gray-200 dark:border-gray-700',
          'bg-gray-50 dark:bg-gray-800 rounded-t-lg',
          'flex items-center justify-between gap-2'
        )}>
          <div className="flex items-center gap-2 min-w-0">
            {hasChildren && (
              <button
                onClick={handleToggleExpand}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              >
                {data.isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            )}
            <span className="font-semibold text-sm truncate">{data.key}</span>
          </div>
          <span className={cn('text-xs', getTypeColor(data.type))}>
            {data.type}
          </span>
        </div>

        {/* Content */}
        <div className="p-2">
          {isValue ? (
            // Single value display
            <div className="px-2 py-1">
              <span className={cn('text-sm', getTypeColor(data.type))}>
                {formatValue(data.value, data.type)}
              </span>
            </div>
          ) : (
            // Table display for arrays/objects
            <div className="space-y-1">
              {displayItems.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between gap-2 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded text-xs"
                >
                  <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
                    {item.key}
                  </span>
                  <span className={cn('truncate max-w-[150px]', getTypeColor(item.type))}>
                    {formatValue(item.value, item.type)}
                  </span>
                </div>
              ))}
              
              {hasMoreItems && (
                <button
                  onClick={handleShowMore}
                  className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  <MoreHorizontal className="h-3 w-3" />
                  <span>+{data.childrenKeys.length - 3} more</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer with stats */}
        {hasChildren && (
          <div className="px-3 py-1.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {data.childrenKeys.length} {isArray ? 'items' : 'properties'}
            </span>
          </div>
        )}
      </div>
      
      {hasChildren && (
        <Handle
          type="source"
          position={Position.Right}
          className={cn(
            '!w-3 !h-3 !border-2',
            theme === 'dark' ? '!bg-gray-700 !border-gray-500' : '!bg-white !border-gray-400'
          )}
        />
      )}
    </>
  );
};