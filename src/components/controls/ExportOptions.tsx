import { Download, FileJson, FileText, Image, FileCode, FileType, Code } from 'lucide-react';
import React, { useState } from 'react';

import { useToast } from '../../hooks/useToast';
import { exportJSON, exportCSV, exportPNG, exportSVG, exportPDF, exportXML, exportYAML } from '../../lib/export-enhanced';
import { useJsonStore } from '../../stores/json-store';
import { useUIStore } from '../../stores/ui-store';
import { Button } from '../ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';

export const ExportOptions: React.FC = () => {
  const { data } = useJsonStore();
  const { activeView } = useUIStore();
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'json' | 'csv' | 'png' | 'svg' | 'pdf' | 'xml' | 'yaml') => {
    if (!data) return;
    
    setIsExporting(true);
    try {
      let result;
      const fileName = `json-export-${new Date().toISOString().slice(0, 10)}`;
      
      switch (format) {
        case 'json':
          result = await exportJSON(data, { 
            fileName: `${fileName}.json`,
            prettify: true,
            includeMetadata: true,
          });
          break;
          
        case 'csv':
          result = await exportCSV(data, {
            fileName: `${fileName}.csv`,
          });
          break;
          
        case 'png': {
          const element = document.querySelector('.visualization-container') ||
                        document.querySelector('.react-flow') ||
                        document.querySelector('[data-export="visualization"]');
          if (element instanceof HTMLElement) {
            result = await exportPNG(element, {
              fileName: `${fileName}-${activeView}.png`,
              quality: 2,
            });
          } else {
            throw new Error('No visualization element found');
          }
          break;
        }
        
        case 'svg': {
          const svgElement = document.querySelector('.react-flow__viewport svg') ||
                           document.querySelector('svg[data-export="visualization"]');
          result = await exportSVG(svgElement as SVGElement, {
            fileName: `${fileName}-${activeView}.svg`,
          });
          break;
        }
        
        case 'pdf': {
          const element = document.querySelector('.visualization-container') ||
                        document.querySelector('[data-export="visualization"]');
          result = await exportPDF(data, element as HTMLElement, {
            fileName: `${fileName}.pdf`,
            pdfOrientation: 'landscape',
            includeMetadata: true,
          });
          break;
        }
        
        case 'xml':
          result = await exportXML(data, {
            fileName: `${fileName}.xml`,
          });
          break;
          
        case 'yaml':
          result = await exportYAML(data, {
            fileName: `${fileName}.yaml`,
          });
          break;
      }
      
      if (result?.success) {
        showToast({
          title: 'Export successful',
          description: `Exported as ${result.fileName} (${(result.size / 1024).toFixed(2)} KB)`,
          variant: 'success',
        });
      } else {
        throw new Error(result?.error || 'Export failed');
      }
    } catch (error) {
      showToast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={!data || isExporting}
          title="Export"
        >
          <Download className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileJson className="mr-2 h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('png')}>
          <Image className="mr-2 h-4 w-4" />
          Export as PNG
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('svg')}
        >
          <FileCode className="mr-2 h-4 w-4" />
          Export as SVG {activeView !== 'graph' && '(Graph view only)'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileType className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('xml')}>
          <Code className="mr-2 h-4 w-4" />
          Export as XML
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('yaml')}>
          <FileText className="mr-2 h-4 w-4" />
          Export as YAML
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};