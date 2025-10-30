import { JsonValue } from '../types/json.types';

import { parseJSON } from './json-parser';

export interface FileProcessingOptions {
  maxSize?: number;
  chunkSize?: number;
  validateStructure?: boolean;
  sanitizeData?: boolean;
}

export interface FileProcessingResult {
  success: boolean;
  data?: JsonValue;
  error?: string;
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

const DEFAULT_OPTIONS: FileProcessingOptions = {
  maxSize: 100 * 1024 * 1024, // 100MB (increased from 50MB)
  chunkSize: 1024 * 1024, // 1MB
  validateStructure: true,
  sanitizeData: true,
};

// Fix malformed JSON strings with nested JSON - ULTRA AGGRESSIVE
export function fixNestedJsonStrings(content: string): string {
  let fixed = content;
  
  // Pattern 1: Fix specific pattern: "config": "{\"key\":\"value\"}"
  fixed = fixed.replace(
    /"([^"]*)":\s*"(\{[^}]*\})"/g,
    (_match, key, jsonValue) => {
      try {
        // Try to parse the inner JSON to validate it
        const unescapedJson = jsonValue
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
        
        // If it's valid JSON, properly escape it
        JSON.parse(unescapedJson);
        
        // Re-escape for JSON string
        const properlyEscaped = JSON.stringify(unescapedJson);
        return `"${key}": ${properlyEscaped}`;
      } catch (e) {
        // If it's not valid JSON, escape it as a regular string
        const escaped = jsonValue
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"');
        return `"${key}": "${escaped}"`;
      }
    }
  );
  
  // Pattern 2: Fix unescaped quotes in any string value
  fixed = fixed.replace(
    /"([^"]*)":\s*"([^"]*"[^"]*[^"]*[^"]*)"(?=\s*[,}\]])/g,
    (_match, key, value) => {
      // This string contains unescaped quotes
      const escaped = value.replace(/"/g, '\\"');
      return `"${key}": "${escaped}"`;
    }
  );
  
  // Pattern 3: Fix control characters in string literals
  fixed = fixed.replace(
    /"([^"]*[\x00-\x1F][^"]*)"/g,
    (_match, content) => {
      const cleaned = content
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, (char: string) => {
          switch (char.charCodeAt(0)) {
            case 9: return '\\t';   // tab
            case 10: return '\\n';  // newline
            case 13: return '\\r';  // carriage return
            case 8: return '\\b';   // backspace
            case 12: return '\\f';  // form feed
            default: return '';     // remove everything else
          }
        });
      return `"${cleaned}"`;
    }
  );
  
  return fixed;
}

// Emergency JSON recovery - last resort
export function emergencyJsonRecovery(content: string): string {
  let recovered = content;
  
  // Step 1: Fix obvious quote escaping issues
  recovered = recovered.replace(/([^\\])"/g, '$1\\"');
  recovered = recovered.replace(/^"/, '\\"'); // Handle start of string
  
  // Step 2: Fix line breaks in strings
  recovered = recovered.replace(/\n/g, '\\n');
  recovered = recovered.replace(/\r/g, '\\r');
  recovered = recovered.replace(/\t/g, '\\t');
  
  // Step 3: Remove completely invalid characters
  recovered = recovered.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Step 4: Fix trailing commas
  recovered = recovered.replace(/,(\s*[}\]])/g, '$1');
  
  // Step 5: Try to fix broken string endings
  recovered = recovered.replace(/([^\\])"(\s*[,}\]])/g, '$1\\"$2');
  
  return recovered;
}

// Clean control characters from JSON content - MEGA AGGRESSIVE VERSION
export function cleanControlCharacters(content: string): string {
  // First pass: Remove all problematic control characters completely
  let cleaned = content
    // Remove all control characters except space, tab, newline, carriage return
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Replace tabs with spaces outside of strings
    .replace(/\t/g, ' ')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Second pass: Fix nested JSON strings (JSON inside JSON)
  // This handles cases like: "config": "{\"key\":\"value\"}"
  cleaned = cleaned.replace(/"([^"]*\{[^"]*\}[^"]*)"/g, (_match, jsonContent) => {
    try {
      // Try to fix common JSON escaping issues
      const fixedContent = jsonContent
        // Fix unescaped quotes in nested JSON
        .replace(/(?<!\\)"/g, '\\"')
        // Fix already escaped quotes that got double-escaped
        .replace(/\\\\"/g, '\\"');
      
      return `"${fixedContent}"`;
    } catch (e) {
      // If parsing fails, return original but with basic escaping
      return `"${jsonContent.replace(/"/g, '\\"')}"`;
    }
  });

  // Third pass: Fix control characters inside JSON strings
  cleaned = cleaned.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (_match, content) => {
    // Don't re-process already fixed nested JSON
    if (content.includes('{\\"') || content.includes('\\"}')) {
      return _match;
    }
    
    // Escape any remaining control characters inside strings
    const escapedContent = content
      .replace(/\n/g, '\\n')   // Escape newlines
      .replace(/\r/g, '\\r')   // Escape carriage returns
      .replace(/\t/g, '\\t')   // Escape tabs
      .replace(/\x08/g, '\\b') // Escape backspace (use \x08, NOT \b which is word boundary)
      .replace(/\f/g, '\\f')   // Escape form feed
      // Remove any other remaining control characters
      .replace(/[\x00-\x1F\x7F]/g, '');
    
    return `"${escapedContent}"`;
  });

  return cleaned;
}

