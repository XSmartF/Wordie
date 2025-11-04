import * as React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog"
import { cn } from "@/shared/lib/utils"

export interface ConfirmDialogProps {
  open: boolean
  title: React.ReactNode
  description?: React.ReactNode
  confirmLabel?: string
  loadingLabel?: string
  cancelLabel?: string
  confirmLoading?: boolean
  confirmDisabled?: boolean
  confirmClassName?: string
  onConfirm: () => void
  onOpenChange?: (open: boolean) => void
  tone?: "default" | "danger"
  children?: React.ReactNode
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  loadingLabel,
  cancelLabel = "Cancel",
  confirmLoading = false,
  confirmDisabled = false,
  confirmClassName,
  onConfirm,
  onOpenChange,
  tone = "default",
  children,
}: ConfirmDialogProps) {
  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      onOpenChange?.(next)
    },
    [onOpenChange]
  )

  const handleConfirm = React.useCallback(() => {
    if (confirmDisabled || confirmLoading) return
    onConfirm()
  }, [confirmDisabled, confirmLoading, onConfirm])

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        {children ? <div className="mt-2 text-sm text-muted-foreground">{children}</div> : null}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => handleOpenChange(false)} disabled={confirmLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={confirmLoading || confirmDisabled}
            className={cn(
              tone === "danger" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined,
              confirmClassName
            )}
          >
            {confirmLoading ? loadingLabel ?? confirmLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmDialog
