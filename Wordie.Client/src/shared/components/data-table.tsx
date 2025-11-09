import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrendingUp,
  IconSearch,
  IconFilter,
} from "@tabler/icons-react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Row,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"
import { useIsMobile } from "@/shared/hooks/use-mobile"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { SplitButton } from "@/shared/components/ui/split-button"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/components/ui/chart"
import { Checkbox } from "@/shared/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { Input } from "@/shared/components/ui/input"
import { ComboBox } from "@/shared/components/combobox"
import { Label } from "@/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { Separator } from "@/shared/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs"
import { DateRangePicker } from "@/shared/components/ui/date-range-picker"
import type { DateRange } from "react-day-picker"
import { endOfDay, startOfDay } from "date-fns"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/components/ui/pagination"
import type {
  FilterOperator,
  FilterRule,
  FilterType,
  SearchRule,
  SortDirection,
} from "@/shared/types/pagination"
import { Skeleton } from "./ui/skeleton"

export interface TableButton<T> {
  key: string
  label: React.ReactNode
  onClick?: (selected: T[]) => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  disabled?: (selected: T[]) => boolean
}

export type FilterFieldOption = {
  label: string
  value: string
}

export interface FilterFieldConfig {
  field: string
  label?: string
  type: FilterType
  operator?: FilterOperator
  options?: FilterFieldOption[]
  placeholder?: string
}

// Base row shape required by the table (kept as a type to avoid exporting runtime schema)
type TableRowBase = {
  id: UniqueIdentifier
  header?: string
  type?: string
  status?: string
  target?: string
  limit?: string
  reviewer?: string
}

// Props interface cho DataTable
interface DataTableProps<T extends TableRowBase> {
  data: T[]
  columns?: ColumnDef<T>[]
  loading?: boolean
  // Pagination
  pagination?: {
    pageIndex: number
    pageSize: number
    totalPages?: number
    hasNext?: boolean
    hasPrevious?: boolean
    totalCount?: number
    onPageChange: (page: number) => void
    onPageSizeChange: (pageSize: number) => void
  }
  // Filtering
  filters?: FilterRule[]
  onFiltersChange?: (filters: FilterRule[]) => void
  onSortChange?: (sorts: { field: string; direction: SortDirection }[]) => void
  onSearchChange?: (search: SearchRule | undefined) => void
  // Selection
  selectable?: boolean
  onSelectionChange?: (selected: T[]) => void
  // Actions
  onRowClick?: (item: T) => void
  buttons?: TableButton<T>[]
  groupToolbarButtons?: boolean
  // Customization
  enableTabs?: boolean
  enableDragAndDrop?: boolean
  searchableColumns?: string[]
  filterableColumns?: string[]
  filterFields?: FilterFieldConfig[]
  primaryAction?: {
    label: React.ReactNode
    onClick: () => void
    icon?: React.ReactNode
  }
}

