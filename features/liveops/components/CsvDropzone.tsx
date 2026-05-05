'use client'

import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCsvProcessor } from '../hooks/useCsvProcessor'
import { cn } from '@/lib/utils'

interface CsvDropzoneProps {
  className?: string
}

export function CsvDropzone({ className }: CsvDropzoneProps) {
  const { 
    isProcessing, 
    result, 
    error, 
    processFile, 
    downloadSample, 
    clearResult 
  } = useCsvProcessor()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        await processFile(acceptedFiles[0]!)
      }
    },
    [processFile]
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isProcessing,
  })

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          "relative cursor-pointer rounded-lg border-2 border-dashed p-6 transition-colors",
          isDragActive 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          isProcessing && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center">
          {isProcessing ? (
            <>
              <div className="mb-2 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Processing CSV...</p>
            </>
          ) : (
            <>
              <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
              <p className="mb-1 text-sm font-medium">
                {isDragActive ? 'Drop CSV file here' : 'Click to upload or drag CSV file'}
              </p>
              <p className="text-xs text-muted-foreground">
                Supports .csv files up to 10MB with max 10,000 rows
              </p>
            </>
          )}
        </div>
      </div>

      {/* File Rejections */}
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

      {/* Processing Error */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Processing Error</span>
          </div>
          <p className="text-xs text-destructive/80">{error}</p>
        </div>
      )}

      {/* Processing Results */}
      {result && (
        <div className="space-y-3">
          {/* Success Summary */}
          {result.successfulRows > 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Import Successful
                </span>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300">
                Successfully imported {result.successfulRows} of {result.totalRows} events
              </p>
            </div>
          )}

          {/* Errors Summary */}
          {result.errors.length > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    {result.errors.length} Row Error{result.errors.length === 1 ? '' : 's'}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadErrorReport(result.errors)}
                  className="h-6 px-2 text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download Report
                </Button>
              </div>
              
              {/* Show first few errors */}
              <div className="space-y-1 text-xs text-yellow-700 dark:text-yellow-300">
                {result.errors.slice(0, 3).map((error, index) => (
                  <div key={index}>
                    Row {error.row}: {error.message}
                    {error.column && ` (${error.column})`}
                  </div>
                ))}
                {result.errors.length > 3 && (
                  <div className="text-yellow-600 dark:text-yellow-400">
                    ... and {result.errors.length - 3} more errors
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Clear Results Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={clearResult}
            className="text-xs"
          >
            Clear Results
          </Button>
        </div>
      )}

      {/* Sample Download */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Need help formatting?</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={downloadSample}
          disabled={isProcessing}
        >
          <Download className="h-4 w-4 mr-1" />
          Download Template
        </Button>
      </div>
    </div>
  )
}

/**
 * Download error report as CSV
 */
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