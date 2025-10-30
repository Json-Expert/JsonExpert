import { Filter, Plus, X } from 'lucide-react';

import { useSearchFilters } from '../../hooks/useSearchFilters';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

import { SearchFilterRow } from './SearchFilterRow';

interface AdvancedSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ isOpen, onClose }) => {
  const {
    filters,
    addFilter,
    removeFilter,
    updateFilter,
    applyFilters,
    clearFilters,
  } = useSearchFilters(onClose);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClose();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Close dialog"
      />
      
      <Card className="relative w-full max-w-2xl max-h-[80vh] overflow-auto ">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Search & Filter
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {filters.map((filter, index) => (
              <SearchFilterRow
                key={index}
                filter={filter}
                index={index}
                onUpdate={updateFilter}
                onRemove={removeFilter}
                canRemove={filters.length > 1}
              />
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={addFilter}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Filter
            </Button>
          </div>

          <div className="border-t pt-4">
            <div className="text-sm text-muted-foreground mb-3">
              <strong>Search Tips:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Simple:</strong> Use &quot;Contains&quot; for partial text matches</li>
                <li><strong>Regex:</strong> Use regular expressions (e.g., <code className="text-xs bg-muted px-1 rounded">^\d{3}-\d{4}$</code> for phone numbers)</li>
                <li><strong>Fuzzy:</strong> Find approximate matches (typo-tolerant)</li>
                <li><strong>JSONPath Examples:</strong></li>
                <li className="ml-4"><code className="text-xs bg-muted px-1 rounded">$.store.book[*].author</code> - All book authors</li>
                <li className="ml-4"><code className="text-xs bg-muted px-1 rounded">$..price</code> - All prices at any depth</li>
                <li className="ml-4"><code className="text-xs bg-muted px-1 rounded">$.items[0:5]</code> - First 5 items</li>
                <li className="ml-4"><code className="text-xs bg-muted px-1 rounded">$.users[?(@.age &gt; 21)]</code> - Filter by condition</li>
                <li><strong>Type Filter:</strong> Search by data type (string, number, boolean, object, array, null)</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={applyFilters} className="flex-1">
              Apply Filters
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear All
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};