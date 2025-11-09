import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  type ControllerFieldState,
  type ControllerRenderProps,
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
import { Checkbox, type CheckboxProps } from "@/shared/components/ui/checkbox"
import { Input, type InputProps } from "@/shared/components/ui/input"
import { Textarea, type TextareaProps } from "@/shared/components/ui/textarea"
import { ComboBox, type ComboBoxProps } from "@/shared/components/combobox"
import {
  MultiSelect,
  type MultiSelectOption,
  type MultiSelectProps,
} from "@/shared/components/ui/multi-select"
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

type InputConfigProps = Omit<
  InputProps,
  "value" | "defaultValue" | "onChange" | "disabled" | "name" | "ref"
>

type TextareaConfigProps = Omit<
  TextareaProps,
  "value" | "defaultValue" | "onChange" | "disabled" | "name" | "ref"
>

type ComboBoxConfigProps = Omit<
  ComboBoxProps,
  "value" | "onChange" | "items" | "disabled"
>

type MultiSelectConfigProps = Omit<
  MultiSelectProps,
  "value" | "onChange" | "options" | "disabled"
>

type DatePickerConfigProps = Omit<
  React.ComponentPropsWithoutRef<typeof DatePicker>,
  "value" | "onChange"
>

type DateRangePickerConfigProps = Omit<
  React.ComponentPropsWithoutRef<typeof DateRangePicker>,
  "value" | "onChange"
>

type CheckboxConfigProps = Omit<
  CheckboxProps,
  "checked" | "defaultChecked" | "onCheckedChange" | "disabled"
>

type FieldComponentProps = Omit<
  React.ComponentPropsWithoutRef<typeof Field>,
  "children"
> & {
  ["data-invalid"]?: string
  ["data-disabled"]?: string
}

export type FormBuilderContext<
  TFieldValues extends FieldValues = FieldValues,
> = {
  form: UseFormReturn<TFieldValues>
  submitting: boolean
}

export interface FormFieldRenderProps<
  TFieldValues extends FieldValues = FieldValues,
> {
  form: UseFormReturn<TFieldValues>
  submitting: boolean
  field: ControllerRenderProps<TFieldValues, Path<TFieldValues>>
  fieldState: ControllerFieldState
  defaultRender: () => React.ReactElement
}

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
  fieldProps?: FieldComponentProps
  shouldRender?: (context: FormBuilderContext<TFieldValues>) => boolean
  render?: (props: FormFieldRenderProps<TFieldValues>) => React.ReactElement
}

export interface TextFieldConfig<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldConfig<TFieldValues> {
  type: "text"
  autoComplete?: string
  maxLength?: number
  inputProps?: InputConfigProps
}

export interface TextAreaFieldConfig<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldConfig<TFieldValues> {
  type: "textarea"
  rows?: number
  autoResize?: boolean
  textareaProps?: TextareaConfigProps
}

export interface NumberFieldConfig<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldConfig<TFieldValues> {
  type: "number"
  min?: number
  max?: number
  step?: number
  inputProps?: InputConfigProps
}

export interface SelectFieldConfig<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldConfig<TFieldValues> {
  type: "select"
  options: FormFieldOption[]
  allowEmpty?: boolean
  comboBoxProps?: ComboBoxConfigProps
}

export interface MultiSelectFieldConfig<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldConfig<TFieldValues> {
  type: "multi-select"
  options: MultiSelectOption[]
  maxBadgeCount?: number
  multiSelectProps?: MultiSelectConfigProps
}

export interface DateFieldConfig<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldConfig<TFieldValues> {
  type: "date"
  minDate?: Date
  maxDate?: Date
  datePickerProps?: DatePickerConfigProps
}

export interface DateRangeFieldConfig<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldConfig<TFieldValues> {
  type: "date-range"
  minDate?: Date
  maxDate?: Date
  monthCount?: number
  dateRangePickerProps?: DateRangePickerConfigProps
}

