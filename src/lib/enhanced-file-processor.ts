import { JsonValue } from '../types/json.types';

import { fixNestedJsonStrings, brutalSanitize } from './file-processor';
import { parseJSON } from './json-parser';

export interface EnhancedFileProcessingOptions {
  maxSize?: number;
  chunkSize?: number;
  validateStructure?: boolean;
  sanitizeData?: boolean;
  strictMode?: boolean;
  allowPartialRecovery?: boolean;
  maxObjectKeys?: number;
  maxArrayLength?: number;
  maxStringLength?: number;
}

export interface EnhancedFileProcessingResult {
  success: boolean;
  data?: JsonValue;
  error?: string;
  warnings?: string[];
  recovered?: boolean;
  partialData?: JsonValue;
  metadata?: {
    originalSize: number;
    processedSize: number;
    processingTime: number;
    encoding: string;
    lineCount: number;
    hasComments: boolean;
    hasBOM: boolean;
    truncated?: boolean;
    memoryUsage?: number;
  };
}

const ENHANCED_DEFAULT_OPTIONS: EnhancedFileProcessingOptions = {
  maxSize: 50 * 1024 * 1024, // 50MB
  chunkSize: 1024 * 1024, // 1MB
  validateStructure: true,
  sanitizeData: true,
  strictMode: false,
  allowPartialRecovery: true,
  maxObjectKeys: 10000,
  maxArrayLength: 100000,
  maxStringLength: 1024 * 1024, // 1MB per string
};

