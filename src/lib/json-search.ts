import { JsonValue } from '../types/json.types';

export interface SearchOptions {
  query: string;
  caseSensitive?: boolean;
  searchInKeys?: boolean;
  searchInValues?: boolean;
  searchInPaths?: boolean;
  useRegex?: boolean;
  searchByType?: string;
  maxDepth?: number;
}

export interface SearchResult {
  path: string;
  key: string;
  value: JsonValue;
  parentPath: string;
  depth: number;
  type: string;
  matches: {
    inKey: boolean;
    inValue: boolean;
    inPath: boolean;
  };
}

export interface SearchStats {
  totalMatches: number;
  matchesByType: Record<string, number>;
  maxDepth: number;
  searchTime: number;
}

// Convert array path to JSONPath notation
export function arrayPathToJsonPath(path: string[]): string {
  return path.reduce((acc, part, index) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return acc + part;
    }
    return index === 0 ? part : `${acc}.${part}`;
  }, '$');
}

// Parse JSONPath expression
export function parseJsonPath(jsonPath: string): string[] {
  if (!jsonPath.startsWith('$')) {
    jsonPath = '$.' + jsonPath;
  }
  
  const parts: string[] = [];
  let current = '';
  let inBracket = false;
  
  for (let i = 1; i < jsonPath.length; i++) {
    const char = jsonPath[i];
    
    if (char === '[') {
      if (current) {
        parts.push(current);
        current = '';
      }
      inBracket = true;
      current = '[';
    } else if (char === ']') {
      current += ']';
      parts.push(current);
      current = '';
      inBracket = false;
    } else if (char === '.' && !inBracket) {
      if (current) {
        parts.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  
  if (current) {
    parts.push(current);
  }
  
  return parts;
}

// Check if a value matches the search query
function matchesQuery(
  value: string,
  query: string,
  caseSensitive: boolean,
  useRegex: boolean
): boolean {
  if (!caseSensitive) {
    value = value.toLowerCase();
    query = query.toLowerCase();
  }
  
  if (useRegex) {
    try {
      const regex = new RegExp(query, caseSensitive ? 'g' : 'gi');
      return regex.test(value);
    } catch {
      // Invalid regex, fall back to contains
      return value.includes(query);
    }
  }
  
  return value.includes(query);
}

// Deep search through JSON structure
export function searchJson(
  data: JsonValue,
  options: SearchOptions
): { results: SearchResult[]; stats: SearchStats } {
  const startTime = performance.now();
  const results: SearchResult[] = [];
  const stats: SearchStats = {
    totalMatches: 0,
    matchesByType: {},
    maxDepth: 0,
    searchTime: 0,
  };
  
  const {
    query,
    caseSensitive = false,
    searchInKeys = true,
    searchInValues = true,
    searchInPaths = false,
    useRegex = false,
    searchByType,
    maxDepth = Infinity,
  } = options;
  
  function traverse(
    value: JsonValue,
    path: string[] = [],
    depth: number = 0
  ): void {
    if (depth > maxDepth) return;
    
    stats.maxDepth = Math.max(stats.maxDepth, depth);
    
    const currentKey = path[path.length - 1] || 'root';
    const jsonPath = arrayPathToJsonPath(path);
    const parentPath = path.slice(0, -1).join('.');
    const valueType = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
    
    // Type filter
    if (searchByType && valueType !== searchByType) {
      return;
    }
    
    // Search in current item
    const matches = {
      inKey: false,
      inValue: false,
      inPath: false,
    };
    
    // Search in keys
    if (searchInKeys && currentKey) {
      matches.inKey = matchesQuery(currentKey, query, caseSensitive, useRegex);
    }
    
    // Search in values
    if (searchInValues && valueType === 'string') {
      matches.inValue = matchesQuery(String(value), query, caseSensitive, useRegex);
    }
    
    // Search in paths
    if (searchInPaths) {
      matches.inPath = matchesQuery(jsonPath, query, caseSensitive, useRegex);
    }
    
    // Add to results if any match
    if (matches.inKey || matches.inValue || matches.inPath) {
      results.push({
        path: jsonPath,
        key: currentKey,
        value,
        parentPath,
        depth,
        type: valueType,
        matches,
      });
      
      stats.totalMatches++;
      stats.matchesByType[valueType] = (stats.matchesByType[valueType] || 0) + 1;
    }
    
    // Traverse nested structures
    if (valueType === 'object' && value !== null) {
      const obj = value as Record<string, JsonValue>;
      for (const [key, val] of Object.entries(obj)) {
        traverse(val, [...path, key], depth + 1);
      }
    } else if (valueType === 'array') {
      const arr = value as JsonValue[];
      arr.forEach((item, index) => {
        traverse(item, [...path, `[${index}]`], depth + 1);
      });
    }
  }
  
  traverse(data);
  
  stats.searchTime = performance.now() - startTime;
  
  return { results, stats };
}

// Get value at JSONPath
export function getValueAtPath(data: JsonValue, jsonPath: string): JsonValue | undefined {
  const parts = parseJsonPath(jsonPath);
  let current: any = data;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    
    if (part.startsWith('[') && part.endsWith(']')) {
      // Array index
      const index = parseInt(part.slice(1, -1), 10);
      if (Array.isArray(current) && index >= 0 && index < current.length) {
        current = current[index];
      } else {
        return undefined;
      }
    } else {
      // Object key
      if (typeof current === 'object' && current !== null && part in current) {
        current = (current as any)[part];
      } else {
        return undefined;
      }
    }
  }
  
  return current;
}

// Highlight search matches in text
export function highlightMatches(
  text: string,
  query: string,
  caseSensitive: boolean = false
): string {
  if (!query) return text;
  
  const flags = caseSensitive ? 'g' : 'gi';
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, flags);
  
  return text.replace(regex, '<mark>$1</mark>');
}

// Filter JSON data based on search results
export function filterJsonBySearch(
  data: JsonValue,
  searchResults: SearchResult[]
): JsonValue {
  if (searchResults.length === 0) return data;
  
  // Create a set of paths to include
  const includePaths = new Set<string>();
  searchResults.forEach(result => {
    // Include the result path and all parent paths
    const parts = parseJsonPath(result.path);
    for (let i = 0; i <= parts.length; i++) {
      const parentPath = arrayPathToJsonPath(parts.slice(0, i));
      includePaths.add(parentPath);
    }
  });
  
  // Rebuild filtered data structure
  function filterTraverse(value: JsonValue, currentPath: string[]): JsonValue | undefined {
    const path = arrayPathToJsonPath(currentPath);
    
    if (!includePaths.has(path)) {
      return undefined;
    }
    
    if (value === null || typeof value !== 'object') {
      return value;
    }
    
    if (Array.isArray(value)) {
      const filtered: JsonValue[] = [];
      value.forEach((item, index) => {
        const childPath = [...currentPath, `[${index}]`];
        const filteredItem = filterTraverse(item, childPath);
        if (filteredItem !== undefined) {
          filtered.push(filteredItem);
        }
      });
      return filtered.length > 0 ? filtered : undefined;
    }
    
    const filtered: Record<string, JsonValue> = {};
    let hasValues = false;
    
    for (const [key, val] of Object.entries(value)) {
      const childPath = [...currentPath, key];
      const filteredValue = filterTraverse(val, childPath);
      if (filteredValue !== undefined) {
        filtered[key] = filteredValue;
        hasValues = true;
      }
    }
    
    return hasValues ? filtered : undefined;
  }
  
  return filterTraverse(data, []) ?? {};
}