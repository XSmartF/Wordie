import React, { useState, useEffect } from "react";
import type {
  PagedResponse,
  FilterRule,
  FilterType,
  FilterOperator,
  SearchRule,
  SortDirection,
} from "./types";
import {
  Panel,
  Input,
  MultiSelect,
  Button,
  Pagination,
  ComboBox,
} from "./components";

interface Column<T> {
  key: keyof T;
  header: string;
  filterable?: boolean;
  filterType?: FilterType;
  // optional list of options for enum / multiselect filters
  options?: { value: string | number; label: string }[];
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
  // Optional per-row buttons: array of functions that receive the row item and return a React node (button/action)
  // If true, table renders a checkbox column to allow selecting rows.
  selectable?: boolean;
  // selection change callback returns the currently selected items from the current page
  onSelectionChange?: (selected: T[]) => void;
  // optional key to identify each row when notifying selection (defaults to 'Id')
  buttons?: Array<{
    key: string;
    label: React.ReactNode;
    onClick?: (selected: T[]) => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    disabled?: (selected: T[]) => boolean;
  }>;
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
  selectable = false,
  onSelectionChange,
  buttons,
}: TableProps<T>) {
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelFilters, setPanelFilters] = useState<FilterRule[]>([]);
  const [sorts, setSorts] = useState<
    { Field: string; Direction: SortDirection }[]
  >([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  const {
    Items: items = [],
    Page: currentPage = 1,
    PageSize: pageSize = 10,
    TotalPages = 0,
    HasNext = false,
    HasPrevious = false,
  } = data || {};

  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(
    new Set()
  );

  const selectedItems = Array.from(selectedIndexes).map((i) => items[i]).filter(Boolean) as T[];

  // debounce for search
  const debounceRef = React.useRef<number | null>(null);
  useEffect(() => {
    if (!columns.some((c) => c.searchable)) return;
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      handleSearchChange(searchKeyword);
    }, 400);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKeyword]);

  const notifySelection = (newSet: Set<number>) => {
    setSelectedIndexes(new Set(newSet));
    if (onSelectionChange) {
      const selected = Array.from(newSet)
        .map((i) => items[i])
        .filter(Boolean) as T[];
      onSelectionChange(selected);
    }
  };

  // Clear selection when the page items change (e.g., after a fetch)
  useEffect(() => {
    notifySelection(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Panel-local change (does not immediately apply to server until user presses Apply)
  const handlePanelFilterChange = (
    field: string,
    value: unknown,
    operator: FilterOperator = "Equal"
  ) => {
    const newFilters = panelFilters.filter((f) => f.Field !== field);

    const isIdField = field.toLowerCase().endsWith("id");
    const isString = typeof value === "string";
    if (isIdField && isString) {
      const guid = (value as string).trim();
      const guidRegex =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!guidRegex.test(guid)) {
        // don't add the filter yet (user is still typing partial id)
        setPanelFilters(newFilters);
        return;
      }
    }

    // Always push an entry when operator or value changes in the panel.
    // This allows users to pick the operator first and then enter a value without the UI reverting.
    newFilters.push({
      Field: field,
      Type: getFilterTypeForField(field),
      Operator: operator,
      Value: value,
    });
    setPanelFilters(newFilters);
  };

  const handleSortChange = (field: string, additive: boolean = false) => {
    const existingSort = sorts.find((s) => s.Field === field);

    // Non-additive behavior (normal click): set this column as the only sort column
    if (!additive) {
      let newSorts: { Field: string; Direction: SortDirection }[];
      if (!existingSort) {
        // not sorted yet -> set Asc
        newSorts = [{ Field: field, Direction: "Asc" }];
      } else if (existingSort.Direction === "Asc") {
        // Asc -> Desc
        newSorts = [{ Field: field, Direction: "Desc" }];
      } else {
        // Desc -> remove sort
        newSorts = [];
      }
      setSorts(newSorts);
      onSortChange(newSorts);
      return;
    }

    // Additive behavior (shift+click): preserve other sorts and toggle this column
    const newSorts = [...sorts];
    const idx = newSorts.findIndex((s) => s.Field === field);
    if (idx === -1) {
      newSorts.push({ Field: field, Direction: "Asc" });
    } else {
      const cur = newSorts[idx];
      if (cur.Direction === "Asc") {
        newSorts[idx] = { ...cur, Direction: "Desc" };
      } else {
        newSorts.splice(idx, 1);
      }
    }

    setSorts(newSorts);
    onSortChange(newSorts);
  };

  const handleSearchChange = (keyword: string) => {
    setSearchKeyword(keyword);
    const searchableColumns = columns
      .filter((col) => col.searchable)
      .map((col) => String(col.key));
    if (keyword.trim()) {
      const searchRule: SearchRule = {
        Columns: searchableColumns,
        Keyword: keyword.trim(),
      };
      onSearchChange(searchRule);
    } else {
      onSearchChange(undefined);
    }
  };

  const getFilterTypeForField = (field: string): FilterType => {
    const column = columns.find((c) => String(c.key) === field);
    return column?.filterType || "Text";
  };

  return (
    <div className="table-container">
      {/* Toolbar row: left actions + right search/filter/search button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          marginBottom: "0.5rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {buttons && buttons.map((b) => (
            <Button
              key={b.key}
              variant={b.variant === 'danger' ? 'secondary' : (b.variant || 'primary')}
              onClick={() => b.onClick && b.onClick(selectedItems)}
              disabled={b.disabled ? b.disabled(selectedItems) : false}
              style={b.variant === 'danger' ? { background: '#dc3545', color: 'white' } : undefined}
            >
              {b.label}
            </Button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {columns.some((col) => col.searchable) && (
            <Input
              placeholder="Search..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { if (debounceRef.current) { window.clearTimeout(debounceRef.current); debounceRef.current = null; } handleSearchChange(searchKeyword); } }}
            />
          )}
          <Button variant="primary" onClick={() => { if (debounceRef.current) { window.clearTimeout(debounceRef.current); debounceRef.current = null; } handleSearchChange(searchKeyword); }}>Search</Button>
          <Button
            onClick={() => {
              const opening = !panelOpen;
              setPanelOpen(opening);
              if (opening) setPanelFilters(filters);
            }}
            variant="secondary"
          >
            Filters
          </Button>
        </div>
      </div>

      {/* Sheet + overlay (renders when panelOpen is true) */}
      <Panel
        open={panelOpen}
        title={<strong>Filters</strong>}
        onClose={() => setPanelOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPanelFilters([])}>
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setFilters(panelFilters);
                onFiltersChange(panelFilters);
                setPanelOpen(false);
              }}
            >
              Apply
            </Button>
          </>
        }
      >
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {columns
            .filter((col) => col.filterable)
            .map((col) => (
              <div
                key={String(col.key)}
                style={{
                  borderBottom: "1px solid #f0f0f0",
                  paddingBottom: "0.5rem",
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "0.25rem",
                  }}
                >
                  {col.header}
                </label>
                {/* use specific components per filter type */}
                {(() => {
                  const field = String(col.key);
                  const filterType = col.filterType || "Text";
                  const currentFilter = panelFilters.find(
                    (f) => f.Field === field
                  );
                  switch (filterType) {
                    case "Text":
                      return (
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "center",
                          }}
                        >
                          <ComboBox
                            options={[
                              { value: "Contains", label: "Contains" },
                              { value: "NotContains", label: "NotContains" },
                              { value: "Equal", label: "Equal" },
                              { value: "NotEqual", label: "NotEqual" },
                            ]}
                            value={
                              (currentFilter?.Operator as string) || "Contains"
                            }
                            onChange={(v) =>
                              handlePanelFilterChange(
                                field,
                                currentFilter?.Value,
                                v as FilterOperator
                              )
                            }
                            onSelect={(opt) =>
                              handlePanelFilterChange(
                                field,
                                currentFilter?.Value,
                                opt.value as FilterOperator
                              )
                            }
                            placeholder="Operator"
                          />
                          <Input
                            value={(currentFilter?.Value as string) || ""}
                            onChange={(e) =>
                              handlePanelFilterChange(
                                field,
                                e.target.value,
                                (currentFilter?.Operator as FilterOperator) ||
                                  "Contains"
                              )
                            }
                            placeholder={`Filter ${col.header}`}
                          />
                        </div>
                      );
                    case "Date":
                      return (
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "center",
                          }}
                        >
                          <ComboBox
                            options={[
                              { value: "Equal", label: "On" },
                              { value: "NotEqual", label: "Not On" },
                              { value: "GreaterThan", label: "After" },
                              { value: "LessThan", label: "Before" },
                              { value: "Between", label: "Between" },
                            ]}
                            value={
                              (currentFilter?.Operator as string) || "Equal"
                            }
                            onChange={(v) =>
                              handlePanelFilterChange(
                                field,
                                currentFilter?.Value,
                                v as FilterOperator
                              )
                            }
                            onSelect={(opt) =>
                              handlePanelFilterChange(
                                field,
                                currentFilter?.Value,
                                opt.value as FilterOperator
                              )
                            }
                            placeholder="Operator"
                          />
                          {(currentFilter?.Operator as FilterOperator) ===
                          "Between" ? (
                            (() => {
                              const rangeVal: { min?: string; max?: string } =
                                (currentFilter?.Value as {
                                  min?: string;
                                  max?: string;
                                }) || {};
                              return (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "0.5rem",
                                    alignItems: "center",
                                  }}
                                >
                                  <Input
                                    type="date"
                                    value={rangeVal.min || ""}
                                    onChange={(e) =>
                                      handlePanelFilterChange(
                                        field,
                                        {
                                          ...rangeVal,
                                          min: e.target.value || undefined,
                                        },
                                        "Between"
                                      )
                                    }
                                  />
                                  <span>to</span>
                                  <Input
                                    type="date"
                                    value={rangeVal.max || ""}
                                    onChange={(e) =>
                                      handlePanelFilterChange(
                                        field,
                                        {
                                          ...rangeVal,
                                          max: e.target.value || undefined,
                                        },
                                        "Between"
                                      )
                                    }
                                  />
                                </div>
                              );
                            })()
                          ) : (
                            <Input
                              type="date"
                              value={(currentFilter?.Value as string) || ""}
                              onChange={(e) =>
                                handlePanelFilterChange(
                                  field,
                                  e.target.value,
                                  (currentFilter?.Operator as FilterOperator) ||
                                    "Equal"
                                )
                              }
                            />
                          )}
                        </div>
                      );
                    case "Enum":
                      return (() => {
                        const opts = col.options || [];
                        return (
                          <ComboBox
                            options={opts.map((o) => ({
                              value: o.value,
                              label: o.label,
                            }))}
                            value={
                              currentFilter?.Value
                                ? String(currentFilter.Value)
                                : ""
                            }
                            onSelect={(opt) => {
                              const parsed =
                                opts.find(
                                  (o) => String(o.value) === String(opt.value)
                                )?.value ?? opt.value;
                              handlePanelFilterChange(
                                field,
                                parsed,
                                (currentFilter?.Operator as FilterOperator) ||
                                  "Equal"
                              );
                            }}
                            onChange={(v) =>
                              handlePanelFilterChange(
                                field,
                                v,
                                (currentFilter?.Operator as FilterOperator) ||
                                  "Equal"
                              )
                            }
                            placeholder={`Filter ${col.header}`}
                          />
                        );
                      })();
                    case "MultiSelect":
                      return (
                        <MultiSelect
                          options={col.options || []}
                          value={
                            Array.isArray(currentFilter?.Value)
                              ? (currentFilter?.Value as (string | number)[])
                              : []
                          }
                          onChange={(v) =>
                            handlePanelFilterChange(
                              field,
                              v,
                              (currentFilter?.Operator as FilterOperator) ||
                                "Include"
                            )
                          }
                          placeholder={`Select ${col.header}`}
                        />
                      );
                    default:
                      return (
                        <Input
                          value={(currentFilter?.Value as string) || ""}
                          onChange={(e) =>
                            handlePanelFilterChange(field, e.target.value)
                          }
                        />
                      );
                  }
                })()}
              </div>
            ))}
        </div>
      </Panel>

      {/* Filters moved to sheet panel */}

      <table className="table">
        <thead>
          <tr>
            {selectable && (
              <th>
                <input
                  type="checkbox"
                  checked={
                    items.length > 0 && selectedIndexes.size === items.length
                  }
                  onChange={(e) => {
                    const opening = e.target.checked;
                    const newSet = new Set<number>();
                    if (opening) items.forEach((_, idx) => newSet.add(idx));
                    notifySelection(newSet);
                  }}
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={String(col.key)}
                onClick={(e) =>
                  handleSortChange(
                    String(col.key),
                    (e as React.MouseEvent).shiftKey
                  )
                }
                className={"sortable"}
              >
                {col.header}
                {sorts.find((s) => s.Field === String(col.key)) && (
                  <span className="sort-indicator">
                    {sorts.find((s) => s.Field === String(col.key))
                      ?.Direction === "Asc"
                      ? "↑"
                      : "↓"}
                  </span>
                )}
              </th>
            ))}
            {/* actions moved to top-level; no action column here */}
          </tr>
        </thead>
        <tbody>
          {loading || !data ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="loading"
              >
                Loading...
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="no-data"
              >
                No data available
              </td>
            </tr>
          ) : (
            items.map((item, index) => (
              <tr
                key={index}
                onClick={() => onRowClick?.(item)}
                style={onRowClick ? { cursor: "pointer" } : {}}
              >
                {selectable && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIndexes.has(index)}
                      onChange={(e) => {
                        const newSet = new Set(selectedIndexes);
                        if (e.target.checked) newSet.add(index);
                        else newSet.delete(index);
                        notifySelection(newSet);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={String(col.key)}>
                    {col.render
                      ? col.render(item[col.key], item)
                      : String(item[col.key] || "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Pagination
        Page={currentPage}
        PageSize={pageSize}
        TotalPages={TotalPages}
        HasNext={HasNext}
        HasPrevious={HasPrevious}
        onPageChange={(p) => onPageChange(p)}
        onPageSizeChange={(s) => onPageSizeChange(s)}
      />
    </div>
  );
}

export default Table;
