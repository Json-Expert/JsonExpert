import { 
  ChevronRight, 
  ChevronDown, 
  FolderOpen,
  Folder,
  List,
  FileText,
  Settings,
  Eye
} from 'lucide-react';
import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

import { SimpleNodeData } from '../../../lib/simple-graph';
import { cn } from '../../../lib/utils';
import { useUIStore } from '../../../stores/ui-store';

interface SimpleNodeProps extends NodeProps<SimpleNodeData> {
  onToggleExpand?: (nodeId: string, path: string[], key: string) => void;
  onShowSiblingSelector?: (parentPath: string[], parentKey: string, allSiblings: string[], currentSiblings: string[]) => void;
  onPreviewValue?: (value: any, title: string) => void;
}

export const SimpleNode: React.FC<SimpleNodeProps> = ({ 
  data, 
  selected,
  onToggleExpand,
  onShowSiblingSelector,
  onPreviewValue
}) => {
  const { theme } = useUIStore();

  const handleToggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand(data.id, data.path, data.key);
    }
  };

  const handleShowSiblingSelector = () => {
    if (onShowSiblingSelector) {
      if (data.type === 'more' && data.parentPath && data.parentKey) {
        // For 'more' nodes, show selector for parent's children
        onShowSiblingSelector(data.parentPath, data.parentKey, [], []);
      } else if (data.siblingKeys.length > 1) {
        // Get current selected siblings for this parent
        const currentSelected = data.siblingKeys.filter(key => key === data.key);
        onShowSiblingSelector(data.path, data.parentId || 'root', data.siblingKeys, currentSelected);
      }
    }
  };

  const handlePreviewValue = () => {
    if (onPreviewValue) {
      onPreviewValue(data.value, `${data.key} - Value Preview`);
    }
  };

  const getNodeIcon = () => {
    switch (data.type) {
      case 'object':
        return data.isExpanded ? 
          <FolderOpen className="h-4 w-4 text-orange-600" /> : 
          <Folder className="h-4 w-4 text-orange-600" />;
      case 'array':
        return <List className="h-4 w-4 text-purple-600" />;
      case 'more':
        return <Settings className="h-4 w-4 text-gray-600" />;
      default:
        return <FileText className="h-4 w-4 text-blue-600" />;
    }
  };

  const getNodeStyle = () => {
    const baseStyle = 'rounded-xl border-2 shadow-lg transition-all duration-200 min-w-[200px] max-w-[300px]';
    
    if (selected) {
      return cn(baseStyle, 'ring-4 ring-blue-400 ring-opacity-60 scale-105');
    }

    switch (data.type) {
      case 'object':
        return cn(baseStyle, 
          'border-orange-300 bg-gradient-to-br from-orange-50 via-white to-orange-100',
          'dark:border-orange-600 dark:from-orange-950/20 dark:via-gray-900 dark:to-orange-950/30',
          'hover:shadow-xl hover:scale-102'
        );
      case 'array':
        return cn(baseStyle,
          'border-purple-300 bg-gradient-to-br from-purple-50 via-white to-purple-100',
          'dark:border-purple-600 dark:from-purple-950/20 dark:via-gray-900 dark:to-purple-950/30',
          'hover:shadow-xl hover:scale-102'
        );
      case 'more':
        return cn(baseStyle,
          'border-gray-300 bg-gradient-to-br from-gray-50 via-white to-gray-100',
          'dark:border-gray-600 dark:from-gray-950/20 dark:via-gray-900 dark:to-gray-950/30',
          'hover:shadow-xl hover:scale-102 cursor-pointer'
        );
      default:
        return cn(baseStyle,
          'border-blue-300 bg-gradient-to-br from-blue-50 via-white to-blue-100',
          'dark:border-blue-600 dark:from-blue-950/20 dark:via-gray-900 dark:to-blue-950/30',
          'hover:shadow-xl hover:scale-102'
        );
    }
  };

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') {
      return value.length > 50 ? `"${value.substring(0, 50)}..."` : `"${value}"`;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return JSON.stringify(value);
  };

  const getItemCount = () => {
    if (data.type === 'object' && data.value && typeof data.value === 'object') {
      return Object.keys(data.value as Record<string, any>).length;
    }
    if (data.type === 'array' && Array.isArray(data.value)) {
      return data.value.length;
    }
    return 0;
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className={cn(
          '!w-3 !h-3 !border-2 !-top-1.5',
          theme === 'dark' ? '!bg-gray-600 !border-gray-400' : '!bg-white !border-gray-500'
        )}
      />
      
      <div className={getNodeStyle()} onClick={data.type === 'more' ? handleShowSiblingSelector : undefined}>
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {getNodeIcon()}
              <span className="font-bold text-lg truncate">
                {data.key}
              </span>
              {(data.type === 'object' || data.type === 'array') && (
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full flex-shrink-0">
                  {getItemCount()} items
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Sibling selector button */}
              {(data.type === 'more' || (data.siblingKeys && data.siblingKeys.length > 1)) && (
                <button
                  onClick={handleShowSiblingSelector}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={`Select from ${data.siblingKeys.length} sibling items`}
                >
                  <Settings className="h-4 w-4 text-gray-600" />
                </button>
              )}
              
              {/* Value preview button */}
              {data.type === 'value' && (
                <button
                  onClick={handlePreviewValue}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Preview value"
                >
                  <Eye className="h-4 w-4 text-gray-600" />
                </button>
              )}
              
              {/* Expand/collapse button */}
              {(data.childrenKeys && data.childrenKeys.length > 0) && (
                <button
                  onClick={handleToggleExpand}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={data.isExpanded ? 'Collapse' : 'Expand'}
                >
                  {data.isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Content preview */}
          {data.type === 'value' && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="text-sm text-gray-700 dark:text-gray-300 break-all">
                {formatValue(data.value)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Type: {typeof data.value}
              </div>
            </div>
          )}

          {/* Object/Array preview when collapsed */}
          {!data.isExpanded && (data.type === 'object' || data.type === 'array') && (data.childrenKeys && data.childrenKeys.length > 0) && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {data.type === 'object' ? 'Properties:' : 'Items:'}
              </div>
              <div className="space-y-1 max-h-16 overflow-hidden">
                {(data.childrenKeys || []).slice(0, 3).map(key => (
                  <div key={key} className="text-xs text-gray-700 dark:text-gray-300 truncate">
                    {data.type === 'array' ? key : `${key}: ...`}
                  </div>
                ))}
                {(data.childrenKeys && data.childrenKeys.length > 3) && (
                  <div className="text-xs text-gray-500 italic">
                    ... and {data.childrenKeys.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Expansion status */}
          {data.isExpanded && (data.childrenKeys && data.childrenKeys.length > 0) && (
            <div className="text-xs text-gray-500 text-center py-1 border-t border-gray-200 dark:border-gray-700">
              Expanded - showing child items
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className={cn(
          '!w-3 !h-3 !border-2 !-bottom-1.5',
          theme === 'dark' ? '!bg-gray-600 !border-gray-400' : '!bg-white !border-gray-500'
        )}
      />
    </>
  );
};