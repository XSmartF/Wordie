import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import {
  IconArrowRight,
  IconEdit,
  IconPlus,
  IconStar,
  IconStarFilled,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { wordSetsApi } from "@/features/word-sets/api/word-sets-api";
import type {
  CreateWordSetRequest,
  UpdateWordSetRequest,
  WordSetDto,
} from "@/features/word-sets/types";
import type {
  FilterFieldConfig,
  TableButton,
} from "@/shared/components/data-table";
import { DataTable } from "@/shared/components/data-table";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import type {
  FilterRule,
  PagedResponse,
  SearchRule,
  SortRule,
} from "@/shared/types/pagination";

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

type WordSetTableRow = {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  isFavorite: boolean;
  wordSet: WordSetDto;
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
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [sorts, setSorts] = useState<SortRule[]>([]);
  const [searchRule, setSearchRule] = useState<SearchRule | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<WordSetsResponseState>(INITIAL_STATE);

  const [dialogState, setDialogState] = useState<DialogState>(DEFAULT_DIALOG_STATE);
  const [deleteState, setDeleteState] = useState<DeleteState>(DEFAULT_DELETE_STATE);

  const [formValues, setFormValues] = useState<{
    title: string;
    description: string;
    isFavorite: boolean;
  }>({ title: "", description: "", isFavorite: false });
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

      const response: PagedResponse<WordSetDto> = await wordSetsApi.query(request);

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
        const updated = await wordSetsApi.updateFavorite(wordSet.Id, nextFavorite);

        setState((current) => ({
          ...current,
          items: current.items.map((item) => (item.Id === updated.Id ? updated : item)),
        }));

        queryClient.setQueryData<WordSetDto[] | undefined>(["wordSets", "favorites"], (previous) => {
          if (!previous) return previous;

          if (updated.IsFavorite) {
            const exists = previous.some((item) => item.Id === updated.Id);
            if (exists) {
              return previous.map((item) => (item.Id === updated.Id ? updated : item)).sort((a, b) => a.Title.localeCompare(b.Title));
            }
            return [...previous, updated].sort((a, b) => a.Title.localeCompare(b.Title));
          }

          return previous.filter((item) => item.Id !== updated.Id);
        });

        void queryClient.invalidateQueries({ queryKey: ["wordSets", "favorites"] });

        toast.success(
          updated.IsFavorite
            ? `Đã thêm "${updated.Title}" vào danh sách yêu thích.`
            : `Đã bỏ "${updated.Title}" khỏi danh sách yêu thích.`,
        );
      } catch (err) {
        console.error("Failed to update favorite", err);
        toast.error("Không thể cập nhật trạng thái yêu thích.");
      }
    },
    [queryClient],
  );

  const openCreateDialog = useCallback(() => {
    setDialogState({ open: true, mode: "create", wordSet: null });
    setFormValues({ title: "", description: "", isFavorite: false });
  }, []);

  const openEditDialog = useCallback((wordSet: WordSetDto) => {
    setDialogState({ open: true, mode: "edit", wordSet });
    setFormValues({
      title: wordSet.Title,
      description: wordSet.Description ?? "",
      isFavorite: wordSet.IsFavorite,
    });
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

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formSubmitting) return;

    setFormSubmitting(true);

    try {
      if (dialogState.mode === "create") {
        const payload: CreateWordSetRequest = {
          title: formValues.title.trim(),
          description: formValues.description.trim() || undefined,
          isFavorite: formValues.isFavorite,
        };

        await wordSetsApi.create(payload);
        toast.success("Tạo word set mới thành công.");
      } else if (dialogState.wordSet) {
        const payload: UpdateWordSetRequest = {
          title: formValues.title.trim(),
          description: formValues.description.trim() || undefined,
          isFavorite: formValues.isFavorite,
        };

        await wordSetsApi.update(dialogState.wordSet.Id, payload);
        toast.success("Cập nhật word set thành công.");
      }

      closeDialog();
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

  const tableData: WordSetTableRow[] = useMemo(
    () =>
      state.items.map((item) => ({
        id: item.Id,
        title: item.Title,
        description: item.Description ?? "",
        createdAt: item.CreatedAt,
        isFavorite: item.IsFavorite,
        wordSet: item,
      })),
    [state.items],
  );

  const columns = useMemo<ColumnDef<WordSetTableRow>[]>(() => {
    return [
      {
        id: "Title",
        header: "Tiêu đề",
        accessorFn: (row) => row.title,
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-foreground wrap-break-word" title={row.original.title}>
              {row.original.title}
            </span>
            {row.original.description && (
              <span className="text-sm text-muted-foreground wrap-break-word" title={row.original.description}>
                {row.original.description}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "Description",
        header: "Mô tả",
        accessorFn: (row) => row.description ?? "",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground wrap-break-word">
            {row.original.description || "—"}
          </span>
        ),
      },
      {
        id: "CreatedAt",
        header: "Ngày tạo",
        accessorFn: (row) => row.createdAt,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {format(new Date(row.original.createdAt), "dd/MM/yyyy")}
          </span>
        ),
      },
    ];
  }, []);

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
    [],
  );

  const searchableColumns = useMemo(() => ["Title", "Description"], []);

  const handleFiltersChange = useCallback((nextFilters: FilterRule[]) => {
    setFilters(nextFilters);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((nextSorts: { field: string; direction: "Asc" | "Desc" }[]) => {
    const mapped: SortRule[] = nextSorts.map((sort) => ({ Field: sort.field, Direction: sort.direction }));
    setSorts((current) => {
      if (
        current.length === mapped.length &&
        current.every((item, index) => item.Field === mapped[index]?.Field && item.Direction === mapped[index]?.Direction)
      ) {
        return current;
      }

      return mapped;
    });
  }, []);

  const handleSearchChange = useCallback((nextSearch: SearchRule | undefined) => {
    setSearchRule(nextSearch);
    setPage(1);
  }, []);

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
    [page, pageSize, state.totalPages, state.totalCount],
  );

  const toolbarButtons = useMemo<TableButton<WordSetTableRow>[]>(
    () => [
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
            for (const row of selected.filter((item) => !item.wordSet.IsFavorite)) {
              await handleToggleFavorite(row.wordSet, true);
            }
          })();
        },
        disabled: (selected) => selected.length === 0 || selected.every((row) => row.wordSet.IsFavorite),
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
            for (const row of selected.filter((item) => item.wordSet.IsFavorite)) {
              await handleToggleFavorite(row.wordSet, false);
            }
          })();
        },
        disabled: (selected) => selected.length === 0 || selected.every((row) => !row.wordSet.IsFavorite),
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
          openEditDialog(target.wordSet);
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
          openDeleteDialog(target.wordSet);
        },
        disabled: (selected) => selected.length === 0,
      },
    ],
    [handleToggleFavorite, navigate, openDeleteDialog, openEditDialog],
  );

  return (
    <div className="flex flex-col gap-5 px-4 py-6 md:gap-8 md:px-8 md:py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-foreground">Word Sets</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Quản lý các bộ từ vựng của bạn, thêm mới, chỉnh sửa hoặc đánh dấu yêu thích để truy cập nhanh.
        </p>
        {error && (
          <span className="text-sm text-destructive">{error}</span>
        )}
      </div>

      <div>
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex flex-col gap-4 border-b border-border/60 bg-muted/20 px-6 py-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold text-foreground">
                  Tổng số: {state.totalCount.toLocaleString()} word set
                </CardTitle>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Trang {state.totalCount === 0 ? 0 : page} / {Math.max(state.totalPages, 1)}
                </span>
              </div>
              <Button
                variant="default"
                size="sm"
                className="gap-2 self-start md:self-auto"
                onClick={openCreateDialog}
              >
                <IconPlus className="size-4" /> Thêm word set
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              data={tableData}
              columns={columns}
              loading={loading}
              enableTabs={false}
              enableDragAndDrop={false}
              selectable
              buttons={toolbarButtons}
              pagination={pagination}
              onFiltersChange={handleFiltersChange}
              onSortChange={handleSortChange}
              onSearchChange={handleSearchChange}
              searchableColumns={searchableColumns}
              filterFields={filterFields}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogState.open} onOpenChange={(open) => (open ? dialogState.open : closeDialog())}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialogState.mode === "create" ? "Tạo word set mới" : "Chỉnh sửa word set"}
            </DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={handleFormSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="wordset-title">Tiêu đề</Label>
              <Input
                id="wordset-title"
                value={formValues.title}
                onChange={(event) => setFormValues((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Nhập tiêu đề"
                required
                disabled={formSubmitting}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="wordset-description">Mô tả</Label>
              <Textarea
                id="wordset-description"
                value={formValues.description}
                onChange={(event) => setFormValues((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Mô tả ngắn gọn cho word set"
                disabled={formSubmitting}
                className="min-h-32"
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox
                checked={formValues.isFavorite}
                onCheckedChange={(checked) =>
                  setFormValues((prev) => ({ ...prev, isFavorite: checked === true }))
                }
                disabled={formSubmitting}
              />
              Đánh dấu là yêu thích
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} disabled={formSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={formSubmitting || formValues.title.trim().length === 0}>
                {formSubmitting ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteState.open} onOpenChange={(open) => (open ? deleteState.open : closeDeleteDialog())}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteState.wordSet
                ? `Bạn có chắc muốn xóa "${deleteState.wordSet.Title}"? Thao tác này không thể hoàn tác.`
                : "Bạn có chắc muốn xóa word set này?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog} disabled={deleteSubmitting}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleteSubmitting} className="bg-destructive">
              {deleteSubmitting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WordSetsPage;
