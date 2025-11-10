import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconArrowRight,
  IconEdit,
  IconPlayerPlay,
  IconPlus,
  IconSortDescending,
  IconStar,
  IconStarFilled,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/keys";
import { wordSetsApi } from "@/features/word-sets/api/word-sets-api";
import type {
  CreateWordSetRequest,
  UpdateWordSetRequest,
  WordSetDto,
} from "@/features/word-sets/types";
import {
  WordSetEditorDialog,
  type WordSetFormValues,
} from "@/features/word-sets/components/word-set-editor-dialog";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import type { FilterFieldConfig, TableButton } from "@/shared/components/data-table";
import { PageHeader, PageSection, PageShell } from "@/shared/components/page";
import { Typography } from "@/shared/components/typography";
import type {
  FilterRule,
  PagedResponse,
  SearchRule,
  SortRule,
} from "@/shared/types/pagination";
import { FilterGrid } from "@/shared/components/filter";
import { WordSetCard } from "@/features/word-sets/components/word-set-card";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";

type WordSetsResponseState = {
  items: WordSetDto[];
  totalCount: number;
  totalPages: number;
};

const INITIAL_STATE: WordSetsResponseState = {
  items: [],
  totalCount: 0,
  totalPages: 1,
};

type DialogState = {
  open: boolean;
  mode: "create" | "edit";
  wordSet: WordSetDto | null;
};

type DeleteState = {
  open: boolean;
  wordSet: WordSetDto | null;
};

const DEFAULT_DIALOG_STATE: DialogState = {
  open: false,
  mode: "create",
  wordSet: null,
};

const DEFAULT_DELETE_STATE: DeleteState = {
  open: false,
  wordSet: null,
};

