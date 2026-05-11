'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ReplaceConfirmDialogProps {
  open: boolean
  existingCount: number
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ReplaceConfirmDialog({
  open,
  existingCount,
  onOpenChange,
  onConfirm,
}: ReplaceConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Replace all events?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove {existingCount} existing event{existingCount === 1 ? '' : 's'} and
            replace them with the imported events. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground">
            Replace all events
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
