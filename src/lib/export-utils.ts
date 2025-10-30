import { JsonValue } from '../types/json.types';

import { jsonToTableRows } from './data-transformers';
import { stringifyJSON } from './json-parser';

export async function exportJSON(data: JsonValue, fileName: string = 'data.json'): Promise<void> {
  const jsonString = stringifyJSON(data, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  downloadBlob(blob, fileName);
}

export async function exportCSV(data: JsonValue, fileName: string = 'data.csv'): Promise<void> {
  const rows = jsonToTableRows(data);
  
  const headers = ['Path', 'Key', 'Value', 'Type'];
  const csvRows = [
    headers.join(','),
    ...rows.map(row => [
      `"${row.path}"`,
      `"${row.key}"`,
      `"${String(row.value).replace(/"/g, '""')}"`,
      row.type
    ].join(','))
  ];
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv' });
  downloadBlob(blob, fileName);
}

export async function exportPNG(element: HTMLElement, fileName: string = 'visualization.png'): Promise<void> {
  try {
    const html2canvas = await import('html2canvas');
    const canvas = await html2canvas.default(element, {
      backgroundColor: null,
      scale: 2,
    });
    
    canvas.toBlob((blob: Blob | null) => {
      if (blob) {
        downloadBlob(blob, fileName);
      }
    }, 'image/png');
  } catch (error) {
    console.error('Failed to export PNG:', error);
    throw error;
  }
}

export async function exportSVG(svgElement: SVGElement, fileName: string = 'visualization.svg'): Promise<void> {
  const svgString = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  downloadBlob(blob, fileName);
}

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

export function copyJSONPath(path: string[]): Promise<void> {
  const pathString = path.reduce((acc, part) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return `${acc}${part}`;
    }
    return acc ? `${acc}.${part}` : part;
  }, '');
  
  return navigator.clipboard.writeText(pathString);
}