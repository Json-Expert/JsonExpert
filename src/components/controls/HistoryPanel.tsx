import { History, Undo, Redo, Trash2, X } from 'lucide-react';

import { useHistoryActions } from '../../hooks/useHistoryActions';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

import { HistoryEntry } from './HistoryEntry';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose }) => {
  const {
    entries,
    currentIndex,
    canUndo,
    canRedo,
    handleGoToEntry,
    handleUndo,
    handleRedo,
    handleRemoveEntry,
    handleClearHistory,
  } = useHistoryActions();

  if (!isOpen) {
    return null;
  }

  const hasEntries = entries.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClose();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Close dialog"
      />
      
      <Card className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            History ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="flex gap-2 pb-4 border-b">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo}
              className="flex-1"
            >
              <Undo className="h-4 w-4 mr-2" />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo}
              className="flex-1"
            >
              <Redo className="h-4 w-4 mr-2" />
              Redo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              disabled={!hasEntries}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>

          {/* History Entries */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {!hasEntries ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No history entries yet</p>
                <p className="text-sm mt-1">
                  Upload, paste, or fetch JSON data to build your history
                </p>
              </div>
            ) : (
              <>
                {entries.map((entry, index) => (
                  <HistoryEntry
                    key={`${entry.timestamp}-${index}`}
                    entry={entry}
                    index={index}
                    isActive={index === currentIndex}
                    onSelect={handleGoToEntry}
                    onRemove={handleRemoveEntry}
                  />
                ))}
              </>
            )}
          </div>

          {/* Help Text */}
          {hasEntries && (
            <div className="text-xs text-muted-foreground border-t pt-4">
              <strong>Tips:</strong> Click an entry to navigate to it, or use the Undo/Redo buttons for quick navigation.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};