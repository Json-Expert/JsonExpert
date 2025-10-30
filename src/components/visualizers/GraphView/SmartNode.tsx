import { 
  ChevronRight, 
  ChevronDown, 
  Image, 
  ExternalLink, 
  FileText, 
  Folder, 
  List,
  Eye,
  Copy
} from 'lucide-react';
import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

import { cn } from '../../../lib/utils';
import { useUIStore } from '../../../stores/ui-store';

interface SmartNodeData {
  id: string;
  type: 'object' | 'array' | 'value' | 'image' | 'url' | 'large-text';
  path: string[];
  value: any;
  isExpanded: boolean;
  richContent?: {
    preview: string;
    isImage: boolean;
    isUrl: boolean;
    isLargeText: boolean;
    thumbnail?: string;
  };
  childrenCount?: number;
}

interface SmartNodeProps extends NodeProps<SmartNodeData> {
  onExpand?: (nodeId: string) => void;
  onCollapse?: (nodeId: string) => void;
  onPreview?: (nodeId: string, content: any) => void;
}

export const SmartNode: React.FC<SmartNodeProps> = ({ 
  data, 
  selected,
  onExpand,
  onCollapse,
  onPreview
}) => {
  const { theme } = useUIStore();
  const [imageError, setImageError] = useState(false);

  // Debug logging and safety checks
  if (!data) {
    console.error('SmartNode: data is null/undefined');
    return <div>Error: No data provided</div>;
  }

  // React Flow passes the SmartNodeData directly as 'data' prop
  // Ensure we have the expected data structure with safe defaults
  const safeData = {
    ...data,
    id: data.id || 'unknown',
    type: data.type || 'value',
    path: data.path || [],
    value: data.value,
    isExpanded: data.isExpanded || false,
    richContent: data.richContent,
    childrenCount: data.childrenCount || 0
  };

  const handleToggle = () => {
    if (safeData.isExpanded && onCollapse) {
      onCollapse(safeData.id);
    } else if (!safeData.isExpanded && onExpand) {
      onExpand(safeData.id);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(safeData.id, safeData.value);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(safeData.value, null, 2));
    } catch (err) {
      console.error('Kopyalama başarısız:', err);
    }
  };

  const getNodeIcon = () => {
    switch (safeData.type) {
      case 'object':
        return <Folder className="h-4 w-4" />;
      case 'array':
        return <List className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'url':
        return <ExternalLink className="h-4 w-4" />;
      case 'large-text':
        return <FileText className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getNodeStyle = () => {
    const baseStyle = 'rounded-xl border-2 shadow-lg transition-all duration-300 min-w-[280px] max-w-[400px]';
    
    if (selected) {
      return cn(baseStyle, 'ring-4 ring-blue-400 ring-opacity-60 scale-105');
    }

    switch (safeData.type) {
      case 'object':
        return cn(baseStyle, 
          'border-orange-300 bg-gradient-to-br from-orange-50 via-white to-orange-50',
          'dark:border-orange-600 dark:from-orange-950/20 dark:via-gray-900 dark:to-orange-950/20',
          'hover:border-orange-400 hover:shadow-xl hover:scale-102'
        );
      case 'array':
        return cn(baseStyle,
          'border-purple-300 bg-gradient-to-br from-purple-50 via-white to-purple-50',
          'dark:border-purple-600 dark:from-purple-950/20 dark:via-gray-900 dark:to-purple-950/20',
          'hover:border-purple-400 hover:shadow-xl hover:scale-102'
        );
      case 'image':
        return cn(baseStyle,
          'border-green-300 bg-gradient-to-br from-green-50 via-white to-green-50',
          'dark:border-green-600 dark:from-green-950/20 dark:via-gray-900 dark:to-green-950/20',
          'hover:border-green-400 hover:shadow-xl hover:scale-102'
        );
      case 'url':
        return cn(baseStyle,
          'border-blue-300 bg-gradient-to-br from-blue-50 via-white to-blue-50',
          'dark:border-blue-600 dark:from-blue-950/20 dark:via-gray-900 dark:to-blue-950/20',
          'hover:border-blue-400 hover:shadow-xl hover:scale-102'
        );
      default:
        return cn(baseStyle,
          'border-gray-300 bg-gradient-to-br from-gray-50 via-white to-gray-50',
          'dark:border-gray-600 dark:from-gray-950/20 dark:via-gray-900 dark:to-gray-950/20',
          'hover:border-gray-400 hover:shadow-xl hover:scale-102'
        );
    }
  };

  const renderContent = () => {
    if (safeData.type === 'object' || safeData.type === 'array') {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getNodeIcon()}
              <span className="font-bold text-lg">
                {(safeData.path && safeData.path.length > 0) ? safeData.path[safeData.path.length - 1] : 'root'}
              </span>
              <span className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                {safeData.childrenCount || 0} öğe
              </span>
            </div>
            {(safeData.childrenCount || 0) > 0 && (
              <button
                onClick={handleToggle}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {safeData.isExpanded ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </button>
            )}
          </div>

          {/* Object/Array preview */}
          {safeData.type === 'object' && safeData.value && typeof safeData.value === 'object' && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Özellik Önizlemesi:</div>
              <div className="space-y-1 max-h-20 overflow-hidden">
                {Object.entries(safeData.value).slice(0, 3).map(([key, value]) => (
                  <div key={key} className="flex text-xs">
                    <span className="font-medium text-blue-600 dark:text-blue-400 min-w-[80px] truncate">
                      {key}:
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 ml-2 truncate">
                      {typeof value === 'string' ? `"${value}"` : JSON.stringify(value)}
                    </span>
                  </div>
                ))}
                {Object.keys(safeData.value).length > 3 && (
                  <div className="text-xs text-gray-500 italic">
                    ... ve {Object.keys(safeData.value).length - 3} tane daha
                  </div>
                )}
              </div>
            </div>
          )}

          {safeData.type === 'array' && Array.isArray(safeData.value) && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Array Önizlemesi:</div>
              <div className="space-y-1 max-h-20 overflow-hidden">
                {(safeData.value as any[]).slice(0, 3).map((item, index) => (
                  <div key={index} className="flex text-xs">
                    <span className="font-medium text-purple-600 dark:text-purple-400 min-w-[40px]">
                      [{index}]:
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 ml-2 truncate">
                      {typeof item === 'object' ? JSON.stringify(item).substring(0, 30) + '...' : JSON.stringify(item)}
                    </span>
                  </div>
                ))}
                {(safeData.value as any[]).length > 3 && (
                  <div className="text-xs text-gray-500 italic">
                    ... ve {(safeData.value as any[]).length - 3} tane daha
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Value nodes
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getNodeIcon()}
            <span className="font-semibold">
              {(safeData.path && safeData.path.length > 0) ? safeData.path[safeData.path.length - 1] : 'value'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {(safeData.type === 'image' || safeData.type === 'large-text' || safeData.type === 'url') && (
              <button
                onClick={handlePreview}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Önizleme"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={copyToClipboard}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Kopyala"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Rich content based on type */}
        {safeData.type === 'image' && !imageError && safeData.richContent?.thumbnail && (
          <div className="relative">
            <img
              src={safeData.richContent.thumbnail}
              alt="Preview"
              className="w-full max-h-32 object-cover rounded-lg"
              onError={() => setImageError(true)}
            />
            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
              Resim
            </div>
          </div>
        )}

        {safeData.type === 'url' && safeData.richContent && (
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
            <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">URL:</div>
            <a 
              href={safeData.value as string}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-700 dark:text-blue-300 hover:underline break-all"
            >
              {safeData.richContent.preview}
            </a>
          </div>
        )}

        {safeData.type === 'large-text' && safeData.richContent && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Metin ({(safeData.value as string).length} karakter):
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 max-h-20 overflow-hidden">
              {safeData.richContent.preview}
            </div>
          </div>
        )}

        {safeData.type === 'value' && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="text-sm text-gray-700 dark:text-gray-300 break-all">
              {typeof safeData.value === 'string' 
                ? `"${safeData.value}"` 
                : JSON.stringify(safeData.value)
              }
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Tip: {typeof safeData.value}
            </div>
          </div>
        )}
      </div>
    );
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
      
      <div className={getNodeStyle()}>
        <div className="p-4">
          {renderContent()}
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