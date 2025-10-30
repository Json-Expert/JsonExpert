export interface FetchOptions {
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
  method?: 'GET' | 'POST';
  body?: any;
}

export interface FileUploadResult {
  success: boolean;
  data?: any;
  error?: string;
  fileName?: string;
  fileSize?: number;
  warnings?: string[];
  metadata?: {
    originalSize: number;
    processedSize: number;
    processingTime: number;
    encoding: string;
    lineCount: number;
    hasComments: boolean;
    hasBOM: boolean;
  };
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'png' | 'svg' | 'pdf' | 'xml' | 'yaml';
  fileName?: string;
  quality?: number;
  prettify?: boolean;
}