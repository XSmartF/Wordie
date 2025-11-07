import * as React from "react"

import { cn } from "@/shared/lib/utils"

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  attached?: boolean
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, attached = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="button-group"
        className={cn(
          "inline-flex items-stretch",
          attached &&
            "*:data-[slot=button]:rounded-none *:data-[slot=button]:first:rounded-l-md *:data-[slot=button]:last:rounded-r-md *:data-[slot=button]+*:data-[slot=button]:-ml-px",
          className,
        )}
        {...props}
      />
    )
  },
)

ButtonGroup.displayName = "ButtonGroup"

export { ButtonGroup }
