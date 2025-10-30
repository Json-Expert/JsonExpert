import { X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

import { cn } from '../../../lib/utils';

interface SiblingSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentPath: string[];
  parentKey: string;
  allSiblings: string[];
  currentSelection: string[];
  onApplySelection: (selectedKeys: string[]) => void;
}

export const SiblingSelectorModal: React.FC<SiblingSelectorModalProps> = ({
  isOpen,
  onClose,
  parentPath,
  parentKey,
  allSiblings,
  currentSelection,
  onApplySelection
}) => {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set(currentSelection));
  const [currentPage, setCurrentPage] = useState(0);
  
  const itemsPerPage = 12;
  const totalPages = Math.ceil(allSiblings.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, allSiblings.length);
  const currentPageItems = allSiblings.slice(startIndex, endIndex);

  if (!isOpen) return null;

  const handleToggleKey = (key: string) => {
    const newSelected = new Set(selectedKeys);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedKeys(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedKeys(new Set(currentPageItems));
  };

  const handleDeselectAll = () => {
    const newSelected = new Set(selectedKeys);
    currentPageItems.forEach(key => newSelected.delete(key));
    setSelectedKeys(newSelected);
  };

  const handleApply = () => {
    onApplySelection(Array.from(selectedKeys));
    onClose();
  };

  const handleCancel = () => {
    setSelectedKeys(new Set(currentSelection));
    onClose();
  };

  const isArrayParent = allSiblings.some(key => key.startsWith('['));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl max-h-[80vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Select Sibling Items
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Select from {parentPath.length > 0 ? `${parentPath.join(' → ')} → ${parentKey}` : parentKey}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {allSiblings.length} total items, {selectedKeys.size} selected
            </p>
          </div>
          
          <button
            onClick={handleCancel}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage + 1} / {totalPages} ({startIndex + 1}-{endIndex} of {allSiblings.length})
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Page Actions */}
        <div className="flex gap-2 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={handleSelectAll}
            className="text-sm px-3 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 rounded text-blue-700 dark:text-blue-300 transition-colors"
          >
            Select This Page ({currentPageItems.length})
          </button>
          <button
            onClick={handleDeselectAll}
            className="text-sm px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300 transition-colors"
          >
            Deselect This Page
          </button>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-3">
            {currentPageItems.map(key => (
              <button
                key={key}
                onClick={() => handleToggleKey(key)}
                className={cn(
                  'p-3 rounded-lg border-2 text-left transition-all hover:scale-105',
                  selectedKeys.has(key)
                    ? 'border-blue-400 bg-blue-100 text-blue-700 dark:border-blue-500 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">
                    {isArrayParent ? `Item ${key}` : key}
                  </span>
                  {selectedKeys.has(key) && (
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  )}
                </div>
                {!isArrayParent && (
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    Key: {key}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedKeys.size} items selected. Selected items will be shown in the graph view.
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply ({selectedKeys.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};