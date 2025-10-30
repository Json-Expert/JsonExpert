import { Settings, X } from 'lucide-react';
import React, { useState } from 'react';

import { cn } from '../../lib/utils';
import { useSettingsStore } from '../../stores/settings-store';
import { useUIStore } from '../../stores/ui-store';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const settings = useSettingsStore();
  const { showLineNumbers, wordWrap, setShowLineNumbers, setWordWrap, expandLevel, setExpandLevel } = useUIStore();
  const [localSettings, setLocalSettings] = useState({
    maxFileSize: settings.maxFileSize,
    autoFormat: settings.autoFormat,
    validateOnPaste: settings.validateOnPaste,
    indentSize: settings.indentSize,
    enableAnimations: settings.enableAnimations,
  });

  const handleSave = () => {
    settings.updateSettings(localSettings);
    onClose();
  };

  const handleReset = () => {
    settings.resetSettings();
    setLocalSettings({
      maxFileSize: settings.maxFileSize,
      autoFormat: settings.autoFormat,
      validateOnPaste: settings.validateOnPaste,
      indentSize: settings.indentSize,
      enableAnimations: settings.enableAnimations,
    });
  };

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center p-4',
      isOpen ? 'visible' : 'invisible'
    )}>
      <div 
        className={cn(
          'absolute inset-0 bg-black/50 transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
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
      
      <Card className={cn(
        'relative w-full max-w-lg transform transition-all',
        isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      )}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
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
        
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-3">Editor Settings</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm">Show line numbers</span>
                <input
                  type="checkbox"
                  checked={showLineNumbers}
                  onChange={(e) => setShowLineNumbers(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm">Word wrap</span>
                <input
                  type="checkbox"
                  checked={wordWrap}
                  onChange={(e) => setWordWrap(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm">Auto format JSON</span>
                <input
                  type="checkbox"
                  checked={localSettings.autoFormat}
                  onChange={(e) => setLocalSettings({ ...localSettings, autoFormat: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm">Validate on paste</span>
                <input
                  type="checkbox"
                  checked={localSettings.validateOnPaste}
                  onChange={(e) => setLocalSettings({ ...localSettings, validateOnPaste: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </label>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-3">Display Settings</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm">Expand level</span>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={expandLevel}
                  onChange={(e) => setExpandLevel(parseInt(e.target.value))}
                  className="w-16 rounded border border-input px-2 py-1 text-sm"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm">Indent size</span>
                <select
                  value={localSettings.indentSize}
                  onChange={(e) => setLocalSettings({ ...localSettings, indentSize: parseInt(e.target.value) })}
                  className="rounded border border-input px-2 py-1 text-sm"
                >
                  <option value="2">2 spaces</option>
                  <option value="4">4 spaces</option>
                  <option value="8">8 spaces</option>
                </select>
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm">Enable animations</span>
                <input
                  type="checkbox"
                  checked={localSettings.enableAnimations}
                  onChange={(e) => setLocalSettings({ ...localSettings, enableAnimations: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </label>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-3">Performance</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm">Max file size (MB)</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={localSettings.maxFileSize / (1024 * 1024)}
                  onChange={(e) => setLocalSettings({ ...localSettings, maxFileSize: parseInt(e.target.value) * 1024 * 1024 })}
                  className="w-16 rounded border border-input px-2 py-1 text-sm"
                />
              </label>
            </div>
          </div>
        </CardContent>
        
        <div className="flex justify-between p-6 pt-0">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};