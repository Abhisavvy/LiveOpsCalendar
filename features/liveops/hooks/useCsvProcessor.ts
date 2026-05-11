'use client'

import { useState, useCallback } from 'react'
import { processCsvFile, generateSampleCsv } from '../lib/csv-processor'
import { CsvProcessingResult } from '../types/events'
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
  }, [toast])

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
    } catch {
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