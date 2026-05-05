'use client'

import { useState, useCallback } from 'react'
import { processCsvFile, generateSampleCsv } from '../lib/csv-processor'
import { CsvProcessingResult } from '../types/events'
import { useEventStore } from './useEventStore'
import { useToast } from '@/hooks/use-toast'

interface CsvProcessorState {
  isProcessing: boolean
  result: CsvProcessingResult | null
  error: string | null
}

export function useCsvProcessor() {
  const [state, setState] = useState<CsvProcessorState>({
    isProcessing: false,
    result: null,
    error: null,
  })
  
  const importFromCSV = useEventStore(state => state.importFromCSV)
  const { toast } = useToast()

  const processFile = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }))
    
    try {
      const result = await processCsvFile(file)
      
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        result,
        error: null 
      }))
      
      // Show results toast
      if (result.errors.length === 0) {
        toast({
          title: "CSV Import Successful",
          description: `Successfully imported ${result.successfulRows} events from ${result.totalRows} rows.`,
        })
        
        // Import events into store
        importFromCSV(result)
      } else if (result.successfulRows > 0) {
        toast({
          title: "CSV Import Completed with Warnings",
          description: `Imported ${result.successfulRows} events. ${result.errors.length} rows had errors.`,
          variant: "default",
        })
        
        // Import successful events into store
        importFromCSV(result)
      } else {
        toast({
          title: "CSV Import Failed",
          description: `No events could be imported. ${result.errors.length} errors found.`,
          variant: "destructive",
        })
      }
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: errorMessage 
      }))
      
      toast({
        title: "CSV Processing Error",
        description: errorMessage,
        variant: "destructive",
      })
      
      return null
    }
  }, [importFromCSV, toast])

  const downloadSample = useCallback(() => {
    try {
      const csvContent = generateSampleCsv()
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', 'liveops-events-template.csv')
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        toast({
          title: "Sample Downloaded",
          description: "CSV template has been downloaded to your computer.",
        })
      } else {
        throw new Error('Download not supported in this browser')
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download sample CSV template.",
        variant: "destructive",
      })
    }
  }, [toast])

  const clearResult = useCallback(() => {
    setState(prev => ({ ...prev, result: null, error: null }))
  }, [])

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      result: null,
      error: null,
    })
  }, [])

  return {
    ...state,
    processFile,
    downloadSample,
    clearResult,
    reset,
  }
}