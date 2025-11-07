import * as React from "react"
import { IconChevronDown } from "@tabler/icons-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import type { ButtonVariantProps } from "@/shared/components/ui/button-variants"
import { ButtonGroup } from "@/shared/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"

export type SplitButtonOption = {
  key: string
  label: React.ReactNode
  onSelect: () => void
  disabled?: boolean
  icon?: React.ReactNode
  tone?: "default" | "destructive"
  shortcut?: string
}

export interface SplitButtonProps {
  primaryAction: {
    label: React.ReactNode
    onClick: () => void
    disabled?: boolean
    icon?: React.ReactNode
  }
  options: SplitButtonOption[]
  variant?: ButtonVariantProps["variant"]
  size?: ButtonVariantProps["size"]
  align?: "start" | "center" | "end"
  className?: string
  menuClassName?: string
  triggerAriaLabel?: string
}

export const SplitButton: React.FC<SplitButtonProps> = ({
  primaryAction,
  options,
  variant = "default",
  size = "default",
  align = "end",
  className,
  menuClassName,
  triggerAriaLabel = "Hiển thị thêm hành động",
}) => {
  const hasOptions = options.length > 0
  const allOptionsDisabled = hasOptions && options.every((option) => option.disabled)

  return (
    <ButtonGroup
      data-slot="split-button"
      className={cn(
        "inline-flex items-stretch overflow-hidden rounded-md",
        variant === "default" || variant === "destructive"
          ? "shadow-sm"
          : "border border-border shadow-sm",
        className,
      )}
    >
      <Button
        variant={variant}
        size={size}
        onClick={primaryAction.onClick}
        disabled={primaryAction.disabled}
        className={cn(
          "rounded-none first:rounded-l-md",
          hasOptions ? "border-r border-border" : "last:rounded-r-md",
        )}
      >
        {primaryAction.icon ? (
          <span className="inline-flex items-center justify-center">{primaryAction.icon}</span>
        ) : null}
        <span>{primaryAction.label}</span>
      </Button>

      {hasOptions ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={variant}
              size={size}
              aria-label={triggerAriaLabel}
              disabled={primaryAction.disabled && allOptionsDisabled}
              className={cn(
                "rounded-none last:rounded-r-md px-2",
                variant === "default"
                  ? "border-l border-white/30 dark:border-white/15"
                  : variant === "destructive"
                    ? "border-l border-destructive-foreground/40"
                    : "border-l border-border",
              )}
              data-slot="split-button-trigger"
            >
              <IconChevronDown className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={align}
            className={cn("min-w-48 p-1", menuClassName)}
          >
            {options.map((option) => (
              <DropdownMenuItem
                key={option.key}
                disabled={option.disabled}
                onSelect={() => {
                  option.onSelect()
                }}
                variant={option.tone === "destructive" ? "destructive" : "default"}
                className={cn("gap-2", option.shortcut ? "justify-between" : "")}
              >
                <div className="flex flex-1 items-center gap-2">
                  {option.icon ? (
                    <span className="inline-flex size-4 items-center justify-center text-muted-foreground">
                      {option.icon}
                    </span>
                  ) : null}
                  <span className="flex-1 truncate text-left">{option.label}</span>
                </div>
                {option.shortcut ? (
                  <span className="text-muted-foreground text-xs">
                    {option.shortcut}
                  </span>
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </ButtonGroup>
  )
}

SplitButton.displayName = "SplitButton"
