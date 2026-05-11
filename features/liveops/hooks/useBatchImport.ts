'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { 
  LiveOpsEvent, 
  CsvProcessingError
} from '../types/events'
import type {
  BatchProcessorMessage,
  ProcessFilePayload,
  ProgressPayload,
  CompletePayload
} from '../workers/csv-batch-processor'

export type BatchImportStatus = 
  | 'idle' 
  | 'initializing' 
  | 'processing' 
  | 'completing' 
  | 'completed' 
  | 'error'

export interface BatchImportState {
  status: BatchImportStatus
  progress: {
    processed: number
    total: number
    percentage: number
    currentBatch: number
    totalBatches: number
  }
  results: {
    successful: number
    failed: number
    errors: CsvProcessingError[]
  }
  performance: {
    startTime?: number
    estimatedCompletion?: number
    eventsPerSecond: number
    elapsedTime: number
  }
  file?: {
    name: string
    size: number
  }
}

export interface BatchImportResult {
  success: boolean
  events: LiveOpsEvent[]
  errors: CsvProcessingError[]
  totalRows: number
  successfulRows: number
  performance: {
    totalTime: number
    averageEventsPerSecond: number
    memoryUsage?: number
  }
}

export interface UseBatchImportReturn {
  state: BatchImportState
  importFile: (file: File) => Promise<BatchImportResult>
  cancelImport: () => void
  resetState: () => void
}

const initialState: BatchImportState = {
  status: 'idle',
  progress: {
    processed: 0,
    total: 0,
    percentage: 0,
    currentBatch: 0,
    totalBatches: 0,
  },
  results: {
    successful: 0,
    failed: 0,
    errors: [],
  },
  performance: {
    eventsPerSecond: 0,
    elapsedTime: 0,
  },
}

