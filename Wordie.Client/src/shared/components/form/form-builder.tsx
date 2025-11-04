import * as React from "react"
import {
  Controller,
  type DefaultValues,
  type FieldValues,
  type Path,
  type SubmitHandler,
  useForm,
} from "react-hook-form"
import type { DateRange } from "react-day-picker"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Textarea } from "@/shared/components/ui/textarea"
import { ComboBox } from "@/shared/components/combobox"
import { MultiSelect, type MultiSelectOption } from "@/shared/components/ui/multi-select"
import { DatePicker } from "@/shared/components/ui/date-picker"
import { DateRangePicker } from "@/shared/components/ui/date-range-picker"

export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "multi-select"
  | "date"
  | "date-range"
  | "checkbox"

export interface FormFieldOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

type ColumnCount = 1 | 2 | 3 | 4

interface BaseFieldConfig<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>
  label: React.ReactNode
  type: FormFieldType
  placeholder?: string
  helperText?: React.ReactNode
  description?: React.ReactNode
  disabled?: boolean
  required?: boolean
  colSpan?: ColumnCount
  className?: string
}

export interface TextFieldConfig<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldConfig<TFieldValues> {
  type: "text"
  autoComplete?: string
  maxLength?: number
}

export interface TextAreaFieldConfig<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldConfig<TFieldValues> {
  type: "textarea"
  rows?: number
  autoResize?: boolean
}

export interface NumberFieldConfig<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldConfig<TFieldValues> {
  type: "number"
  min?: number
  max?: number
  step?: number
}

export interface SelectFieldConfig<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldConfig<TFieldValues> {
  type: "select"
  options: FormFieldOption[]
  allowEmpty?: boolean
}

export interface MultiSelectFieldConfig<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldConfig<TFieldValues> {
  type: "multi-select"
  options: MultiSelectOption[]
  maxBadgeCount?: number
}

export interface DateFieldConfig<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldConfig<TFieldValues> {
  type: "date"
  minDate?: Date
  maxDate?: Date
}

export interface DateRangeFieldConfig<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldConfig<TFieldValues> {
  type: "date-range"
  minDate?: Date
  maxDate?: Date
  monthCount?: number
}

export interface CheckboxFieldConfig<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldConfig<TFieldValues> {
  type: "checkbox"
}

export type FormFieldConfig<TFieldValues extends FieldValues = FieldValues> =
  | TextFieldConfig<TFieldValues>
  | TextAreaFieldConfig<TFieldValues>
  | NumberFieldConfig<TFieldValues>
  | SelectFieldConfig<TFieldValues>
  | MultiSelectFieldConfig<TFieldValues>
  | DateFieldConfig<TFieldValues>
  | DateRangeFieldConfig<TFieldValues>
  | CheckboxFieldConfig<TFieldValues>

export interface FormBuilderProps<TValues extends FieldValues = FieldValues> {
  fields: FormFieldConfig<TValues>[]
  defaultValues?: Partial<TValues>
  onSubmit: SubmitHandler<TValues>
  onCancel?: () => void
  submitting?: boolean
  submitLabel?: string
  cancelLabel?: string
  columns?: ColumnCount
  className?: string
  renderFooter?: React.ReactNode
}

const COLUMN_CLASS_MAP: Record<ColumnCount, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-4",
}

const COL_SPAN_CLASS_MAP: Record<ColumnCount, Record<ColumnCount, string>> = {
  1: {
    1: "col-span-1",
    2: "col-span-1",
    3: "col-span-1",
    4: "col-span-1",
  },
  2: {
    1: "col-span-1",
    2: "col-span-1 md:col-span-2",
    3: "col-span-1 md:col-span-2",
    4: "col-span-1 md:col-span-2",
  },
  3: {
    1: "col-span-1",
    2: "col-span-1 md:col-span-2",
    3: "col-span-1 md:col-span-3",
    4: "col-span-1 md:col-span-3",
  },
  4: {
    1: "col-span-1",
    2: "col-span-1 md:col-span-2",
    3: "col-span-1 md:col-span-3",
    4: "col-span-1 md:col-span-4",
  },
}

function getFieldWrapperClass(columns: ColumnCount, colSpan?: ColumnCount) {
  const clampedSpan = Math.min(colSpan ?? 1, columns) as ColumnCount
  return COL_SPAN_CLASS_MAP[columns][clampedSpan]
}

interface DatePredicateConfig {
  isDisabled?: boolean
  minDate?: Date
  maxDate?: Date
}

function buildDateDisabledPredicate({
  isDisabled,
  minDate,
  maxDate,
}: DatePredicateConfig): ((date: Date) => boolean) | undefined {
  if (isDisabled) {
    return () => true
  }

  if (minDate || maxDate) {
    return (date: Date) => {
      if (minDate && date < minDate) return true
      if (maxDate && date > maxDate) return true
      return false
    }
  }

  return undefined
}

