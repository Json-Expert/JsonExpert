import { FileUp, Edit, Globe } from 'lucide-react';
import React from 'react';

import { cn } from '../../lib/utils';

import { FileUpload } from './FileUpload';
import { TextPaste } from './TextPaste';
import { URLFetch } from './URLFetch';


type TabType = 'file' | 'paste' | 'url';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

const tabs: Tab[] = [
  {
    id: 'file',
    label: 'File Upload',
    icon: <FileUp className="h-4 w-4" />,
    component: <FileUpload />,
  },
  {
    id: 'paste',
    label: 'Paste JSON',
    icon: <Edit className="h-4 w-4" />,
    component: <TextPaste />,
  },
  {
    id: 'url',
    label: 'Fetch URL',
    icon: <Globe className="h-4 w-4" />,
    component: <URLFetch />,
  },
];

export const InputTabs: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<TabType>('file');

  return (
    <div className="w-full">
      <div className="border-b">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'group inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
              )}
            >
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
      
      <div className="mt-6">
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};