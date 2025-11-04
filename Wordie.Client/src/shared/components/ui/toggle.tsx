"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"

import { cn } from "@/shared/lib/utils"
import { toggleVariants, type ToggleVariantProps } from "./toggle-variants"

type ToggleProps = React.ComponentProps<typeof TogglePrimitive.Root> &
  ToggleVariantProps

function Toggle({
  className,
  variant,
  size,
  ...props
}: ToggleProps) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Toggle }
export type { ToggleProps }