export function FormBuilder<TValues extends FieldValues = FieldValues>({
  fields,
  defaultValues,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  columns = 1,
  className,
  renderFooter,
}: FormBuilderProps<TValues>) {
  const form = useForm<TValues>({
    defaultValues: defaultValues as DefaultValues<TValues> | undefined,
  })

  React.useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues as DefaultValues<TValues>)
    }
  }, [defaultValues, form])

  const gridClass = COLUMN_CLASS_MAP[columns]

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-6", className)}
    >
  <div className={cn("grid gap-4", gridClass)}>
        {fields.map((field) => {
          const fieldKey = field.name
          const rules = field.required
            ? {
                required: typeof field.label === "string" ? `${field.label} là bắt buộc` : "Thông tin này là bắt buộc",
              }
            : undefined

          switch (field.type) {
            case "text":
            case "number":
              return (
                <Controller
                  key={String(fieldKey)}
                  name={fieldKey}
                  control={form.control}
                  rules={rules}
                  render={({ field: controllerField, fieldState }) => (
                    <div className={cn("space-y-2", getFieldWrapperClass(columns, field.colSpan), field.className)}>
                      <Label htmlFor={String(fieldKey)}>
                        {field.label}
                        {field.required ? <span className="ml-1 text-destructive">*</span> : null}
                      </Label>
                      <Input
                        id={String(fieldKey)}
                        type={field.type === "number" ? "number" : "text"}
                        inputMode={field.type === "number" ? "decimal" : undefined}
                        placeholder={field.placeholder?.toString()}
                        autoComplete={"autoComplete" in field ? field.autoComplete : undefined}
                        disabled={field.disabled || submitting}
                        value={controllerField.value ?? ""}
                        onChange={(event) => {
                          if (field.type === "number") {
                            const nextValue = event.target.value
                            controllerField.onChange(nextValue === "" ? undefined : Number(nextValue))
                          } else {
                            controllerField.onChange(event.target.value)
                          }
                        }}
                        onBlur={controllerField.onBlur}
                        name={controllerField.name}
                      />
                      {field.helperText ? (
                        <p className="text-xs text-muted-foreground">{field.helperText}</p>
                      ) : null}
                      {fieldState.error ? (
                        <p className="text-xs text-destructive">{fieldState.error.message}</p>
                      ) : null}
                    </div>
                  )}
                />
              )

            case "textarea":
              return (
                <Controller
                  key={String(fieldKey)}
                  name={fieldKey}
                  control={form.control}
                  rules={rules}
                  render={({ field: controllerField, fieldState }) => (
                    <div className={cn("space-y-2", getFieldWrapperClass(columns, field.colSpan), field.className)}>
                      <Label htmlFor={String(fieldKey)}>
                        {field.label}
                        {field.required ? <span className="ml-1 text-destructive">*</span> : null}
                      </Label>
                      <Textarea
                        id={String(fieldKey)}
                        placeholder={field.placeholder?.toString()}
                        disabled={field.disabled || submitting}
                        value={controllerField.value ?? ""}
                        onChange={controllerField.onChange}
                        onBlur={controllerField.onBlur}
                        name={controllerField.name}
                        rows={field.rows ?? 4}
                      />
                      {field.helperText ? (
                        <p className="text-xs text-muted-foreground">{field.helperText}</p>
                      ) : null}
                      {fieldState.error ? (
                        <p className="text-xs text-destructive">{fieldState.error.message}</p>
                      ) : null}
                    </div>
                  )}
                />
              )

            case "select":
              return (
                <Controller
                  key={String(fieldKey)}
                  name={fieldKey}
                  control={form.control}
                  rules={rules}
                  render={({ field: controllerField, fieldState }) => (
                    <div className={cn("space-y-2", getFieldWrapperClass(columns, field.colSpan), field.className)}>
                      <Label>
                        {field.label}
                        {field.required ? <span className="ml-1 text-destructive">*</span> : null}
                      </Label>
                      <ComboBox
                        items={field.options}
                        value={controllerField.value ?? ""}
                        onChange={(nextValue) => {
                          if (nextValue === "" && field.allowEmpty === false) {
                            return
                          }
                          controllerField.onChange(nextValue)
                        }}
                        placeholder={field.placeholder?.toString()}
                        disabled={field.disabled || submitting}
                      />
                      {field.helperText ? (
                        <p className="text-xs text-muted-foreground">{field.helperText}</p>
                      ) : null}
                      {fieldState.error ? (
                        <p className="text-xs text-destructive">{fieldState.error.message}</p>
                      ) : null}
                    </div>
                  )}
                />
              )

            case "multi-select":
              return (
                <Controller
                  key={String(fieldKey)}
                  name={fieldKey}
                  control={form.control}
                  rules={rules}
                  render={({ field: controllerField, fieldState }) => (
                    <div className={cn("space-y-2", getFieldWrapperClass(columns, field.colSpan), field.className)}>
                      <Label>
                        {field.label}
                        {field.required ? <span className="ml-1 text-destructive">*</span> : null}
                      </Label>
                      <MultiSelect
                        options={field.options}
                        value={Array.isArray(controllerField.value) ? controllerField.value : []}
                        onChange={(next) => controllerField.onChange(next)}
                        placeholder={field.placeholder?.toString()}
                        disabled={field.disabled || submitting}
                        maxBadgeCount={field.maxBadgeCount}
                      />
                      {field.helperText ? (
                        <p className="text-xs text-muted-foreground">{field.helperText}</p>
                      ) : null}
                      {fieldState.error ? (
                        <p className="text-xs text-destructive">{fieldState.error.message}</p>
                      ) : null}
                    </div>
                  )}
                />
              )

            case "date":
              return (
                <Controller
                  key={String(fieldKey)}
                  name={fieldKey}
                  control={form.control}
                  rules={rules}
                  render={({ field: controllerField, fieldState }) => (
                    <div className={cn("space-y-2", getFieldWrapperClass(columns, field.colSpan), field.className)}>
                      <Label>
                        {field.label}
                        {field.required ? <span className="ml-1 text-destructive">*</span> : null}
                      </Label>
                      <DatePicker
                        value={controllerField.value ? new Date(controllerField.value as Date) : undefined}
                        onChange={(date) => controllerField.onChange(date ?? undefined)}
                        placeholder={field.placeholder?.toString()}
                        disabled={buildDateDisabledPredicate({
                          isDisabled: field.disabled || submitting,
                          minDate: field.minDate,
                          maxDate: field.maxDate,
                        })}
                        className="w-full"
                      />
                      {field.helperText ? (
                        <p className="text-xs text-muted-foreground">{field.helperText}</p>
                      ) : null}
                      {fieldState.error ? (
                        <p className="text-xs text-destructive">{fieldState.error.message}</p>
                      ) : null}
                    </div>
                  )}
                />
              )

            case "date-range":
              return (
                <Controller
                  key={String(fieldKey)}
                  name={fieldKey}
                  control={form.control}
                  rules={rules}
                  render={({ field: controllerField, fieldState }) => (
                    <div className={getFieldWrapperClass(columns, field.colSpan)}>
                      <Label>
                        {field.label}
                        {field.required ? <span className="ml-1 text-destructive">*</span> : null}
                      </Label>
                      <DateRangePicker
                        value={controllerField.value as DateRange | undefined}
                        onChange={(range) => controllerField.onChange(range)}
                        placeholder={field.placeholder?.toString()}
                        disabled={buildDateDisabledPredicate({
                          isDisabled: field.disabled || submitting,
                          minDate: field.minDate,
                          maxDate: field.maxDate,
                        })}
                        className="w-full"
                        monthCount={field.monthCount ?? 1}
                      />
                      {field.helperText ? (
                        <p className="text-xs text-muted-foreground">{field.helperText}</p>
                      ) : null}
                      {fieldState.error ? (
                        <p className="text-xs text-destructive">{fieldState.error.message}</p>
                      ) : null}
                    </div>
                  )}
                />
              )

            case "checkbox":
              return (
                <Controller
                  key={String(fieldKey)}
                  name={fieldKey}
                  control={form.control}
                  rules={rules}
                  render={({ field: controllerField, fieldState }) => (
                    <div
                      className={cn(
                        "flex items-start gap-2 rounded-md border border-transparent p-2 transition-colors space-y-0",
                        field.disabled ? "opacity-60" : "hover:border-border",
                        getFieldWrapperClass(columns, field.colSpan),
                        field.className
                      )}
                    >
                      <Checkbox
                        id={fieldKey}
                        checked={!!controllerField.value}
                        onCheckedChange={(checked) => controllerField.onChange(checked === true)}
                        disabled={field.disabled || submitting}
                      />
                      <div className="space-y-1">
                        <Label htmlFor={String(fieldKey)} className="leading-none">
                          {field.label}
                        </Label>
                        {field.description ? (
                          <p className="text-xs text-muted-foreground">{field.description}</p>
                        ) : null}
                        {fieldState.error ? (
                          <p className="text-xs text-destructive">{fieldState.error.message}</p>
                        ) : null}
                      </div>
                    </div>
                  )}
                />
              )

            default:
              return null
          }
        })}
      </div>

      {renderFooter ?? (
        <div className="flex justify-end gap-2">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              {cancelLabel}
            </Button>
          ) : null}
          <Button type="submit" disabled={submitting}>
            {submitting ? `${submitLabel}...` : submitLabel}
          </Button>
        </div>
      )}
    </form>
  )
}

export default FormBuilder
