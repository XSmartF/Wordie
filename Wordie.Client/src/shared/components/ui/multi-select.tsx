"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command"
import { Checkbox } from "@/shared/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover"

export interface MultiSelectOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  maxBadgeCount?: number
  disabled?: boolean
  emptyMessage?: string
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options",
  searchPlaceholder = "Search...",
  className,
  maxBadgeCount = 3,
  disabled = false,
  emptyMessage = "No results found.",
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const selectedOptions = React.useMemo(
    () => options.filter((option) => value.includes(option.value)),
    [options, value]
  )

  const handleToggle = React.useCallback(
    (optionValue: string) => {
      if (value.includes(optionValue)) {
        onChange(value.filter((val) => val !== optionValue))
      } else {
        onChange([...value, optionValue])
      }
    },
    [onChange, value]
  )

  const handleClear = React.useCallback(() => {
    onChange([])
  }, [onChange])

  const renderedBadges = React.useMemo(() => {
    if (selectedOptions.length === 0) return null

    const visibleItems = selectedOptions.slice(0, maxBadgeCount)
    const remaining = selectedOptions.length - visibleItems.length

    return (
      <div className="flex flex-1 flex-wrap items-center gap-1">
        {visibleItems.map((option) => (
          <Badge key={option.value} variant="secondary" className="flex items-center gap-1">
            {option.label}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-4 p-0"
              onClick={(event) => {
                event.stopPropagation()
                handleToggle(option.value)
              }}
            >
              <XIcon className="size-3" />
              <span className="sr-only">Remove {option.label}</span>
            </Button>
          </Badge>
        ))}
        {remaining > 0 && (
          <Badge variant="outline">+{remaining} more</Badge>
        )}
      </div>
    )
  }, [handleToggle, maxBadgeCount, selectedOptions])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between gap-2",
            selectedOptions.length === 0 && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {selectedOptions.length > 0 ? (
            renderedBadges
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
  <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = value.includes(option.value)

                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    onSelect={() => handleToggle(option.value)}
                  >
                    <div className="flex w-full items-center gap-2">
                      <Checkbox
                        checked={isSelected}
                        aria-hidden="true"
                        tabIndex={-1}
                        disabled={option.disabled}
                        onCheckedChange={() => handleToggle(option.value)}
                      />
                      <div className="flex flex-1 flex-col text-sm">
                        <span className="font-medium leading-none">
                          {option.label}
                        </span>
                        {option.description && (
                          <span className="text-muted-foreground text-xs">
                            {option.description}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <CheckIcon className="size-4 text-primary" />
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
          {selectedOptions.length > 0 && (
            <div className="border-t p-2">
              <Button variant="ghost" size="sm" className="w-full" onClick={handleClear}>
                Clear selection
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
