import { Settings, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

import { cn } from '../../../lib/utils';
import { useUIStore } from '../../../stores/ui-store';

interface SiblingSelectorData {
  parentId: string;
  totalCount: number;
  visibleIndices: number[];
  parentType: 'object' | 'array';
  availableIndices: number[];
}

interface SiblingSelectorProps extends NodeProps {
  data: SiblingSelectorData;
  onSelectionChange?: (parentId: string, selectedIndices: number[]) => void;
}

export const SiblingSelector: React.FC<SiblingSelectorProps> = ({ 
  data, 
  onSelectionChange 
}) => {
  const { theme } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(data.visibleIndices)
  );
  const [currentPage, setCurrentPage] = useState(0);
  
  const itemsPerPage = 10;
  const totalPages = Math.ceil(data.totalCount / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, data.totalCount);
  const currentPageIndices = data.availableIndices.slice(startIndex, endIndex);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleIndexToggle = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const handleApply = () => {
    if (onSelectionChange) {
      onSelectionChange(data.parentId, Array.from(selectedIndices));
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setSelectedIndices(new Set(data.visibleIndices));
    setIsOpen(false);
  };

  const handleSelectPage = () => {
    const newSelected = new Set(selectedIndices);
    currentPageIndices.forEach(index => newSelected.add(index));
    setSelectedIndices(newSelected);
  };

  const handleDeselectPage = () => {
    const newSelected = new Set(selectedIndices);
    currentPageIndices.forEach(index => newSelected.delete(index));
    setSelectedIndices(newSelected);
  };

  if (!isOpen) {
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
        
        <div 
          className={cn(
            'px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-all',
            'bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100',
            'dark:bg-yellow-950/20 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-950/30',
            'min-w-[200px] text-center'
          )}
          onClick={handleToggle}
        >
          <div className="flex items-center justify-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="text-sm font-medium">
              {data.totalCount} {data.parentType === 'array' ? 'öğe' : 'özellik'} seç
            </span>
          </div>
          <div className="text-xs mt-1 opacity-75">
            Şu anda {data.visibleIndices.length} tanesi görünüyor
          </div>
        </div>
      </>
    );
  }

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
      
      <div className={cn(
        'bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600',
        'rounded-xl shadow-xl min-w-[320px] max-w-[400px]'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {data.parentType === 'array' ? 'Array Öğelerini' : 'Özellikleri'} Seç
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {data.totalCount} toplam, {selectedIndices.size} seçili
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="p-2 rounded-lg bg-green-100 hover:bg-green-200 dark:bg-green-900/50 dark:hover:bg-green-900/70 transition-colors"
              title="Uygula"
            >
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            </button>
            <button
              onClick={handleCancel}
              className="p-2 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900/70 transition-colors"
              title="İptal"
            >
              <X className="h-4 w-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {startIndex + 1}-{endIndex} / {data.totalCount}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Page Actions */}
        <div className="flex gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSelectPage}
            className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 rounded text-blue-700 dark:text-blue-300 transition-colors"
          >
            Tümünü Seç
          </button>
          <button
            onClick={handleDeselectPage}
            className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300 transition-colors"
          >
            Seçimi Kaldır
          </button>
        </div>

        {/* Items */}
        <div className="max-h-64 overflow-y-auto p-3">
          <div className="grid grid-cols-5 gap-2">
            {currentPageIndices.map(index => (
              <button
                key={index}
                onClick={() => handleIndexToggle(index)}
                className={cn(
                  'p-2 rounded-lg border-2 text-xs font-medium transition-all',
                  selectedIndices.has(index)
                    ? 'border-blue-400 bg-blue-100 text-blue-700 dark:border-blue-500 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500'
                )}
              >
                {data.parentType === 'array' ? `[${index}]` : `#${index}`}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
          İpucu: Görüntülemek istediğiniz öğeleri seçin ve "Uygula"ya tıklayın
        </div>
      </div>
    </>
  );
};