// Create a separate component for the drag handle
function DragHandle({ id }: { id: UniqueIdentifier }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

const defaultColumns: ColumnDef<TableRowBase>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "header",
    header: "Header",
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />
    },
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: "Section Type",
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.type ?? "Uncategorized"}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status ?? "Not Started"
      const isDone = status === "Done"

      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {isDone ? (
            <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
          ) : (
            <IconLoader />
          )}
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "target",
    header: () => <div className="w-full text-right">Target</div>,
    cell: ({ row }) => (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            loading: `Saving ${row.original.header}`,
            success: "Done",
            error: "Error",
          })
        }}
      >
        <Label htmlFor={`${row.original.id}-target`} className="sr-only">
          Target
        </Label>
        <Input
          className="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
          defaultValue={row.original.target ?? ""}
          id={`${row.original.id}-target`}
        />
      </form>
    ),
  },
  {
    accessorKey: "limit",
    header: () => <div className="w-full text-right">Limit</div>,
    cell: ({ row }) => (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            loading: `Saving ${row.original.header}`,
            success: "Done",
            error: "Error",
          })
        }}
      >
        <Label htmlFor={`${row.original.id}-limit`} className="sr-only">
          Limit
        </Label>
        <Input
          className="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
          defaultValue={row.original.limit ?? ""}
          id={`${row.original.id}-limit`}
        />
      </form>
    ),
  },
  {
    accessorKey: "reviewer",
    header: "Reviewer",
    cell: ({ row }) => {
      const reviewer = row.original.reviewer ?? "Assign reviewer"
      const isAssigned = reviewer !== "Assign reviewer"

      if (isAssigned) {
        return reviewer
      }

      return (
        <>
          <Label htmlFor={`${row.original.id}-reviewer`} className="sr-only">
            Reviewer
          </Label>
          <Select>
            <SelectTrigger
              className="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
              size="sm"
              id={`${row.original.id}-reviewer`}
            >
              <SelectValue placeholder="Assign reviewer" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
              <SelectItem value="Jamik Tashpulatov">
                Jamik Tashpulatov
              </SelectItem>
            </SelectContent>
          </Select>
        </>
      )
    },
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Make a copy</DropdownMenuItem>
          <DropdownMenuItem>Favorite</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

const DraggableRow = <T extends TableRowBase>({ row }: { row: Row<T> }) => {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

// Filter Panel Component
interface FilterPanelProps<T extends TableRowBase> {
  open: boolean
  onClose: () => void
  onApply: (filters: FilterRule[]) => void
  columns: ColumnDef<T>[]
  fields: FilterFieldConfig[]
  appliedFilters?: FilterRule[]
}

function FilterPanel<T extends TableRowBase>({
  open,
  onClose,
  onApply,
  columns,
  fields,
  appliedFilters,
}: FilterPanelProps<T>) {
  type FieldValue =
    | string
    | string[]
    | { min?: string; max?: string }
    | { from?: string; to?: string }

  const [fieldValues, setFieldValues] = React.useState<Record<string, FieldValue>>({})

  const fieldValuesEqual = React.useCallback(
    (first: Record<string, FieldValue>, second: Record<string, FieldValue>) => {
      const firstKeys = Object.keys(first)
      const secondKeys = Object.keys(second)

      if (firstKeys.length !== secondKeys.length) {
        return false
      }

      for (const key of firstKeys) {
        if (!(key in second)) {
          return false
        }

        const a = first[key]
        const b = second[key]

        if (typeof a === "string" || typeof b === "string") {
          if (a !== b) return false
          continue
        }

        const aIsArray = Array.isArray(a)
        const bIsArray = Array.isArray(b)
        if (aIsArray || bIsArray) {
          if (!aIsArray || !bIsArray) return false
          const arrayA = a as string[]
          const arrayB = b as string[]
          if (arrayA.length !== arrayB.length) return false
          for (let index = 0; index < arrayA.length; index += 1) {
            if (arrayA[index] !== arrayB[index]) return false
          }
          continue
        }

        if (a && b && typeof a === "object" && typeof b === "object") {
          const objectKeys = new Set([
            ...Object.keys(a as Record<string, unknown>),
            ...Object.keys(b as Record<string, unknown>),
          ])

          for (const objectKey of objectKeys) {
            if ((a as Record<string, unknown>)[objectKey] !== (b as Record<string, unknown>)[objectKey]) {
              return false
            }
          }
          continue
        }

        if (a !== b) {
          return false
        }
      }

      return true
    },
    []
  )

  const columnLabelMap = React.useMemo(() => {
    const map = new Map<string, string>()

    columns.forEach((col) => {
      const accessorKey = (col as ColumnDef<unknown> & { accessorKey?: string }).accessorKey
      const id = col.id
      const rawHeader = col.header

      const resolvedLabel =
        typeof rawHeader === "string"
          ? rawHeader
          : typeof accessorKey === "string"
            ? accessorKey
            : id ?? ""

      if (typeof accessorKey === "string") {
        map.set(accessorKey, resolvedLabel)
      }

      if (typeof id === "string" && !map.has(id)) {
        map.set(id, resolvedLabel)
      }
    })

    return map
  }, [columns])

  const defaultOperatorByType: Record<FilterType, FilterOperator> = {
    Text: "Contains",
    Number: "Equal",
    Date: "Equal",
    Enum: "Equal",
    MultiSelect: "Include",
    Range: "Between",
    DateRange: "Between",
  }

  React.useEffect(() => {
    if (!open) return

    if (!appliedFilters || appliedFilters.length === 0) {
      setFieldValues((previous) => (Object.keys(previous).length === 0 ? previous : {}))
      return
    }

    const nextValues: Record<string, FieldValue> = {}

    appliedFilters.forEach((filter) => {
      const field = filter.Field
      const fieldConfig = fields.find((config) => config.field === field)
      if (!fieldConfig) return

      switch (fieldConfig.type) {
        case "MultiSelect":
          if (Array.isArray(filter.Value)) {
            nextValues[field] = filter.Value as string[]
          }
          break
        case "Range":
          if (
            filter.Value &&
            typeof filter.Value === "object" &&
            ("Min" in (filter.Value as Record<string, unknown>) ||
              "Max" in (filter.Value as Record<string, unknown>))
          ) {
            const valueObject = filter.Value as Record<string, unknown>
            nextValues[field] = {
              min: valueObject.Min ? String(valueObject.Min) : "",
              max: valueObject.Max ? String(valueObject.Max) : "",
            }
          }
          break
        case "DateRange":
          if (
            filter.Value &&
            typeof filter.Value === "object" &&
            ("Min" in (filter.Value as Record<string, unknown>) ||
              "Max" in (filter.Value as Record<string, unknown>) ||
              "min" in (filter.Value as Record<string, unknown>) ||
              "max" in (filter.Value as Record<string, unknown>))
          ) {
            const valueObject = filter.Value as Record<string, unknown>
            const minValue = (valueObject.Min ?? valueObject.min) as string | undefined
            const maxValue = (valueObject.Max ?? valueObject.max) as string | undefined
            nextValues[field] = {
              from: minValue ?? "",
              to: maxValue ?? "",
            }
          }
          break
        case "Date":
          if (typeof filter.Value === "string") {
            nextValues[field] = filter.Value.slice(0, 10)
          }
          break
        default:
          if (filter.Value !== undefined && filter.Value !== null) {
            nextValues[field] = String(filter.Value)
          }
          break
      }
    })

    setFieldValues((previous) =>
      fieldValuesEqual(previous, nextValues) ? previous : nextValues
    )
  }, [appliedFilters, fieldValuesEqual, fields, open])

  const handleTextChange = (field: string, value: string) => {
    setFieldValues((previous) => {
      if (value.trim() === "") {
        const next = { ...previous }
        delete next[field]
        return next
      }
      return { ...previous, [field]: value }
    })
  }

  const handleNumberChange = (field: string, value: string) => {
    setFieldValues((previous) => {
      if (value === "") {
        const next = { ...previous }
        delete next[field]
        return next
      }
      return { ...previous, [field]: value }
    })
  }

  const handleDateChange = (field: string, value: string) => {
    setFieldValues((previous) => {
      if (value === "") {
        const next = { ...previous }
        delete next[field]
        return next
      }
      return { ...previous, [field]: value }
    })
  }

  const handleEnumChange = (field: string, value: string) => {
  if (!value) {
      setFieldValues((previous) => {
        const next = { ...previous }
        delete next[field]
        return next
      })
      return
    }

    setFieldValues((previous) => {
      return { ...previous, [field]: value }
    })
  }

  const handleMultiSelectToggle = (field: string, optionValue: string, checked: boolean) => {
    setFieldValues((previous) => {
      const current = Array.isArray(previous[field])
        ? (previous[field] as string[])
        : []

      const next = checked
        ? Array.from(new Set([...current, optionValue]))
        : current.filter((item) => item !== optionValue)

      if (next.length === 0) {
        const rest = { ...previous }
        delete rest[field]
        return rest
      }

      return { ...previous, [field]: next }
    })
  }

  const handleRangeChange = (field: string, bound: "min" | "max", value: string) => {
    setFieldValues((previous) => {
      const current = previous[field]
      const nextRange: { min?: string; max?: string } =
        current && typeof current === "object" && !Array.isArray(current)
          ? { ...(current as { min?: string; max?: string }) }
          : {}

      if (value === "") {
        delete nextRange[bound]
      } else {
        nextRange[bound] = value
      }

      if (!nextRange.min && !nextRange.max) {
        const rest = { ...previous }
        delete rest[field]
        return rest
      }

      return { ...previous, [field]: nextRange }
    })
  }

  const handleDateRangeChange = (field: string, range: DateRange | undefined) => {
    setFieldValues((previous) => {
      if (!range || (!range.from && !range.to)) {
        const next = { ...previous }
        delete next[field]
        return next
      }

      const next = { ...previous }

      next[field] = {
        from: range.from ? startOfDay(range.from).toISOString() : undefined,
        to: range.to ? endOfDay(range.to).toISOString() : undefined,
      }

      return next
    })
  }

  const buildFilterRule = (config: FilterFieldConfig, rawValue: FieldValue | undefined): FilterRule | undefined => {
    if (rawValue === undefined) return undefined

    const operator = config.operator ?? defaultOperatorByType[config.type]

    switch (config.type) {
      case "Text": {
        if (typeof rawValue !== "string" || rawValue.trim() === "") return undefined
        return {
          Field: config.field,
          Type: "Text",
          Operator: operator,
          Value: rawValue.trim(),
        }
      }
      case "Number": {
        if (typeof rawValue !== "string" || rawValue === "") return undefined
        const numericValue = Number(rawValue)
        if (Number.isNaN(numericValue)) return undefined
        return {
          Field: config.field,
          Type: "Number",
          Operator: operator,
          Value: numericValue,
        }
      }
      case "Date": {
        if (typeof rawValue !== "string" || rawValue === "") return undefined
        const isoDate = new Date(`${rawValue}T00:00:00.000Z`).toISOString()
        return {
          Field: config.field,
          Type: "Date",
          Operator: operator,
          Value: isoDate,
        }
      }
      case "Enum": {
        if (typeof rawValue !== "string" || rawValue === "") return undefined
        return {
          Field: config.field,
          Type: "Enum",
          Operator: operator,
          Value: rawValue,
        }
      }
      case "MultiSelect": {
        if (!Array.isArray(rawValue) || rawValue.length === 0) return undefined
        return {
          Field: config.field,
          Type: "MultiSelect",
          Operator: operator,
          Value: rawValue,
        }
      }
      case "Range": {
        if (
          !rawValue ||
          typeof rawValue !== "object" ||
          Array.isArray(rawValue)
        ) {
          return undefined
        }

        const { min, max } = rawValue as { min?: string; max?: string }
        if (min === undefined && max === undefined) return undefined

        const result: { Min?: number; Max?: number } = {}

        if (min !== undefined && min !== "") {
          const numericMin = Number(min)
          if (!Number.isNaN(numericMin)) {
            result.Min = numericMin
          }
        }

        if (max !== undefined && max !== "") {
          const numericMax = Number(max)
          if (!Number.isNaN(numericMax)) {
            result.Max = numericMax
          }
        }

        if (result.Min === undefined && result.Max === undefined) return undefined

        return {
          Field: config.field,
          Type: "Range",
          Operator: operator,
          Value: result,
        }
      }
      case "DateRange": {
        if (
          !rawValue ||
          typeof rawValue !== "object" ||
          Array.isArray(rawValue)
        ) {
          return undefined
        }

        const { from, to } = rawValue as { from?: string; to?: string }
        if (!from && !to) return undefined

        const result: { Min?: string; Max?: string } = {}

        if (from) {
          result.Min = new Date(from).toISOString()
        }

        if (to) {
          result.Max = new Date(to).toISOString()
        }

        if (!result.Min && !result.Max) return undefined

        return {
          Field: config.field,
          Type: "DateRange",
          Operator: operator,
          Value: result,
        }
      }
      default:
        return undefined
    }
  }

  const handleApply = () => {
    const filters: FilterRule[] = []

    fields.forEach((config) => {
      const rawValue = fieldValues[config.field]
      const rule = buildFilterRule(config, rawValue)
      if (rule) {
        filters.push(rule)
      }
    })

    onApply(filters)
  }

  const handleReset = () => {
    setFieldValues({})
    onApply([])
  }

  if (fields.length === 0) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[320px] max-w-full space-y-6 p-6 sm:w-[360px]">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Apply filters to narrow down your results
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-5">
          {fields.map((fieldConfig) => {
            const fieldLabel = fieldConfig.label ?? columnLabelMap.get(fieldConfig.field) ?? fieldConfig.field
            const controlId = `${fieldConfig.field}-filter`
            const currentValue = fieldValues[fieldConfig.field]

            switch (fieldConfig.type) {
              case "Number":
                return (
                  <div key={fieldConfig.field} className="grid gap-2">
                    <Label htmlFor={controlId}>{fieldLabel}</Label>
                    <Input
                      id={controlId}
                      type="number"
                      placeholder={fieldConfig.placeholder ?? `Filter by ${fieldLabel}`}
                      value={typeof currentValue === "string" ? currentValue : ""}
                      onChange={(event) => handleNumberChange(fieldConfig.field, event.target.value)}
                    />
                  </div>
                )
              case "Date":
                return (
                  <div key={fieldConfig.field} className="grid gap-2">
                    <Label htmlFor={controlId}>{fieldLabel}</Label>
                    <Input
                      id={controlId}
                      type="date"
                      value={typeof currentValue === "string" ? currentValue : ""}
                      onChange={(event) => handleDateChange(fieldConfig.field, event.target.value)}
                    />
                  </div>
                )
              case "DateRange": {
                const rangeValue: DateRange | undefined =
                  currentValue &&
                  typeof currentValue === "object" &&
                  !Array.isArray(currentValue)
                    ? {
                        from: (currentValue as { from?: string }).from
                          ? new Date((currentValue as { from?: string }).from as string)
                          : undefined,
                        to: (currentValue as { to?: string }).to
                          ? new Date((currentValue as { to?: string }).to as string)
                          : undefined,
                      }
                    : undefined

                return (
                  <div key={fieldConfig.field} className="grid gap-2">
                    <Label>{fieldLabel}</Label>
                    <DateRangePicker
                      value={rangeValue}
                      onChange={(nextRange) => handleDateRangeChange(fieldConfig.field, nextRange)}
                      className="h-9"
                      monthCount={1}
                    />
                  </div>
                )
              }
              case "Enum": {
                const comboItems = fieldConfig.options ?? []
                const comboValue = typeof currentValue === "string" ? currentValue : ""

                return (
                  <div key={fieldConfig.field} className="grid gap-2">
                    <Label htmlFor={controlId}>{fieldLabel}</Label>
                    <ComboBox
                      id={controlId}
                      items={comboItems}
                      value={comboValue}
                      onChange={(value) => {
                        handleEnumChange(fieldConfig.field, value)
                      }}
                      placeholder={fieldConfig.placeholder ?? `Filter by ${fieldLabel}`}
                    />
                  </div>
                )
              }
              case "MultiSelect":
                return (
                  <div key={fieldConfig.field} className="grid gap-2">
                    <Label>{fieldLabel}</Label>
                    <div className="grid gap-2">
                      {fieldConfig.options?.map((option) => {
                        const selectedValues = Array.isArray(currentValue) ? currentValue : []
                        const checked = selectedValues.includes(option.value)

                        return (
                          <label key={option.value} className="flex items-center gap-2 text-sm font-normal">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) =>
                                handleMultiSelectToggle(fieldConfig.field, option.value, value === true)
                              }
                            />
                            <span>{option.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              case "Range":
                return (
                  <div key={fieldConfig.field} className="grid gap-2">
                    <Label>{fieldLabel}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={
                          currentValue &&
                          typeof currentValue === "object" &&
                          !Array.isArray(currentValue) &&
                          "min" in currentValue
                            ? (currentValue as { min?: string }).min ?? ""
                            : ""
                        }
                        onChange={(event) =>
                          handleRangeChange(fieldConfig.field, "min", event.target.value)
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={
                          currentValue &&
                          typeof currentValue === "object" &&
                          !Array.isArray(currentValue) &&
                          "max" in currentValue
                            ? (currentValue as { max?: string }).max ?? ""
                            : ""
                        }
                        onChange={(event) =>
                          handleRangeChange(fieldConfig.field, "max", event.target.value)
                        }
                      />
                    </div>
                  </div>
                )
              default:
                return (
                  <div key={fieldConfig.field} className="grid gap-2">
                    <Label htmlFor={controlId}>{fieldLabel}</Label>
                    <Input
                      id={controlId}
                      placeholder={fieldConfig.placeholder ?? `Filter by ${fieldLabel}`}
                      value={typeof currentValue === "string" ? currentValue : ""}
                      onChange={(event) => handleTextChange(fieldConfig.field, event.target.value)}
                    />
                  </div>
                )
            }
          })}
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleApply}>
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

const createSelectionColumn = <T extends TableRowBase>(): ColumnDef<T> => ({
  id: "select",
  header: ({ table }) => (
    <div className="flex items-center justify-center">
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    </div>
  ),
  cell: ({ row }) => (
    <div className="flex items-center justify-center">
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    </div>
  ),
  enableSorting: false,
  enableHiding: false,
})

export function DataTable<T extends TableRowBase>({
  data: initialData,
  columns = defaultColumns as ColumnDef<T>[],
  loading = false,
  pagination,
  filters,
  onFiltersChange,
  onSortChange,
  onSearchChange,
  selectable = false,
  onSelectionChange,
  onRowClick,
  buttons,
  groupToolbarButtons = true,
  enableTabs = true,
  enableDragAndDrop = true,
  searchableColumns = [],
  filterableColumns = [],
  filterFields = [],
  primaryAction,
}: DataTableProps<T>) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [internalPagination, setInternalPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [searchKeyword, setSearchKeyword] = React.useState("")
  const [filterPanelOpen, setFilterPanelOpen] = React.useState(false)
  const [internalFilters, setInternalFilters] = React.useState<FilterRule[]>(() => filters ?? [])
  
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  React.useEffect(() => {
    if (filters !== undefined) {
      setInternalFilters(filters)
    }
  }, [filters])

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  const resolvedColumns = React.useMemo<ColumnDef<T>[]>(() => {
    if (selectable) {
      const hasSelectionColumn = columns.some((column) => column.id === "select")
      if (hasSelectionColumn) {
        return columns
      }
      return [createSelectionColumn<T>(), ...columns]
    }

    return columns.filter((column) => column.id !== "select")
  }, [columns, selectable])

  const resolveColumnLabel = React.useCallback(
    (field: string): string => {
      const candidate = columns.find((column) => {
        const accessorKey = (column as ColumnDef<unknown> & { accessorKey?: string }).accessorKey
        return accessorKey === field || column.id === field
      })

      if (!candidate) return field

      const rawHeader = candidate.header
      if (typeof rawHeader === "string") return rawHeader
      if (candidate.id) return candidate.id
      return field
    },
    [columns]
  )

  const resolvedFilterFields = React.useMemo<FilterFieldConfig[]>(() => {
    if (filterFields.length > 0) {
      return filterFields.map((field) => ({
        ...field,
        label: field.label ?? resolveColumnLabel(field.field),
      }))
    }

    if (filterableColumns.length > 0) {
      return filterableColumns.map((field) => ({
        field,
        label: resolveColumnLabel(field),
        type: "Text",
      }))
    }

    return []
  }, [filterFields, filterableColumns, resolveColumnLabel])

  const hasFilterControls = resolvedFilterFields.length > 0
  const currentFilters = filters !== undefined ? filters : internalFilters
  const activeFilterCount = currentFilters.length
  const hasActiveFilters = activeFilterCount > 0

  const resolvedPageCount = React.useMemo(() => {
    if (!pagination) return undefined
    if (typeof pagination.totalPages === "number") {
      return Math.max(pagination.totalPages, 1)
    }
    if (typeof pagination.totalCount === "number") {
      return Math.max(1, Math.ceil(pagination.totalCount / pagination.pageSize))
    }
    return undefined
  }, [pagination])

  // Use external pagination if provided, otherwise use internal
  const paginationState = pagination ? {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
  } : internalPagination

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: paginationState,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: selectable,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: pagination ? undefined : setInternalPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: !!pagination,
    manualSorting: !!onSortChange,
    pageCount: resolvedPageCount,
  })

  // Handle selection change
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original)
      onSelectionChange(selectedRows)
    }
    // Intentionally only depend on rowSelection and onSelectionChange to avoid
    // re-running when the `table` instance identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection, onSelectionChange])

  // Handle search with debounce
  const debounceRef = React.useRef<number | null>(null)
  React.useEffect(() => {
    if (searchableColumns.length === 0) return
    
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = window.setTimeout(() => {
      if (onSearchChange) {
        if (searchKeyword.trim()) {
          const searchRule: SearchRule = {
            Columns: searchableColumns,
            Keyword: searchKeyword.trim(),
          }
          onSearchChange(searchRule)
        } else {
          onSearchChange(undefined)
        }
      }
    }, 400)
    
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [searchKeyword, searchableColumns, onSearchChange])

  React.useEffect(() => {
    if (!onSortChange) return

    if (sorting.length === 0) {
      onSortChange([])
      return
    }

    const nextSorts: { field: string; direction: SortDirection }[] = sorting.map((sortItem) => ({
      field: sortItem.id,
      direction: sortItem.desc ? "Desc" : "Asc",
    }))

    onSortChange(nextSorts)
  }, [sorting, onSortChange])

  function handleDragEnd(event: DragEndEvent) {
    if (!enableDragAndDrop) return
    
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  function handleFiltersApply(nextFilters: FilterRule[]) {
    setFilterPanelOpen(false)
    if (filters === undefined) {
      setInternalFilters(nextFilters)
    }
    if (onFiltersChange) {
      onFiltersChange(nextFilters)
    }
  }

  const selectedRows = table.getSelectedRowModel().rows.map(row => row.original)

  const pageIndex = table.getState().pagination.pageIndex
  const totalPageCount = table.getPageCount()
  const selectedCount = table.getFilteredSelectedRowModel().rows.length
  const totalFilteredCount = table.getFilteredRowModel().rows.length

  const displayedPages = React.useMemo<(number | "ellipsis")[]>(() => {
    if (totalPageCount <= 0) return []
    if (totalPageCount <= 7) {
      return Array.from({ length: totalPageCount }, (_, index) => index)
    }

    const pages: (number | "ellipsis")[] = [0]
    const start = Math.max(1, pageIndex - 1)
    const end = Math.min(totalPageCount - 2, pageIndex + 1)

    if (start > 1) {
      pages.push("ellipsis")
    }

    for (let index = start; index <= end; index += 1) {
      pages.push(index)
    }

    if (end < totalPageCount - 2) {
      pages.push("ellipsis")
    }

    pages.push(totalPageCount - 1)
    return pages
  }, [pageIndex, totalPageCount])

  const handlePageChange = React.useCallback((nextIndex: number) => {
    const maxIndex = Math.max(totalPageCount - 1, 0)
    const target = Math.min(Math.max(nextIndex, 0), maxIndex)
    if (pagination) {
      pagination.onPageChange(target)
    } else {
      table.setPageIndex(target)
    }
  }, [pagination, table, totalPageCount])

  const handlePageSizeChange = React.useCallback((newSize: number) => {
    if (pagination) {
      pagination.onPageSizeChange(newSize)
    } else {
      table.setPageSize(newSize)
    }
  }, [pagination, table])

  const handlePreviousPage = React.useCallback(() => {
    if (!table.getCanPreviousPage()) return
    handlePageChange(pageIndex - 1)
  }, [handlePageChange, pageIndex, table])

  const handleNextPage = React.useCallback(() => {
    if (!table.getCanNextPage()) return
    handlePageChange(pageIndex + 1)
  }, [handlePageChange, pageIndex, table])

  const goToPage = React.useCallback((targetIndex: number) => {
    if (targetIndex === pageIndex) return
    handlePageChange(targetIndex)
  }, [handlePageChange, pageIndex])

  const tableContent = (
    <div className="flex flex-col gap-4">
      {/* Toolbar với search, filters và buttons */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {(() => {
            if (!buttons?.length) {
              return null
            }

            const mapVariant = (
              variant?: TableButton<T>["variant"],
            ): 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' => {
              if (variant === 'danger') return 'destructive'
              if (variant === 'primary') return 'default'
              if (variant === 'secondary') return 'secondary'
              if (variant === 'ghost') return 'ghost'
              return 'outline'
            }

            if (!groupToolbarButtons) {
              return buttons.map((button) => (
                <Button
                  key={button.key}
                  variant={mapVariant(button.variant)}
                  size="sm"
                  onClick={() => button.onClick?.(selectedRows)}
                  disabled={button.disabled?.(selectedRows)}
                >
                  {button.label}
                </Button>
              ))
            }

            const nonDangerButtons = buttons.filter((button) => button.variant !== 'danger')
            const dangerButtons = buttons.filter((button) => button.variant === 'danger')

            const primaryAction = nonDangerButtons[0]
            const secondaryActions = nonDangerButtons.slice(1)

            return (
              <>
                {primaryAction ? (
                  secondaryActions.length > 0 ? (
                    <SplitButton
                      key={`split-${primaryAction.key}`}
                      primaryAction={{
                        label: primaryAction.label,
                        onClick: () => primaryAction.onClick?.(selectedRows),
                        disabled: primaryAction.disabled?.(selectedRows),
                      }}
                      options={secondaryActions.map((button) => ({
                        key: button.key,
                        label: button.label,
                        onSelect: () => button.onClick?.(selectedRows),
                        disabled: button.disabled?.(selectedRows),
                        tone: button.variant === 'danger' ? 'destructive' : 'default',
                      }))}
                      variant={mapVariant(primaryAction.variant)}
                      size="sm"
                      className="shadow-none"
                    />
                  ) : (
                    <Button
                      key={primaryAction.key}
                      variant={mapVariant(primaryAction.variant)}
                      size="sm"
                      onClick={() => primaryAction.onClick?.(selectedRows)}
                      disabled={primaryAction.disabled?.(selectedRows)}
                    >
                      {primaryAction.label}
                    </Button>
                  )
                ) : null}

                {dangerButtons.map((button) => (
                  <Button
                    key={button.key}
                    variant={mapVariant(button.variant)}
                    size="sm"
                    onClick={() => button.onClick?.(selectedRows)}
                    disabled={button.disabled?.(selectedRows)}
                  >
                    {button.label}
                  </Button>
                ))}
              </>
            )
          })()}
        </div>
        
        <div className="flex items-center gap-2">
          {searchableColumns.length > 0 && (
            <div className="relative">
              <IconSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-8 w-48"
              />
            </div>
          )}
          
          {hasFilterControls && (
            <Button
              variant={hasActiveFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterPanelOpen(true)}
              className="gap-2"
            >
              <IconFilter className="h-4 w-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns className="h-4 w-4 mr-2" />
                Columns
                <IconChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {primaryAction && (
            <Button
              variant="outline"
              size="sm"
              onClick={primaryAction.onClick}
              className="gap-2"
            >
              {primaryAction.icon ?? <IconPlus className="h-4 w-4" />}
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        {enableDragAndDrop ? (
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-gray-50/70 text-xs uppercase tracking-wide text-gray-700/80 backdrop-blur-sm dark:bg-gray-900/80 dark:text-gray-200/80">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead 
                          key={header.id} 
                          colSpan={header.colSpan}
                          className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          {header.column.getCanSort() && (
                            <span className="ml-1">
                              {header.column.getIsSorted() === "asc" ? "↑" : 
                               header.column.getIsSorted() === "desc" ? "↓" : "↕"}
                            </span>
                          )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {loading ? (
                  Array.from({ length: Math.min(table.getState().pagination.pageSize, 5) }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      {resolvedColumns.map((_, colIndex) => (
                        <TableCell key={`skeleton-cell-${index}-${colIndex}`} className="h-12">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={resolvedColumns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-gray-50/70 text-xs uppercase tracking-wide text-gray-700/80 backdrop-blur-sm dark:bg-gray-900/80 dark:text-gray-200/80">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead 
                        key={header.id} 
                        colSpan={header.colSpan}
                        className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {header.column.getCanSort() && (
                          <span className="ml-1">
                            {header.column.getIsSorted() === "asc" ? "↑" : 
                             header.column.getIsSorted() === "desc" ? "↓" : "↕"}
                          </span>
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
{loading ? (
                Array.from({ length: Math.min(table.getState().pagination.pageSize, 5) }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    {resolvedColumns.map((_, colIndex) => (
                      <TableCell key={`skeleton-cell-${index}-${colIndex}`} className="h-12">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={onRowClick ? "cursor-pointer" : ""}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={resolvedColumns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 border-t border-border/70 bg-background/95 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="hidden text-xs text-muted-foreground sm:block">
          {selectedCount} of {totalFilteredCount} selected
        </div>
        <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="rows-per-page" className="text-xs font-medium sm:text-sm">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => handlePageSizeChange(Number(value))}
            >
              <SelectTrigger size="sm" className="w-[92px]" id="rows-per-page">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs font-medium text-muted-foreground sm:text-sm">
            Page {pageIndex + 1} of {Math.max(totalPageCount, 1)}
          </div>
          <Pagination className="w-full justify-center sm:w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault()
                    handlePreviousPage()
                  }}
                  className="px-2"
                />
              </PaginationItem>
              {displayedPages.map((item, index) => {
                if (item === "ellipsis") {
                  return (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )
                }

                const isActive = item === pageIndex
                return (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href="#"
                      isActive={isActive}
                      onClick={(event) => {
                        event.preventDefault()
                        goToPage(item)
                      }}
                    >
                      {item + 1}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault()
                    handleNextPage()
                  }}
                  className="px-2"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )

  if (!enableTabs) {
    return (
      <>
        {tableContent}
        {hasFilterControls && (
          <FilterPanel<T>
            open={filterPanelOpen}
            onClose={() => setFilterPanelOpen(false)}
            onApply={handleFiltersApply}
            columns={resolvedColumns}
            fields={resolvedFilterFields}
            appliedFilters={currentFilters}
          />
        )}
      </>
    )
  }

  return (
    <>
      <Tabs
        defaultValue="outline"
        className="w-full flex-col justify-start gap-6"
      >
        <div className="flex items-center justify-between px-4 lg:px-6">
          <Label htmlFor="view-selector" className="sr-only">
            View
          </Label>
          <Select defaultValue="outline">
            <SelectTrigger
              className="flex w-fit @4xl/main:hidden"
              size="sm"
              id="view-selector"
            >
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="outline">Outline</SelectItem>
              <SelectItem value="past-performance">Past Performance</SelectItem>
              <SelectItem value="key-personnel">Key Personnel</SelectItem>
              <SelectItem value="focus-documents">Focus Documents</SelectItem>
            </SelectContent>
          </Select>
          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger value="outline">Outline</TabsTrigger>
            <TabsTrigger value="past-performance">
              Past Performance <Badge variant="secondary">3</Badge>
            </TabsTrigger>
            <TabsTrigger value="key-personnel">
              Key Personnel <Badge variant="secondary">2</Badge>
            </TabsTrigger>
            <TabsTrigger value="focus-documents">Focus Documents</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="outline" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
          {tableContent}
        </TabsContent>
        
        <TabsContent value="past-performance" className="flex flex-col px-4 lg:px-6">
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
        </TabsContent>
        
        <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
        </TabsContent>
        
        <TabsContent value="focus-documents" className="flex flex-col px-4 lg:px-6">
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
        </TabsContent>
      </Tabs>
      
      {hasFilterControls && (
        <FilterPanel<T>
          open={filterPanelOpen}
          onClose={() => setFilterPanelOpen(false)}
          onApply={handleFiltersApply}
          columns={resolvedColumns}
          fields={resolvedFilterFields}
          appliedFilters={currentFilters}
        />
      )}
    </>
  )
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function TableCellViewer({ item }: { item: TableRowBase }) {
  const isMobile = useIsMobile()
  const headerTitle = item.header ?? "Untitled item"
  const typeValue = item.type ?? "Table of Contents"
  const statusValue = item.status ?? "Not Started"
  const targetValue = item.target ?? ""
  const limitValue = item.limit ?? ""
  const reviewerValue = item.reviewer ?? "Assign reviewer"

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {headerTitle}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{headerTitle}</DrawerTitle>
          <DrawerDescription>
            Showing total visitors for the last 6 months
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="mobile"
                    type="natural"
                    fill="var(--color-mobile)"
                    fillOpacity={0.6}
                    stroke="var(--color-mobile)"
                    stackId="a"
                  />
                  <Area
                    dataKey="desktop"
                    type="natural"
                    fill="var(--color-desktop)"
                    fillOpacity={0.4}
                    stroke="var(--color-desktop)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  Trending up by 5.2% this month{" "}
                  <IconTrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Showing total visitors for the last 6 months. This is just
                  some random text to test the layout. It spans multiple lines
                  and should wrap around.
                </div>
              </div>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="header">Header</Label>
              <Input id="header" defaultValue={headerTitle} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="type">Type</Label>
                <Select defaultValue={typeValue}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Table of Contents">
                      Table of Contents
                    </SelectItem>
                    <SelectItem value="Executive Summary">
                      Executive Summary
                    </SelectItem>
                    <SelectItem value="Technical Approach">
                      Technical Approach
                    </SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Capabilities">Capabilities</SelectItem>
                    <SelectItem value="Focus Documents">
                      Focus Documents
                    </SelectItem>
                    <SelectItem value="Narrative">Narrative</SelectItem>
                    <SelectItem value="Cover Page">Cover Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={statusValue}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Done">Done</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="target">Target</Label>
                <Input id="target" defaultValue={targetValue} />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="limit">Limit</Label>
                <Input id="limit" defaultValue={limitValue} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="reviewer">Reviewer</Label>
              <Select defaultValue={reviewerValue}>
                <SelectTrigger id="reviewer" className="w-full">
                  <SelectValue placeholder="Select a reviewer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
                  <SelectItem value="Jamik Tashpulatov">
                    Jamik Tashpulatov
                  </SelectItem>
                  <SelectItem value="Emily Whalen">Emily Whalen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}