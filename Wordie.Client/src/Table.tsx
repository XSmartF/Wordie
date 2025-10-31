import React, { useState } from 'react';
import type { PagedResponse, FilterRule, FilterType, FilterOperator, SearchRule, SortDirection } from './types';

interface Column<T> {
  key: keyof T;
  header: string;
  filterable?: boolean;
  filterType?: FilterType;
  searchable?: boolean;
  render?: (value: unknown, item: T) => React.ReactNode;
}

interface TableProps<T> {
  data: PagedResponse<T>;
  columns: Column<T>[];
  loading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onFiltersChange: (filters: FilterRule[]) => void;
  onSortChange: (sorts: { Field: string; Direction: SortDirection }[]) => void;
  onSearchChange: (search: SearchRule | undefined) => void;
  onRowClick?: (item: T) => void;
}

function Table<T extends object>({
  data,
  columns,
  loading = false,
  onPageChange,
  onPageSizeChange,
  onFiltersChange,
  onSortChange,
  onSearchChange,
  onRowClick,
}: TableProps<T>) {
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [sorts, setSorts] = useState<{ Field: string; Direction: SortDirection }[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  const { Items: items = [], Page: currentPage = 1, PageSize: pageSize = 10, TotalPages = 0, HasNext = false, HasPrevious = false } = data || {};

  const handleFilterChange = (field: string, value: unknown, operator: FilterOperator = 'Equal') => {
    const newFilters = filters.filter(f => f.Field !== field);
    if (value !== undefined && value !== null && value !== '') {
      newFilters.push({
        Field: field,
        Type: getFilterTypeForField(field),
        Operator: operator,
        Value: value
      });
    }
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSortChange = (field: string) => {
    const existingSort = sorts.find(s => s.field === field);
    let newSorts: { Field: string; Direction: SortDirection }[];

    if (existingSort) {
      if (existingSort.Direction === 'Asc') {
        newSorts = sorts.map(s => s.Field === field ? { ...s, Direction: 'Desc' } : s);
      } else {
        newSorts = sorts.filter(s => s.Field !== field);
      }
    } else {
      newSorts = [...sorts, { Field: field, Direction: 'Asc' }];
    }

    setSorts(newSorts);
    onSortChange(newSorts);
  };

  const handleSearchChange = (keyword: string) => {
    setSearchKeyword(keyword);
    const searchableColumns = columns.filter(col => col.searchable).map(col => String(col.key));
    if (keyword.trim()) {
      const searchRule: SearchRule = {
        Columns: searchableColumns,
        Keyword: keyword.trim()
      };
      onSearchChange(searchRule);
    } else {
      onSearchChange(undefined);
    }
  };

  const getFilterTypeForField = (field: string): FilterType => {
    const column = columns.find(c => String(c.key) === field);
    return column?.filterType || 'Text';
  };

  const renderFilterInput = (column: Column<T>) => {
    if (!column.filterable) return null;

    const field = String(column.key);
    const filterType = column.filterType || 'Text';
    const currentFilter = filters.find(f => f.Field === field);

    switch (filterType) {
      case 'Text':
        return (
          <input
            type="text"
            placeholder={`Filter ${column.header}`}
            value={currentFilter?.Value as string || ''}
            onChange={(e) => handleFilterChange(field, e.target.value, 'Contains')}
            className="filter-input"
          />
        );

      case 'Number':
        return (
          <div className="filter-number">
            <select
              value={currentFilter?.Operator || 'Equal'}
              onChange={(e) => handleFilterChange(field, currentFilter?.Value, e.target.value as FilterOperator)}
            >
              <option value="Equal">=</option>
              <option value="NotEqual">≠</option>
              <option value="GreaterThan">&gt;</option>
              <option value="GreaterThanOrEqual">≥</option>
              <option value="LessThan">&lt;</option>
              <option value="LessThanOrEqual">≤</option>
            </select>
            <input
              type="number"
              placeholder="Value"
              value={currentFilter?.Value as number || ''}
              onChange={(e) => handleFilterChange(field, e.target.value ? Number(e.target.value) : undefined, currentFilter?.Operator || 'Equal')}
              className="filter-input"
            />
          </div>
        );

      case 'Date':
        return (
          <input
            type="date"
            value={currentFilter?.Value as string || ''}
            onChange={(e) => handleFilterChange(field, e.target.value, 'Equal')}
            className="filter-input"
          />
        );

      case 'Range': {
        const rangeValue = currentFilter?.Value as { min?: number; max?: number } || {};
        return (
          <div className="filter-range">
            <input
              type="number"
              placeholder="Min"
              value={rangeValue.min || ''}
              onChange={(e) => {
                const newValue = { ...rangeValue, min: e.target.value ? Number(e.target.value) : undefined };
                handleFilterChange(field, newValue, 'Between');
              }}
              className="filter-input"
            />
            <span>to</span>
            <input
              type="number"
              placeholder="Max"
              value={rangeValue.max || ''}
              onChange={(e) => {
                const newValue = { ...rangeValue, max: e.target.value ? Number(e.target.value) : undefined };
                handleFilterChange(field, newValue, 'Between');
              }}
              className="filter-input"
            />
          </div>
        );
      }

      default:
        return (
          <input
            type="text"
            placeholder={`Filter ${column.header}`}
            value={currentFilter?.Value as string || ''}
            onChange={(e) => handleFilterChange(field, e.target.value)}
            className="filter-input"
          />
        );
    }
  };

  return (
    <div className="table-container">
      {/* Search */}
      {columns.some(col => col.searchable) && (
        <div className="search-container">
          <input
            type="text"
            placeholder="Search..."
            value={searchKeyword}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="search-input"
          />
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        {columns.filter(col => col.filterable).map((column) => (
          <div key={String(column.key)} className="filter-group">
            <label>{column.header}:</label>
            {renderFilterInput(column)}
          </div>
        ))}
      </div>

      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                onClick={() => col.filterable && handleSortChange(String(col.key))}
                className={col.filterable ? 'sortable' : ''}
              >
                {col.header}
                {sorts.find(s => s.Field === String(col.key)) && (
                  <span className="sort-indicator">
                    {sorts.find(s => s.Field === String(col.key))?.Direction === 'Asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading || !data ? (
            <tr>
              <td colSpan={columns.length} className="loading">
                Loading...
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="no-data">
                No data available
              </td>
            </tr>
          ) : (
            items.map((item, index) => (
              <tr key={index} onClick={() => onRowClick?.(item)} style={onRowClick ? { cursor: 'pointer' } : {}}>
                {columns.map((col) => (
                  <td key={String(col.key)}>
                    {col.render ? col.render(item[col.key], item) : String(item[col.key] || '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="pagination">
        <div className="page-size-selector">
          <label>
            Page size:
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>

        <div className="page-controls">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!HasPrevious}
          >
            Previous
          </button>

          <span>
            Page {currentPage} of {TotalPages}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!HasNext}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default Table;