export function useBatchImport(): UseBatchImportReturn {
  const [state, setState] = useState<BatchImportState>(initialState)
  const workerRef = useRef<Worker | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { toast } = useToast()

  // Initialize worker on mount
  useEffect(() => {
    // Create worker dynamically to avoid SSR issues
    const createWorker = () => {
      try {
        workerRef.current = new Worker(
          new URL('../workers/csv-batch-processor.ts', import.meta.url),
          { type: 'module' }
        )
        return true
      } catch (error) {
        console.error('Failed to create Web Worker:', error)
        return false
      }
    }

    // Only create worker in browser environment
    if (typeof window !== 'undefined' && 'Worker' in window) {
      createWorker()
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])

  const updateState = useCallback((updates: Partial<BatchImportState>) => {
    setState(prev => ({
      ...prev,
      ...updates,
      progress: updates.progress ? { ...prev.progress, ...updates.progress } : prev.progress,
      results: updates.results ? { ...prev.results, ...updates.results } : prev.results,
      performance: updates.performance ? { ...prev.performance, ...updates.performance } : prev.performance,
    }))
  }, [])

  const resetState = useCallback(() => {
    setState(initialState)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const cancelImport = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    if (workerRef.current) {
      workerRef.current.terminate()
      // Recreate worker for future use
      workerRef.current = new Worker(
        new URL('../workers/csv-batch-processor.ts', import.meta.url),
        { type: 'module' }
      )
    }
    
    updateState({ 
      status: 'idle',
      progress: initialState.progress,
      results: initialState.results,
    })
    
    toast({
      title: "Import Cancelled",
      description: "The batch import has been cancelled.",
    })
  }, [updateState, toast])

  const importFile = useCallback(async (file: File): Promise<BatchImportResult> => {
    // Validate prerequisites
    if (!workerRef.current) {
      const error = 'Web Worker not available. Large file processing is not supported in this environment.'
      toast({
        title: "Import Error", 
        description: error,
        variant: "destructive",
      })
      throw new Error(error)
    }

    if (state.status !== 'idle') {
      throw new Error('Import already in progress')
    }

    // Create abort controller for cancellation support
    abortControllerRef.current = new AbortController()

    // Initialize state
    updateState({
      status: 'initializing',
      file: { name: file.name, size: file.size },
      progress: { ...initialState.progress },
      results: { ...initialState.results },
      performance: { ...initialState.performance },
    })

    return new Promise<BatchImportResult>((resolve, reject) => {
      const worker = workerRef.current
      if (!worker) {
        reject(new Error('Web Worker not available'))
        return
      }
      const importStartTime = Date.now()

      // Set up worker message handling
      const handleWorkerMessage = (event: MessageEvent<BatchProcessorMessage>) => {
        const { type, payload } = event.data

        // Check if import was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          worker.removeEventListener('message', handleWorkerMessage)
          reject(new Error('Import cancelled'))
          return
        }

        switch (type) {
          case 'PROGRESS':
            const progressData = payload as ProgressPayload
            const now = Date.now()
            updateState({
              status: 'processing',
              progress: {
                processed: progressData.processed,
                total: progressData.total,
                percentage: Math.round((progressData.processed / progressData.total) * 100),
                currentBatch: progressData.currentBatch,
                totalBatches: progressData.totalBatches,
              },
              results: {
                successful: progressData.batchResults.successful,
                failed: progressData.batchResults.failed,
                errors: progressData.batchResults.errors,
              },
              performance: {
                startTime: progressData.performance.startTime,
                estimatedCompletion: progressData.performance.estimatedCompletion,
                eventsPerSecond: progressData.performance.eventsPerSecond,
                elapsedTime: now - importStartTime,
              },
            })
            break

          case 'BATCH_COMPLETE':
            // Batch completion is handled by progress updates
            // Could add additional batch-specific logic here if needed
            break

          case 'COMPLETE':
            worker.removeEventListener('message', handleWorkerMessage)
            updateState({ status: 'completing' })
            
            const completeData = payload as CompletePayload

            updateState({ status: 'completed' })

            const result: BatchImportResult = {
              success: true,
              events: completeData.events,
              errors: completeData.errors,
              totalRows: completeData.totalRows,
              successfulRows: completeData.successfulRows,
              performance: completeData.performance,
            }

            resolve(result)
            break

          case 'ERROR':
            worker.removeEventListener('message', handleWorkerMessage)
            updateState({ status: 'error' })
            const errorMessage = (
              typeof payload === 'object' &&
              payload !== null &&
              'message' in payload &&
              typeof (payload as { message?: unknown }).message === 'string'
            )
              ? (payload as { message: string }).message
              : 'Unknown processing error'
            toast({
              title: "Import Error",
              description: errorMessage,
              variant: "destructive",
            })
            reject(new Error(errorMessage))
            break
        }
      }

      worker.addEventListener('message', handleWorkerMessage)

      // Handle worker errors
      const handleWorkerError = (error: ErrorEvent) => {
        worker.removeEventListener('message', handleWorkerMessage)
        worker.removeEventListener('error', handleWorkerError)
        updateState({ status: 'error' })
        const errorMessage = `Worker error: ${error.message}`
        toast({
          title: "Import Error",
          description: errorMessage,
          variant: "destructive",
        })
        reject(new Error(errorMessage))
      }

      worker.addEventListener('error', handleWorkerError)

      // Read file and start processing
      const reader = new FileReader()
      reader.onload = (e) => {
        const fileContent = e.target?.result as string
        const payload: ProcessFilePayload = {
          fileContent,
          fileName: file.name,
          fileSize: file.size,
        }

        worker.postMessage({
          type: 'PROCESS_FILE',
          payload,
        })
      }

      reader.onerror = () => {
        worker.removeEventListener('message', handleWorkerMessage)
        worker.removeEventListener('error', handleWorkerError)
        updateState({ status: 'error' })
        const errorMessage = 'Failed to read file'
        toast({
          title: "Import Error",
          description: errorMessage,
          variant: "destructive",
        })
        reject(new Error(errorMessage))
      }

      reader.readAsText(file)
    })
  }, [state.status, updateState, toast])

  return {
    state,
    importFile,
    cancelImport,
    resetState,
  }
}