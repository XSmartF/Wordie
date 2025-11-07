import * as React from "react"

import { useIsMobile } from "@/shared/hooks/use-mobile"
import { cn } from "@/shared/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet"

export interface ResponsiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  desktopContentClassName?: string
  desktopBodyClassName?: string
  mobileContentClassName?: string
  mobileBodyClassName?: string
  mobileSide?: "top" | "right" | "bottom" | "left"
  headerClassName?: string
}

export const ResponsiveDialog: React.FC<ResponsiveDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  desktopContentClassName,
  desktopBodyClassName,
  mobileContentClassName,
  mobileBodyClassName,
  mobileSide = "bottom",
  headerClassName,
}) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side={mobileSide}
          className={cn(
            "h-[90vh] max-h-[90vh] overflow-hidden px-0",
            mobileContentClassName,
          )}
        >
          <SheetHeader className={cn("px-4 pt-6", headerClassName)}>
            <SheetTitle>{title}</SheetTitle>
            {description ? (
              <SheetDescription>{description}</SheetDescription>
            ) : null}
          </SheetHeader>
          <div
            className={cn(
              "flex-1 overflow-y-auto px-4 pb-6",
              "flex flex-col gap-4",
              mobileBodyClassName,
            )}
          >
            {children}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-lg", desktopContentClassName)}>
        <DialogHeader className={headerClassName}>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {desktopBodyClassName ? (
          <div className={desktopBodyClassName}>{children}</div>
        ) : (
          children
        )}
      </DialogContent>
    </Dialog>
  )
}

ResponsiveDialog.displayName = "ResponsiveDialog"
