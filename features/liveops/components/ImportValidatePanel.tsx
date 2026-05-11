'use client'

import { AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { CsvProcessingError } from '../types/events'
import { cn } from '@/lib/utils'

interface ImportValidatePanelProps {
  totalRows: number
  successfulRows: number
  errors: CsvProcessingError[]
  isProcessing?: boolean
  onContinue?: () => void
  onCancel?: () => void
  onDownloadErrors?: () => void
  className?: string
}

export function ImportValidatePanel({
  totalRows,
  successfulRows,
  errors,
  isProcessing = false,
  onContinue,
  onCancel,
  onDownloadErrors,
  className,
}: ImportValidatePanelProps) {
  const hasErrors = errors.length > 0
  const canContinue = successfulRows > 0 && !isProcessing

  return (
    <div className={cn('space-y-4', className)}>
      <div aria-live="polite" className="flex flex-wrap gap-2">
        <Badge variant="outline">{totalRows} rows</Badge>
        <Badge className="bg-green-600 text-white">{successfulRows} valid</Badge>
        {hasErrors && <Badge className="bg-yellow-500 text-white">{errors.length} errors</Badge>}
      </div>

      {hasErrors && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4" />
            Validation issues detected
          </div>
          <ul className="mt-2 space-y-1 text-xs text-yellow-800">
            {errors.slice(0, 3).map((error, index) => (
              <li key={`${error.row}-${index}`}>
                Row {error.row}: {error.message}{error.column ? ` (${error.column})` : ''}
              </li>
            ))}
            {errors.length > 3 && (
              <li className="text-yellow-700">...and {errors.length - 3} more</li>
            )}
          </ul>
          {onDownloadErrors && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadErrors}
              className="mt-2"
            >
              Download error report
            </Button>
          )}
        </div>
      )}

      {!hasErrors && !isProcessing && (
        <div className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" />
          All rows validated successfully.
        </div>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {onContinue && (
          <Button onClick={onContinue} disabled={!canContinue}>
            Continue to review
          </Button>
        )}
      </div>
    </div>
  )
}
