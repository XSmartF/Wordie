"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import { Calendar } from "@/shared/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover"

export interface DateRangePickerProps {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  placeholder?: string
  disabled?: React.ComponentProps<typeof Calendar>["disabled"]
  className?: string
  min?: Date
  max?: Date
  monthCount?: number
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  disabled,
  className,
  min,
  max,
  monthCount = 2,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const clampedMonthCount = React.useMemo(() => {
    if (Number.isNaN(monthCount) || monthCount < 1) return 1
    return Math.min(Math.floor(monthCount), 3)
  }, [monthCount])

  const label = React.useMemo(() => {
    if (value?.from && value?.to) {
      return `${format(value.from, "PPP")} - ${format(value.to, "PPP")}`
    }
    if (value?.from) {
      return format(value.from, "PPP")
    }
    return placeholder
  }, [placeholder, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={(range) => {
            onChange(range)
            if (range?.from && range?.to) {
              setOpen(false)
            }
          }}
          disabled={disabled}
          fromDate={min}
          toDate={max}
          numberOfMonths={clampedMonthCount}
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  )
}
