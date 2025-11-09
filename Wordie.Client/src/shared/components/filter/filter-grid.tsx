import * as React from "react";
import {
  IconCheck,
  IconFilter,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { SplitButton } from "@/shared/components/ui/split-button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/components/ui/empty";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { FilterRule, SearchRule } from "@/shared/types/pagination";
import type { FilterFieldConfig, FilterFieldOption, TableButton } from "@/shared/components/data-table";
import { cn } from "@/shared/lib/utils";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { FilterPanel } from "./filter-panel";

export type FilterIdentifier = string | number;

export interface FilterItemBase {
  id: FilterIdentifier;
}

export interface FilterGridPagination {
  pageIndex: number;
  pageSize: number;
  totalPages?: number;
  totalCount?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export interface FilterGridProps<T extends FilterItemBase> {
  data: T[];
  renderItem: (item: T, context: { selected: boolean }) => React.ReactNode;
  loading?: boolean;
  selectable?: boolean;
  buttons?: TableButton<T>[];
  groupToolbarButtons?: boolean;
  searchPlaceholder?: string;
  searchableColumns?: string[];
  filters?: FilterRule[];
  filterFields?: FilterFieldConfig[];
  onFiltersChange?: (filters: FilterRule[]) => void;
  onSearchChange?: (search: SearchRule | undefined) => void;
  pagination?: FilterGridPagination;
  columns?: number;
  minCardWidth?: number;
  className?: string;
  emptyPlaceholder?: React.ReactNode;
  onSelectionChange?: (selected: T[]) => void;
  primaryAction?: {
    label: React.ReactNode;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  toolbarEndContent?: React.ReactNode;
  toolbarStartContent?: React.ReactNode;
}

const DEFAULT_EMPTY = (
  <Empty className="border border-dashed">
    <EmptyHeader>
      <EmptyTitle>Không có dữ liệu</EmptyTitle>
      <EmptyDescription>Hãy điều chỉnh bộ lọc hoặc tạo mục mới.</EmptyDescription>
    </EmptyHeader>
  </Empty>
);

const DEFAULT_PAGE_SIZES = [6, 12, 18, 24, 30];

export function FilterGrid<T extends FilterItemBase>({
  data,
  renderItem,
  loading = false,
  selectable = false,
  buttons = [],
  groupToolbarButtons = true,
  searchPlaceholder = "Search...",
  searchableColumns = [],
  filters,
  filterFields = [],
  onFiltersChange,
  onSearchChange,
  pagination,
  columns,
  minCardWidth = 260,
  className,
  emptyPlaceholder = DEFAULT_EMPTY,
  onSelectionChange,
  primaryAction,
  toolbarEndContent,
  toolbarStartContent,
}: FilterGridProps<T>) {
  const [selectedIds, setSelectedIds] = React.useState<Set<FilterIdentifier>>(new Set());
  const [searchKeyword, setSearchKeyword] = React.useState("");
  const [filterPanelOpen, setFilterPanelOpen] = React.useState(false);
  const [internalFilters, setInternalFilters] = React.useState<FilterRule[]>(() => filters ?? []);

  const isMobile = useIsMobile();

  React.useEffect(() => {
    if (filters !== undefined) {
      setInternalFilters(filters);
    }
  }, [filters]);

  React.useEffect(() => {
    setSelectedIds((previous) => {
      const next = new Set<FilterIdentifier>();
      data.forEach((item) => {
        if (previous.has(item.id)) {
          next.add(item.id);
        }
      });
      return next;
    });
  }, [data]);

  const selectedItems = React.useMemo(() => data.filter((item) => selectedIds.has(item.id)), [data, selectedIds]);

  React.useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedItems);
    }
  }, [onSelectionChange, selectedItems]);

  const toggleSelection = React.useCallback((identifier: FilterIdentifier) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(identifier)) {
        next.delete(identifier);
      } else {
        next.add(identifier);
      }
      return next;
    });
  }, []);

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleFiltersApply = React.useCallback((nextFilters: FilterRule[]) => {
    setFilterPanelOpen(false);
    if (filters === undefined) {
      setInternalFilters(nextFilters);
    }
    onFiltersChange?.(nextFilters);
  }, [filters, onFiltersChange]);

  const currentFilters = filters ?? internalFilters;
  const activeFilterCount = currentFilters.length;
  const hasFilterControls = filterFields.length > 0;
  const hasActiveFilters = activeFilterCount > 0;

  const debounceRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (searchableColumns.length === 0 || !onSearchChange) return;

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      if (searchKeyword.trim()) {
        const rule: SearchRule = {
          Columns: searchableColumns,
          Keyword: searchKeyword.trim(),
        };
        onSearchChange(rule);
      } else {
        onSearchChange(undefined);
      }
    }, 400);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [searchKeyword, searchableColumns, onSearchChange]);

  const mapVariant = React.useCallback((variant?: TableButton<T>["variant"]) => {
    if (variant === "danger") return "destructive" as const;
    if (variant === "primary") return "default" as const;
    if (variant === "secondary") return "secondary" as const;
    if (variant === "ghost") return "ghost" as const;
    return "outline" as const;
  }, []);

  const renderedButtons = React.useMemo(() => {
    if (!buttons.length) return null;

    if (!groupToolbarButtons || buttons.length === 1) {
      return buttons.map((button) => (
        <Button
          key={button.key}
          variant={mapVariant(button.variant)}
          size="sm"
          disabled={button.disabled?.(selectedItems)}
          onClick={() => button.onClick?.(selectedItems)}
        >
          {button.label}
        </Button>
      ));
    }

    const nonDanger = buttons.filter((button) => button.variant !== "danger");
    const danger = buttons.filter((button) => button.variant === "danger");
    const primary = nonDanger[0];
    const secondary = nonDanger.slice(1);

    return (
      <>
        {primary ? (
          secondary.length > 0 ? (
            <SplitButton
              key={`split-${primary.key}`}
              primaryAction={{
                label: primary.label,
                onClick: () => primary.onClick?.(selectedItems),
                disabled: primary.disabled?.(selectedItems),
              }}
              options={secondary.map((button) => ({
                key: button.key,
                label: button.label,
                onSelect: () => button.onClick?.(selectedItems),
                disabled: button.disabled?.(selectedItems),
                tone: button.variant === "danger" ? "destructive" : "default",
              }))}
              variant={mapVariant(primary.variant)}
              size="sm"
              className="shadow-none"
            />
          ) : (
            <Button
              key={primary.key}
              variant={mapVariant(primary.variant)}
              size="sm"
              disabled={primary.disabled?.(selectedItems)}
              onClick={() => primary.onClick?.(selectedItems)}
            >
              {primary.label}
            </Button>
          )
        ) : null}
        {danger.map((button) => (
          <Button
            key={button.key}
            variant={mapVariant(button.variant)}
            size="sm"
            disabled={button.disabled?.(selectedItems)}
            onClick={() => button.onClick?.(selectedItems)}
          >
            {button.label}
          </Button>
        ))}
      </>
    );
  }, [buttons, groupToolbarButtons, mapVariant, selectedItems]);

  const pageIndex = pagination?.pageIndex ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const totalCount = pagination?.totalCount ?? data.length;
  const pageSize = pagination?.pageSize ?? data.length;

  const displayedPages = React.useMemo<(number | "ellipsis")[]>(() => {
    if (totalPages <= 0) return [];
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index);
    }

    const pages: (number | "ellipsis")[] = [0];
    const start = Math.max(1, pageIndex - 1);
    const end = Math.min(totalPages - 2, pageIndex + 1);

    if (start > 1) {
      pages.push("ellipsis");
    }

    for (let index = start; index <= end; index += 1) {
      pages.push(index);
    }

    if (end < totalPages - 2) {
      pages.push("ellipsis");
    }

    pages.push(totalPages - 1);
    return pages;
  }, [pageIndex, totalPages]);

  const handleGoToPage = React.useCallback((target: number) => {
    if (!pagination) return;
    if (target === pageIndex) return;
    pagination.onPageChange(target);
  }, [pageIndex, pagination]);

  const handlePreviousPage = React.useCallback(() => {
    if (!pagination) return;
    if (pageIndex <= 0) return;
    pagination.onPageChange(pageIndex - 1);
  }, [pageIndex, pagination]);

  const handleNextPage = React.useCallback(() => {
    if (!pagination) return;
    if (pageIndex >= totalPages - 1) return;
    pagination.onPageChange(pageIndex + 1);
  }, [pageIndex, pagination, totalPages]);

  const noResults = !loading && data.length === 0;

  const gridStyle: React.CSSProperties = React.useMemo(() => {
    if (columns && columns > 0) {
      return { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };
    }
    return { gridTemplateColumns: `repeat(auto-fit, minmax(${minCardWidth}px, 1fr))` };
  }, [columns, minCardWidth]);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {toolbarStartContent}
          {renderedButtons}
          {selectable && selectedItems.length > 0 ? (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={clearSelection}>
              <IconX className="size-3" /> Bỏ chọn ({selectedItems.length})
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {searchableColumns.length > 0 && (
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder={searchPlaceholder}
                className="pl-8 w-48"
                aria-label="Tìm kiếm"
              />
              {searchKeyword ? (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/70"
                  onClick={() => setSearchKeyword("")}
                  aria-label="Xóa tìm kiếm"
                >
                  <IconX className="size-3.5" />
                </button>
              ) : null}
            </div>
          )}

          {hasFilterControls ? (
            <Button
              variant={hasActiveFilters ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setFilterPanelOpen(true)}
            >
              <IconFilter className="size-4" />
              <span>Bộ lọc</span>
              {hasActiveFilters ? (
                <Badge variant="secondary" className="px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              ) : null}
            </Button>
          ) : null}

          {primaryAction ? (
            <Button variant="outline" size="sm" className="gap-2" onClick={primaryAction.onClick}>
              {primaryAction.icon ?? <IconCheck className="size-4" />}
              {primaryAction.label}
            </Button>
          ) : null}

          {toolbarEndContent}
        </div>
      </div>

      <div
        className={cn(
          "grid gap-4",
          isMobile ? "grid-cols-1" : undefined,
        )}
        style={gridStyle}
      >
        {loading
          ? Array.from({ length: Math.max(6, Math.min(9, pageSize)) }).map((_, index) => (
              <div key={`skeleton-${index}`} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))
          : noResults
            ? emptyPlaceholder
            : data.map((item) => {
                const selected = selectedIds.has(item.id);
                return (
                  <div key={item.id} className={cn("relative h-full", selectable ? "group" : undefined)}>
                    {selectable ? (
                      <div className="pointer-events-auto absolute right-3 top-3 z-10 rounded-full bg-background/90 p-1 shadow-sm">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => toggleSelection(item.id)}
                          onClick={(event) => event.stopPropagation()}
                          className="size-4"
                          aria-label="Chọn thẻ"
                        />
                      </div>
                    ) : null}
                    <div className="h-full">
                      {renderItem(item, { selected })}
                    </div>
                  </div>
                );
              })}
      </div>

      {pagination ? (
        <div className="flex flex-col gap-3 border-t border-border/70 bg-background/95 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-muted-foreground md:text-sm">
            {selectedItems.length} được chọn / {totalCount.toLocaleString()} mục
          </div>
          <div className="flex w-full flex-col items-center gap-3 md:w-auto md:flex-row md:gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="grid-page-size" className="text-xs font-medium md:text-sm">
                Số thẻ mỗi trang
              </Label>
              <Select
                value={`${pageSize}`}
                onValueChange={(value) => pagination.onPageSizeChange(Number(value))}
              >
                <SelectTrigger id="grid-page-size" size="sm" className="w-[92px]">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {(DEFAULT_PAGE_SIZES.includes(pageSize) ? DEFAULT_PAGE_SIZES : [pageSize, ...DEFAULT_PAGE_SIZES]).map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs font-medium text-muted-foreground md:text-sm">
              Trang {pageIndex + 1} / {Math.max(totalPages, 1)}
            </div>
            <Pagination className="w-full justify-center md:w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    className="px-2"
                    onClick={(event) => {
                      event.preventDefault();
                      handlePreviousPage();
                    }}
                  />
                </PaginationItem>
                {displayedPages.map((item, index) => {
                  if (item === "ellipsis") {
                    return (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  const isActive = item === pageIndex;
                  return (
                    <PaginationItem key={item}>
                      <PaginationLink
                        href="#"
                        isActive={isActive}
                        onClick={(event) => {
                          event.preventDefault();
                          handleGoToPage(item);
                        }}
                      >
                        {item + 1}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    className="px-2"
                    onClick={(event) => {
                      event.preventDefault();
                      handleNextPage();
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      ) : null}

      {hasFilterControls ? (
        <FilterPanel
          open={filterPanelOpen}
          onClose={() => setFilterPanelOpen(false)}
          onApply={handleFiltersApply}
          fields={filterFields}
          appliedFilters={currentFilters}
        />
      ) : null}
    </div>
  );
}

export type FilterField = FilterFieldConfig;
export type FilterButton<T extends FilterItemBase> = TableButton<T>;
export type FilterOption = FilterFieldOption;