// Enhanced JSON preprocessing with better error recovery
export function enhancedPreprocessJSON(content: string, strict = false): {
  processed: string;
  modifications: string[];
} {
  let processed = content;
  const modifications: string[] = [];
  
  // Remove BOM
  if (processed.charCodeAt(0) === 0xfeff) {
    processed = processed.slice(1);
    modifications.push('Removed BOM');
  }
  
  // FIX NESTED JSON STRINGS FIRST (critical for complex files)
  const originalForNestedCheck = processed;
  processed = fixNestedJsonStrings(processed);
  if (processed !== originalForNestedCheck) {
    modifications.push('Fixed nested JSON strings');
  }
  
  // AGGRESSIVE CONTROL CHARACTER REMOVAL
  // Remove ALL problematic control characters first
  const controlCharRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g;
  if (controlCharRegex.test(processed)) {
    processed = processed.replace(controlCharRegex, '');
    modifications.push('Removed control characters');
  }
  
  // Handle various line endings
  processed = processed.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Fix control characters inside JSON strings AGGRESSIVELY
  processed = processed.replace(/(")((?:[^"\\]|\\.)*)(")/g, (_match, quote1, content, quote2) => {
    let hasChanges = false;
    const cleaned = content.replace(/[\x00-\x1F\x7F]/g, (char: string) => {
      hasChanges = true;
      switch (char.charCodeAt(0)) {
        case 9: return '\\t';   // tab
        case 10: return '\\n';  // newline  
        case 13: return '\\r';  // carriage return
        case 8: return '\\b';   // backspace
        case 12: return '\\f';  // form feed
        default: return '';     // remove everything else
      }
    });
    
    if (hasChanges && !modifications.includes('Fixed control characters in strings')) {
      modifications.push('Fixed control characters in strings');
    }
    
    return quote1 + cleaned + quote2;
  });
  
  if (!strict) {
    // Remove comments more robustly
    const singleLineCommentRegex = /\/\/[^\n]*$/gm;
    const multiLineCommentRegex = /\/\*[\s\S]*?\*\//g;
    
    if (singleLineCommentRegex.test(processed)) {
      processed = processed.replace(singleLineCommentRegex, '');
      modifications.push('Removed single-line comments');
    }
    
    if (multiLineCommentRegex.test(processed)) {
      processed = processed.replace(multiLineCommentRegex, '');
      modifications.push('Removed multi-line comments');
    }
    
    // Fix common JSON errors
    // Remove trailing commas
    const trailingCommaRegex = /,(\s*[}\]])/g;
    if (trailingCommaRegex.test(processed)) {
      processed = processed.replace(trailingCommaRegex, '$1');
      modifications.push('Fixed trailing commas');
    }
    
    // Fix single quotes (convert to double quotes)
    const singleQuoteRegex = /'([^'\\]*(\\.[^'\\]*)*)'/g;
    if (singleQuoteRegex.test(processed)) {
      processed = processed.replace(singleQuoteRegex, '"$1"');
      modifications.push('Converted single quotes to double quotes');
    }
    
    // Fix unquoted keys (basic implementation)
    const unquotedKeyRegex = /([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g;
    if (unquotedKeyRegex.test(processed)) {
      processed = processed.replace(unquotedKeyRegex, '$1"$2":');
      modifications.push('Added quotes to unquoted keys');
    }
  }
  
  // Trim whitespace
  processed = processed.trim();
  
  // Ensure it starts with { or [
  if (!processed.startsWith('{') && !processed.startsWith('[')) {
    // Try to find the first { or [
    const firstBrace = processed.indexOf('{');
    const firstBracket = processed.indexOf('[');
    
    if (firstBrace !== -1 || firstBracket !== -1) {
      const start = firstBrace === -1 ? firstBracket : 
                   firstBracket === -1 ? firstBrace : 
                   Math.min(firstBrace, firstBracket);
      processed = processed.substring(start);
      modifications.push('Removed invalid content before JSON start');
    }
  }
  
  return { processed, modifications };
}

// Enhanced structure validation with size limits
export function enhancedValidateJSONStructure(
  data: unknown, 
  options: EnhancedFileProcessingOptions
): { valid: boolean; error?: string; warnings?: string[] } {
  const warnings: string[] = [];
  const seen = new WeakSet();
  let objectCount = 0;
  let arrayCount = 0;
  let stringCount = 0;
  
  function checkValue(obj: unknown, depth: number, path: string): boolean {
    if (depth > 100) {
      throw new Error(`JSON exceeds maximum depth of 100 at path: ${path}`);
    }
    
    if (obj === null || obj === undefined) {
      return true;
    }
    
    if (typeof obj === 'string') {
      stringCount++;
      if (options.maxStringLength && obj.length > options.maxStringLength) {
        warnings.push(`String at ${path} exceeds maximum length (${obj.length} > ${options.maxStringLength})`);
      }
      return true;
    }
    
    if (typeof obj === 'object') {
      // Check for circular references
      if (seen.has(obj)) {
        throw new Error(`Circular reference detected at path: ${path}`);
      }
      seen.add(obj);
      
      if (Array.isArray(obj)) {
        arrayCount++;
        if (options.maxArrayLength && obj.length > options.maxArrayLength) {
          warnings.push(`Array at ${path} exceeds maximum length (${obj.length} > ${options.maxArrayLength})`);
        }
        
        return obj.every((item, index) => 
          checkValue(item, depth + 1, `${path}[${index}]`)
        );
      } else {
        objectCount++;
        const keys = Object.keys(obj);
        
        if (options.maxObjectKeys && keys.length > options.maxObjectKeys) {
          warnings.push(`Object at ${path} exceeds maximum keys (${keys.length} > ${options.maxObjectKeys})`);
        }
        
        return keys.every(key => 
          checkValue((obj as any)[key], depth + 1, `${path}.${key}`)
        );
      }
    }
    
    return true;
  }
  
  try {
    checkValue(data, 0, 'root');
    return { valid: true, warnings: warnings.length > 0 ? warnings : [] };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid structure',
      warnings 
    };
  }
}

// Stream process large files
async function* streamReadFile(file: File, chunkSize: number): AsyncGenerator<string> {
  let offset = 0;
  const decoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: false });
  
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    const buffer = await chunk.arrayBuffer();
    const text = decoder.decode(buffer, { stream: offset + chunkSize < file.size });
    yield text;
    offset += chunkSize;
  }
}

