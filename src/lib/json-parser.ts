import { JsonValue } from '../types/json.types';

import { fixNestedJsonStrings, emergencyJsonRecovery } from './file-processor';

/**
 * Result of JSON parsing operation
 */
export interface ParseResult {
  /** Parsed JSON data, null if parsing failed */
  data: JsonValue | null;
  /** Error message if parsing failed, null if successful */
  error: string | null;
  /** Whether the JSON was valid and parsed successfully */
  isValid: boolean;
}

/**
 * Parse a JSON string with automatic error recovery
 *
 * This function attempts to parse JSON with multiple fallback strategies:
 * 1. Standard JSON.parse
 * 2. Fix nested JSON strings
 * 3. Emergency recovery for malformed JSON
 *
 * Provides helpful error messages for common JSON syntax issues.
 *
 * @param input - JSON string to parse
 * @returns Parse result with data, error message, and validity flag
 *
 * @example
 * ```ts
 * const result = parseJSON('{"name": "John", "age": 30}');
 * if (result.isValid) {
 *   console.log(result.data); // { name: "John", age: 30 }
 * } else {
 *   console.error(result.error);
 * }
 * ```
 *
 * @example
 * ```ts
 * // Handles recovery for common issues
 * const result = parseJSON('{"name": "John\nDoe"}'); // Control character
 * // Attempts automatic recovery
 * ```
 */
export function parseJSON(input: string): ParseResult {
  try {
    const trimmed = input.trim();
    if (!trimmed) {
      return {
        data: null,
        error: 'Empty input',
        isValid: false,
      };
    }
    
    const data = JSON.parse(trimmed);
    return {
      data,
      error: null,
      isValid: true,
    };
  } catch (error) {
    let errorMessage = 'Invalid JSON';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Try recovery methods for common issues
      if (errorMessage.includes('bad control character') || 
          errorMessage.includes('Unexpected token') ||
          errorMessage.includes('Unterminated string')) {
        
        try {
          // Try method 1: Fix nested JSON strings
          const fixed1 = fixNestedJsonStrings(input);
          const data1 = JSON.parse(fixed1);
          return {
            data: data1,
            error: null,
            isValid: true,
          };
        } catch (e1) {
          try {
            // Try method 2: Emergency recovery
            const fixed2 = emergencyJsonRecovery(input);
            const data2 = JSON.parse(fixed2);
            return {
              data: data2,
              error: null,
              isValid: true,
            };
          } catch (e2) {
            // Both recovery methods failed
            errorMessage += '. Auto-recovery failed. Try using the enhanced JSON processor.';
          }
        }
      }
      
      // Provide more helpful error messages for common issues
      if (errorMessage.includes('bad control character')) {
        errorMessage += '. Try using the enhanced JSON processor or clean the file of special characters.';
      } else if (errorMessage.includes('Unexpected token')) {
        errorMessage += '. Check for missing quotes, commas, or brackets.';
      } else if (errorMessage.includes('Unexpected end of JSON input')) {
        errorMessage += '. The JSON appears to be incomplete.';
      }
    }
    
    return {
      data: null,
      error: errorMessage,
      isValid: false,
    };
  }
}

/**
 * Convert a JavaScript value to a formatted JSON string
 *
 * @param data - JavaScript value to stringify
 * @param space - Number of spaces for indentation (default: 2)
 * @returns Formatted JSON string
 *
 * @example
 * ```ts
 * const obj = { name: "John", age: 30 };
 * const json = stringifyJSON(obj);
 * // Returns: "{\n  \"name\": \"John\",\n  \"age\": 30\n}"
 * ```
 */
export function stringifyJSON(
  data: JsonValue,
  space: number = 2
): string {
  return JSON.stringify(data, null, space);
}

/**
 * Validate a JSON string without parsing it
 *
 * Provides validation result with error details including position information
 * for syntax errors. Useful for real-time validation in editors.
 *
 * @param input - JSON string to validate
 * @returns Validation result with error details if invalid
 * @returns isValid - Whether the JSON is syntactically valid
 * @returns error - Error message if invalid
 * @returns position - Line and column of the error (if detectable)
 *
 * @example
 * ```ts
 * const result = validateJSON('{"name": "John"}');
 * console.log(result); // { isValid: true }
 * ```
 *
 * @example
 * ```ts
 * const result = validateJSON('{"name": }');
 * console.log(result);
 * // { isValid: false, error: "Unexpected token...", position: { line: 1, column: 10 } }
 * ```
 */
export function validateJSON(input: string): {
  isValid: boolean;
  error?: string;
  position?: { line: number; column: number };
} {
  try {
    JSON.parse(input);
    return { isValid: true };
  } catch (error) {
    if (error instanceof SyntaxError) {
      const match = error.message.match(/position (\d+)/);
      if (match) {
        const position = parseInt(match[1] || '0');
        const lines = input.substring(0, position).split('\n');
        const line = lines.length;
        const lastLine = lines[lines.length - 1];
        const column = (lastLine?.length || 0) + 1;
        
        return {
          isValid: false,
          error: error.message,
          position: { line, column },
        };
      }
    }
    
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
}

export function detectJSONType(value: JsonValue): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

export function getJSONStats(data: JsonValue): {
  totalKeys: number;
  totalValues: number;
  maxDepth: number;
  types: Record<string, number>;
} {
  const stats = {
    totalKeys: 0,
    totalValues: 0,
    maxDepth: 0,
    types: {
      string: 0,
      number: 0,
      boolean: 0,
      null: 0,
      array: 0,
      object: 0,
    },
  };
  
  function traverse(value: JsonValue, depth: number = 0): void {
    stats.maxDepth = Math.max(stats.maxDepth, depth);
    const type = detectJSONType(value);
    if (type in stats.types) {
      (stats.types as any)[type]++;
    }
    
    if (type === 'object' && value !== null) {
      const obj = value as Record<string, JsonValue>;
      Object.keys(obj).forEach((key) => {
        stats.totalKeys++;
        const value = obj[key];
        if (value !== undefined) {
          traverse(value, depth + 1);
        }
      });
    } else if (type === 'array') {
      const arr = value as JsonValue[];
      arr.forEach((item) => traverse(item, depth + 1));
    } else {
      stats.totalValues++;
    }
  }
  
  traverse(data);
  return stats;
}