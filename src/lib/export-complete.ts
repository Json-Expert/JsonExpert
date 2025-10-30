import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

import { JsonValue } from '../types/json.types';

import { jsonToTableRows } from './data-transformers';
import { EnhancedSearchResult } from './enhanced-json-search';
import { stringifyJSON } from './json-parser';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface CompleteExportOptions {
  format: 'json' | 'csv' | 'png' | 'svg' | 'pdf' | 'xlsx' | 'xml' | 'yaml';
  fileName?: string;
  prettify?: boolean;
  includeMetadata?: boolean;
  quality?: number;
  searchResults?: EnhancedSearchResult[];
  customCSVDelimiter?: string;
  pdfOrientation?: 'portrait' | 'landscape';
  includeHeaders?: boolean;
  colorScheme?: 'light' | 'dark' | 'auto';
  maxDepth?: number;
  compression?: boolean;
}

export interface CompleteExportResult {
  success: boolean;
  fileName: string;
  size: number;
  format: string;
  error?: string;
  metadata?: {
    exportDate: string;
    duration: number;
    rowCount?: number;
  };
}

// Helper to download blob
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Enhanced JSON export with compression option
export async function exportCompleteJSON(
  data: JsonValue,
  options: Partial<CompleteExportOptions> = {}
): Promise<CompleteExportResult> {
  const startTime = performance.now();
  
  try {
    const {
      fileName = 'data.json',
      prettify = true,
      includeMetadata = false,
      searchResults,
      compression = false,
      maxDepth: _maxDepth,
    } = options;
    
    let exportData: any = data;
    
    // Filter by search results if provided
    if (searchResults && searchResults.length > 0) {
      const filteredData: any = {};
      searchResults.forEach(result => {
        const pathParts = result.path.split('.');
        let current = filteredData;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          if (!part) continue;
          if (!(part in current)) {
            current[part] = {};
          }
          current = current[part];
        }
        
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart) {
          current[lastPart] = result.value;
        }
      });
      
      exportData = filteredData;
    }
    
    // Add metadata if requested
    if (includeMetadata) {
      exportData = {
        _metadata: {
          exportDate: new Date().toISOString(),
          version: '1.0',
          searchResultsCount: searchResults?.length || 0,
          originalSize: JSON.stringify(data).length,
          compressed: compression,
        },
        data: exportData,
      };
    }
    
    const jsonString = stringifyJSON(exportData, prettify ? 2 : 0);
    
    // Compress if requested
    let blob: Blob;
    let finalFileName = fileName;
    
    if (compression) {
      // Use CompressionStream API if available
      if ('CompressionStream' in window) {
        const stream = new Blob([jsonString]).stream();
        const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
        const compressedBlob = await new Response(compressedStream).blob();
        blob = compressedBlob;
        finalFileName = fileName.replace(/\.json$/i, '.json.gz');
      } else {
        // Fallback to regular JSON
        blob = new Blob([jsonString], { type: 'application/json' });
      }
    } else {
      blob = new Blob([jsonString], { type: 'application/json' });
    }
    
    downloadBlob(blob, finalFileName);
    
    return {
      success: true,
      fileName: finalFileName,
      size: blob.size,
      format: 'json',
      metadata: {
        exportDate: new Date().toISOString(),
        duration: performance.now() - startTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      fileName: options.fileName || 'data.json',
      size: 0,
      format: 'json',
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

// Enhanced CSV export with multiple options
export async function exportCompleteCSV(
  data: JsonValue,
  options: Partial<CompleteExportOptions> = {}
): Promise<CompleteExportResult> {
  const startTime = performance.now();
  
  try {
    const {
      fileName = 'data.csv',
      customCSVDelimiter = ',',
      searchResults,
      includeHeaders = true,
      maxDepth = 10,
    } = options;
    
    const rows = jsonToTableRows(data);
    
    // Filter rows if search results provided
    const exportRows = searchResults
      ? rows.filter(row => 
          searchResults.some(result => result.jsonPath === `$.${row.path}`)
        )
      : rows;
    
    // Build CSV content
    const csvRows: string[] = [];
    
    // Add headers
    if (includeHeaders) {
      const headers = ['Path', 'Key', 'Type', 'Value', 'Depth'];
      csvRows.push(headers.map(h => `"${h}"`).join(customCSVDelimiter));
    }
    
    // Add data rows
    exportRows.forEach(row => {
      if (row.depth <= maxDepth) {
        const csvRow = [
          row.path,
          row.key,
          row.type,
          row.type === 'string' ? String(row.value) : JSON.stringify(row.value),
          String(row.depth),
        ].map(cell => {
          const cellStr = String(cell);
          // Escape quotes and wrap in quotes if contains delimiter
          if (cellStr.includes('"')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          if (cellStr.includes(customCSVDelimiter) || cellStr.includes('\n')) {
            return `"${cellStr}"`;
          }
          return cellStr;
        });
        
        csvRows.push(csvRow.join(customCSVDelimiter));
      }
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    
    downloadBlob(blob, fileName);
    
    return {
      success: true,
      fileName,
      size: blob.size,
      format: 'csv',
      metadata: {
        exportDate: new Date().toISOString(),
        duration: performance.now() - startTime,
        rowCount: exportRows.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      fileName: options.fileName || 'data.csv',
      size: 0,
      format: 'csv',
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

// Enhanced PNG export with quality options
export async function exportCompletePNG(
  element: HTMLElement,
  options: Partial<CompleteExportOptions> = {}
): Promise<CompleteExportResult> {
  const startTime = performance.now();
  
  try {
    const {
      fileName = 'visualization.png',
      quality = 2,
      colorScheme: _colorScheme = 'auto',
    } = options;
    
    // Apply color scheme if needed
    const originalTheme = element.getAttribute('data-theme');
    if (_colorScheme !== 'auto') {
      element.setAttribute('data-theme', _colorScheme);
    }
    
    // Capture the element
    const canvas = await html2canvas(element, {
      scale: quality,
      useCORS: true,
      allowTaint: true,
      backgroundColor: _colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        // Ensure styles are properly cloned
        const clonedElement = clonedDoc.querySelector('[data-export]');
        if (clonedElement) {
          clonedElement.setAttribute('data-export-mode', 'true');
        }
      },
    });
    
    // Restore original theme
    if (originalTheme) {
      element.setAttribute('data-theme', originalTheme);
    }
    
    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png', 1);
    });
    
    downloadBlob(blob, fileName);
    
    return {
      success: true,
      fileName,
      size: blob.size,
      format: 'png',
      metadata: {
        exportDate: new Date().toISOString(),
        duration: performance.now() - startTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      fileName: options.fileName || 'visualization.png',
      size: 0,
      format: 'png',
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

// Enhanced SVG export with styling preservation
export async function exportCompleteSVG(
  svgElement: SVGElement | null,
  options: Partial<CompleteExportOptions> = {}
): Promise<CompleteExportResult> {
  const startTime = performance.now();
  
  try {
    const {
      fileName = 'visualization.svg',
      colorScheme: _colorScheme = 'auto',
      includeMetadata = false,
    } = options;
    
    if (!svgElement) {
      throw new Error('No SVG element found');
    }
    
    // Clone the SVG
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    
    // Apply styles inline for proper export
    // const _styles = window.getComputedStyle(svgElement);
    const importantStyles = [
      'font-family',
      'font-size',
      'fill',
      'stroke',
      'stroke-width',
      'opacity',
    ];
    
    // Recursively apply styles
    function applyInlineStyles(element: Element): void {
      const computedStyles = window.getComputedStyle(element);
      importantStyles.forEach(styleName => {
        const value = computedStyles.getPropertyValue(styleName);
        if (value && value !== 'none' && value !== 'normal') {
          (element as HTMLElement).style.setProperty(styleName, value);
        }
      });
      
      Array.from(element.children).forEach(child => applyInlineStyles(child));
    }
    
    applyInlineStyles(clonedSvg);
    
    // Add metadata if requested
    if (includeMetadata) {
      const metadata = document.createElementNS('http://www.w3.org/2000/svg', 'metadata');
      metadata.innerHTML = `
        <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
                 xmlns:dc="http://purl.org/dc/elements/1.1/">
          <rdf:Description>
            <dc:creator>JSON Hero</dc:creator>
            <dc:date>${new Date().toISOString()}</dc:date>
            <dc:format>image/svg+xml</dc:format>
          </rdf:Description>
        </rdf:RDF>
      `;
      clonedSvg.insertBefore(metadata, clonedSvg.firstChild);
    }
    
    // Add proper SVG declaration
    const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
${clonedSvg.outerHTML}`;
    
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    downloadBlob(blob, fileName);
    
    return {
      success: true,
      fileName,
      size: blob.size,
      format: 'svg',
      metadata: {
        exportDate: new Date().toISOString(),
        duration: performance.now() - startTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      fileName: options.fileName || 'visualization.svg',
      size: 0,
      format: 'svg',
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

// Enhanced PDF export with multiple layout options
export async function exportCompletePDF(
  data: JsonValue,
  element: HTMLElement | null,
  options: Partial<CompleteExportOptions> = {}
): Promise<CompleteExportResult> {
  const startTime = performance.now();
  
  try {
    const {
      fileName = 'data.pdf',
      pdfOrientation = 'portrait',
      includeMetadata = true,
      quality = 2,
      searchResults,
    } = options;
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: pdfOrientation,
      unit: 'mm',
      format: 'a4',
    });
    
    // Add metadata
    pdf.setProperties({
      title: 'JSON Export',
      subject: 'JSON Data Export from JSON Hero',
      author: 'JSON Hero',
      keywords: 'json, data, export',
      creator: 'JSON Hero',
    });
    
    let currentY = 20;
    
    // Add title
    pdf.setFontSize(20);
    pdf.text('JSON Data Export', 20, currentY);
    currentY += 15;
    
    // Add metadata section
    if (includeMetadata) {
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Export Date: ${new Date().toLocaleString()}`, 20, currentY);
      currentY += 5;
      
      if (searchResults && searchResults.length > 0) {
        pdf.text(`Search Results: ${searchResults.length} matches`, 20, currentY);
        currentY += 5;
      }
      
      pdf.text(`Total Size: ${JSON.stringify(data).length} characters`, 20, currentY);
      currentY += 10;
    }
    
    pdf.setTextColor(0, 0, 0);
    
    // Add visualization if element provided
    if (element) {
      try {
        const canvas = await html2canvas(element, {
          scale: quality,
          useCORS: true,
          allowTaint: true,
          logging: false,
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pdf.internal.pageSize.getWidth() - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Check if image fits on current page
        if (currentY + imgHeight > pdf.internal.pageSize.getHeight() - 20) {
          pdf.addPage();
          currentY = 20;
        }
        
        pdf.addImage(imgData, 'PNG', 20, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 10;
      } catch (error) {
        console.error('Failed to add visualization to PDF:', error);
      }
    }
    
    // Add data table
    const rows = jsonToTableRows(data);
    const tableRows = searchResults
      ? rows.filter(row => 
          searchResults.some(result => result.jsonPath === `$.${row.path}`)
        )
      : rows;
    
    // Prepare table data
    const tableData = tableRows.slice(0, 100).map(row => [
      row.path.length > 50 ? row.path.substring(0, 47) + '...' : row.path,
      row.key.length > 30 ? row.key.substring(0, 27) + '...' : row.key,
      row.type,
      row.type === 'string' && String(row.value).length > 50 
        ? String(row.value).substring(0, 47) + '...' 
        : String(row.value),
    ]);
    
    // Check if we need a new page for the table
    if (currentY > pdf.internal.pageSize.getHeight() - 60) {
      pdf.addPage();
      currentY = 20;
    }
    
    // Add table
    pdf.autoTable({
      head: [['Path', 'Key', 'Type', 'Value']],
      body: tableData,
      startY: currentY,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { left: 20, right: 20 },
    });
    
    // Add footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Page ${i} of ${pageCount}`,
        pdf.internal.pageSize.getWidth() / 2,
        pdf.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Save PDF
    const pdfBlob = pdf.output('blob');
    downloadBlob(pdfBlob, fileName);
    
    return {
      success: true,
      fileName,
      size: pdfBlob.size,
      format: 'pdf',
      metadata: {
        exportDate: new Date().toISOString(),
        duration: performance.now() - startTime,
        rowCount: tableRows.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      fileName: options.fileName || 'data.pdf',
      size: 0,
      format: 'pdf',
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

// XML export
export async function exportXML(
  data: JsonValue,
  options: Partial<CompleteExportOptions> = {}
): Promise<CompleteExportResult> {
  const startTime = performance.now();
  
  try {
    const {
      fileName = 'data.xml',
      prettify = true,
      includeMetadata = false,
    } = options;
    
    function jsonToXml(obj: any, rootName = 'root', indent = ''): string {
      const nextIndent = prettify ? indent + '  ' : '';
      const newline = prettify ? '\n' : '';
      
      if (obj === null) return `${indent}<${rootName} xsi:nil="true"/>`;
      if (typeof obj !== 'object') return `${indent}<${rootName}>${escapeXml(String(obj))}</${rootName}>`;
      
      let xml = `${indent}<${rootName}>`;
      
      if (Array.isArray(obj)) {
        obj.forEach((item, _index) => {
          xml += newline + jsonToXml(item, 'item', nextIndent);
        });
      } else {
        Object.entries(obj).forEach(([key, value]) => {
          const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
          xml += newline + jsonToXml(value, safeKey, nextIndent);
        });
      }
      
      xml += newline + `${indent}</${rootName}>`;
      return xml;
    }
    
    function escapeXml(str: string): string {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    }
    
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    
    if (includeMetadata) {
      xmlContent += '<!-- Generated by JSON Hero -->\n';
      xmlContent += `<!-- Export Date: ${new Date().toISOString()} -->\n`;
    }
    
    xmlContent += jsonToXml(data, 'data', '');
    
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    downloadBlob(blob, fileName);
    
    return {
      success: true,
      fileName,
      size: blob.size,
      format: 'xml',
      metadata: {
        exportDate: new Date().toISOString(),
        duration: performance.now() - startTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      fileName: options.fileName || 'data.xml',
      size: 0,
      format: 'xml',
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

// YAML export
export async function exportYAML(
  data: JsonValue,
  options: Partial<CompleteExportOptions> = {}
): Promise<CompleteExportResult> {
  const startTime = performance.now();
  
  try {
    const {
      fileName = 'data.yaml',
      includeMetadata = false,
    } = options;
    
    function jsonToYaml(obj: any, indent = ''): string {
      if (obj === null) return 'null';
      if (obj === undefined) return 'null';
      if (typeof obj === 'boolean') return obj.toString();
      if (typeof obj === 'number') return obj.toString();
      if (typeof obj === 'string') {
        // Check if string needs quotes
        if (obj.includes(':') || obj.includes('#') || obj.includes('\n') || 
            obj.startsWith(' ') || obj.endsWith(' ')) {
          return `"${obj.replace(/"/g, '\\"')}"`;
        }
        return obj;
      }
      
      if (Array.isArray(obj)) {
        if (obj.length === 0) return '[]';
        return obj.map((item) => {
          const itemYaml = jsonToYaml(item, indent + '  ');
          return `${indent}- ${itemYaml.startsWith('\n') ? itemYaml.substring(1) : itemYaml}`;
        }).join('\n');
      }
      
      if (typeof obj === 'object') {
        const entries = Object.entries(obj);
        if (entries.length === 0) return '{}';
        
        return entries.map(([key, value]) => {
          const safeKey = key.includes(':') || key.includes(' ') ? `"${key}"` : key;
          const valueYaml = jsonToYaml(value, indent + '  ');
          
          if (typeof value === 'object' && value !== null) {
            return `${indent}${safeKey}:\n${valueYaml}`;
          }
          return `${indent}${safeKey}: ${valueYaml}`;
        }).join('\n');
      }
      
      return String(obj);
    }
    
    let yamlContent = '';
    
    if (includeMetadata) {
      yamlContent += '# Generated by JSON Hero\n';
      yamlContent += `# Export Date: ${new Date().toISOString()}\n`;
      yamlContent += '---\n';
    }
    
    yamlContent += jsonToYaml(data);
    
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    downloadBlob(blob, fileName);
    
    return {
      success: true,
      fileName,
      size: blob.size,
      format: 'yaml',
      metadata: {
        exportDate: new Date().toISOString(),
        duration: performance.now() - startTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      fileName: options.fileName || 'data.yaml',
      size: 0,
      format: 'yaml',
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}