'use client'

import React from 'react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, CheckCircle, Clock, Cpu, FileText, Pause, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BatchImportState, BatchImportStatus } from '../hooks/useBatchImport'

interface BatchImportProgressProps {
  state: BatchImportState
  onCancel?: () => void
  onClose?: () => void
  className?: string
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
}

function getStatusIcon(status: BatchImportStatus) {
  switch (status) {
    case 'initializing':
      return <Clock className="h-4 w-4 animate-pulse" />
    case 'processing':
      return <Cpu className="h-4 w-4 animate-pulse" />
    case 'completing':
      return <CheckCircle className="h-4 w-4 animate-pulse text-green-600" />
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-600" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

function getStatusLabel(status: BatchImportStatus): string {
  switch (status) {
    case 'idle': return 'Ready'
    case 'initializing': return 'Initializing...'
    case 'processing': return 'Processing'
    case 'completing': return 'Finalizing...'
    case 'completed': return 'Completed'
    case 'error': return 'Error'
    default: return 'Unknown'
  }
}

function getStatusColor(status: BatchImportStatus): string {
  switch (status) {
    case 'processing': return 'bg-blue-500'
    case 'completing': return 'bg-green-500' 
    case 'completed': return 'bg-green-600'
    case 'error': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

export function BatchImportProgress({ 
  state, 
  onCancel, 
  onClose, 
  className 
}: BatchImportProgressProps) {
  const { status, progress, results, performance, file } = state
  const isActive = ['initializing', 'processing', 'completing'].includes(status)
  const isComplete = status === 'completed'
  const hasErrors = results.errors.length > 0

  const estimatedTimeRemaining = performance.estimatedCompletion 
    ? Math.max(0, performance.estimatedCompletion - Date.now())
    : 0

  return (
    <Card className={cn('w-full max-w-2xl', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(status)}
            <div>
              <CardTitle className="text-lg">
                Batch Import {getStatusLabel(status)}
              </CardTitle>
              {file && (
                <CardDescription>
                  {file.name} • {formatFileSize(file.size)}
                </CardDescription>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={isComplete ? "default" : "secondary"}>
              {getStatusLabel(status)}
            </Badge>
            
            {onClose && (isComplete || status === 'error') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        {(isActive || isComplete) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span className="font-mono">
                {progress.processed.toLocaleString()} / {progress.total.toLocaleString()} rows
                {progress.totalBatches > 0 && (
                  <span className="text-muted-foreground ml-2">
                    (Batch {progress.currentBatch}/{progress.totalBatches})
                  </span>
                )}
              </span>
            </div>
            
            <Progress 
              value={progress.percentage} 
              className="h-2"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress.percentage}% complete</span>
              {estimatedTimeRemaining > 0 && (
                <span>~{formatTime(estimatedTimeRemaining)} remaining</span>
              )}
            </div>
          </div>
        )}

        {/* Results Section */}
        {(results.successful > 0 || results.failed > 0) && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-green-50 border">
                <div className="text-2xl font-bold text-green-600">
                  {results.successful.toLocaleString()}
                </div>
                <div className="text-sm text-green-700">Successful</div>
              </div>
              
              <div className="text-center p-3 rounded-lg bg-red-50 border">
                <div className="text-2xl font-bold text-red-600">
                  {results.failed.toLocaleString()}
                </div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
            </div>
          </>
        )}

        {/* Performance Metrics */}
        {(isActive || isComplete) && performance.eventsPerSecond > 0 && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Processing Speed</div>
                <div className="text-muted-foreground">
                  {Math.round(performance.eventsPerSecond)} events/sec
                </div>
              </div>
              
              <div>
                <div className="font-medium">Elapsed Time</div>
                <div className="text-muted-foreground">
                  {formatTime(performance.elapsedTime)}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Error Summary */}
        {hasErrors && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-700">Recent Errors</span>
              </div>
              
              <div className="max-h-32 overflow-y-auto space-y-1">
                {results.errors.slice(0, 5).map((error, index) => (
                  <div 
                    key={index}
                    className="text-xs bg-red-50 border border-red-200 rounded p-2"
                  >
                    <div className="font-medium">
                      Row {error.row}
                      {error.column && <span className="ml-1">({error.column})</span>}
                    </div>
                    <div className="text-red-700">{error.message}</div>
                  </div>
                ))}
                
                {results.errors.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center py-1">
                    ... and {results.errors.length - 5} more errors
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <div className="flex items-center gap-2">
            {isActive && onCancel && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onCancel}
                className="flex items-center gap-2"
              >
                <Pause className="h-4 w-4" />
                Cancel Import
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isComplete && (
              <Badge variant="outline" className="text-green-700">
                Import Complete
              </Badge>
            )}
            
            {status === 'error' && (
              <Badge variant="outline" className="text-red-700">
                Import Failed
              </Badge>
            )}
          </div>
        </div>

        {/* Progress Bar Animation */}
        {isActive && (
          <div className="relative">
            <div 
              className={cn(
                "absolute top-0 left-0 h-1 rounded-full transition-all duration-300",
                getStatusColor(status)
              )}
              style={{
                width: `${progress.percentage}%`,
                animation: 'pulse 2s infinite'
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}