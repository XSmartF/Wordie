import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  type DefaultValues,
  type FieldValues,
  type Path,
  type SubmitHandler,
  useForm,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form"
import type { DateRange } from "react-day-picker"
import type { ZodType } from "zod"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import { ComboBox } from "@/shared/components/combobox"
import { MultiSelect, type MultiSelectOption } from "@/shared/components/ui/multi-select"
import { DatePicker } from "@/shared/components/ui/date-picker"
import { DateRangePicker } from "@/shared/components/ui/date-range-picker"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form"
import {
  Field,
  FieldContent,
  FieldDescription as FieldHint,
  FieldTitle,
} from "@/shared/components/ui/field"

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
  schema?: ZodType<TValues>
  formOptions?: Omit<UseFormProps<TValues>, "defaultValues" | "values" | "resolver">
  renderFooter?:
    | React.ReactNode
    | ((form: UseFormReturn<TValues>) => React.ReactNode)
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
  schema,
  formOptions,
  renderFooter,
}: FormBuilderProps<TValues>) {
  const form = useForm<TValues>({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: defaultValues as DefaultValues<TValues> | undefined,
    ...formOptions,
  })

  React.useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues as DefaultValues<TValues>)
    }
  }, [defaultValues, form])

  const gridClass = COLUMN_CLASS_MAP[columns]

  const footerContent =
    typeof renderFooter === "function" ? renderFooter(form) : renderFooter

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-6", className)}
      >
        <div className={cn("grid gap-4", gridClass)}>
          {fields.map((field) => {
            const fieldKey = field.name
            const rules = !schema && field.required
              ? {
                  required:
                    typeof field.label === "string"
                      ? `${field.label} là bắt buộc`
                      : "Thông tin này là bắt buộc",
                }
              : undefined

            const baseItemClass = cn(
              getFieldWrapperClass(columns, field.colSpan),
              field.className,
            )

            switch (field.type) {
              case "text":
                return (
                  <FormField
                    key={String(fieldKey)}
                    control={form.control}
                    name={fieldKey}
                    rules={rules}
                    render={({ field: controllerField, fieldState }) => {
                      const { ref, value, onChange, ...rest } = controllerField
                      const disabled = field.disabled || submitting
                      return (
                        <FormItem className={baseItemClass}>
                          <Field
                            orientation="vertical"
                            data-invalid={fieldState.error ? "true" : undefined}
                            data-disabled={disabled ? "true" : undefined}
                            className="gap-2"
                          >
                            <FieldTitle className="text-sm font-medium">
                              <FormLabel className="flex items-center gap-1">
                                {field.label}
                                {field.required ? (
                                  <span className="text-destructive">*</span>
                                ) : null}
                              </FormLabel>
                            </FieldTitle>
                            <FieldContent>
                              <FormControl>
                                <Input
                                  ref={ref}
                                  value={(value as string | undefined) ?? ""}
                                  onChange={(event) => onChange(event.target.value)}
                                  placeholder={field.placeholder?.toString()}
                                  autoComplete={"autoComplete" in field ? field.autoComplete : undefined}
                                  disabled={disabled}
                                  {...rest}
                                />
                              </FormControl>
                              {field.helperText ? (
                                <FormDescription className="text-xs text-muted-foreground">
                                  {field.helperText}
                                </FormDescription>
                              ) : null}
                              <FormMessage />
                            </FieldContent>
                          </Field>
                        </FormItem>
                      )
                    }}
                  />
                )

              case "number":
                return (
                  <FormField
                    key={String(fieldKey)}
                    control={form.control}
                    name={fieldKey}
                    rules={rules}
                    render={({ field: controllerField, fieldState }) => {
                      const { ref, value, onChange, ...rest } = controllerField
                      const disabled = field.disabled || submitting
                      return (
                        <FormItem className={baseItemClass}>
                          <Field
                            orientation="vertical"
                            data-invalid={fieldState.error ? "true" : undefined}
                            data-disabled={disabled ? "true" : undefined}
                            className="gap-2"
                          >
                            <FieldTitle className="text-sm font-medium">
                              <FormLabel className="flex items-center gap-1">
                                {field.label}
                                {field.required ? (
                                  <span className="text-destructive">*</span>
                                ) : null}
                              </FormLabel>
                            </FieldTitle>
                            <FieldContent>
                              <FormControl>
                                <Input
                                  ref={ref}
                                  type="number"
                                  value={
                                    typeof value === "number" || typeof value === "string"
                                      ? String(value)
                                      : ""
                                  }
                                  onChange={(event) => {
                                    const nextValue = event.target.value
                                    onChange(
                                      nextValue === ""
                                        ? undefined
                                        : Number(nextValue),
                                    )
                                  }}
                                  placeholder={field.placeholder?.toString()}
                                  disabled={disabled}
                                  inputMode="decimal"
                                  min={"min" in field ? field.min : undefined}
                                  max={"max" in field ? field.max : undefined}
                                  step={"step" in field ? field.step : undefined}
                                  {...rest}
                                />
                              </FormControl>
                              {field.helperText ? (
                                <FormDescription className="text-xs text-muted-foreground">
                                  {field.helperText}
                                </FormDescription>
                              ) : null}
                              <FormMessage />
                            </FieldContent>
                          </Field>
                        </FormItem>
                      )
                    }}
                  />
                )

              case "textarea":
                return (
                  <FormField
                    key={String(fieldKey)}
                    control={form.control}
                    name={fieldKey}
                    rules={rules}
                    render={({ field: controllerField, fieldState }) => {
                      const { ref, value, onChange, ...rest } = controllerField
                      const disabled = field.disabled || submitting
                      return (
                        <FormItem className={baseItemClass}>
                          <Field
                            orientation="vertical"
                            data-invalid={fieldState.error ? "true" : undefined}
                            data-disabled={disabled ? "true" : undefined}
                            className="gap-2"
                          >
                            <FieldTitle className="text-sm font-medium">
                              <FormLabel className="flex items-center gap-1">
                                {field.label}
                                {field.required ? (
                                  <span className="text-destructive">*</span>
                                ) : null}
                              </FormLabel>
                            </FieldTitle>
                            <FieldContent>
                              <FormControl>
                                <Textarea
                                  ref={ref}
                                  value={(value as string | undefined) ?? ""}
                                  onChange={onChange}
                                  placeholder={field.placeholder?.toString()}
                                  disabled={disabled}
                                  rows={field.rows ?? 4}
                                  {...rest}
                                />
                              </FormControl>
                              {field.helperText ? (
                                <FormDescription className="text-xs text-muted-foreground">
                                  {field.helperText}
                                </FormDescription>
                              ) : null}
                              <FormMessage />
                            </FieldContent>
                          </Field>
                        </FormItem>
                      )
                    }}
                  />
                )

              case "select":
                return (
                  <FormField
                    key={String(fieldKey)}
                    control={form.control}
                    name={fieldKey}
                    rules={rules}
                    render={({ field: controllerField, fieldState }) => {
                      const { ref, value, onChange, ...rest } = controllerField
                      const disabled = field.disabled || submitting
                      return (
                        <FormItem className={baseItemClass}>
                          <Field
                            orientation="vertical"
                            data-invalid={fieldState.error ? "true" : undefined}
                            data-disabled={disabled ? "true" : undefined}
                            className="gap-2"
                          >
                            <FieldTitle className="text-sm font-medium">
                              <FormLabel className="flex items-center gap-1">
                                {field.label}
                                {field.required ? (
                                  <span className="text-destructive">*</span>
                                ) : null}
                              </FormLabel>
                            </FieldTitle>
                            <FieldContent>
                              <FormControl>
                                <ComboBox
                                  ref={ref}
                                  id={rest.name}
                                  items={field.options}
                                  value={(value as string | undefined) ?? ""}
                                  onChange={(nextValue) => {
                                    if (nextValue === "" && field.allowEmpty === false) {
                                      return
                                    }
                                    onChange(nextValue)
                                  }}
                                  placeholder={field.placeholder?.toString()}
                                  disabled={disabled}
                                />
                              </FormControl>
                              {field.helperText ? (
                                <FormDescription className="text-xs text-muted-foreground">
                                  {field.helperText}
                                </FormDescription>
                              ) : null}
                              <FormMessage />
                            </FieldContent>
                          </Field>
                        </FormItem>
                      )
                    }}
                  />
                )

              case "multi-select":
                return (
                  <FormField
                    key={String(fieldKey)}
                    control={form.control}
                    name={fieldKey}
                    rules={rules}
                    render={({ field: controllerField, fieldState }) => {
                      const { value, onChange } = controllerField
                      const disabled = field.disabled || submitting
                      return (
                        <FormItem className={baseItemClass}>
                          <Field
                            orientation="vertical"
                            data-invalid={fieldState.error ? "true" : undefined}
                            data-disabled={disabled ? "true" : undefined}
                            className="gap-2"
                          >
                            <FieldTitle className="text-sm font-medium">
                              <FormLabel className="flex items-center gap-1">
                                {field.label}
                                {field.required ? (
                                  <span className="text-destructive">*</span>
                                ) : null}
                              </FormLabel>
                            </FieldTitle>
                            <FieldContent>
                              <FormControl>
                                <div>
                                  <MultiSelect
                                    options={field.options}
                                    value={Array.isArray(value) ? (value as string[]) : []}
                                    onChange={(next) => onChange(next)}
                                    placeholder={field.placeholder?.toString()}
                                    disabled={disabled}
                                    maxBadgeCount={field.maxBadgeCount}
                                  />
                                </div>
                              </FormControl>
                              {field.helperText ? (
                                <FormDescription className="text-xs text-muted-foreground">
                                  {field.helperText}
                                </FormDescription>
                              ) : null}
                              <FormMessage />
                            </FieldContent>
                          </Field>
                        </FormItem>
                      )
                    }}
                  />
                )

              case "date":
                return (
                  <FormField
                    key={String(fieldKey)}
                    control={form.control}
                    name={fieldKey}
                    rules={rules}
                    render={({ field: controllerField, fieldState }) => {
                      const { value, onChange } = controllerField
                      const disabled = field.disabled || submitting
                      const selectedDate = (value as any) instanceof Date
                        ? (value as Date)
                        : value
                          ? new Date(value as unknown as string)
                          : undefined
                      return (
                        <FormItem className={baseItemClass}>
                          <Field
                            orientation="vertical"
                            data-invalid={fieldState.error ? "true" : undefined}
                            data-disabled={disabled ? "true" : undefined}
                            className="gap-2"
                          >
                            <FieldTitle className="text-sm font-medium">
                              <FormLabel className="flex items-center gap-1">
                                {field.label}
                                {field.required ? (
                                  <span className="text-destructive">*</span>
                                ) : null}
                              </FormLabel>
                            </FieldTitle>
                            <FieldContent>
                              <FormControl>
                                <div>
                                  <DatePicker
                                    value={selectedDate}
                                    onChange={(date) => onChange(date ?? undefined)}
                                    placeholder={field.placeholder?.toString()}
                                    disabled={buildDateDisabledPredicate({
                                      isDisabled: disabled,
                                      minDate: field.minDate,
                                      maxDate: field.maxDate,
                                    })}
                                    className="w-full"
                                  />
                                </div>
                              </FormControl>
                              {field.helperText ? (
                                <FormDescription className="text-xs text-muted-foreground">
                                  {field.helperText}
                                </FormDescription>
                              ) : null}
                              <FormMessage />
                            </FieldContent>
                          </Field>
                        </FormItem>
                      )
                    }}
                  />
                )

              case "date-range":
                return (
                  <FormField
                    key={String(fieldKey)}
                    control={form.control}
                    name={fieldKey}
                    rules={rules}
                    render={({ field: controllerField, fieldState }) => {
                      const { value, onChange } = controllerField
                      const disabled = field.disabled || submitting
                      return (
                        <FormItem className={baseItemClass}>
                          <Field
                            orientation="vertical"
                            data-invalid={fieldState.error ? "true" : undefined}
                            data-disabled={disabled ? "true" : undefined}
                            className="gap-2"
                          >
                            <FieldTitle className="text-sm font-medium">
                              <FormLabel className="flex items-center gap-1">
                                {field.label}
                                {field.required ? (
                                  <span className="text-destructive">*</span>
                                ) : null}
                              </FormLabel>
                            </FieldTitle>
                            <FieldContent>
                              <FormControl>
                                <div>
                                  <DateRangePicker
                                    value={value as DateRange | undefined}
                                    onChange={(range) => onChange(range)}
                                    placeholder={field.placeholder?.toString()}
                                    disabled={buildDateDisabledPredicate({
                                      isDisabled: disabled,
                                      minDate: field.minDate,
                                      maxDate: field.maxDate,
                                    })}
                                    className="w-full"
                                    monthCount={field.monthCount ?? 1}
                                  />
                                </div>
                              </FormControl>
                              {field.helperText ? (
                                <FormDescription className="text-xs text-muted-foreground">
                                  {field.helperText}
                                </FormDescription>
                              ) : null}
                              <FormMessage />
                            </FieldContent>
                          </Field>
                        </FormItem>
                      )
                    }}
                  />
                )

              case "checkbox":
                return (
                  <FormField
                    key={String(fieldKey)}
                    control={form.control}
                    name={fieldKey}
                    rules={rules}
                    render={({ field: controllerField, fieldState }) => {
                      const { value, onChange, ...rest } = controllerField
                      const disabled = field.disabled || submitting
                      return (
                        <FormItem className={baseItemClass}>
                          <Field
                            orientation="responsive"
                            data-invalid={fieldState.error ? "true" : undefined}
                            data-disabled={disabled ? "true" : undefined}
                            className={cn(
                              "items-start gap-3 rounded-md border border-transparent p-3 transition-colors",
                              disabled ? "opacity-60" : "hover:border-border",
                            )}
                          >
                            <FormControl>
                              <Checkbox
                                checked={!!value}
                                onCheckedChange={(checked) => onChange(checked === true)}
                                disabled={disabled}
                                {...rest}
                              />
                            </FormControl>
                            <FieldContent className="gap-1.5">
                              <FieldTitle className="text-sm font-medium">
                                <span className="flex items-center gap-1">
                                  {field.label}
                                  {field.required ? (
                                    <span className="text-destructive">*</span>
                                  ) : null}
                                </span>
                              </FieldTitle>
                              {field.description ? (
                                <FieldHint className="text-xs text-muted-foreground">
                                  {field.description}
                                </FieldHint>
                              ) : null}
                              <FormMessage />
                            </FieldContent>
                          </Field>
                        </FormItem>
                      )
                    }}
                  />
                )

              default:
                return null
            }
          })}
        </div>

        {footerContent ?? (
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
    </Form>
  )
}

export default FormBuilder
