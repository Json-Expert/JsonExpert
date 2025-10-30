import { FileJson, Moon, Sun, Github } from 'lucide-react';
import React from 'react';

import { InfoModal } from '@/components/common/InfoModal';
import { APP_NAME } from '../../lib/constants';
import { useUIStore } from '../../stores/ui-store';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useUIStore();

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        <div className="flex items-center space-x-2">
          <FileJson className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">{APP_NAME}</span>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <InfoModal />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            asChild
          >
            <a
              href="https://github.com/Json-Expert/JsonExpert"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View on GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
};