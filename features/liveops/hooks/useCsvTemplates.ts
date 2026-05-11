'use client'

import { useState, useCallback } from 'react'
import { AdvancedCsvGenerator } from '../services/AdvancedCsvGenerator'
import type { TemplateType } from '../config/ExcelTemplates'
import { useToast } from '@/hooks/use-toast'

export interface CsvTemplateState {
  isGenerating: boolean
  error: string | null
}

export interface UseCsvTemplatesReturn {
  state: CsvTemplateState
  generateCsvTemplate: (templateType: TemplateType) => string
  downloadCsvTemplate: (templateType: TemplateType, customName?: string) => void
  getCsvTemplateInfo: (templateType: TemplateType) => ReturnType<typeof AdvancedCsvGenerator.getTemplateInfo>
  getAllCsvTemplates: () => Record<TemplateType, ReturnType<typeof AdvancedCsvGenerator.getTemplateInfo>>
  resetState: () => void
}

const initialState: CsvTemplateState = {
  isGenerating: false,
  error: null,
}

/**
 * Hook for managing CSV template generation and download
 */
export function useCsvTemplates(): UseCsvTemplatesReturn {
  const [state, setState] = useState<CsvTemplateState>(initialState)
  const { toast } = useToast()

  const updateState = useCallback((updates: Partial<CsvTemplateState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const resetState = useCallback(() => {
    setState(initialState)
  }, [])

  /**
   * Generate CSV template content as string
   */
  const generateCsvTemplate = useCallback((templateType: TemplateType): string => {
    updateState({ isGenerating: true, error: null })

    try {
      const csv = AdvancedCsvGenerator.generateTemplate(templateType)
      updateState({ isGenerating: false })
      return csv
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate CSV template'
      updateState({ isGenerating: false, error: errorMessage })
      throw error
    }
  }, [updateState])

  /**
   * Generate and download CSV template
   */
  const downloadCsvTemplate = useCallback((templateType: TemplateType, customName?: string): void => {
    updateState({ isGenerating: true, error: null })

    try {
      const config = AdvancedCsvGenerator.getTemplateInfo(templateType)
      if (!config) {
        throw new Error(`Template type "${templateType}" not found`)
      }

      // Generate CSV content
      const csv = AdvancedCsvGenerator.generateTemplate(templateType)
      
      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Generate filename
      const fileName = customName 
        ? customName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
        : config.filename
      
      link.download = `${fileName}.csv`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Cleanup
      URL.revokeObjectURL(url)

      updateState({ isGenerating: false })

      toast({
        title: "CSV Template Downloaded",
        description: `${config.name} CSV template has been downloaded successfully.`,
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download CSV template'
      updateState({ isGenerating: false, error: errorMessage })
      
      toast({
        title: "Download Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [updateState, toast])

  /**
   * Get template information for display
   */
  const getCsvTemplateInfo = useCallback((templateType: TemplateType) => {
    return AdvancedCsvGenerator.getTemplateInfo(templateType)
  }, [])

  /**
   * Get all available templates
   */
  const getAllCsvTemplates = useCallback(() => {
    return AdvancedCsvGenerator.getAllTemplates()
  }, [])

  return {
    state,
    generateCsvTemplate,
    downloadCsvTemplate,
    getCsvTemplateInfo,
    getAllCsvTemplates,
    resetState,
  }
}