// Enhanced file processing with streaming for large files
export async function enhancedProcessJSONFile(
  file: File,
  options: EnhancedFileProcessingOptions = {}
): Promise<EnhancedFileProcessingResult> {
  const opts = { ...ENHANCED_DEFAULT_OPTIONS, ...options };
  const startTime = performance.now();
  const warnings: string[] = [];
  const initialMemory = (performance as any).memory?.usedJSHeapSize;
  
  try {
    // Validate file size
    if (file.size > opts.maxSize!) {
      return {
        success: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(opts.maxSize! / 1024 / 1024).toFixed(2)}MB)`,
      };
    }
    
    // Check file extension and MIME type
    const extension = file.name.toLowerCase().split('.').pop();
    const validExtensions = ['json', 'geojson', 'txt', 'jsonl', 'ndjson'];
    const validMimeTypes = ['application/json', 'text/plain', 'application/geo+json'];
    
    if (!validExtensions.includes(extension || '') && !validMimeTypes.includes(file.type)) {
      warnings.push(`Unusual file type: ${file.type || 'unknown'}, extension: ${extension}`);
    }
    
    // Read file content
    let content: string;
    
    // Use streaming for large files
    if (file.size > 10 * 1024 * 1024) { // 10MB
      warnings.push('Using streaming mode for large file');
      content = '';
      
      for await (const chunk of streamReadFile(file, opts.chunkSize!)) {
        content += chunk;
        
        // Check memory usage
        if ((performance as any).memory) {
          const currentMemory = (performance as any).memory.usedJSHeapSize;
          if (currentMemory > 500 * 1024 * 1024) { // 500MB threshold
            warnings.push('High memory usage detected during file processing');
          }
        }
      }
    } else {
      // Read entire file for smaller files
      content = await file.text();
    }
    
    // BRUTAL SANITIZE IMMEDIATELY - THIS IS THE KEY!
    content = brutalSanitize(content);
    warnings.push('Applied brutal control character sanitization');
    
    // Detect encoding issues
    if (content.includes('�')) {
      warnings.push('File may have encoding issues (replacement characters detected)');
    }
    
    // Preprocess content
    const { processed: processedContent, modifications } = enhancedPreprocessJSON(content, opts.strictMode);
    if (modifications.length > 0) {
      warnings.push(...modifications);
    }
    
    // Check for JSONL/NDJSON format
    if (extension === 'jsonl' || extension === 'ndjson' || 
        (processedContent.includes('\n{') && !processedContent.includes('[\n'))) {
      warnings.push('File appears to be JSONL/NDJSON format, converting to array');
      const lines = processedContent.split('\n').filter(line => line.trim());
      const jsonArray: JsonValue[] = [];
      
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          jsonArray.push(parsed);
        } catch (e) {
          warnings.push(`Failed to parse JSONL line: ${line.substring(0, 50)}...`);
        }
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize;
      
      return {
        success: true,
        data: jsonArray,
        warnings,
        metadata: {
          originalSize: file.size,
          processedSize: processedContent.length,
          processingTime: performance.now() - startTime,
          encoding: 'utf-8',
          lineCount: lines.length,
          hasComments: modifications.includes('Removed single-line comments') || 
                      modifications.includes('Removed multi-line comments'),
          hasBOM: modifications.includes('Removed BOM'),
          memoryUsage: finalMemory && initialMemory ? finalMemory - initialMemory : 0,
        },
      };
    }
    
    // Parse JSON with error recovery
    let parseResult = parseJSON(processedContent);
    
    // Try recovery if parsing failed and recovery is enabled
    if (!parseResult.isValid && opts.allowPartialRecovery) {
      warnings.push('Attempting error recovery...');
      
      // Try to fix common issues
      let recoveredContent = processedContent;
      
      // Fix incomplete JSON by adding closing brackets/braces
      const openBraces = (recoveredContent.match(/{/g) || []).length;
      const closeBraces = (recoveredContent.match(/}/g) || []).length;
      const openBrackets = (recoveredContent.match(/\[/g) || []).length;
      const closeBrackets = (recoveredContent.match(/]/g) || []).length;
      
      if (openBraces > closeBraces) {
        recoveredContent += '}'.repeat(openBraces - closeBraces);
        warnings.push(`Added ${openBraces - closeBraces} missing closing brace(s)`);
      }
      
      if (openBrackets > closeBrackets) {
        recoveredContent += ']'.repeat(openBrackets - closeBrackets);
        warnings.push(`Added ${openBrackets - closeBrackets} missing closing bracket(s)`);
      }
      
      // Try parsing again
      parseResult = parseJSON(recoveredContent);
      
      if (parseResult.isValid) {
        warnings.push('Successfully recovered JSON data');
      }
    }
    
    if (!parseResult.isValid) {
      return {
        success: false,
        error: parseResult.error || 'Invalid JSON',
        warnings,
      };
    }
    
    // Validate structure
    if (opts.validateStructure && parseResult.data !== null) {
      const validation = enhancedValidateJSONStructure(parseResult.data, opts);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Validation failed',
          warnings: [...warnings, ...(validation.warnings || [])],
        };
      }
      if (validation.warnings) {
        warnings.push(...validation.warnings);
      }
    }
    
    // Calculate final metadata
    const processingTime = performance.now() - startTime;
    const lineCount = processedContent.split('\n').length;
    const finalMemory = (performance as any).memory?.usedJSHeapSize;
    
    return {
      success: true,
      data: parseResult.data,
      warnings: warnings.length > 0 ? warnings : [],
      metadata: {
        originalSize: file.size,
        processedSize: processedContent.length,
        processingTime,
        encoding: 'utf-8',
        lineCount,
        hasComments: modifications.includes('Removed single-line comments') || 
                    modifications.includes('Removed multi-line comments'),
        hasBOM: modifications.includes('Removed BOM'),
        memoryUsage: finalMemory && initialMemory ? finalMemory - initialMemory : 0,
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