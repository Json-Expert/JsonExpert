import { FileJson, Edit, Globe, Trash2 } from 'lucide-react';

import { formatBytes, cn } from '../../lib/utils';
import type { HistoryEntry as HistoryEntryType } from '../../stores/history-store';
import { Button } from '../ui/Button';

interface HistoryEntryProps {
  entry: HistoryEntryType;
  index: number;
  isActive: boolean;
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
}

export const HistoryEntry: React.FC<HistoryEntryProps> = ({
  entry,
  index,
  isActive,
  onSelect,
  onRemove,
}) => {
  let iconNode;
  const iconClassName = "h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground";
  switch (entry.inputMethod) {
    case 'file':
      iconNode = <FileJson className={iconClassName} />;
      break;
    case 'paste':
      iconNode = <Edit className={iconClassName} />;
      break;
    case 'url':
      iconNode = <Globe className={iconClassName} />;
      break;
    default:
      iconNode = <FileJson className={iconClassName} />;
      break;
  }

  return (
    <div
      className={cn(
        'p-3 border rounded-lg cursor-pointer transition-colors group',
        isActive
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
      )}
      onClick={() => onSelect(index)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(index);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {iconNode}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{entry.description}</span>
              <span className="text-xs text-muted-foreground">
                {formatBytes(entry.rawInput.length)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(entry.timestamp).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1 truncate">
              Preview: {entry.rawInput.substring(0, 60)}
              {entry.rawInput.length > 60 ? '...' : ''}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};