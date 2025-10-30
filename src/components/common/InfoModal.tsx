import { Info, X, Github, Globe } from 'lucide-react';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';

import { APP_NAME, APP_VERSION } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export const InfoModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        aria-label="About JSON Expert"
      >
        <Info className="h-5 w-5" />
      </Button>

      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => setIsOpen(false)}
        >
          <Card
            className="w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
              <div>
                <CardTitle className="text-2xl">{APP_NAME}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Version {APP_VERSION}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Description */}
              <div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Professional JSON visualization and analysis tool. Visualize complex JSON structures with multiple view modes, perform advanced searches, validate schemas, and export data in various formats.
                </p>
              </div>

              {/* Features */}
              <div>
                <h3 className="font-semibold mb-2">Key Features</h3>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li>• Multiple visualization modes: Tree, Graph, Table, Raw</li>
                  <li>• Advanced search with regex support</li>
                  <li>• JSON Schema validation</li>
                  <li>• Export to JSON, CSV, PNG formats</li>
                  <li>• Large file support up to 100MB</li>
                  <li>• Dark/Light theme</li>
                </ul>
              </div>

              {/* Links */}
              <div className="pt-4 border-t space-y-3">
                <a
                  href="https://jsonexpert.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors group"
                >
                  <Globe className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">jsonexpert.com</span>
                </a>
                <a
                  href="https://github.com/Json-Expert/JsonExpert"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors group"
                >
                  <Github className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>View on GitHub</span>
                </a>
              </div>

              {/* License */}
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  &copy; 2025 JSON Expert. Licensed under MIT License.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>,
        document.body
      )}
    </>
  );
};
