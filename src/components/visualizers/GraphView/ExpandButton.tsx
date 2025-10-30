import { ChevronRight, ChevronDown } from 'lucide-react';
import React from 'react';
import { Handle, Position } from 'reactflow';

interface ExpandButtonProps {
  data: {
    parentId: string;
    totalCount?: number;
    visibleCount?: number;
    isExpandButton?: boolean;
    isCollapseButton?: boolean;
  };
  onExpand?: (parentId: string) => void;
  onCollapse?: (parentId: string) => void;
}

export const ExpandButton: React.FC<ExpandButtonProps> = ({ 
  data, 
  onExpand, 
  onCollapse 
}) => {
  const handleClick = () => {
    if (data.isExpandButton && onExpand) {
      onExpand(data.parentId);
    } else if (data.isCollapseButton && onCollapse) {
      onCollapse(data.parentId);
    }
  };

  const getButtonContent = () => {
    if (data.isExpandButton) {
      const remaining = (data.totalCount || 0) - (data.visibleCount || 0);
      return (
        <div className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4" />
          <span className="text-sm">
            +{remaining} daha göster
          </span>
        </div>
      );
    } else if (data.isCollapseButton) {
      return (
        <div className="flex items-center gap-2">
          <ChevronDown className="h-4 w-4" />
          <span className="text-sm">Daralt</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#6b7280', width: 8, height: 8 }}
      />
      
      <button
        onClick={handleClick}
        className={`
          px-3 py-2 rounded-md border-2 border-dashed
          transition-all duration-200 hover:scale-105 cursor-pointer
          ${data.isExpandButton 
            ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100' 
            : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
          }
          dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700
        `}
      >
        {getButtonContent()}
      </button>
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#6b7280', width: 8, height: 8 }}
      />
    </div>
  );
};