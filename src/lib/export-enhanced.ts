import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

import { JsonValue } from '../types/json.types';

import { jsonToTableRows } from './data-transformers';
import { stringifyJSON } from './json-parser';
import { SearchResult } from './json-search';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'png' | 'svg' | 'pdf' | 'xml' | 'yaml';
  fileName?: string;
  prettify?: boolean;
  includeMetadata?: boolean;
  quality?: number;
  searchResults?: SearchResult[];
  customCSVDelimiter?: string;
  pdfOrientation?: 'portrait' | 'landscape';
}

export interface ExportResult {
  success: boolean;
  fileName: string;
  size: number;
  error?: string;
}

// Enhanced JSON export with options
export async function exportJSON(
  data: JsonValue,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  try {
    const {
      fileName = 'data.json',
      prettify = true,
      includeMetadata = false,
      searchResults,
    } = options;
    
    let exportData: any = data;
    
    if (includeMetadata) {
      exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          version: '1.0',
          searchResultsCount: searchResults?.length || 0,
        },
        data,
      };
    }
    
    const jsonString = stringifyJSON(exportData, prettify ? 2 : 0);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    downloadBlob(blob, fileName);
    
    return {
      success: true,
      fileName,
      size: blob.size,
    };
  } catch (error) {
    return {
      success: false,
      fileName: options.fileName || 'data.json',
      size: 0,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

// Enhanced CSV export with custom delimiter
export async function exportCSV(
  data: JsonValue,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  try {
    const {
      fileName = 'data.csv',
      customCSVDelimiter = ',',
      searchResults,
    } = options;
    
    const rows = jsonToTableRows(data);
    
    // Filter rows if search results provided
    const exportRows = searchResults
      ? rows.filter(row => 
          searchResults.some(result => result.path === row.path)
        )
      : rows;
    
    const headers = ['Path', 'Key', 'Value', 'Type', 'Depth'];
    const csvRows = [
      headers.join(customCSVDelimiter),
      ...exportRows.map(row => [
        escapeCSVValue(row.path),
        escapeCSVValue(row.key),
        escapeCSVValue(String(row.value)),
        row.type,
        row.depth,
      ].join(customCSVDelimiter))
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    
    downloadBlob(blob, fileName);
    
    return {
      success: true,
      fileName,
      size: blob.size,
    };
  } catch (error) {
    return {
      success: false,
      fileName: options.fileName || 'data.csv',
      size: 0,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

// Enhanced PNG export with quality settings
export async function exportPNG(
  element: HTMLElement,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  try {
    const {
      fileName = 'visualization.png',
      quality = 2,
    } = options;
    
    const canvas = await html2canvas(element, {
      backgroundColor: null,
      scale: quality,
      logging: false,
      useCORS: true,
      allowTaint: false,
    });
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, fileName);
          resolve({
            success: true,
            fileName,
            size: blob.size,
          });
        } else {
          resolve({
            success: false,
            fileName,
            size: 0,
            error: 'Failed to create PNG blob',
          });
        }
      }, 'image/png', quality / 2);
    });
  } catch (error) {
    return {
      success: false,
      fileName: options.fileName || 'visualization.png',
      size: 0,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

// SVG export from React Flow or other SVG elements
export async function exportSVG(
  svgElement: SVGElement | null,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  try {
    const { fileName = 'visualization.svg' } = options;
    
    if (!svgElement) {
      // Try to find SVG in React Flow container
      const reactFlowElement = document.querySelector('.react-flow__viewport');
      if (reactFlowElement) {
        svgElement = reactFlowElement.querySelector('svg');
      }
    }
    
    if (!svgElement) {
      throw new Error('No SVG element found');
    }
    
    // Clone the SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    
    // Add styles to the SVG
    const styles = document.createElement('style');
    styles.textContent = getComputedStyles();
    clonedSvg.insertBefore(styles, clonedSvg.firstChild);
    
    // Set proper attributes
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    const svgString = new XMLSerializer().serializeToString(clonedSvg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    
    downloadBlob(blob, fileName);
    
    return {
      success: true,
      fileName,
      size: blob.size,
    };
  } catch (error) {
    return {
      success: false,
      fileName: options.fileName || 'visualization.svg',
      size: 0,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

// PDF export with table and visualization
export async function exportPDF(
  data: JsonValue,
  element?: HTMLElement,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  try {
    const {
      fileName = 'data.pdf',
      pdfOrientation = 'portrait',
      includeMetadata = true,
    } = options;
    
    const pdf = new jsPDF({
      orientation: pdfOrientation,
      unit: 'mm',
      format: 'a4',
    });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let currentY = 20;
    
    // Add title
    pdf.setFontSize(20);
    pdf.text('JSON Data Export', pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;
    
    // Add metadata
    if (includeMetadata) {
      pdf.setFontSize(10);
      pdf.text(`Export Date: ${new Date().toLocaleString()}`, 14, currentY);
      currentY += 10;
    }
    
    // Add visualization if element provided
    if (element) {
      try {
        const canvas = await html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 1,
          logging: false,
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 28;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (currentY + imgHeight > pageHeight - 20) {
          pdf.addPage();
          currentY = 20;
        }
        
        pdf.addImage(imgData, 'PNG', 14, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 10;
      } catch (error) {
        console.warn('Failed to add visualization to PDF:', error);
      }
    }
    
    // Add data table
    const rows = jsonToTableRows(data);
    const tableData = rows.map(row => [
      row.path,
      row.key,
      String(row.value).substring(0, 50) + (String(row.value).length > 50 ? '...' : ''),
      row.type,
    ]);
    
    if (currentY > pageHeight - 50) {
      pdf.addPage();
      currentY = 20;
    }
    
    pdf.autoTable({
      head: [['Path', 'Key', 'Value', 'Type']],
      body: tableData,
      startY: currentY,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { left: 14, right: 14 },
    });
    
    // Save the PDF
    const pdfBlob = pdf.output('blob');
    downloadBlob(pdfBlob, fileName);
    
    return {
      success: true,
      fileName,
      size: pdfBlob.size,
    };
  } catch (error) {
    return {
      success: false,
      fileName: options.fileName || 'data.pdf',
      size: 0,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

// Helper function to escape CSV values
function escapeCSVValue(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Helper function to get computed styles for SVG
function getComputedStyles(): string {
  const styles: string[] = [];
  const sheets = document.styleSheets;
  
  for (let i = 0; i < sheets.length; i++) {
    try {
      const sheet = sheets[i];
      if (!sheet) continue;
      const rules = sheet.cssRules || (sheet as any).rules;
      if (!rules) continue;
      for (let j = 0; j < rules.length; j++) {
        const rule = rules[j];
        if (rule instanceof CSSStyleRule) {
          styles.push(rule.cssText);
        }
      }
    } catch (e) {
      // Ignore cross-origin stylesheets
    }
  }
  
  return styles.join('\n');
}

// Helper function to download blob
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export as XML
export async function exportXML(
  data: JsonValue,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  try {
    const { fileName = 'data.xml' } = options;
    
    function jsonToXml(obj: any, rootName = 'root'): string {
      function escape(str: string): string {
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }
      
      function convertValue(value: any, key: string): string {
        if (value === null) return `<${key} xsi:nil="true" />`;
        if (typeof value === 'string') return `<${key}>${escape(value)}</${key}>`;
        if (typeof value === 'number' || typeof value === 'boolean') {
          return `<${key}>${String(value)}</${key}>`;
        }
        if (Array.isArray(value)) {
          return value.map(item => convertValue(item, 'item')).join('');
        }
        if (typeof value === 'object') {
          const entries = Object.entries(value)
            .map(([k, v]) => convertValue(v, k))
            .join('');
          return `<${key}>${entries}</${key}>`;
        }
        return `<${key}>${escape(String(value))}</${key}>`;
      }
      
      return `<?xml version="1.0" encoding="UTF-8"?>\n${convertValue(obj, rootName)}`;
    }
    
    const xmlContent = jsonToXml(data);
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    downloadBlob(blob, fileName);
    
    return {
      success: true,
      fileName,
      size: blob.size,
    };
  } catch (error) {
    return {
      success: false,
      fileName: options.fileName || 'data.xml',
      size: 0,
      error: error instanceof Error ? error.message : 'XML export failed',
    };
  }
}

// Export as YAML
export async function exportYAML(
  data: JsonValue,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  try {
    const { fileName = 'data.yaml' } = options;
    
    function jsonToYaml(obj: any, indent = 0): string {
      const spaces = '  '.repeat(indent);
      
      if (obj === null) return 'null';
      if (typeof obj === 'string') {
        // Escape quotes and handle multiline
        if (obj.includes('\n') || obj.includes('"') || obj.includes("'")) {
          return `|\n${spaces}  ${obj.split('\n').join(`\n${spaces}  `)}`;
        }
        return `"${obj.replace(/"/g, '\\"')}"`;
      }
      if (typeof obj === 'number' || typeof obj === 'boolean') {
        return String(obj);
      }
      if (Array.isArray(obj)) {
        if (obj.length === 0) return '[]';
        return obj.map(item => `${spaces}- ${jsonToYaml(item, indent + 1)}`).join('\n');
      }
      if (typeof obj === 'object') {
        if (Object.keys(obj).length === 0) return '{}';
        return Object.entries(obj)
          .map(([key, value]) => {
            const yamlValue = jsonToYaml(value, indent + 1);
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              return `${spaces}${key}:\n${yamlValue}`;
            }
            return `${spaces}${key}: ${yamlValue}`;
          })
          .join('\n');
      }
      return String(obj);
    }
    
    const yamlContent = jsonToYaml(data);
    const blob = new Blob([yamlContent], { type: 'application/x-yaml' });
    downloadBlob(blob, fileName);
    
    return {
      success: true,
      fileName,
      size: blob.size,
    };
  } catch (error) {
    return {
      success: false,
      fileName: options.fileName || 'data.yaml',
      size: 0,
      error: error instanceof Error ? error.message : 'YAML export failed',
    };
  }
}

// Copy JSON path to clipboard
export function copyJSONPath(path: string[]): Promise<void> {
  const pathString = path.reduce((acc, part) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return `${acc}${part}`;
    }
    return acc ? `${acc}.${part}` : part;
  }, '$');
  
  return navigator.clipboard.writeText(pathString);
}