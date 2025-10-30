import { useState, useCallback } from 'react';

import type { SearchFilter } from '../components/controls/SearchFilterRow';
import { enhancedSearchJson, EnhancedSearchOptions } from '../lib/enhanced-json-search';
import { useJsonStore } from '../stores/json-store';
import { useUIStore } from '../stores/ui-store';

import { useToast } from './useToast';


export const useSearchFilters = (onClose?: () => void) => {
  const { setSearchQuery, setSearchOptions } = useUIStore();
  const { parsedData } = useJsonStore();
  const { showToast } = useToast();
  const [filters, setFilters] = useState<SearchFilter[]>([
    { type: 'any', operator: 'contains', value: '', caseSensitive: false }
  ]);

  const addFilter = (): void => {
    setFilters([...filters, { type: 'value', operator: 'contains', value: '', caseSensitive: false }]);
  };

  const removeFilter = (index: number): void => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, updates: Partial<SearchFilter>): void => {
    const newFilters = [...filters];
    const existingFilter = newFilters[index]; // eslint-disable-line security/detect-object-injection
    if (existingFilter) {
      newFilters[index] = {  // eslint-disable-line security/detect-object-injection
        type: updates.type ?? existingFilter.type,
        operator: updates.operator ?? existingFilter.operator,
        value: updates.value ?? existingFilter.value,
        caseSensitive: updates.caseSensitive ?? existingFilter.caseSensitive
      };
      setFilters(newFilters);
    }
  };

  const buildSearchQuery = (filterList: SearchFilter[]): string => {
    const searchParts = filterList
      .filter(f => f.value)
      .map(f => {
        const query = f.value;
        if (f.operator === 'regex') {
          return `/${query}/`;
        }
        if (f.operator === 'startsWith') {
          return `^${query}`;
        }
        if (f.operator === 'endsWith') {
          return `${query}$`;
        }
        return query;
      });

    return searchParts.join(' ');
  };

  const applyFilters = useCallback(() => {
    const primaryFilter = filters.find(f => f.value);
    
    if (!primaryFilter) {
      setSearchQuery('');
      setSearchOptions({});
      onClose?.();
      return;
    }
    
    // Handle JSONPath mode
    if (primaryFilter.type === 'jsonpath' || primaryFilter.operator === 'jsonpath') {
      const searchOptions: Partial<EnhancedSearchOptions> = {
        query: primaryFilter.value,
        mode: 'jsonpath',
      };
      
      setSearchQuery(primaryFilter.value);
      setSearchOptions(searchOptions as any);
      
      // Test the JSONPath
      if (parsedData) {
        try {
          const { results, stats } = enhancedSearchJson(parsedData.data, searchOptions as EnhancedSearchOptions);
          showToast({
            title: 'JSONPath Search',
            description: `Found ${results.length} matches in ${stats.searchTime.toFixed(1)}ms`,
            variant: results.length > 0 ? 'success' : 'info',
          });
        } catch (error) {
          showToast({
            title: 'Invalid JSONPath',
            description: error instanceof Error ? error.message : 'Invalid JSONPath expression',
            variant: 'error',
          });
        }
      }
    } else {
      // Regular search mode
      const searchOptions: Partial<EnhancedSearchOptions> = {
        query: primaryFilter.value,
        mode: primaryFilter.operator === 'regex' ? 'regex' : 
              primaryFilter.operator === 'fuzzy' ? 'fuzzy' : 'simple',
        caseSensitive: primaryFilter.caseSensitive,
        searchInKeys: primaryFilter.type === 'key' || primaryFilter.type === 'any',
        searchInValues: primaryFilter.type === 'value' || primaryFilter.type === 'any',
        searchInPaths: primaryFilter.type === 'path',
      };
      
      // Handle type filters
      const typeFilters = filters.filter(f => f.type === 'type' && f.value);
      if (typeFilters.length > 0) {
        searchOptions.searchByType = typeFilters.map(f => f.value);
      }
      
      // Build search query for display
      const combinedQuery = buildSearchQuery(filters);
      setSearchQuery(combinedQuery);
      setSearchOptions(searchOptions as any);
      
      // Perform search and show stats
      if (parsedData) {
        const { results, stats } = enhancedSearchJson(parsedData.data, searchOptions as EnhancedSearchOptions);
        showToast({
          title: 'Search Results',
          description: `Found ${results.length} matches in ${stats.searchTime.toFixed(1)}ms`,
          variant: results.length > 0 ? 'success' : 'info',
        });
      }
    }
    
    onClose?.();
  }, [filters, setSearchQuery, setSearchOptions, parsedData, showToast, onClose]);

  const clearFilters = useCallback(() => {
    setFilters([{ type: 'any', operator: 'contains', value: '', caseSensitive: false }]);
    setSearchQuery('');
    setSearchOptions({});
  }, [setSearchQuery, setSearchOptions]);

  return {
    filters,
    addFilter,
    removeFilter,
    updateFilter,
    applyFilters,
    clearFilters,
  };
};