export interface CheckboxFieldConfig<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldConfig<TFieldValues> {
  type: "checkbox"
  checkboxProps?: CheckboxConfigProps
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
  formProps?: Omit<React.ComponentPropsWithoutRef<"form">, "onSubmit" | "className">
  fieldsWrapperClassName?: string
  onFormReady?: (form: UseFormReturn<TValues>) => void
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
  basePredicate?: ((date: Date) => boolean) | undefined
}

function buildDateDisabledPredicate({
  isDisabled,
  minDate,
  maxDate,
  basePredicate,
}: DatePredicateConfig): ((date: Date) => boolean) | undefined {
  if (isDisabled) {
    return () => true
  }

  if (minDate || maxDate || basePredicate) {
    return (date: Date) => {
      if (basePredicate?.(date)) return true
      if (minDate && date < minDate) return true
      if (maxDate && date > maxDate) return true
      return false
    }
  }

  return undefined
}

function resolveFieldComponentProps<TFieldValues extends FieldValues>(
  config: BaseFieldConfig<TFieldValues>,
  fieldState: ControllerFieldState,
  disabled: boolean,
  defaultClassName: string,
  defaultOrientation: FieldComponentProps["orientation"] = "vertical",
): FieldComponentProps {
  const override = config.fieldProps ?? {}
  const { className, ...rest } = override
  const base: FieldComponentProps = {
    orientation: defaultOrientation,
    className: defaultClassName,
    "data-invalid": fieldState.error ? "true" : undefined,
    "data-disabled": disabled ? "true" : undefined,
  }

  return {
    ...base,
    ...rest,
    className: cn(base.className, className),
  }
}

function renderWithOverride<TFieldValues extends FieldValues>(
  config: BaseFieldConfig<TFieldValues>,
  props: FormFieldRenderProps<TFieldValues>,
) {
  if (config.render) {
    // Allow consumers to replace the default rendering while still getting access to helpers.
    return config.render(props)
  }

  return props.defaultRender()
}

type DateRangePickerDisabled = React.ComponentPropsWithoutRef<
  typeof DateRangePicker
>["disabled"]

