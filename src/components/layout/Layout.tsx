import { Github, Globe } from 'lucide-react';
import React from 'react';

import { cn } from '../../lib/utils';

import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className={cn('flex-1', className)}>
        {children}
      </main>
      <footer className="border-t bg-background py-6 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>&copy; 2025 JSON Expert. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://jsonexpert.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-foreground transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span>jsonexpert.com</span>
            </a>
            <a
              href="https://github.com/Json-Expert/JsonExpert"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-foreground transition-colors"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};