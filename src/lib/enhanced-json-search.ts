import { JsonValue } from '../types/json.types';

export interface EnhancedSearchOptions {
  query: string;
  mode: 'simple' | 'regex' | 'jsonpath' | 'fuzzy';
  caseSensitive?: boolean;
  searchInKeys?: boolean;
  searchInValues?: boolean;
  searchInPaths?: boolean;
  useRegex?: boolean;
  searchByType?: string | string[];
  maxDepth?: number;
  fuzzyThreshold?: number;
  highlightMatches?: boolean;
  includeAncestors?: boolean;
  limit?: number;
}

export interface EnhancedSearchResult {
  path: string;
  jsonPath: string;
  key: string;
  value: JsonValue;
  parentPath: string;
  depth: number;
  type: string;
  score: number;
  matches: {
    inKey: boolean;
    inValue: boolean;
    inPath: boolean;
    matchedText?: string;
    matchPositions?: Array<{ start: number; end: number }>;
  };
  context?: {
    parent?: JsonValue;
    siblings?: Record<string, JsonValue>;
    ancestors?: string[];
  };
}

export interface EnhancedSearchStats {
  totalMatches: number;
  matchesByType: Record<string, number>;
  matchesByDepth: Record<number, number>;
  maxDepth: number;
  searchTime: number;
  mode: string;
  truncated: boolean;
}

// JSONPath tokenizer
interface JsonPathToken {
  type: 'root' | 'property' | 'index' | 'wildcard' | 'recursive' | 'filter' | 'slice';
  value: string;
}

function tokenizeJsonPath(path: string): JsonPathToken[] {
  const tokens: JsonPathToken[] = [];
  let i = 0;
  
  // Must start with $
  if (path[0] !== '$') {
    throw new Error('JSONPath must start with $');
  }
  
  tokens.push({ type: 'root', value: '$' });
  i = 1;
  
  while (i < path.length) {
    if (path[i] === '.') {
      i++;
      if (path[i] === '.') {
        // Recursive descent
        tokens.push({ type: 'recursive', value: '..' });
        i++;
      } else if (path[i] === '*') {
        // Wildcard
        tokens.push({ type: 'wildcard', value: '*' });
        i++;
      } else {
        // Property
        let prop = '';
        while (i < path.length && path[i] !== '.' && path[i] !== '[') {
          prop += path[i];
          i++;
        }
        if (prop) {
          tokens.push({ type: 'property', value: prop });
        }
      }
    } else if (path[i] === '[') {
      i++;
      let content = '';
      let brackets = 1;
      
      while (i < path.length && brackets > 0) {
        if (path[i] === '[') brackets++;
        else if (path[i] === ']') brackets--;
        
        if (brackets > 0) {
          content += path[i];
        }
        i++;
      }
      
      // Determine bracket content type
      if (content === '*') {
        tokens.push({ type: 'wildcard', value: '*' });
      } else if (content.includes('?')) {
        tokens.push({ type: 'filter', value: content });
      } else if (content.includes(':')) {
        tokens.push({ type: 'slice', value: content });
      } else if (/^\d+$/.test(content)) {
        tokens.push({ type: 'index', value: content });
      } else if (content.startsWith("'") || content.startsWith('"')) {
        // Property with quotes
        const prop = content.slice(1, -1);
        tokens.push({ type: 'property', value: prop });
      }
    } else {
      i++;
    }
  }
  
  return tokens;
}

