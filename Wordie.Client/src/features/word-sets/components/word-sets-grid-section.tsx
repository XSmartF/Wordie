import { useEffect, useMemo, useState } from "react";
import {
  IconArrowRight,
  IconColumns3,
  IconEdit,
  IconPlayerPlay,
  IconPlus,
  IconSortDescending,
  IconStar,
  IconStarFilled,
  IconTrash,
} from "@tabler/icons-react";

import type { WordSetDto } from "@/features/word-sets/types";
import { WordSetCard } from "@/features/word-sets/components/word-set-card";
import { FilterGrid, type FilterGridPagination } from "@/shared/components/filter";
import type { FilterFieldConfig, TableButton } from "@/shared/components/data-table";
import { Button } from "@/shared/components/ui/button";
import { Typography } from "@/shared/components/typography";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import type { FilterRule, SearchRule, SortRule } from "@/shared/types/pagination";

const SORT_OPTIONS = [
  { label: "Mới nhất", value: "CreatedAt|Desc" },
  { label: "Cũ nhất", value: "CreatedAt|Asc" },
  { label: "Tên A-Z", value: "Title|Asc" },
  { label: "Tên Z-A", value: "Title|Desc" },
] as const;

const COLUMN_OPTIONS = [2, 3, 4] as const;

interface WordSetsGridSectionProps {
  items: WordSetDto[];
  loading: boolean;
  totalCount: number;
  filters: FilterRule[];
  filterFields: FilterFieldConfig[];
  searchableColumns: string[];
  onFiltersChange: (filters: FilterRule[]) => void;
  onSearchChange: (search: SearchRule | undefined) => void;
  onSortChange: (sorts: SortRule[]) => void;
  pagination: FilterGridPagination;
  onCreate: () => void;
  onToggleFavorite: (wordSet: WordSetDto, override?: boolean) => void | Promise<void>;
  onStudy: (wordSet: WordSetDto) => void;
  onEdit: (wordSet: WordSetDto) => void;
  onDelete: (wordSet: WordSetDto) => void;
  onViewDetails: (wordSet: WordSetDto) => void;
}

type WordSetCardItem = WordSetDto & { id: string };

