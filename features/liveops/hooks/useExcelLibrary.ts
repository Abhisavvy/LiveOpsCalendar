'use client'

import { useLazyImport, type LazyImportState } from './useLazyImport'

// Excel library types (permissive interface for ExcelJS compatibility)
export interface ExcelWorkbook {
  [key: string]: unknown // Allow unknown properties for ExcelJS compatibility
  addWorksheet(name: string, options?: Record<string, unknown>): ExcelWorksheet
  xlsx: {
    writeBuffer(): Promise<ArrayBuffer>
    load(buffer: ArrayBuffer): Promise<void>
  }
}

export interface ExcelWorksheet {
  [key: string]: unknown // Allow unknown properties for ExcelJS compatibility
  name: string
  addRow(values: unknown[]): ExcelRow
  getRow(rowNumber: number): ExcelRow
  getCell(cell: string): ExcelCell
  columns: unknown[]
  addTable?: (tableRef: Record<string, unknown>) => void
  addDataValidation?: (validation: Record<string, unknown>) => void
  addConditionalFormatting?: (config: Record<string, unknown>) => void
}

export interface ExcelRow {
  [key: string]: unknown // Allow unknown properties for ExcelJS compatibility
  values: unknown[]
  getCell(colNumber: number): ExcelCell
  commit?: () => void
}

export interface ExcelCell {
  [key: string]: unknown // Allow unknown properties for ExcelJS compatibility
  value: unknown
  font?: Record<string, unknown>
  fill?: Record<string, unknown>
  border?: Record<string, unknown>
  alignment?: Record<string, unknown>
}

export interface ExcelJS {
  Workbook: new () => ExcelWorkbook
}

export type ExcelLibraryStatus = 'idle' | 'loading' | 'loaded' | 'error'

export interface UseExcelLibraryReturn {
  state: LazyImportState<ExcelJS>
  ExcelJS: ExcelJS | null
  loadExcel: () => Promise<ExcelJS>
  createWorkbook: () => Promise<ExcelWorkbook>
  isSupported: boolean
}

/**
 * Hook for lazy loading ExcelJS library with Excel-specific utilities
 */
export function useExcelLibrary(): UseExcelLibraryReturn {
  // Dynamic import for ExcelJS
  const {
    state,
    load: loadExcelJS,
  } = useLazyImport<ExcelJS>(
    async () => {
      const exceljs = await import('exceljs')
      // Transform the imported module to match our interface
      return {
        Workbook: exceljs.Workbook as unknown as ExcelJS['Workbook'], // Type assertion for compatibility
      } as ExcelJS
    },
    'exceljs',
    {
      retryCount: 3,
      retryDelay: 1000,
      preload: false, // Don't preload by default - load on demand
      fallback: null,
    }
  )

  // Check if Excel features are supported in current environment
  const isSupported = typeof window !== 'undefined' && 
    'ArrayBuffer' in window && 
    'Blob' in window &&
    'FileReader' in window

  const createWorkbook = async (): Promise<ExcelWorkbook> => {
    const ExcelJS = await loadExcelJS()
    return new ExcelJS.Workbook()
  }

  return {
    state,
    ExcelJS: state.module,
    loadExcel: loadExcelJS,
    createWorkbook,
    isSupported,
  }
}