// Evaluate JSONPath expression
function evaluateJsonPath(data: JsonValue, tokens: JsonPathToken[]): Array<{ value: JsonValue; path: string[] }> {
  const results: Array<{ value: JsonValue; path: string[] }> = [];
  
  function traverse(
    value: JsonValue,
    remainingTokens: JsonPathToken[],
    currentPath: string[]
  ): void {
    if (remainingTokens.length === 0) {
      results.push({ value, path: currentPath });
      return;
    }
    
    const [token, ...rest] = remainingTokens;
    
    if (!token) return;
    
    switch (token.type) {
      case 'root':
        traverse(value, rest, []);
        break;
        
      case 'property':
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const obj = value as Record<string, JsonValue>;
          if (token.value && token.value in obj) {
            const val = obj[token.value];
            if (val !== undefined) {
              traverse(val, rest, [...currentPath, token.value]);
            }
          }
        }
        break;
        
      case 'index':
        if (Array.isArray(value)) {
          const index = parseInt(token.value || '0', 10);
          if (index >= 0 && index < value.length) {
            const val = value[index];
            if (val !== undefined) {
              traverse(val, rest, [...currentPath, `[${index}]`]);
            }
          }
        }
        break;
        
      case 'wildcard':
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            traverse(item, rest, [...currentPath, `[${index}]`]);
          });
        } else if (value && typeof value === 'object') {
          const obj = value as Record<string, JsonValue>;
          Object.entries(obj).forEach(([key, val]) => {
            traverse(val, rest, [...currentPath, key]);
          });
        }
        break;
        
      case 'recursive':
        // Current level
        traverse(value, rest, currentPath);
        
        // Recursive descent
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            traverse(item, remainingTokens, [...currentPath, `[${index}]`]);
          });
        } else if (value && typeof value === 'object') {
          const obj = value as Record<string, JsonValue>;
          Object.entries(obj).forEach(([key, val]) => {
            traverse(val, remainingTokens, [...currentPath, key]);
          });
        }
        break;
        
      case 'filter':
        // Simple filter implementation (can be expanded)
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            // Basic @.property comparison
            const filterMatch = token.value?.match(/@\.(\w+)\s*([=<>!]+)\s*(.+)/);
            if (filterMatch) {
              const [, prop, op, expected] = filterMatch;
              if (item && typeof item === 'object' && prop && prop in item) {
                const actual = (item as any)[prop];
                let match = false;
                
                switch (op) {
                  case '==':
                  case '=':
                    match = String(actual) === expected?.replace(/['"]/g, '');
                    break;
                  case '!=':
                    match = String(actual) !== expected?.replace(/['"]/g, '');
                    break;
                  case '>':
                    match = Number(actual) > Number(expected);
                    break;
                  case '<':
                    match = Number(actual) < Number(expected);
                    break;
                  case '>=':
                    match = Number(actual) >= Number(expected);
                    break;
                  case '<=':
                    match = Number(actual) <= Number(expected);
                    break;
                }
                
                if (match) {
                  traverse(item, rest, [...currentPath, `[${index}]`]);
                }
              }
            }
          });
        }
        break;
        
      case 'slice':
        if (Array.isArray(value)) {
          const parts = (token.value || '').split(':').map(p => p.trim());
          const start = parts[0] ? parseInt(parts[0], 10) : 0;
          const end = parts[1] ? parseInt(parts[1], 10) : value.length;
          const step = parts[2] ? parseInt(parts[2], 10) : 1;
          
          for (let i = start; i < end && i < value.length; i += step) {
            const val = value[i];
            if (val !== undefined) {
              traverse(val, rest, [...currentPath, `[${i}]`]);
            }
          }
        }
        break;
    }
  }
  
  traverse(data, tokens, []);
  return results;
}

// Fuzzy string matching
function fuzzyMatch(str: string, query: string, threshold: number = 0.6): boolean {
  str = str.toLowerCase();
  query = query.toLowerCase();
  
  // Simple fuzzy match: check if all query characters appear in order
  let queryIndex = 0;
  let matches = 0;
  
  for (let i = 0; i < str.length && queryIndex < query.length; i++) {
    if (str[i] === query[queryIndex]) {
      matches++;
      queryIndex++;
    }
  }
  
  const score = matches / query.length;
  return score >= threshold;
}

