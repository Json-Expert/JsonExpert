import { ChevronRight, ChevronDown, Hash, Type, Braces, Brackets } from 'lucide-react';
import React from 'react';

import { cn } from '../../../lib/utils';
import { JsonValue } from '../../../types/json.types';

interface TreeNodeProps {
  nodeKey: string;
  value: JsonValue;
  path: string[];
  depth: number;
  isExpanded: boolean;
  onToggle: (path: string) => void;
  isLast: boolean;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  nodeKey,
  value,
  path,
  depth,
  isExpanded,
  onToggle,
  isLast,
}) => {
  // Auto-expand first few levels
  React.useEffect(() => {
    if (depth < 2 && !isExpanded) {
      onToggle(path.join('.'));
    }
  }, []);
  const pathStr = path.join('.');
  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const hasChildren = isObject || isArray;
  
  const getValueType = () => {
    if (isArray) return 'array';
    if (isObject) return 'object';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value === null) return 'null';
    return 'unknown';
  };

  const getIcon = () => {
    const type = getValueType();
    switch (type) {
      case 'object':
        return <Braces className="w-3.5 h-3.5" />;
      case 'array':
        return <Brackets className="w-3.5 h-3.5" />;
      case 'string':
        return <Type className="w-3.5 h-3.5" />;
      case 'number':
        return <Hash className="w-3.5 h-3.5" />;
      case 'boolean':
        return <div className="w-3.5 h-3.5 rounded-full bg-current" />;
      default:
        return null;
    }
  };

  const getTypeColor = () => {
    const type = getValueType();
    switch (type) {
      case 'object':
        return 'text-orange-500';
      case 'array':
        return 'text-purple-500';
      case 'string':
        return 'text-green-500';
      case 'number':
        return 'text-blue-500';
      case 'boolean':
        return 'text-pink-500';
      case 'null':
        return 'text-gray-500';
      default:
        return 'text-gray-400';
    }
  };

  const formatValue = (val: JsonValue): string => {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'string') {
      if (val.length > 50) {
        return `"${val.substring(0, 50)}..."`;
      }
      return `"${val}"`;
    }
    if (typeof val === 'boolean') return val.toString();
    if (typeof val === 'number') return val.toString();
    return '';
  };

  const getChildrenEntries = (): [string, JsonValue][] => {
    let entries: [string, JsonValue | undefined][] = [];
    if (isObject && value !== null) {
      entries = Object.entries(value as Record<string, JsonValue>);
    } else if (isArray) {
      entries = (value as JsonValue[]).map((item, index) => [index.toString(), item]);
    }
    return entries.filter((entry): entry is [string, JsonValue] => entry[1] !== undefined);
  };

  const childrenEntries = hasChildren ? getChildrenEntries() : [];
  const childCount = childrenEntries.length;

  // Limit children display
  const maxVisibleChildren = 100;
  const visibleChildren = isExpanded ? childrenEntries.slice(0, maxVisibleChildren) : [];
  const hasMoreChildren = childCount > maxVisibleChildren;

  return (
    <div 
      className={cn('tree-node', { 'tree-node-last': isLast })}
      style={{ '--depth': depth } as React.CSSProperties}
    >
      <div className="node-content">
        {/* Connection line */}
        {depth > 0 && (
          <div className="node-line-container">
            <div className="node-line-vertical" />
            <div className="node-line-horizontal" />
          </div>
        )}
        
        {/* Node header */}
        <div 
          className={cn(
            'node-header',
            hasChildren && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800',
            depth === 0 && 'font-semibold',
            'group'
          )}
          onClick={hasChildren ? () => onToggle(pathStr) : undefined}
        >
          {/* Expand/collapse icon */}
          {hasChildren && (
            <span className="node-toggle">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
          )}
          
          {/* Type icon */}
          <span className={cn('node-icon', getTypeColor())}>
            {getIcon()}
          </span>
          
          {/* Key */}
          {depth > 0 && (
            <span className="node-key">
              {nodeKey}
              {hasChildren && ':'}
            </span>
          )}
          
          {/* Value or count */}
          {!hasChildren && (
            <span className={cn('node-value', `node-value-${getValueType()}`)}>
              {formatValue(value)}
            </span>
          )}
          
          {hasChildren && (
            <span className="node-count opacity-60 group-hover:opacity-100 transition-opacity">
              {isArray ? `[${childCount}]` : `{${childCount}}`}
            </span>
          )}
        </div>
      </div>
      
      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="node-children" style={{ '--depth': depth } as React.CSSProperties}>
          {visibleChildren.map(([key, childValue], index) => {
            if (childValue === undefined) return null;
            const childPath = [...path, key];
            return (
              <TreeNode
                key={`${pathStr}.${key}`}
                nodeKey={key}
                value={childValue}
                path={childPath}
                depth={depth + 1}
                isExpanded={false}
                onToggle={onToggle}
                isLast={index === visibleChildren.length - 1 && !hasMoreChildren}
              />
            );
          })}
          {hasMoreChildren && (
            <div className="node-more" style={{ '--depth': depth + 1 } as React.CSSProperties}>
              <div className="node-line-container">
                <div className="node-line-vertical" />
                <div className="node-line-horizontal" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-600 italic">
                ... and {childCount - maxVisibleChildren} more
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};