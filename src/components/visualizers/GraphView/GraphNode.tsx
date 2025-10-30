import {
  ChevronRight,
  ChevronDown,
  Braces,
  Brackets,
  Type,
  Hash,
  ToggleLeft,
  FileJson
} from 'lucide-react';
import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';

import { cn } from '../../../lib/utils';

import { PropertyDetailModal } from './PropertyDetailModal';

interface GraphNodeProps {
  data: {
    label: string;
    value: any;
    type: 'object' | 'array' | 'primitive' | 'table-object' | 'load-more';
    isExpanded: boolean;
    childCount: number;
    path: string[];
    properties?: Array<{ key: string; value: any; type: string }>;
    parentNodeId?: string;
    remainingCount?: number;
  };
  selected?: boolean;
}

export const GraphNode: React.FC<GraphNodeProps> = ({ data, selected }) => {
  const [detailModal, setDetailModal] = useState<{ key: string; value: any; type: string } | null>(null);
  const isMoreNode = data.type === 'load-more';
  const isPrimitive = data.type === 'primitive';
  const isTableObject = data.type === 'table-object';
  
  const getIcon = () => {
    if (isMoreNode) return <FileJson className="w-4 h-4" />;

    switch (data.type) {
      case 'object':
      case 'table-object':
        return <Braces className="w-4 h-4" />;
      case 'array':
        return <Brackets className="w-4 h-4" />;
      default:
        if (data.value === null) return <FileJson className="w-4 h-4" />;
        if (typeof data.value === 'string') return <Type className="w-4 h-4" />;
        if (typeof data.value === 'number') return <Hash className="w-4 h-4" />;
        if (typeof data.value === 'boolean') return <ToggleLeft className="w-4 h-4" />;
        return <FileJson className="w-4 h-4" />;
    }
  };

  const getColor = () => {
    if (isMoreNode) return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700';

    switch (data.type) {
      case 'object':
      case 'table-object':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-700';
      case 'array':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-700';
      default:
        if (data.value === null || data.value === undefined)
          return 'text-gray-600 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
        if (typeof data.value === 'string')
          return 'text-green-600 bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700';
        if (typeof data.value === 'number')
          return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700';
        if (typeof data.value === 'boolean')
          return 'text-pink-600 bg-pink-50 dark:bg-pink-950/20 border-pink-300 dark:border-pink-700';
        return 'text-gray-600 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
    }
  };

  const formatValue = () => {
    if (data.type !== 'primitive' || isMoreNode) return null;
    
    const val = data.value;
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'string') {
      if (val.length > 30) return `"${val.substring(0, 30)}..."`;
      return `"${val}"`;
    }
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (typeof val === 'number') return val.toString();
    return JSON.stringify(val);
  };

  const showHandle = true; // Always show handles

  return (
    <>
      {showHandle && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2 !h-2 !bg-gray-400 dark:!bg-gray-600 !border-gray-600 dark:!border-gray-400"
        />
      )}
      
      <div
        className={cn(
          'rounded-lg border-2 shadow-md transition-all duration-200',
          'min-w-[300px] max-w-[400px]',
          getColor(),
          selected && 'ring-2 ring-blue-400 ring-opacity-60',
          (isMoreNode || data.type === 'array') && 'cursor-pointer hover:shadow-lg hover:scale-[1.02]',
          isMoreNode && 'border-dashed'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between gap-2 px-4 py-3',
          (isTableObject || (data.type === 'array' && data.properties && data.properties.length > 0)) && 'border-b border-gray-200 dark:border-gray-700'
        )}>
          <div className="flex items-center gap-2 min-w-0">
            {data.type === 'array' && !isMoreNode && (
              <div className="flex-shrink-0">
                {data.isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            )}
            <div className="flex-shrink-0">{getIcon()}</div>
            <span className="font-semibold text-sm truncate">{data.label}</span>
          </div>
          
          {data.type === 'array' && !isMoreNode && (
            <span className="text-xs opacity-70 flex-shrink-0">
              {data.childCount} items
            </span>
          )}
          
          {data.type === 'table-object' && data.properties && (
            <span className="text-xs opacity-70 flex-shrink-0">
              {data.properties.length} props
            </span>
          )}
          
          {isMoreNode && data.remainingCount && (
            <span className="text-xs opacity-70 flex-shrink-0">
              {data.remainingCount} remaining
            </span>
          )}
        </div>
        
        {/* Table content for all nodes with properties */}
        {data.properties && data.properties.length > 0 && (
          <div className="p-2 space-y-1">
            {data.properties.map((prop, index) => {
              const isComplex = prop.type === 'object' || prop.type === 'array' || (prop.type === 'string' && prop.value && prop.value.length > 50);
              return (
                <div
                  key={index}
                  className={cn(
                    'flex items-center justify-between gap-2 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded text-xs',
                    isComplex && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                  )}
                  onClick={(e) => {
                    if (isComplex) {
                      e.stopPropagation();
                      setDetailModal({ key: prop.key, value: prop.value, type: prop.type });
                    }
                  }}
                  title={isComplex ? 'Click to view full content' : undefined}
                >
                  <span className="font-medium text-gray-700 dark:text-gray-300">{prop.key}</span>
                  <span className={cn(
                    'truncate max-w-[200px]',
                    prop.type === 'string' && 'text-green-600 dark:text-green-400',
                    prop.type === 'number' && 'text-blue-600 dark:text-blue-400',
                    prop.type === 'boolean' && 'text-pink-600 dark:text-pink-400',
                    prop.type === 'object' && 'text-orange-600 dark:text-orange-400',
                    prop.type === 'array' && 'text-purple-600 dark:text-purple-400',
                    prop.type === 'null' && 'text-gray-500'
                  )}>
                    {prop.value === null ? 'null' :
                     prop.value === undefined ? 'undefined' :
                     prop.type === 'string' ?
                      (prop.value.length > 50 ? `"${prop.value.substring(0, 50)}..."` : `"${prop.value}"`) :
                     prop.type === 'object' ? `Object {${Object.keys(prop.value || {}).length}}` :
                     prop.type === 'array' ? `Array [${(prop.value || []).length}]` :
                     String(prop.value)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Show empty message for empty objects/arrays */}
        {(data.type === 'array' || data.type === 'table-object') && 
         (!data.properties || data.properties.length === 0) && 
         data.childCount === 0 && (
          <div className="px-4 pb-3">
            <div className="text-xs text-gray-500 italic">
              {data.type === 'array' ? 'Empty array' : 'Empty object'}
            </div>
          </div>
        )}
        
        {/* Show primitive value */}
        {isPrimitive && (
          <div className="px-4 pb-3 text-xs opacity-80 break-all">
            {formatValue()}
          </div>
        )}

        {/* Load more hint */}
        {isMoreNode && (
          <div className="px-4 pb-3 text-xs text-center italic opacity-70">
            {data.properties && data.properties.length > 0
              ? 'Click to select branches to expand'
              : 'Click to load more items'}
          </div>
        )}
      </div>
      
      {showHandle && (!isPrimitive || isTableObject) && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-2 !h-2 !bg-gray-400 dark:!bg-gray-600 !border-gray-600 dark:!border-gray-400"
        />
      )}

      {/* Property Detail Modal */}
      {detailModal && (
        <PropertyDetailModal
          isOpen={true}
          onClose={() => setDetailModal(null)}
          propertyKey={detailModal.key}
          propertyValue={detailModal.value}
          propertyType={detailModal.type}
        />
      )}
    </>
  );
};