// Enhanced search implementation
export function enhancedSearchJson(
  data: JsonValue,
  options: EnhancedSearchOptions
): { results: EnhancedSearchResult[]; stats: EnhancedSearchStats } {
  const startTime = performance.now();
  const results: EnhancedSearchResult[] = [];
  const stats: EnhancedSearchStats = {
    totalMatches: 0,
    matchesByType: {},
    matchesByDepth: {},
    maxDepth: 0,
    searchTime: 0,
    mode: options.mode,
    truncated: false,
  };
  
  const {
    query,
    mode = 'simple',
    caseSensitive = false,
    searchInKeys = true,
    searchInValues = true,
    searchInPaths = false,
    searchByType,
    maxDepth = Infinity,
    fuzzyThreshold = 0.6,
    includeAncestors = false,
    limit = 1000,
  } = options;
  
  // JSONPath mode
  if (mode === 'jsonpath') {
    try {
      const tokens = tokenizeJsonPath(query);
      const pathResults = evaluateJsonPath(data, tokens);
      
      pathResults.forEach(({ value, path }) => {
        const result: EnhancedSearchResult = {
          path: path.join('.'),
          jsonPath: '$.' + path.join('.'),
          key: path[path.length - 1] || 'root',
          value,
          parentPath: path.slice(0, -1).join('.'),
          depth: path.length,
          type: value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value,
          score: 1,
          matches: {
            inKey: false,
            inValue: false,
            inPath: true,
          },
        };
        
        results.push(result);
        stats.totalMatches++;
        stats.matchesByType[result.type] = (stats.matchesByType[result.type] || 0) + 1;
        stats.matchesByDepth[result.depth] = (stats.matchesByDepth[result.depth] || 0) + 1;
        
        if (results.length >= limit) {
          stats.truncated = true;
          return;
        }
      });
    } catch (error) {
      // Invalid JSONPath, return empty results
      console.error('Invalid JSONPath:', error);
    }
  } else {
    // Regular search modes
    function matchValue(text: string): { match: boolean; score: number } {
      if (!caseSensitive) {
        text = text.toLowerCase();
      }
      
      const searchQuery = caseSensitive ? query : query.toLowerCase();
      
      switch (mode) {
        case 'regex':
          try {
            const regex = new RegExp(query, caseSensitive ? 'g' : 'gi');
            return { match: regex.test(text), score: 1 };
          } catch {
            return { match: false, score: 0 };
          }
          
        case 'fuzzy':
          const fuzzyResult = fuzzyMatch(text, searchQuery, fuzzyThreshold);
          return { match: fuzzyResult, score: fuzzyResult ? 0.8 : 0 };
          
        default: // simple
          const match = text.includes(searchQuery);
          return { match, score: match ? 1 : 0 };
      }
    }
    
    function traverse(
      value: JsonValue,
      path: string[] = [],
      depth: number = 0,
      ancestors: string[] = []
    ): void {
      if (depth > maxDepth || results.length >= limit) return;
      
      stats.maxDepth = Math.max(stats.maxDepth, depth);
      
      const currentKey = path[path.length - 1] || 'root';
      const jsonPath = '$.' + path.join('.');
      const parentPath = path.slice(0, -1).join('.');
      const valueType = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
      
      // Type filter
      if (searchByType) {
        const types = Array.isArray(searchByType) ? searchByType : [searchByType];
        if (!types.includes(valueType)) {
          // Still traverse children
          if (valueType === 'object' && value !== null) {
            const obj = value as Record<string, JsonValue>;
            Object.entries(obj).forEach(([key, val]) => {
              traverse(val, [...path, key], depth + 1, [...ancestors, jsonPath]);
            });
          } else if (valueType === 'array') {
            const arr = value as JsonValue[];
            arr.forEach((item, index) => {
              traverse(item, [...path, `[${index}]`], depth + 1, [...ancestors, jsonPath]);
            });
          }
          return;
        }
      }
      
      // Search in current item
      const matches = {
        inKey: false,
        inValue: false,
        inPath: false,
        matchedText: '' as string,
        matchPositions: [] as Array<{ start: number; end: number }>,
      };
      
      let totalScore = 0;
      
      // Search in keys
      if (searchInKeys && currentKey) {
        const { match, score } = matchValue(currentKey);
        if (match) {
          matches.inKey = true;
          totalScore += score;
          matches.matchedText = currentKey;
        }
      }
      
      // Search in values
      if (searchInValues && valueType === 'string') {
        const { match, score } = matchValue(String(value));
        if (match) {
          matches.inValue = true;
          totalScore += score;
          matches.matchedText = String(value);
        }
      }
      
      // Search in paths
      if (searchInPaths) {
        const { match, score } = matchValue(jsonPath);
        if (match) {
          matches.inPath = true;
          totalScore += score;
        }
      }
      
      // Add to results if any match
      if (matches.inKey || matches.inValue || matches.inPath) {
        const result: EnhancedSearchResult = {
          path: path.join('.'),
          jsonPath,
          key: currentKey,
          value,
          parentPath,
          depth,
          type: valueType,
          score: totalScore,
          matches,
        };
        
        if (includeAncestors) {
          result.context = {
            ancestors,
          };
        }
        
        results.push(result);
        stats.totalMatches++;
        stats.matchesByType[valueType] = (stats.matchesByType[valueType] || 0) + 1;
        stats.matchesByDepth[depth] = (stats.matchesByDepth[depth] || 0) + 1;
      }
      
      // Traverse nested structures
      if (valueType === 'object' && value !== null) {
        const obj = value as Record<string, JsonValue>;
        Object.entries(obj).forEach(([key, val]) => {
          traverse(val, [...path, key], depth + 1, [...ancestors, jsonPath]);
        });
      } else if (valueType === 'array') {
        const arr = value as JsonValue[];
        arr.forEach((item, index) => {
          traverse(item, [...path, `[${index}]`], depth + 1, [...ancestors, jsonPath]);
        });
      }
    }
    
    traverse(data);
  }
  
  // Sort results by score
  results.sort((a, b) => b.score - a.score);
  
  stats.searchTime = performance.now() - startTime;
  
  return { results, stats };
}

