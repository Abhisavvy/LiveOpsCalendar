'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle, Download, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useCsvProcessor } from '../hooks/useCsvProcessor'
import { useBatchImport } from '../hooks/useBatchImport'
import { useImportWizard } from '../hooks/useImportWizard'
import { useEventStore } from '../hooks/useEventStore'
import { commitImportAppend, commitImportReplace } from '../lib/import-commit'
import { BatchImportProgress } from './BatchImportProgress'
import { ImportWizardShell } from './ImportWizardShell'
import { ImportValidatePanel } from './ImportValidatePanel'
import { ImportReviewPanel } from './ImportReviewPanel'
import { ReplaceConfirmDialog } from './ReplaceConfirmDialog'
import { TemplateSelector } from './TemplateSelector'

// File size threshold for batch processing (2MB)
const BATCH_PROCESSING_THRESHOLD = 2 * 1024 * 1024

interface CsvDropzoneProps {
  className?: string
}

export function CsvDropzone({ className }: CsvDropzoneProps) {
  const [useBatchProcessing, setUseBatchProcessing] = useState(false)
  const { toast } = useToast()

  const { isProcessing, error, processFile, downloadSample, clearResult } = useCsvProcessor()
  const batchImport = useBatchImport()
  const wizard = useImportWizard()

  const addMultipleEvents = useEventStore(state => state.addMultipleEvents)
  const replaceCalendarWithImported = useEventStore(state => state.replaceCalendarWithImported)
  const existingCount = useEventStore(state => state.events.length)

  const batchInProgress = ['initializing', 'processing', 'completing'].includes(batchImport.state.status)
  const isAnyProcessing = isProcessing || batchInProgress

  const pendingResult = wizard.state.pending?.result
  const validateSummary = useMemo(() => {
    if (pendingResult) {
      return {
        totalRows: pendingResult.totalRows,
        successfulRows: pendingResult.successfulRows,
        errors: pendingResult.errors,
      }
    }

    return {
      totalRows: batchImport.state.progress.total,
      successfulRows: batchImport.state.results.successful,
      errors: batchImport.state.results.errors,
    }
  }, [pendingResult, batchImport.state])

  const downloadErrorsHandler = useMemo(() => {
    if (validateSummary.errors.length === 0) return undefined
    return () => downloadErrorReport(validateSummary.errors)
  }, [validateSummary.errors])

  const resetWizard = useCallback(() => {
    clearResult()
    batchImport.resetState()
    setUseBatchProcessing(false)
    wizard.dispatch({ type: 'RESET' })
  }, [batchImport, clearResult, wizard])

  const handleCommit = useCallback(() => {
    if (!wizard.previewEvents.length) {
      toast({
        title: 'No events to commit',
        description: 'Import results are empty.',
        variant: 'destructive',
      })
      return
    }

    if (wizard.state.appendReplace === 'replace' && existingCount > 0) {
      wizard.dispatch({ type: 'OPEN_REPLACE_CONFIRM' })
      return
    }

    try {
      commitImportAppend(wizard.previewEvents, { addMultipleEvents })
      toast({
        title: 'Import completed',
        description: `Added ${wizard.previewEvents.length} events to the calendar.`,
      })
      resetWizard()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to commit import'
      toast({
        title: 'Commit failed',
        description: message,
        variant: 'destructive',
      })
    }
  }, [addMultipleEvents, existingCount, resetWizard, toast, wizard])

  const handleConfirmReplace = useCallback(() => {
    try {
      commitImportReplace(wizard.previewEvents, { replaceCalendarWithImported })
      toast({
        title: 'Import completed',
        description: `Replaced calendar with ${wizard.previewEvents.length} imported events.`,
      })
      resetWizard()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to replace events'
      toast({
        title: 'Commit failed',
        description: message,
        variant: 'destructive',
      })
    }
  }, [replaceCalendarWithImported, resetWizard, toast, wizard.previewEvents])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      wizard.dispatch({ type: 'START_FILE' })

      if (file.size >= BATCH_PROCESSING_THRESHOLD) {
        setUseBatchProcessing(true)
        try {
          const batchResult = await batchImport.importFile(file)
          wizard.dispatch({ type: 'SET_PENDING_BATCH', result: batchResult })
        } catch (err) {
          console.error('Batch import failed:', err)
          resetWizard()
          toast({
            title: 'Batch import failed',
            description: err instanceof Error ? err.message : 'Failed to import file',
            variant: 'destructive',
          })
        }
      } else {
        setUseBatchProcessing(false)
        try {
          const syncResult = await processFile(file)
          if (syncResult) {
            wizard.dispatch({ type: 'SET_PENDING_SYNC', result: syncResult })
          } else {
            wizard.dispatch({ type: 'RESET' })
          }
        } catch (err) {
          console.error('CSV processing failed:', err)
          wizard.dispatch({ type: 'RESET' })
        }
      }
    },
    [batchImport, processFile, resetWizard, toast, wizard]
  )

  const handleCancel = useCallback(() => {
    if (batchInProgress) {
      batchImport.cancelImport()
    }
    resetWizard()
  }, [batchImport, batchInProgress, resetWizard])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isAnyProcessing || wizard.state.step !== 'upload',
  })

  return (
    <div className={cn('space-y-4', className)}>
      {wizard.state.step === 'upload' && (
        <>
          <div
            {...getRootProps()}
            className={cn(
              'relative cursor-pointer rounded-lg border-2 border-dashed p-6 transition-colors',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50',
              isAnyProcessing && 'pointer-events-none opacity-50'
            )}
          >
            <input {...getInputProps({ 'aria-label': 'Upload CSV file' })} />
            <div className="flex flex-col items-center justify-center text-center">
              {isAnyProcessing ? (
                <>
                  <div className="mb-2 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">
                    {useBatchProcessing ? 'Initializing batch processing...' : 'Processing CSV...'}
                  </p>
                </>
              ) : (
                <>
                  <div className="relative mb-2">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <Badge
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 bg-blue-600"
                      title="Supports batch processing for large files"
                    >
                      <Zap className="h-3 w-3" />
                    </Badge>
                  </div>
                  <p className="mb-1 text-sm font-medium">
                    {isDragActive ? 'Drop CSV file here' : 'Click to upload or drag CSV file'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports .csv files up to 10MB with max 10,000 rows
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <Zap className="inline h-3 w-3 mr-1" />
                    Large files (≥2MB) use high-performance batch processing
                  </p>
                </>
              )}
            </div>
          </div>

          {fileRejections.length > 0 && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">File Rejected</span>
              </div>
              {fileRejections.map((rejection, index) => (
                <div key={index} className="text-xs text-destructive/80">
                  {rejection.file.name}: {rejection.errors.map(e => e.message).join(', ')}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Processing Error</span>
              </div>
              <p className="text-xs text-destructive/80">{error}</p>
            </div>
          )}

          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Need help formatting?</span>
              </div>
              <Button size="sm" variant="outline" onClick={downloadSample} disabled={isAnyProcessing}>
                <Download className="h-4 w-4 mr-1" />
                Download Template
              </Button>
            </div>
            <TemplateSelector className="w-full" />
          </div>
        </>
      )}

      {wizard.state.step === 'validate' && (
        <ImportWizardShell step="validate">
          <div className="space-y-4">
            {useBatchProcessing && (
              <BatchImportProgress state={batchImport.state} onCancel={handleCancel} />
            )}

            <ImportValidatePanel
              totalRows={validateSummary.totalRows}
              successfulRows={validateSummary.successfulRows}
              errors={validateSummary.errors}
              isProcessing={isAnyProcessing}
              onCancel={handleCancel}
              {...(downloadErrorsHandler ? { onDownloadErrors: downloadErrorsHandler } : {})}
            />
          </div>
        </ImportWizardShell>
      )}

      {wizard.state.step === 'review' && (
        <>
          <ImportWizardShell step="review">
            <ImportReviewPanel
              events={wizard.previewEvents}
              existingCount={existingCount}
              appendReplace={wizard.state.appendReplace}
              onAppendReplaceChange={(value) => wizard.dispatch({ type: 'SET_APPEND_REPLACE', value })}
              onBack={resetWizard}
              onCommit={handleCommit}
            />
          </ImportWizardShell>

          <ReplaceConfirmDialog
            open={wizard.state.replaceConfirmOpen}
            existingCount={existingCount}
            onOpenChange={(open) =>
              wizard.dispatch({ type: open ? 'OPEN_REPLACE_CONFIRM' : 'CLOSE_REPLACE_CONFIRM' })
            }
            onConfirm={handleConfirmReplace}
          />
        </>
      )}
    </div>
  )
}

function downloadErrorReport(errors: Array<{ row: number; column?: string; message: string; rawValue?: string }>) {
  const headers = ['Row', 'Column', 'Error', 'Raw Value']
  const rows = errors.map(error => [
    error.row.toString(),
    error.column || '',
    error.message,
    error.rawValue || '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'csv-import-errors.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
