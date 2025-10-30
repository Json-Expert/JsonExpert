import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import { jsonToTableRows } from '../../../lib/data-transformers';
import { cn } from '../../../lib/utils';
import { useUIStore } from '../../../stores/ui-store';
import { JsonValue } from '../../../types/json.types';

interface TableViewProps {
  data: JsonValue;
}

type SortDirection = 'asc' | 'desc' | null;
type SortColumn = 'path' | 'key' | 'value' | 'type';

export const TableView: React.FC<TableViewProps> = ({ data }) => {
  const { searchQuery } = useUIStore();
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const rows = useMemo(() => {
    return jsonToTableRows(data);
  }, [data]);

  const filteredAndSortedRows = useMemo(() => {
    let filtered = rows;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = rows.filter(
        (row) =>
          row.path.toLowerCase().includes(query) ||
          row.key.toLowerCase().includes(query) ||
          String(row.value).toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];

        if (sortColumn === 'value') {
          aVal = String(aVal);
          bVal = String(bVal);
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [rows, searchQuery, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string':
        return 'text-green-600 dark:text-green-400';
      case 'number':
        return 'text-blue-600 dark:text-blue-400';
      case 'boolean':
        return 'text-purple-600 dark:text-purple-400';
      case 'null':
        return 'text-gray-500 dark:text-gray-400';
      default:
        return '';
    }
  };

  return (
    <div className="h-full overflow-x-auto overflow-y-auto">
      <table className="w-full border-collapse min-w-max">
        <thead className="sticky top-0 z-10 bg-background">
          <tr className="border-b">
            <th className="text-left p-2">
              <button
                onClick={() => handleSort('path')}
                className="flex items-center gap-1 font-medium hover:text-primary"
              >
                Path
                {getSortIcon('path')}
              </button>
            </th>
            <th className="text-left p-2">
              <button
                onClick={() => handleSort('key')}
                className="flex items-center gap-1 font-medium hover:text-primary"
              >
                Key
                {getSortIcon('key')}
              </button>
            </th>
            <th className="text-left p-2">
              <button
                onClick={() => handleSort('value')}
                className="flex items-center gap-1 font-medium hover:text-primary"
              >
                Value
                {getSortIcon('value')}
              </button>
            </th>
            <th className="text-left p-2">
              <button
                onClick={() => handleSort('type')}
                className="flex items-center gap-1 font-medium hover:text-primary"
              >
                Type
                {getSortIcon('type')}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedRows.map((row) => (
            <tr
              key={row.id}
              className="border-b hover:bg-accent/50 transition-colors"
            >
              <td className="p-2 font-mono text-sm text-muted-foreground">
                {row.path}
              </td>
              <td className="p-2 font-mono text-sm">{row.key}</td>
              <td className="p-2 text-sm">
                <span className={cn(getTypeColor(row.type))}>
                  {row.type === 'string' ? `"${row.value}"` : String(row.value)}
                </span>
              </td>
              <td className="p-2">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  )}
                >
                  {row.type}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredAndSortedRows.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No data to display
        </div>
      )}
    </div>
  );
};