export function WordSetsGridSection({
  items,
  loading,
  totalCount,
  filters,
  filterFields,
  searchableColumns,
  onFiltersChange,
  onSearchChange,
  onSortChange,
  pagination,
  onCreate,
  onToggleFavorite,
  onStudy,
  onEdit,
  onDelete,
  onViewDetails,
}: WordSetsGridSectionProps) {
  const [selectedSortOption, setSelectedSortOption] = useState<string>(
    () => SORT_OPTIONS[0]?.value ?? ""
  );
  const [gridColumns, setGridColumns] = useState<number>(3);

  useEffect(() => {
    if (!selectedSortOption) {
      onSortChange([]);
      return;
    }

    const [field, direction] = selectedSortOption.split("|") as [string, SortRule["Direction"]];
    onSortChange([{ Field: field, Direction: direction }]);
  }, [selectedSortOption, onSortChange]);

  const gridItems = useMemo<WordSetCardItem[]>(
    () => items.map((item) => ({ ...item, id: item.Id })),
    [items]
  );

  const toolbarButtons = useMemo<TableButton<WordSetCardItem>[]>(
    () => [
      {
        key: "create",
        label: (
          <span className="inline-flex items-center gap-1.5">
            <IconPlus className="size-4" /> Tạo mới
          </span>
        ),
        variant: "primary",
        onClick: () => {
          onCreate();
        },
      },
      {
        key: "favorite",
        label: (
          <span className="inline-flex items-center gap-1.5">
            <IconStarFilled className="size-4 text-yellow-500" /> Yêu thích
          </span>
        ),
        variant: "primary",
        onClick: (selected) => {
          void (async () => {
            for (const row of selected.filter((item) => !item.IsFavorite)) {
              await onToggleFavorite(row, true);
            }
          })();
        },
        disabled: (selected) =>
          selected.length === 0 || selected.every((row) => row.IsFavorite),
      },
      {
        key: "unfavorite",
        label: (
          <span className="inline-flex items-center gap-1.5">
            <IconStar className="size-4" /> Bỏ yêu thích
          </span>
        ),
        variant: "secondary",
        onClick: (selected) => {
          void (async () => {
            for (const row of selected.filter((item) => item.IsFavorite)) {
              await onToggleFavorite(row, false);
            }
          })();
        },
        disabled: (selected) =>
          selected.length === 0 || selected.every((row) => !row.IsFavorite),
      },
      {
        key: "study",
        label: (
          <span className="inline-flex items-center gap-1.5">
            <IconPlayerPlay className="size-4" /> Bắt đầu học
          </span>
        ),
        variant: "primary",
        onClick: (selected) => {
          const target = selected[0];
          if (!target) return;
          onStudy(target);
        },
        disabled: (selected) => selected.length !== 1,
      },
      {
        key: "edit",
        label: (
          <span className="inline-flex items-center gap-1.5">
            <IconEdit className="size-4" /> Chỉnh sửa
          </span>
        ),
        onClick: (selected) => {
          const target = selected[0];
          if (!target) return;
          onEdit(target);
        },
        disabled: (selected) => selected.length !== 1,
      },
      {
        key: "details",
        label: (
          <span className="inline-flex items-center gap-1.5">
            <IconArrowRight className="size-4" /> Xem chi tiết
          </span>
        ),
        variant: "ghost",
        onClick: (selected) => {
          const target = selected[0];
          if (!target) return;
          onViewDetails(target);
        },
        disabled: (selected) => selected.length !== 1,
      },
      {
        key: "delete",
        label: (
          <span className="inline-flex items-center gap-1.5">
            <IconTrash className="size-4" /> Xóa
          </span>
        ),
        variant: "danger",
        onClick: (selected) => {
          const target = selected[0];
          if (!target) return;
          onDelete(target);
        },
        disabled: (selected) => selected.length === 0,
      },
    ],
    [onCreate, onDelete, onEdit, onStudy, onToggleFavorite, onViewDetails]
  );

  const toolbarStartContent = useMemo(
    () => (
      <Typography variant="muted" className="text-xs text-muted-foreground md:text-sm">
        {totalCount.toLocaleString()} bộ từ vựng
      </Typography>
    ),
    [totalCount]
  );

  const toolbarEndContent = useMemo(
    () => (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Label
            htmlFor="word-set-sort"
            className="hidden items-center gap-1 text-xs font-medium text-muted-foreground md:flex"
          >
            <IconSortDescending className="size-4" />
            Sắp xếp
          </Label>
          <Select value={selectedSortOption} onValueChange={setSelectedSortOption}>
            <SelectTrigger id="word-set-sort" size="sm" className="w-[140px]">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent align="end">
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label
            htmlFor="word-set-columns"
            className="hidden items-center gap-1 text-xs font-medium text-muted-foreground md:flex"
          >
            <IconColumns3 className="size-4" />
            Cột
          </Label>
          <Select value={`${gridColumns}`} onValueChange={(value) => setGridColumns(Number(value))}>
            <SelectTrigger id="word-set-columns" size="sm" className="w-[92px]">
              <SelectValue placeholder={gridColumns} />
            </SelectTrigger>
            <SelectContent align="end">
              {COLUMN_OPTIONS.map((option) => (
                <SelectItem key={option} value={`${option}`}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    ),
    [gridColumns, selectedSortOption]
  );

  return (
    <FilterGrid
      data={gridItems}
      renderItem={(item, { selected }) => (
        <WordSetCard
          wordSet={item}
          highlight={selected}
          onClick={() => onViewDetails(item)}
          onToggleFavorite={(nextState) => {
            void onToggleFavorite(item, nextState);
          }}
          onStudy={() => onStudy(item)}
          footer={(
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-1" onClick={() => onEdit(item)}>
                <IconEdit className="size-4" />
                Sửa
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1 text-destructive"
                onClick={() => onDelete(item)}
              >
                <IconTrash className="size-4" />
                Xóa
              </Button>
            </div>
          )}
        />
      )}
      loading={loading}
      selectable
      buttons={toolbarButtons}
      groupToolbarButtons={false}
      toolbarStartContent={toolbarStartContent}
      filters={filters}
      filterFields={filterFields}
      onFiltersChange={onFiltersChange}
      onSearchChange={onSearchChange}
      searchableColumns={searchableColumns}
      searchPlaceholder="Tìm kiếm theo tiêu đề hoặc mô tả..."
      toolbarEndContent={toolbarEndContent}
      columns={gridColumns}
      pagination={pagination}
    />
  );
}
