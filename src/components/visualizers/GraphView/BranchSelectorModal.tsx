import { X, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface BranchOption {
  key: string;
  value: any;
  type: string;
}

interface BranchSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: BranchOption[];
  onSelect: (selectedKeys: string[]) => void;
  nodeLabel: string;
}

export const BranchSelectorModal: React.FC<BranchSelectorModalProps> = ({
  isOpen,
  onClose,
  branches,
  onSelect,
  nodeLabel,
}) => {
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(new Set());

  const handleToggle = (key: string) => {
    setSelectedBranches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedBranches(new Set(branches.map(b => b.key)));
  };

  const handleClearAll = () => {
    setSelectedBranches(new Set());
  };

  const handleConfirm = () => {
    onSelect(Array.from(selectedBranches));
    onClose();
    setSelectedBranches(new Set());
  };

  if (!isOpen) return null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string': return 'text-green-600 dark:text-green-400';
      case 'number': return 'text-blue-600 dark:text-blue-400';
      case 'boolean': return 'text-pink-600 dark:text-pink-400';
      case 'object': return 'text-orange-600 dark:text-orange-400';
      case 'array': return 'text-purple-600 dark:text-purple-400';
      case 'null': return 'text-gray-500';
      default: return 'text-gray-600';
    }
  };

  const formatValue = (value: any, type: string) => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (type === 'string') return value.length > 40 ? `"${value.substring(0, 40)}..."` : `"${value}"`;
    if (type === 'object') return `{${Object.keys(value || {}).length} properties}`;
    if (type === 'array') return `[${(value || []).length} items]`;
    return String(value);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <Card
        className="w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0 flex-shrink-0">
          <div>
            <CardTitle className="text-lg">Expand Items</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Select which items from <span className="font-mono">{nodeLabel}</span> to expand
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex flex-col space-y-3">
          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b flex-shrink-0">
            <div className="text-sm text-muted-foreground">
              {selectedBranches.size} of {branches.length} selected
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Branch List */}
          <div className="flex-1 overflow-y-auto space-y-1">
            {branches.map((branch) => {
              const isSelected = selectedBranches.has(branch.key);
              return (
                <div
                  key={branch.key}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-primary'
                      : 'bg-muted/50 border-border hover:bg-muted hover:border-muted-foreground/20'
                  }`}
                  onClick={() => handleToggle(branch.key)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 ${
                        isSelected
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {isSelected && (
                        <ChevronRight className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                    <span className="font-mono text-sm font-medium truncate">
                      {branch.key}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium ${getTypeColor(branch.type)}`}>
                      {branch.type}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {formatValue(branch.value, branch.type)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t flex-shrink-0">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedBranches.size === 0}
            >
              Expand Selected ({selectedBranches.size})
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>,
    document.body
  );
};