// Enhanced highlighting with proper escaping
export function enhancedHighlightMatches(
  text: string,
  query: string,
  options: {
    caseSensitive?: boolean;
    mode?: 'simple' | 'regex' | 'fuzzy';
    className?: string;
  } = {}
): string {
  const { caseSensitive = false, mode = 'simple', className = 'highlight' } = options;
  
  if (!query || !text) return text;
  
  // Escape HTML
  const escapeHtml = (str: string) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };
  
  const escapedText = escapeHtml(text);
  
  switch (mode) {
    case 'regex':
      try {
        const regex = new RegExp(`(${query})`, caseSensitive ? 'g' : 'gi');
        return escapedText.replace(regex, `<mark class="${className}">$1</mark>`);
      } catch {
        return escapedText;
      }
      
    case 'fuzzy':
      // Highlight matching characters in order
      let result = '';
      let queryIndex = 0;
      const lowerText = caseSensitive ? escapedText : escapedText.toLowerCase();
      const lowerQuery = caseSensitive ? query : query.toLowerCase();
      
      for (let i = 0; i < escapedText.length; i++) {
        if (queryIndex < lowerQuery.length && lowerText[i] === lowerQuery[queryIndex]) {
          result += `<mark class="${className}">${escapedText[i]}</mark>`;
          queryIndex++;
        } else {
          result += escapedText[i];
        }
      }
      
      return result;
      
    default: // simple
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, caseSensitive ? 'g' : 'gi');
      return escapedText.replace(regex, `<mark class="${className}">$1</mark>`);
  }
}

// Export search results as structured data
export function exportSearchResults(
  results: EnhancedSearchResult[],
  format: 'json' | 'csv' | 'paths'
): string {
  switch (format) {
    case 'csv':
      const headers = ['Path', 'Key', 'Type', 'Value', 'Score'];
      const rows = results.map(r => [
        r.jsonPath,
        r.key,
        r.type,
        JSON.stringify(r.value),
        r.score.toString(),
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
      
    case 'paths':
      return results.map(r => r.jsonPath).join('\n');
      
    default: // json
      return JSON.stringify(results, null, 2);
  }
}