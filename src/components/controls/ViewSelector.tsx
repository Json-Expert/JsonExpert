import { TreePine, Code, GitGraph, Table } from 'lucide-react';
import React from 'react';

import { cn } from '../../lib/utils';
import { useUIStore } from '../../stores/ui-store';
import { VisualizationType } from '../../types/visualization.types';

interface ViewOption {
  id: VisualizationType;
  label: string;
  icon: React.ReactNode;
}

const viewOptions: ViewOption[] = [
  { id: 'tree', label: 'Tree', icon: <TreePine className="h-4 w-4" /> },
  { id: 'raw', label: 'Raw', icon: <Code className="h-4 w-4" /> },
  { id: 'graph', label: 'Graph', icon: <GitGraph className="h-4 w-4" /> },
  { id: 'table', label: 'Table', icon: <Table className="h-4 w-4" /> },
];

export const ViewSelector: React.FC = () => {
  const { activeView, setActiveView } = useUIStore();

  return (
    <div className="flex rounded-lg border bg-muted p-1 overflow-x-auto">
      {viewOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => setActiveView(option.id)}
          className={cn(
            'flex items-center gap-2 rounded-md px-2 sm:px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap',
            activeView === option.id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.icon}
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      ))}
    </div>
  );
};