// Detect and handle different JSON variants - SUPER AGGRESSIVE
export function preprocessJSON(content: string): string {
  let processed = content;
  
  // Remove BOM if present
  if (processed.charCodeAt(0) === 0xfeff) {
    processed = processed.slice(1);
  }
  
  // FIRST: Fix nested JSON strings (most important for your case!)
  processed = fixNestedJsonStrings(processed);
  
  // SECOND: Remove ALL invisible and control characters BRUTALLY
  processed = processed
    // Remove all control characters that are not whitespace
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    // Remove zero-width characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Remove other problematic Unicode characters
    .replace(/[\u2028\u2029]/g, '');

  // THIRD: Handle JSON5 style comments
  processed = processed.replace(/\/\/[^\n]*$/gm, '');
  processed = processed.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // FOURTH: Handle trailing commas
  processed = processed.replace(/,(\s*[}\]])/g, '$1');
  
  // FIFTH: Clean control characters with the aggressive function
  processed = cleanControlCharacters(processed);
  
  // SIXTH: Fix common JSON issues
  // Fix unescaped control characters in strings more aggressively
  processed = processed.replace(/(")((?:[^"\\]|\\.)*)(")/g, (_match, quote1, content, quote2) => {
    // Ultra-aggressive string cleaning
    const ultraClean = content
      .replace(/[\x00-\x1F\x7F]/g, (char: string) => {
        switch (char.charCodeAt(0)) {
          case 9: return '\\t';   // tab
          case 10: return '\\n';  // newline
          case 13: return '\\r';  // carriage return
          case 8: return '\\b';   // backspace
          case 12: return '\\f';  // form feed
          default: return '';     // remove everything else
        }
      });
    return quote1 + ultraClean + quote2;
  });
  
  // Trim whitespace
  processed = processed.trim();
  
  return processed;
}

// Validate JSON structure for security
export function validateJSONStructure(data: unknown, maxDepth = 100): { valid: boolean; error?: string } {
  const seen = new WeakSet();
  
  function checkDepth(obj: unknown, depth: number): boolean {
    if (depth > maxDepth) {
      throw new Error(`JSON exceeds maximum depth of ${maxDepth}`);
    }
    
    if (obj === null || obj === undefined) {
      return true;
    }
    
    if (typeof obj === 'object') {
      // Check for circular references
      if (seen.has(obj)) {
        throw new Error('Circular reference detected');
      }
      seen.add(obj);
      
      if (Array.isArray(obj)) {
        return obj.every(item => checkDepth(item, depth + 1));
      } else {
        return Object.values(obj).every(value => checkDepth(value, depth + 1));
      }
    }
    
    return true;
  }
  
  try {
    checkDepth(data, 0);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid structure' 
    };
  }
}

