import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';
import { useState } from 'react';

import { getJsonPath } from '../../../lib/data-transformers';
import { cn , copyToClipboard } from '../../../lib/utils';
import { TreeNode as TreeNodeType } from '../../../types/visualization.types';

interface TreeNodeProps {
  node: TreeNodeType;
  searchQuery: string | undefined;
  onToggle: ((nodeId: string) => void) | undefined;
}

const typeColors = {
  string: 'text-green-600 dark:text-green-400',
  number: 'text-blue-600 dark:text-blue-400',
  boolean: 'text-purple-600 dark:text-purple-400',
  null: 'text-gray-500 dark:text-gray-400',
  object: 'text-orange-600 dark:text-orange-400',
  array: 'text-pink-600 dark:text-pink-400',
};

export const TreeNodeComponent: React.FC<TreeNodeProps> = ({
  node,
  searchQuery,
  onToggle,
}) => {
  const [copied, setCopied] = useState(false);
  const hasChildren = node.children.length > 0;
  const isExpandable = node.type === 'object' || node.type === 'array';

  const handleToggle = () => {
    if (onToggle && isExpandable) {
      onToggle(node.id);
    }
  };

  const handleCopyPath = async () => {
    const path = getJsonPath(node.path);
    await copyToClipboard(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderValue = () => {
    if (node.type === 'object') {
      return <span className="text-muted-foreground">{`{${node.children.length}}`}</span>;
    }
    if (node.type === 'array') {
      return <span className="text-muted-foreground">{`[${node.children.length}]`}</span>;
    }
    if (node.type === 'string') {
      return <span className="text-green-600 dark:text-green-400">&quot;{node.value}&quot;</span>;
    }
    if (node.type === 'null') {
      return <span className="text-gray-500 dark:text-gray-400">null</span>;
    }
    return <span className={typeColors[node.type as keyof typeof typeColors] || ''}>{String(node.value)}</span>;
  };

  const highlightMatch = (text: string) => {
    if (!searchQuery) return text;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          'group flex items-center gap-1 rounded px-2 py-1 hover:bg-accent',
          'cursor-pointer transition-colors'
        )}
        style={{ paddingLeft: `${node.depth * 20 + 8}px` }}
      >
        {isExpandable && (
          <button
            onClick={handleToggle}
            className="flex h-4 w-4 items-center justify-center"
          >
            {node.expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
        {!isExpandable && <span className="w-4" />}

        <span className="font-mono text-sm">
          {node.key !== 'root' && (
            <>
              <span className="text-foreground">
                {highlightMatch(node.key)}
              </span>
              <span className="text-muted-foreground">: </span>
            </>
          )}
          {renderValue()}
        </span>

        <button
          onClick={handleCopyPath}
          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy path"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          )}
        </button>
      </div>

      {node.expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              searchQuery={searchQuery}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};