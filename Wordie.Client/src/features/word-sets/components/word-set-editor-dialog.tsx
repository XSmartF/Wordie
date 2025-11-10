import { useMemo } from "react";
import { format } from "date-fns";
import { z } from "zod";

import type { WordSetDto } from "@/features/word-sets/types";
import { ResponsiveDialog } from "@/shared/components/responsive-dialog";
import {
  FormBuilder,
  type FormFieldConfig,
} from "@/shared/components/form/form-builder";
import { Typography } from "@/shared/components/typography";

// eslint-disable-next-line react-refresh/only-export-components
export const wordSetFormSchema = z.object({
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

export type WordSetFormValues = z.infer<typeof wordSetFormSchema>;

type DialogMode = "create" | "edit";

const WORD_SET_FORM_FIELDS: FormFieldConfig<WordSetFormValues>[] = [
  {
    name: "title",
    label: "Tiêu đề",
    type: "text",
    placeholder: "Nhập tiêu đề",
    required: true,
    helperText: "Tên hiển thị trong danh sách word set.",
    colSpan: 2,
    inputProps: {
      maxLength: 120,
      autoComplete: "off",
    },
  },
  {
    name: "description",
    label: "Mô tả",
    type: "textarea",
    placeholder: "Mô tả ngắn gọn cho word set",
    rows: 4,
    helperText: "Tùy chọn; giúp bạn ghi chú nội dung bộ từ.",
    colSpan: 2,
  },
  {
    name: "isFavorite",
    label: "Đánh dấu là yêu thích",
    type: "checkbox",
    description: "Hiển thị bộ từ trong danh sách yêu thích.",
    colSpan: 2,
  },
];

const TIPS: string[] = [
  "Đặt tên ngắn gọn, dễ nhận diện chủ đề học.",
  "Sử dụng mô tả để nhắc lại phạm vi hoặc nguồn của bộ từ.",
  "Đánh dấu yêu thích cho các bộ dùng hằng ngày để truy cập nhanh.",
];

interface WordSetEditorDialogProps {
  open: boolean;
  mode: DialogMode;
  submitting: boolean;
  defaultValues: WordSetFormValues;
  wordSet?: WordSetDto | null;
  onSubmit: (values: WordSetFormValues) => void | Promise<void>;
  onCancel: () => void;
  onOpenChange: (open: boolean) => void;
  submitLabel: string;
}

export const WordSetEditorDialog = ({
  open,
  mode,
  submitting,
  defaultValues,
  wordSet,
  onSubmit,
  onCancel,
  onOpenChange,
  submitLabel,
}: WordSetEditorDialogProps) => {
  const createdAtText = useMemo(() => {
    if (!wordSet?.CreatedAt) return null;
    try {
      return format(new Date(wordSet.CreatedAt), "dd/MM/yyyy HH:mm");
    } catch (error) {
      console.error("Failed to format created date", error);
      return null;
    }
  }, [wordSet?.CreatedAt]);

  const favoriteStatus = wordSet?.IsFavorite ? "Đang đánh dấu yêu thích" : "Chưa đánh dấu yêu thích";

  const dialogTitle = mode === "create" ? "Tạo word set mới" : "Chỉnh sửa word set";
  const dialogDescription =
    mode === "create"
      ? "Thiết lập thông tin cơ bản cho bộ từ mới để thuận tiện quản lý."
      : "Cập nhật tên, mô tả hoặc trạng thái yêu thích của bộ từ hiện có.";

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={dialogTitle}
      description={dialogDescription}
      desktopContentClassName="sm:max-w-2xl lg:max-w-4xl"
      desktopBodyClassName="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border bg-muted/40 p-4">
          <Typography variant="small" className="text-foreground">
            Gợi ý thiết lập
          </Typography>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
            {TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
        {mode === "edit" && wordSet ? (
          <div className="rounded-lg border bg-card/60 p-4 shadow-sm">
            <Typography variant="small" className="text-foreground">
              Thông tin hiện tại
            </Typography>
            <dl className="mt-3 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start justify-between gap-4">
                <dt className="font-medium text-foreground">Tiêu đề</dt>
                <dd className="max-w-[65%] text-right text-foreground">{wordSet.Title}</dd>
              </div>
              {wordSet.Description ? (
                <div className="flex items-start justify-between gap-4">
                  <dt className="font-medium text-foreground">Mô tả</dt>
                  <dd className="max-w-[65%] text-right">{wordSet.Description}</dd>
                </div>
              ) : null}
              {createdAtText ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="font-medium text-foreground">Ngày tạo</dt>
                  <dd>{createdAtText}</dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4">
                <dt className="font-medium text-foreground">Trạng thái</dt>
                <dd>{favoriteStatus}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>

      <FormBuilder<WordSetFormValues>
        key={mode === "edit" ? wordSet?.Id ?? "edit" : "create"}
        fields={WORD_SET_FORM_FIELDS}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        onCancel={onCancel}
        submitting={submitting}
        submitLabel={submitLabel}
        cancelLabel="Hủy"
        columns={2}
        className="h-full"
        schema={wordSetFormSchema}
      />
    </ResponsiveDialog>
  );
};

export default WordSetEditorDialog;