function mergeDisabledMatchers(
  base: DateRangePickerDisabled | undefined,
  extra: DateRangePickerDisabled | undefined,
): DateRangePickerDisabled | undefined {
  if (!base) return extra
  if (!extra) return base

  const baseList = Array.isArray(base) ? base : [base]
  const extraList = Array.isArray(extra) ? extra : [extra]

  return [...baseList, ...extraList]
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
  formProps,
  fieldsWrapperClassName,
  onFormReady,
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

  React.useEffect(() => {
    onFormReady?.(form)
  }, [form, onFormReady])

  const gridClass = COLUMN_CLASS_MAP[columns]

  const footerContent =
    typeof renderFooter === "function" ? renderFooter(form) : renderFooter

  return (
    <Form {...form}>
      <form
        {...formProps}
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-6", className)}
      >
        <div className={cn("grid gap-4", gridClass, fieldsWrapperClassName)}>
          {fields.map((field) => {
            if (field.shouldRender && !field.shouldRender({ form, submitting })) {
              return null
            }

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
                      const fieldComponentProps = resolveFieldComponentProps(
                        field,
                        fieldState,
                        disabled,
                        "gap-2",
                        "vertical",
                      )
                      const {
                        className: inputClassName,
                        placeholder: inputPlaceholder,
                        autoComplete: inputAutoComplete,
                        type: inputType,
                        ...restInputProps
                      } = field.inputProps ?? {}

                      const defaultRender = () => (
                        <FormItem className={baseItemClass}>
                          <Field {...fieldComponentProps}>
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
                                  placeholder={inputPlaceholder ?? field.placeholder}
                                  autoComplete={
                                    inputAutoComplete ?? (
                                      "autoComplete" in field ? field.autoComplete : undefined
                                    )
                                  }
                                  type={inputType ?? "text"}
                                  disabled={disabled}
                                  {...rest}
                                  {...restInputProps}
                                  className={cn(inputClassName)}
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

                      return renderWithOverride(field, {
                        form,
                        submitting,
                        field: controllerField,
                        fieldState,
                        defaultRender,
                      })
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
                      const fieldComponentProps = resolveFieldComponentProps(
                        field,
                        fieldState,
                        disabled,
                        "gap-2",
                        "vertical",
                      )
                      const {
                        className: inputClassName,
                        placeholder: inputPlaceholder,
                        min: inputMin,
                        max: inputMax,
                        step: inputStep,
                        inputMode: inputInputMode,
                        autoComplete: inputAutoComplete,
                        ...restInputProps
                      } = field.inputProps ?? {}

                      const defaultRender = () => (
                        <FormItem className={baseItemClass}>
                          <Field {...fieldComponentProps}>
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
                                  placeholder={inputPlaceholder ?? field.placeholder}
                                  disabled={disabled}
                                  inputMode={inputInputMode ?? "decimal"}
                                  min={field.min ?? inputMin}
                                  max={field.max ?? inputMax}
                                  step={field.step ?? inputStep}
                                  autoComplete={inputAutoComplete}
                                  {...rest}
                                  {...restInputProps}
                                  className={cn(inputClassName)}
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

                      return renderWithOverride(field, {
                        form,
                        submitting,
                        field: controllerField,
                        fieldState,
                        defaultRender,
                      })
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
                      const fieldComponentProps = resolveFieldComponentProps(
                        field,
                        fieldState,
                        disabled,
                        "gap-2",
                        "vertical",
                      )
                      const {
                        className: textareaClassName,
                        placeholder: textareaPlaceholder,
                        rows: textareaRows,
                        ...restTextareaProps
                      } = field.textareaProps ?? {}

                      const defaultRender = () => (
                        <FormItem className={baseItemClass}>
                          <Field {...fieldComponentProps}>
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
                                  placeholder={textareaPlaceholder ?? field.placeholder}
                                  disabled={disabled}
                                  rows={textareaRows ?? field.rows ?? 4}
                                  {...rest}
                                  {...restTextareaProps}
                                  className={cn(textareaClassName)}
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

                      return renderWithOverride(field, {
                        form,
                        submitting,
                        field: controllerField,
                        fieldState,
                        defaultRender,
                      })
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
                      const fieldComponentProps = resolveFieldComponentProps(
                        field,
                        fieldState,
                        disabled,
                        "gap-2",
                        "vertical",
                      )
                      const {
                        className: comboClassName,
                        placeholder: comboPlaceholder,
                        emptyMessage,
                        ...restComboBoxProps
                      } = field.comboBoxProps ?? {}

                      const defaultRender = () => (
                        <FormItem className={baseItemClass}>
                          <Field {...fieldComponentProps}>
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
                                  placeholder={comboPlaceholder ?? field.placeholder}
                                  disabled={disabled}
                                  emptyMessage={emptyMessage}
                                  className={comboClassName}
                                  {...restComboBoxProps}
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

                      return renderWithOverride(field, {
                        form,
                        submitting,
                        field: controllerField,
                        fieldState,
                        defaultRender,
                      })
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
                      const fieldComponentProps = resolveFieldComponentProps(
                        field,
                        fieldState,
                        disabled,
                        "gap-2",
                        "vertical",
                      )
                      const {
                        className: multiClassName,
                        placeholder: multiPlaceholder,
                        maxBadgeCount: multiMaxBadgeCount,
                        ...restMultiSelectProps
                      } = field.multiSelectProps ?? {}

                      const defaultRender = () => (
                        <FormItem className={baseItemClass}>
                          <Field {...fieldComponentProps}>
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
                                    placeholder={multiPlaceholder ?? field.placeholder}
                                    disabled={disabled}
                                    maxBadgeCount={field.maxBadgeCount ?? multiMaxBadgeCount}
                                    className={multiClassName}
                                    {...restMultiSelectProps}
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

                      return renderWithOverride(field, {
                        form,
                        submitting,
                        field: controllerField,
                        fieldState,
                        defaultRender,
                      })
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
                      const rawValue = value as unknown
                      const selectedDate = rawValue instanceof Date
                        ? rawValue
                        : typeof rawValue === "string" || typeof rawValue === "number"
                          ? new Date(rawValue)
                          : undefined
                      const fieldComponentProps = resolveFieldComponentProps(
                        field,
                        fieldState,
                        disabled,
                        "gap-2",
                        "vertical",
                      )
                      const {
                        className: datePickerClassName,
                        placeholder: datePickerPlaceholder,
                        disabled: datePickerDisabled,
                        ...restDatePickerProps
                      } = field.datePickerProps ?? {}

                      const computedDisabled = buildDateDisabledPredicate({
                        isDisabled: disabled,
                        minDate: field.minDate,
                        maxDate: field.maxDate,
                        basePredicate:
                          typeof datePickerDisabled === "function"
                            ? datePickerDisabled
                            : undefined,
                      })

                      const defaultRender = () => (
                        <FormItem className={baseItemClass}>
                          <Field {...fieldComponentProps}>
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
                                    placeholder={datePickerPlaceholder ?? field.placeholder}
                                    disabled={computedDisabled ?? datePickerDisabled}
                                    className={cn("w-full", datePickerClassName)}
                                    {...restDatePickerProps}
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

                      return renderWithOverride(field, {
                        form,
                        submitting,
                        field: controllerField,
                        fieldState,
                        defaultRender,
                      })
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
                      const fieldComponentProps = resolveFieldComponentProps(
                        field,
                        fieldState,
                        disabled,
                        "gap-2",
                        "vertical",
                      )
                      const {
                        className: dateRangeClassName,
                        placeholder: dateRangePlaceholder,
                        disabled: dateRangeDisabled,
                        monthCount: dateRangeMonthCount,
                        ...restDateRangePickerProps
                      } = field.dateRangePickerProps ?? {}

                      const computedDisabled = buildDateDisabledPredicate({
                        isDisabled: disabled,
                        minDate: field.minDate,
                        maxDate: field.maxDate,
                      })

                      const finalDisabled = mergeDisabledMatchers(
                        dateRangeDisabled,
                        computedDisabled,
                      )

                      const defaultRender = () => (
                        <FormItem className={baseItemClass}>
                          <Field {...fieldComponentProps}>
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
                                    placeholder={dateRangePlaceholder ?? field.placeholder}
                                    disabled={finalDisabled}
                                    className={cn("w-full", dateRangeClassName)}
                                    monthCount={field.monthCount ?? dateRangeMonthCount ?? 1}
                                    {...restDateRangePickerProps}
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

                      return renderWithOverride(field, {
                        form,
                        submitting,
                        field: controllerField,
                        fieldState,
                        defaultRender,
                      })
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
                      const fieldComponentProps = resolveFieldComponentProps(
                        field,
                        fieldState,
                        disabled,
                        cn(
                          "items-start gap-3 rounded-md border border-transparent p-3 transition-colors",
                          disabled ? "opacity-60" : "hover:border-border",
                        ),
                        "responsive",
                      )
                      const {
                        className: checkboxClassName,
                        ...restCheckboxProps
                      } = field.checkboxProps ?? {}

                      const defaultRender = () => (
                        <FormItem className={baseItemClass}>
                          <Field {...fieldComponentProps}>
                            <FormControl>
                              <Checkbox
                                checked={!!value}
                                onCheckedChange={(checked) => onChange(checked === true)}
                                disabled={disabled}
                                className={checkboxClassName}
                                {...rest}
                                {...restCheckboxProps}
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

                      return renderWithOverride(field, {
                        form,
                        submitting,
                        field: controllerField,
                        fieldState,
                        defaultRender,
                      })
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
