import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/shared/lib/utils"
import { buttonVariants, type ButtonVariantProps } from "./button-variants"

type ButtonProps = React.ComponentPropsWithoutRef<"button"> &
  ButtonVariantProps & {
    asChild?: boolean
  }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button }
export type { ButtonProps }
