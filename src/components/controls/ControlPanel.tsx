import { RefreshCw, Settings, Shield, History } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { useJsonStore } from '@/stores/json-store';

import { ExportOptions } from './ExportOptions';
import { HistoryPanel } from './HistoryPanel';
import { SchemaValidatorComponent } from './SchemaValidator';
import { SearchFilter } from './SearchFilter';
import { SettingsPanel } from './SettingsPanel';
import { ViewSelector } from './ViewSelector';


export const ControlPanel: React.FC = () => {
  const { clearData } = useJsonStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [schemaValidatorOpen, setSchemaValidatorOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 p-4 border-b">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <ViewSelector />
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setHistoryOpen(true)}
            title="History & Undo"
          >
            <History className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSchemaValidatorOpen(true)}
            title="Schema Validation"
          >
            <Shield className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={clearData}
            title="New JSON"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <ExportOptions />
          
          <Button
            variant="outline"
            size="icon"
            title="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <SearchFilter />
      
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <SchemaValidatorComponent isOpen={schemaValidatorOpen} onClose={() => setSchemaValidatorOpen(false)} />
      <HistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
};