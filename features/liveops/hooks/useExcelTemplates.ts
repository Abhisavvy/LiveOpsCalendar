'use client'

import { useState, useCallback } from 'react'
import { useExcelLibrary } from './useExcelLibrary'
import { ExcelTemplateBuilder } from '../services/ExcelTemplateBuilder'
import { EXCEL_TEMPLATES, type TemplateType } from '../config/ExcelTemplates'
import { useToast } from '@/hooks/use-toast'

export interface ExcelTemplateGenerationState {
  isGenerating: boolean
  progress: number
  currentStep: string
  error: string | null
}

export interface UseExcelTemplatesReturn {
  state: ExcelTemplateGenerationState
  isLibraryReady: boolean
  generateTemplate: (templateType: TemplateType, customName?: string) => Promise<ArrayBuffer>
  downloadTemplate: (templateType: TemplateType, customName?: string) => Promise<void>
  getTemplatePreview: (templateType: TemplateType) => {
    config: typeof EXCEL_TEMPLATES[TemplateType]
    metadata: ReturnType<typeof ExcelTemplateBuilder.getTemplateMetadata>
  }
  reset: () => void
}

const initialState: ExcelTemplateGenerationState = {
  isGenerating: false,
  progress: 0,
  currentStep: '',
  error: null,
}

/**
 * Hook for generating and downloading Excel templates with loading states
 */
export function useExcelTemplates(): UseExcelTemplatesReturn {
  const [state, setState] = useState<ExcelTemplateGenerationState>(initialState)
  const { state: libraryState, loadExcel } = useExcelLibrary()
  const { toast } = useToast()

  const updateState = useCallback((updates: Partial<ExcelTemplateGenerationState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  const isLibraryReady = libraryState.status === 'loaded' && libraryState.module !== null

  /**
   * Generate Excel template buffer
   */
  const generateTemplate = useCallback(async (
    templateType: TemplateType, 
    customName?: string
  ): Promise<ArrayBuffer> => {
    updateState({
      isGenerating: true,
      progress: 0,
      currentStep: 'Loading Excel library...',
      error: null,
    })

    try {
      // Step 1: Load Excel library if not already loaded
      updateState({ progress: 10, currentStep: 'Loading Excel library...' })
      const excelJS = await loadExcel()

      // Step 2: Get template configuration
      updateState({ progress: 20, currentStep: 'Loading template configuration...' })
      const templateConfig = EXCEL_TEMPLATES[templateType as keyof typeof EXCEL_TEMPLATES]
      if (!templateConfig) {
        throw new Error(`Template type "${templateType}" not found`)
      }

      // Apply custom name if provided
      const config = customName 
        ? { ...templateConfig, name: customName }
        : templateConfig

      // Step 3: Initialize template builder
      updateState({ progress: 30, currentStep: 'Initializing Excel template builder...' })
      const builder = new ExcelTemplateBuilder(excelJS)

      // Step 4: Build worksheets
      updateState({ progress: 50, currentStep: 'Creating worksheets and formatting...' })
      
      // Add some delay to show progress for better UX
      await new Promise(resolve => setTimeout(resolve, 200))
      
      updateState({ progress: 70, currentStep: 'Adding data validation and formulas...' })
      await new Promise(resolve => setTimeout(resolve, 200))

      // Step 5: Generate final template
      updateState({ progress: 90, currentStep: 'Generating Excel file...' })
      const buffer = await builder.buildTemplate(config)

      updateState({ 
        progress: 100, 
        currentStep: 'Template generated successfully!',
        isGenerating: false,
      })

      return buffer

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      updateState({
        isGenerating: false,
        progress: 0,
        currentStep: '',
        error: errorMessage,
      })
      throw error
    }
  }, [loadExcel, updateState])

  /**
   * Generate and download Excel template
   */
  const downloadTemplate = useCallback(async (
    templateType: TemplateType, 
    customName?: string
  ): Promise<void> => {
    try {
      const buffer = await generateTemplate(templateType, customName)
      
      // Create blob and download
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Generate filename
      const templateConfig = EXCEL_TEMPLATES[templateType as keyof typeof EXCEL_TEMPLATES]
      const fileName = (customName || templateConfig?.name || 'template')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase()
      
      link.download = `${fileName}_template.xlsx`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Cleanup
      URL.revokeObjectURL(url)

      toast({
        title: "Template Downloaded",
        description: `${templateConfig?.name || 'Template'} template has been downloaded successfully.`,
      })

      // Reset state after successful download
      setTimeout(reset, 1000)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download template'
      
      toast({
        title: "Download Error",
        description: errorMessage,
        variant: "destructive",
      })

      throw error
    }
  }, [generateTemplate, toast, reset])

  /**
   * Get template preview information without generating
   */
  const getTemplatePreview = useCallback((templateType: TemplateType) => {
    const config = EXCEL_TEMPLATES[templateType]
    if (!config) {
      throw new Error(`Template type "${templateType}" not found`)
    }

    const metadata = ExcelTemplateBuilder.getTemplateMetadata(config)
    
    return {
      config,
      metadata,
    }
  }, [])

  return {
    state,
    isLibraryReady,
    generateTemplate,
    downloadTemplate,
    getTemplatePreview,
    reset,
  }
}