import { Search, X, Filter, Info } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { TIMING } from '../../lib/app-constants';
import { debounce } from '../../lib/utils';
import { useUIStore } from '../../stores/ui-store';
import { Button } from '../ui/Button';

import { AdvancedSearch } from './AdvancedSearch';

export const SearchFilter: React.FC = () => {
  const { searchQuery, setSearchQuery, searchStats } = useUIStore();
  const [localValue, setLocalValue] = React.useState(searchQuery);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => {
      setSearchQuery(value);
    }, TIMING.SEARCH_DEBOUNCE_DELAY),
    [setSearchQuery]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalValue(value);
    debouncedSetSearch(value);
  };

  const handleClear = () => {
    setLocalValue('');
    setSearchQuery('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '/' && e.ctrlKey) {
      e.preventDefault();
      setShowAdvanced(true);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={localValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Search JSON... (Ctrl+/ for advanced)"
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Search in keys, values, or use JSONPath (e.g., $.user.name)"
          />
          {localValue && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowAdvanced(true)}
          title="Advanced search"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>
      
      {searchStats && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <Info className="h-3 w-3" />
          <span>
            {searchStats.count} {searchStats.count === 1 ? 'match' : 'matches'} in {searchStats.time.toFixed(1)}ms
          </span>
        </div>
      )}
      
      <AdvancedSearch isOpen={showAdvanced} onClose={() => setShowAdvanced(false)} />
    </>
  );
};