export const WordSetsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [sorts, setSorts] = useState<SortRule[]>([]);
  const [searchRule, setSearchRule] = useState<SearchRule | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<WordSetsResponseState>(INITIAL_STATE);

  const [dialogState, setDialogState] =
    useState<DialogState>(DEFAULT_DIALOG_STATE);
  const [deleteState, setDeleteState] =
    useState<DeleteState>(DEFAULT_DELETE_STATE);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const fetchWordSets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const request = {
        Page: page,
        PageSize: pageSize,
        Filters: filters.length > 0 ? filters : undefined,
        Sorts: sorts.length > 0 ? sorts : undefined,
        Search: searchRule,
      };

      const response: PagedResponse<WordSetDto> = await wordSetsApi.query(
        request
      );

      setState({
        items: response.Items,
        totalCount: response.TotalCount,
        totalPages: response.TotalPages,
      });
    } catch (err) {
      console.error("Failed to load word sets", err);
      toast.error("Không thể tải danh sách word set. Vui lòng thử lại.");
      setError("Unable to load word sets right now. Please try again later.");
      setState(INITIAL_STATE);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters, sorts, searchRule]);

  useEffect(() => {
    void fetchWordSets();
  }, [fetchWordSets]);

  const handleToggleFavorite = useCallback(
    async (wordSet: WordSetDto, override?: boolean) => {
      try {
        const nextFavorite = override ?? !wordSet.IsFavorite;
        const updated = await wordSetsApi.updateFavorite(
          wordSet.Id,
          nextFavorite
        );

        setState((current) => ({
          ...current,
          items: current.items.map((item) =>
            item.Id === updated.Id ? updated : item
          ),
        }));

        queryClient.setQueryData<WordSetDto[] | undefined>(
          queryKeys.wordSets.favorites(),
          (previous) => {
            if (!previous) return previous;

            if (updated.IsFavorite) {
              const exists = previous.some((item) => item.Id === updated.Id);
              if (exists) {
                return previous
                  .map((item) => (item.Id === updated.Id ? updated : item))
                  .sort((a, b) => a.Title.localeCompare(b.Title));
              }
              return [...previous, updated].sort((a, b) =>
                a.Title.localeCompare(b.Title)
              );
            }

            return previous.filter((item) => item.Id !== updated.Id);
          }
        );

        void queryClient.invalidateQueries({
          queryKey: queryKeys.wordSets.favorites(),
        });

        toast.success(
          updated.IsFavorite
            ? `Đã thêm "${updated.Title}" vào danh sách yêu thích.`
            : `Đã bỏ "${updated.Title}" khỏi danh sách yêu thích.`
        );
      } catch (err) {
        console.error("Failed to update favorite", err);
        toast.error("Không thể cập nhật trạng thái yêu thích.");
      }
    },
    [queryClient]
  );

  const openCreateDialog = useCallback(() => {
    setDialogState({ open: true, mode: "create", wordSet: null });
  }, []);

  const openEditDialog = useCallback((wordSet: WordSetDto) => {
    setDialogState({ open: true, mode: "edit", wordSet });
  }, []);

  const closeDialog = () => {
    if (formSubmitting) return;
    setDialogState(DEFAULT_DIALOG_STATE);
  };

  const openDeleteDialog = useCallback((wordSet: WordSetDto) => {
    setDeleteState({ open: true, wordSet });
  }, []);

  const closeDeleteDialog = () => {
    if (deleteSubmitting) return;
    setDeleteState(DEFAULT_DELETE_STATE);
  };

  const formDefaultValues = useMemo<WordSetFormValues>(
    () => ({
      title: dialogState.wordSet?.Title ?? "",
      description: dialogState.wordSet?.Description ?? "",
      isFavorite: dialogState.wordSet?.IsFavorite ?? false,
    }),
    [dialogState.wordSet]
  );

  const dialogMode = dialogState.mode;
  const submitLabel = dialogMode === "create" ? "Tạo" : "Lưu";

  const handleFormSubmit = async (values: WordSetFormValues) => {
    if (formSubmitting) return;

    setFormSubmitting(true);

    try {
      if (dialogMode === "create") {
        const payload: CreateWordSetRequest = {
          title: values.title.trim(),
          description: values.description?.trim() || undefined,
          isFavorite: values.isFavorite,
        };

        await wordSetsApi.create(payload);
        toast.success("Tạo word set mới thành công.");
      } else if (dialogState.wordSet) {
        const payload: UpdateWordSetRequest = {
          title: values.title.trim(),
          description: values.description?.trim() || undefined,
          isFavorite: values.isFavorite,
        };

        await wordSetsApi.update(dialogState.wordSet.Id, payload);
        toast.success("Cập nhật word set thành công.");
      }

      setDialogState(DEFAULT_DIALOG_STATE);
      await fetchWordSets();
    } catch (err) {
      console.error("Failed to save word set", err);
      toast.error("Không thể lưu word set. Vui lòng thử lại.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteState.wordSet || deleteSubmitting) return;

    setDeleteSubmitting(true);

    try {
      await wordSetsApi.delete(deleteState.wordSet.Id);
      toast.success(`Đã xóa "${deleteState.wordSet.Title}".`);
      closeDeleteDialog();
      await fetchWordSets();
    } catch (err) {
      console.error("Failed to delete word set", err);
      toast.error("Không thể xóa word set. Vui lòng thử lại.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const filterFields = useMemo<FilterFieldConfig[]>(
    () => [
      {
        field: "IsFavorite",
        label: "Trạng thái yêu thích",
        type: "MultiSelect",
        options: [
          { label: "Yêu thích", value: "true" },
          { label: "Không yêu thích", value: "false" },
        ],
      },
      {
        field: "CreatedAt",
        label: "Khoảng ngày tạo",
        type: "DateRange",
      },
    ],
    []
  );

  const searchableColumns = useMemo(() => ["Title", "Description"], []);

  const sortOptions = useMemo(
    () => [
      { label: "Mới nhất", value: "CreatedAt|Desc" },
      { label: "Cũ nhất", value: "CreatedAt|Asc" },
      { label: "Tên A-Z", value: "Title|Asc" },
      { label: "Tên Z-A", value: "Title|Desc" },
    ],
    []
  );

  const [selectedSortOption, setSelectedSortOption] = useState<string>(
    () => sortOptions[0]?.value ?? ""
  );

  const handleFiltersChange = useCallback((nextFilters: FilterRule[]) => {
    setFilters(nextFilters);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback(
    (nextSearch: SearchRule | undefined) => {
      setSearchRule(nextSearch);
      setPage(1);
    },
    []
  );

  useEffect(() => {
    if (!sortOptions.length) {
      setSorts([]);
      return;
    }

    if (!selectedSortOption || !sortOptions.some((option) => option.value === selectedSortOption)) {
      const fallback = sortOptions[0]?.value;
      if (fallback && fallback !== selectedSortOption) {
        setSelectedSortOption(fallback);
      } else {
        setSorts([]);
      }
      return;
    }

    const [field, direction] = selectedSortOption.split("|") as [string, SortRule["Direction"]];
    setSorts([{ Field: field, Direction: direction }]);
  }, [selectedSortOption, sortOptions]);

  const pagination = useMemo(
    () => ({
      pageIndex: page - 1,
      pageSize,
      totalPages: state.totalPages,
      totalCount: state.totalCount,
      onPageChange: (nextIndex: number) => {
        setPage(nextIndex + 1);
      },
      onPageSizeChange: (nextSize: number) => {
        setPageSize(nextSize);
        setPage(1);
      },
    }),
    [page, pageSize, state.totalPages, state.totalCount]
  );

  type WordSetCardItem = WordSetDto & { id: string };

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
          openCreateDialog();
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
              await handleToggleFavorite(row, true);
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
              await handleToggleFavorite(row, false);
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
          navigate(`/study?wordSetId=${target.id}`);
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
          openEditDialog(target);
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
          navigate(`/wordsets/${target.id}`);
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
          openDeleteDialog(target);
        },
        disabled: (selected) => selected.length === 0,
      },
    ],
    [
      handleToggleFavorite,
      navigate,
      openCreateDialog,
      openDeleteDialog,
      openEditDialog,
    ]
  );

  const gridItems = useMemo<WordSetCardItem[]>(
    () => state.items.map((item) => ({ ...item, id: item.Id })),
    [state.items]
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
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        
      </div>
    ),
    [selectedSortOption, setSelectedSortOption, sortOptions]
  );

  return (
    <PageShell className="gap-5 md:gap-8">
      <PageHeader
        title="Word sets"
        description="Quản lý các bộ từ vựng và đánh dấu những bộ quan trọng."
      />
      {error ? (
        <PageSection>
          <Typography className="text-sm text-destructive">{error}</Typography>
        </PageSection>
      ) : null}

      <PageSection>
        <FilterGrid
          data={gridItems}
          renderItem={(item, { selected }) => (
            <WordSetCard
              wordSet={item}
              highlight={selected}
              onClick={() => navigate(`/wordsets/${item.Id}`)}
              onToggleFavorite={(nextState) => {
                void handleToggleFavorite(item, nextState);
              }}
              onStudy={() => navigate(`/study?wordSetId=${item.Id}`)}
              footer={(
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => openEditDialog(item)}
                  >
                    <IconEdit className="size-4" />
                    Sửa
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-destructive"
                    onClick={() => openDeleteDialog(item)}
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
          filters={filters}
          filterFields={filterFields}
          onFiltersChange={handleFiltersChange}
          onSearchChange={handleSearchChange}
          searchableColumns={searchableColumns}
          searchPlaceholder="Tìm kiếm theo tiêu đề hoặc mô tả..."
          toolbarEndContent={toolbarEndContent}
          pagination={pagination}
          columns={4}
        />
      </PageSection>

      <WordSetEditorDialog
        open={dialogState.open}
        mode={dialogMode}
        submitting={formSubmitting}
        defaultValues={formDefaultValues}
        wordSet={dialogState.wordSet}
        onSubmit={handleFormSubmit}
        onCancel={closeDialog}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            if (formSubmitting) return;
            closeDialog();
          }
        }}
        submitLabel={submitLabel}
      />
      <ConfirmDialog
        open={deleteState.open}
        title="Xác nhận xóa"
        description={
          deleteState.wordSet
            ? `Bạn có chắc muốn xóa "${deleteState.wordSet.Title}"? Thao tác này không thể hoàn tác.`
            : "Bạn có chắc muốn xóa word set này?"
        }
        confirmLabel="Xóa"
        loadingLabel="Đang xóa..."
        confirmLoading={deleteSubmitting}
        tone="danger"
        onConfirm={handleConfirmDelete}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
      />
  </PageShell>
  );
};

export default WordSetsPage;
