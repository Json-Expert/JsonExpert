import { X } from 'lucide-react';

import { Button } from '../ui/Button';

interface SearchFilter {
  type: 'key' | 'value' | 'path' | 'type' | 'any' | 'jsonpath';
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'fuzzy' | 'jsonpath';
  value: string;
  caseSensitive: boolean;
}

interface SearchFilterRowProps {
  filter: SearchFilter;
  index: number;
  onUpdate: (index: number, updates: Partial<SearchFilter>) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export const SearchFilterRow: React.FC<SearchFilterRowProps> = ({
  filter,
  index,
  onUpdate,
  onRemove,
  canRemove,
}) => {
  return (
    <div className="flex items-center gap-2 p-3 border rounded-lg">
      <select
        value={filter.type}
        onChange={(e) => {
          const newType = e.target.value as SearchFilter['type'];
          onUpdate(index, { 
            type: newType,
            operator: newType === 'jsonpath' ? 'jsonpath' : filter.operator 
          });
        }}
        className="rounded border border-input px-2 py-1 text-sm"
      >
        <option value="any">Any</option>
        <option value="key">Key</option>
        <option value="value">Value</option>
        <option value="path">Path</option>
        <option value="type">Type</option>
        <option value="jsonpath">JSONPath</option>
      </select>
      
      {filter.type !== 'jsonpath' && (
        <select
          value={filter.operator}
          onChange={(e) => onUpdate(index, { operator: e.target.value as SearchFilter['operator'] })}
          className="rounded border border-input px-2 py-1 text-sm"
        >
          <option value="contains">Contains</option>
          <option value="equals">Equals</option>
          <option value="startsWith">Starts with</option>
          <option value="endsWith">Ends with</option>
          <option value="regex">Regex</option>
          <option value="fuzzy">Fuzzy</option>
        </select>
      )}
      
      <input
        type="text"
        value={filter.value}
        onChange={(e) => onUpdate(index, { value: e.target.value })}
        placeholder={filter.type === 'jsonpath' ? '$.path.to.value' : 
                    filter.type === 'type' ? 'string, number, object...' :
                    filter.operator === 'regex' ? '/pattern/flags' :
                    'Search value...'}
        className="flex-1 rounded border border-input px-3 py-1 text-sm font-mono"
      />
      
      {filter.type !== 'jsonpath' && filter.type !== 'type' && (
        <label className="flex items-center gap-1 text-sm whitespace-nowrap">
          <input
            type="checkbox"
            checked={filter.caseSensitive}
            onChange={(e) => onUpdate(index, { caseSensitive: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
          Case
        </label>
      )}
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(index)}
        className="h-8 w-8"
        disabled={!canRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export type { SearchFilter };