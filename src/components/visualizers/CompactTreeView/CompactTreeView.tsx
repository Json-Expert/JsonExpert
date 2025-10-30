import React, { useState, useMemo } from 'react';

import { cn } from '../../../lib/utils';
import { JsonValue } from '../../../types/json.types';

import { TreeNode } from './TreeNode';
import './tree-view.css';

interface CompactTreeViewProps {
  data: JsonValue;
  className?: string;
}

export const CompactTreeView: React.FC<CompactTreeViewProps> = ({ data, className }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));

  const toggleNode = (path: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const rootNode = useMemo(() => {
    return {
      key: 'root',
      value: data,
      path: ['root'],
      depth: 0
    };
  }, [data]);

  return (
    <div className={cn('compact-tree-view', className)}>
      <div className="tree-container">
        <TreeNode
          nodeKey={rootNode.key}
          value={rootNode.value}
          path={rootNode.path}
          depth={rootNode.depth}
          isExpanded={expandedNodes.has('root')}
          onToggle={toggleNode}
          isLast={true}
        />
      </div>
    </div>
  );
};