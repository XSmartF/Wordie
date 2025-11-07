import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";
import {
  IconArrowRight,
  IconEdit,
  IconPlayerPlay,
  IconPlus,
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
import type {
  FilterFieldConfig,
  TableButton,
} from "@/shared/components/data-table";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { DataTable } from "@/shared/components/data-table";
import {
  FormBuilder,
  type FormFieldConfig,
} from "@/shared/components/form/form-builder";
import { PageHeader, PageSection, PageShell } from "@/shared/components/page";
import { Typography } from "@/shared/components/typography";
import { ResponsiveDialog } from "@/shared/components/responsive-dialog";
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

const wordSetFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tiêu đề là bắt buộc")
    .max(120, "Tiêu đề tối đa 120 ký tự"),
  description: z
    .string()
    .trim()
    .max(500, "Mô tả tối đa 500 ký tự")
    .optional(),
  isFavorite: z.boolean().default(false),
});

type WordSetFormValues = z.infer<typeof wordSetFormSchema>;

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

  const wordSetFormFields = useMemo<FormFieldConfig<WordSetFormValues>[]>(
    () => [
      {
        name: "title",
        label: "Tiêu đề",
        type: "text",
        placeholder: "Nhập tiêu đề",
        required: true,
        helperText: "Tên hiển thị trong danh sách word set.",
      },
      {
        name: "description",
        label: "Mô tả",
        type: "textarea",
        placeholder: "Mô tả ngắn gọn cho word set",
        rows: 4,
        helperText: "Tùy chọn; hỗ trợ bạn ghi chú nội dung bộ từ.",
      },
      {
        name: "isFavorite",
        label: "Đánh dấu là yêu thích",
        type: "checkbox",
        description: "Hiển thị bộ từ trong danh sách yêu thích.",
      },
    ],
    []
  );

  const formDefaultValues = useMemo<WordSetFormValues>(
    () => ({
      title: dialogState.wordSet?.Title ?? "",
      description: dialogState.wordSet?.Description ?? "",
      isFavorite: dialogState.wordSet?.IsFavorite ?? false,
    }),
    [dialogState.wordSet]
  );

  const submitLabel = dialogState.mode === "create" ? "Tạo" : "Lưu";

  const handleFormSubmit = async (values: WordSetFormValues) => {
    if (formSubmitting) return;

    setFormSubmitting(true);

    try {
      if (dialogState.mode === "create") {
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
    [state.items]
  );

  const columns = useMemo<ColumnDef<WordSetTableRow>[]>(() => {
    return [
      {
        id: "Title",
        header: "Tiêu đề",
        accessorFn: (row) => row.title,
        cell: ({ row }) => (
          <div className="flex max-w-64 flex-col gap-1">
            <Typography className="truncate font-medium text-foreground" title={row.original.title}>
              {row.original.title}
            </Typography>
            {row.original.description ? (
              <Typography variant="muted" className="truncate" title={row.original.description}>
                {row.original.description}
              </Typography>
            ) : null}
          </div>
        ),
      },
      {
        id: "Description",
        header: "Mô tả",
        accessorFn: (row) => row.description ?? "",
        enableSorting: false,
        cell: ({ row }) => (
          <Typography variant="muted" className="max-w-64 truncate">
            {row.original.description || "—"}
          </Typography>
        ),
      },
      {
        id: "CreatedAt",
        header: "Ngày tạo",
        accessorFn: (row) => row.createdAt,
        cell: ({ row }) => (
          <Typography variant="muted" className="whitespace-nowrap">
            {format(new Date(row.original.createdAt), "dd/MM/yyyy")}
          </Typography>
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
    []
  );

  const searchableColumns = useMemo(() => ["Title", "Description"], []);

  const handleFiltersChange = useCallback((nextFilters: FilterRule[]) => {
    setFilters(nextFilters);
    setPage(1);
  }, []);

  const handleSortChange = useCallback(
    (nextSorts: { field: string; direction: "Asc" | "Desc" }[]) => {
      const mapped: SortRule[] = nextSorts.map((sort) => ({
        Field: sort.field,
        Direction: sort.direction,
      }));
      setSorts((current) => {
        if (
          current.length === mapped.length &&
          current.every(
            (item, index) =>
              item.Field === mapped[index]?.Field &&
              item.Direction === mapped[index]?.Direction
          )
        ) {
          return current;
        }

        return mapped;
      });
    },
    []
  );

  const handleSearchChange = useCallback(
    (nextSearch: SearchRule | undefined) => {
      setSearchRule(nextSearch);
      setPage(1);
    },
    []
  );

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

  const toolbarButtons = useMemo<TableButton<WordSetTableRow>[]>(
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
            for (const row of selected.filter(
              (item) => !item.wordSet.IsFavorite
            )) {
              await handleToggleFavorite(row.wordSet, true);
            }
          })();
        },
        disabled: (selected) =>
          selected.length === 0 ||
          selected.every((row) => row.wordSet.IsFavorite),
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
            for (const row of selected.filter(
              (item) => item.wordSet.IsFavorite
            )) {
              await handleToggleFavorite(row.wordSet, false);
            }
          })();
        },
        disabled: (selected) =>
          selected.length === 0 ||
          selected.every((row) => !row.wordSet.IsFavorite),
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
    [
      handleToggleFavorite,
      navigate,
      openCreateDialog,
      openDeleteDialog,
      openEditDialog,
    ]
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
        <DataTable
          data={tableData}
          columns={columns}
          loading={loading}
          enableTabs={false}
          enableDragAndDrop={false}
          selectable
          buttons={toolbarButtons}
          groupToolbarButtons={false}
          pagination={pagination}
          onFiltersChange={handleFiltersChange}
          onSortChange={handleSortChange}
          onSearchChange={handleSearchChange}
          searchableColumns={searchableColumns}
          filterFields={filterFields}
        />
      </PageSection>

      <ResponsiveDialog
        open={dialogState.open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) return;
          if (formSubmitting) return;
          closeDialog();
        }}
        title=
          {dialogState.mode === "create"
            ? "Tạo word set mới"
            : "Chỉnh sửa word set"}
        desktopContentClassName="max-w-lg"
      >
        <FormBuilder<WordSetFormValues>
          key={dialogState.wordSet?.Id ?? dialogState.mode}
          className="pt-2"
          fields={wordSetFormFields}
          defaultValues={formDefaultValues}
          onSubmit={handleFormSubmit}
          onCancel={closeDialog}
          submitting={formSubmitting}
          submitLabel={submitLabel}
          cancelLabel="Hủy"
          columns={1}
          schema={wordSetFormSchema}
        />
      </ResponsiveDialog>
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