// BRUTAL PRE-PARSE SANITIZER
export function brutalSanitize(content: string): string {
  // Step 1: Convert to array of chars and filter
  const chars = content.split('');
  const sanitized = chars.map((char) => {
    const code = char.charCodeAt(0);
    
    // Keep normal printable ASCII and common unicode
    if (code >= 32 && code <= 126) return char; // Normal ASCII
    if (code === 9 || code === 10 || code === 13) return char; // Tab, LF, CR
    if (code >= 128 && code <= 65535) return char; // Extended unicode
    
    // Replace all other control characters with space
    return ' ';
  }).join('');
  
  // Step 2: Fix broken JSON patterns
  return sanitized
    // Fix tabs in strings
    .replace(/"([^"]*)\t([^"]*)"/g, '"$1\\t$2"')
    // Fix newlines in strings
    .replace(/"([^"]*)\n([^"]*)"/g, '"$1\\n$2"')
    .replace(/"([^"]*)\r([^"]*)"/g, '"$1\\r$2"')
    // Remove any remaining control chars
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// Process file with comprehensive error handling
export async function processJSONFile(
  file: File,
  options: FileProcessingOptions = {}
): Promise<FileProcessingResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = performance.now();
  const warnings: string[] = [];
  
  try {
    // Validate file size
    if (file.size > opts.maxSize!) {
      return {
        success: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(opts.maxSize! / 1024 / 1024).toFixed(2)}MB)`,
      };
    }
    
    // Detect encoding
    const encoding = await detectFileEncoding(file);
    if (encoding !== 'utf-8' && encoding !== 'ascii') {
      warnings.push(`File encoding detected as ${encoding}, converting to UTF-8`);
    }
    
    // Read file content
    let content: string;
    try {
      content = await readFileWithEncoding(file, encoding);
    } catch (error) {
      return {
        success: false,
        error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
    
    // BRUTAL SANITIZE FIRST!
    content = brutalSanitize(content);
    warnings.push('Applied brutal sanitization to handle control characters');
    
    // Check for BOM
    const hasBOM = content.charCodeAt(0) === 0xfeff;
    if (hasBOM) {
      warnings.push('File contains BOM (Byte Order Mark), removing it');
    }
    
    // Preprocess content
    const originalContent = content;
    const processedContent = preprocessJSON(content);
    
    if (originalContent !== processedContent) {
      warnings.push('File contained comments or trailing commas that were removed');
    }
    
    // Parse JSON
    const parseResult = parseJSON(processedContent);
    if (!parseResult.isValid) {
      return {
        success: false,
        error: parseResult.error || 'Invalid JSON',
        warnings,
      };
    }
    
    // Validate structure if requested
    if (opts.validateStructure && parseResult.data !== null) {
      const validation = validateJSONStructure(parseResult.data);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          warnings,
        };
      }
    }
    
    // Calculate metadata
    const processingTime = performance.now() - startTime;
    const lineCount = processedContent.split('\n').length;
    
    return {
      success: true,
      data: parseResult.data,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        originalSize: file.size,
        processedSize: processedContent.length,
        processingTime,
        encoding,
        lineCount,
        hasComments: originalContent !== processedContent,
        hasBOM,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      warnings,
    };
  }
}

// Detect file encoding
async function detectFileEncoding(file: File): Promise<string> {
  const slice = file.slice(0, 4);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  // Check for common BOMs
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return 'utf-8';
  }
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return 'utf-16le';
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return 'utf-16be';
  }
  
  // Default to UTF-8
  return 'utf-8';
}

// Read file with specific encoding AND INSTANT SANITIZE
async function readFileWithEncoding(file: File, encoding: string): Promise<string> {
  try {
    // Use modern file.text() API first
    let content = await file.text();
    
    // INSTANT MEGA BRUTAL CLEAN!
    // Replace ALL control chars except tab, newline, carriage return
    content = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
    
    // Fix tabs and newlines INSIDE strings only
    let inString = false;
    let result = '';
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const prevChar = i > 0 ? content[i-1] : '';
      
      if (char === '"' && prevChar !== '\\') {
        inString = !inString;
        result += char;
      } else if (inString) {
        // We're inside a string
        if (char === '\t') result += '\\t';
        else if (char === '\n') result += '\\n';
        else if (char === '\r') result += '\\r';
        else if (char === '\\' && content[i+1] === '"') {
          result += char; // Keep escape sequences
        } else {
          result += char;
        }
      } else {
        // Outside string, keep as is
        result += char;
      }
    }
    
    return result;
  } catch (error) {
    // Fallback to FileReader if file.text() is not available
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          let content = e.target.result as string;
          
          // Apply same cleaning logic
          content = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
          
          let inString = false;
          let result = '';
          
          for (let i = 0; i < content.length; i++) {
            const char = content[i];
            const prevChar = i > 0 ? content[i-1] : '';
            
            if (char === '"' && prevChar !== '\\') {
              inString = !inString;
              result += char;
            } else if (inString) {
              if (char === '\t') result += '\\t';
              else if (char === '\n') result += '\\n';
              else if (char === '\r') result += '\\r';
              else if (char === '\\' && content[i+1] === '"') {
                result += char;
              } else {
                result += char;
              }
            } else {
              result += char;
            }
          }
          
          resolve(result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('FileReader error'));
      };
      
      reader.readAsText(file, encoding);
    });
  }
}

// Sanitize JSON data for security
export function sanitizeJSONData(data: JsonValue): JsonValue {
  if (data === null || typeof data !== 'object') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeJSONData(item));
  }
  
  const sanitized: Record<string, JsonValue> = {};
  for (const [key, value] of Object.entries(data)) {
    // Remove potentially dangerous keys
    if (key.startsWith('__proto__') || key === 'constructor' || key === 'prototype') {
      continue;
    }
    
    // Sanitize nested values
    sanitized[key] = sanitizeJSONData(value);
  }
  
  return sanitized;
}