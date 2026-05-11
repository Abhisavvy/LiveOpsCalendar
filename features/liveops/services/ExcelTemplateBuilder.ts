'use client'

import type { 
  ExcelJS, 
  ExcelWorkbook, 
  ExcelWorksheet, 
  ExcelCell 
} from '../hooks/useExcelLibrary'

// Excel styling constants
export const EXCEL_COLORS = {
  PRIMARY: 'FF3B82F6',       // Blue
  SUCCESS: 'FF10B981',       // Green  
  WARNING: 'FFF59E0B',       // Orange
  DANGER: 'FFEF4444',        // Red
  MUTED: 'FF6B7280',         // Gray
  BACKGROUND: 'FFF9FAFB',    // Light gray
  WHITE: 'FFFFFFFF',
  BLACK: 'FF000000',
} as const

export const EXCEL_FONTS = {
  HEADER: { bold: true, size: 12, color: { argb: EXCEL_COLORS.BLACK } },
  SUBHEADER: { bold: true, size: 10, color: { argb: EXCEL_COLORS.MUTED } },
  BODY: { size: 10, color: { argb: EXCEL_COLORS.BLACK } },
  FORMULA: { italic: true, size: 9, color: { argb: EXCEL_COLORS.PRIMARY } },
} as const

export const EXCEL_BORDERS = {
  THIN: {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  },
  THICK: {
    top: { style: 'thick' },
    left: { style: 'thick' },
    bottom: { style: 'thick' },
    right: { style: 'thick' },
  },
} as const

export type ExcelCellValue = string | number | boolean | Date | null

export interface ExcelColumnDefinition {
  key: string
  header: string
  width?: number
  type?: 'text' | 'number' | 'date' | 'boolean' | 'formula' | 'dropdown'
  validation?: ExcelValidationRule
  format?: string
  defaultValue?: ExcelCellValue
  description?: string
  required?: boolean
}

export interface ExcelValidationRule {
  type: 'list' | 'whole' | 'decimal' | 'date' | 'time' | 'textLength' | 'custom'
  operator?: 'between' | 'notBetween' | 'equal' | 'notEqual' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual'
  formula1?: string
  formula2?: string
  allowBlank?: boolean
  showInputMessage?: boolean
  promptTitle?: string
  prompt?: string
  showErrorMessage?: boolean
  errorTitle?: string
  error?: string
  errorStyle?: 'stop' | 'warning' | 'information'
}

export interface ExcelTemplateConfig {
  name: string
  description?: string
  worksheets: ExcelWorksheetConfig[]
  metadata?: Record<string, unknown>
}

export interface ExcelWorksheetConfig {
  name: string
  description?: string
  columns: ExcelColumnDefinition[]
  sampleRows?: number
  protectSheet?: boolean
  freezePanes?: { row?: number; column?: number }
  formulas?: Array<{
    cell: string
    formula: string
    description?: string
  }>
}

export interface ExcelTemplateMetadata {
  version: string
  createdAt: string
  description: string
  author: string
  columns: number
  expectedRows: number
  validationRules: number
  formulas: number
}

interface ExcelValidationPayload {
  type: ExcelValidationRule['type']
  allowBlank: boolean
  showInputMessage: boolean
  promptTitle: string
  prompt: string
  showErrorMessage: boolean
  errorTitle: string
  error: string
  errorStyle: ExcelValidationRule['errorStyle']
  formulae?: string[]
  operator?: ExcelValidationRule['operator']
}

/**
 * Advanced Excel template builder with expert-level features
 */
export class ExcelTemplateBuilder {
  private workbook: ExcelWorkbook | null = null
  private excelJS: ExcelJS | null = null

  constructor(excelJS: ExcelJS) {
    this.excelJS = excelJS
    this.workbook = new excelJS.Workbook()
    
    // Set workbook properties
    this.workbook.creator = 'LiveOps Event Calendar'
    this.workbook.lastModifiedBy = 'LiveOps System'
    this.workbook.created = new Date()
    this.workbook.modified = new Date()
  }

  /**
   * Build a complete Excel template from configuration
   */
  async buildTemplate(config: ExcelTemplateConfig): Promise<ArrayBuffer> {
    if (!this.workbook) {
      throw new Error('Excel workbook not initialized')
    }

    // Add metadata worksheet
    this.addMetadataWorksheet(config)

    // Create each configured worksheet
    for (const worksheetConfig of config.worksheets) {
      await this.createWorksheet(worksheetConfig)
    }

    // Generate final buffer
    return await this.workbook.xlsx.writeBuffer()
  }

  /**
   * Create a worksheet with advanced features
   */
  private async createWorksheet(config: ExcelWorksheetConfig): Promise<ExcelWorksheet> {
    if (!this.workbook) {
      throw new Error('Excel workbook not initialized')
    }

    const worksheet = this.workbook.addWorksheet(config.name)

    // Configure columns
    this.setupColumns(worksheet, config.columns)

    // Add headers with styling
    this.addHeaderRow(worksheet, config.columns)

    // Add sample data rows if requested
    if (config.sampleRows && config.sampleRows > 0) {
      this.addSampleRows(worksheet, config.columns, config.sampleRows)
    }

    // Apply data validation
    this.applyDataValidation(worksheet, config.columns)

    // Add formulas
    if (config.formulas) {
      this.addFormulas(worksheet, config.formulas)
    }

    // Apply conditional formatting
    this.applyConditionalFormatting(worksheet, config.columns)

    // Freeze panes if configured
    if (config.freezePanes) {
      worksheet.views = [{
        state: 'frozen',
        xSplit: config.freezePanes.column || 0,
        ySplit: config.freezePanes.row || 1,
      }]
    }

    // Protect sheet if requested
    if (config.protectSheet) {
      this.protectWorksheet(worksheet)
    }

    return worksheet
  }

  /**
   * Setup column definitions and widths
   */
  private setupColumns(worksheet: ExcelWorksheet, columns: ExcelColumnDefinition[]): void {
    worksheet.columns = columns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
    }))
  }

  /**
   * Add and style header row
   */
  private addHeaderRow(worksheet: ExcelWorksheet, columns: ExcelColumnDefinition[]): void {
    const headerRow = worksheet.getRow(1)
    
    columns.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1)
      cell.value = col.header
      cell.font = EXCEL_FONTS.HEADER
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: EXCEL_COLORS.PRIMARY },
      }
      cell.font = { ...EXCEL_FONTS.HEADER, color: { argb: EXCEL_COLORS.WHITE } }
      cell.border = EXCEL_BORDERS.THIN
      cell.alignment = { horizontal: 'center', vertical: 'middle' }

      // Add description as comment if available
      if (col.description) {
        cell.note = {
          margins: {
            insetmode: 'auto',
          },
          protection: {
            locked: 'True',
            lockText: 'True',
          },
          editAs: 'twoCells',
          texts: [{
            font: { size: 9, color: { argb: EXCEL_COLORS.BLACK } },
            text: col.description,
          }],
        }
      }
    })
    
    headerRow.height = 25
    headerRow.commit?.()
  }

  /**
   * Add sample data rows with appropriate formatting
   */
  private addSampleRows(
    worksheet: ExcelWorksheet, 
    columns: ExcelColumnDefinition[], 
    rowCount: number
  ): void {
    for (let i = 2; i <= rowCount + 1; i++) {
      const row = worksheet.getRow(i)
      
      columns.forEach((col, index) => {
        const cell = row.getCell(index + 1)
        
        // Set sample value based on column type
        cell.value = this.getSampleValue(col, i - 1)
        
        // Apply formatting
        this.applyCellFormatting(cell, col)
      })
      
      row.commit?.()
    }
  }

  /**
   * Get sample value for a column based on its type
   */
  private getSampleValue(column: ExcelColumnDefinition, rowIndex: number): ExcelCellValue {
    if (column.defaultValue !== undefined) {
      return column.defaultValue
    }

    const sampleData: Record<string, string[]> = {
      title: ['Spring Festival', 'Summer Sale', 'Holiday Event', 'New Year Promo'],
      eventType: ['Seasonal', 'IAP', 'Retention', 'Progression'],
      cohort: ['All', 'New Users', 'Veteran Players', 'Premium Users'],
      duration: ['1d', '3d', '1w', '2w'],
      placement: ['Main Menu', 'Store', 'Post-Battle', 'Login Screen'],
      description: [
        'Limited-time spring themed content',
        'Special discounts on premium items', 
        'Holiday celebration with rewards',
        'New Year bonus content'
      ]
    }

    switch (column.type) {
      case 'date':
        const baseDate = new Date('2024-01-01')
        baseDate.setDate(baseDate.getDate() + rowIndex * 7)
        return baseDate
      case 'number':
        return Math.floor(Math.random() * 100) + 1
      case 'boolean':
        return rowIndex % 2 === 0
      case 'dropdown':
        if (column.validation?.formula1) {
          const options = column.validation.formula1.replace(/"/g, '').split(',')
          return options[rowIndex % options.length] || ''
        }
        return 'Option 1'
      case 'formula':
        return '' // Formulas will be set separately
      default:
        // Try to match sample data by column key
        const key = column.key.toLowerCase()
        for (const [dataKey, values] of Object.entries(sampleData)) {
          if (key.includes(dataKey)) {
            return values[rowIndex % values.length] || ''
          }
        }
        return `Sample ${column.key} ${rowIndex}`
    }
  }

  /**
   * Apply cell formatting based on column configuration
   */
  private applyCellFormatting(cell: ExcelCell, column: ExcelColumnDefinition): void {
    // Apply custom format if specified
    if (column.format) {
      cell.numFmt = column.format
    }

    // Apply type-specific formatting
    switch (column.type) {
      case 'date':
        cell.numFmt = 'yyyy-mm-dd'
        break
      case 'number':
        cell.numFmt = '0'
        break
      case 'formula':
        cell.font = EXCEL_FONTS.FORMULA
        break
    }

    // Apply borders
    cell.border = EXCEL_BORDERS.THIN

    // Highlight required fields
    if (column.required) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: EXCEL_COLORS.BACKGROUND },
      }
    }
  }

  /**
   * Apply data validation rules to columns
   */
  private applyDataValidation(worksheet: ExcelWorksheet, columns: ExcelColumnDefinition[]): void {
    columns.forEach((col, index) => {
      if (!col.validation) return

      const columnLetter = String.fromCharCode(65 + index) // A, B, C, etc.
      const range = `${columnLetter}2:${columnLetter}1000` // Apply to first 1000 rows

      const validation: ExcelValidationPayload = {
        type: col.validation.type,
        allowBlank: col.validation.allowBlank ?? !col.required,
        showInputMessage: col.validation.showInputMessage ?? true,
        promptTitle: col.validation.promptTitle || col.header,
        prompt: col.validation.prompt || col.description || `Enter valid ${col.header}`,
        showErrorMessage: col.validation.showErrorMessage ?? true,
        errorTitle: col.validation.errorTitle || 'Invalid Input',
        error: col.validation.error || `Please enter a valid ${col.header}`,
        errorStyle: col.validation.errorStyle || 'warning',
      }

      // Set validation formulas
      if (col.validation.formula1) {
        validation.formulae = [col.validation.formula1]
        if (col.validation.formula2) {
          validation.formulae.push(col.validation.formula2)
        }
      }

      // Apply operator for numeric validations
      if (col.validation.operator && ['whole', 'decimal'].includes(col.validation.type)) {
        validation.operator = col.validation.operator
      }

      if (worksheet.addDataValidation) {
        worksheet.addDataValidation({
          sqref: range,
          ...validation,
        })
      }
    })
  }

  /**
   * Add complex formulas to worksheet
   */
  private addFormulas(
    worksheet: ExcelWorksheet, 
    formulas: Array<{ cell: string; formula: string; description?: string }>
  ): void {
    formulas.forEach(({ cell, formula, description }) => {
      const targetCell = worksheet.getCell(cell)
      targetCell.value = { formula }
      targetCell.font = EXCEL_FONTS.FORMULA
      
      if (description) {
        targetCell.note = {
          texts: [{
            font: { size: 9, color: { argb: EXCEL_COLORS.MUTED } },
            text: description,
          }],
        }
      }
    })
  }

  /**
   * Apply conditional formatting for data visualization
   */
  private applyConditionalFormatting(worksheet: ExcelWorksheet, columns: ExcelColumnDefinition[]): void {
    const addConditionalFormatting = worksheet.addConditionalFormatting
    if (!addConditionalFormatting) {
      return
    }

    columns.forEach((col, index) => {
      const columnLetter = String.fromCharCode(65 + index)
      const range = `${columnLetter}2:${columnLetter}1000`

      switch (col.type) {
        case 'date':
          // Highlight past dates in red
          addConditionalFormatting({
            ref: range,
            rules: [{
              type: 'cellIs',
              operator: 'lessThan',
              formulae: ['TODAY()'],
              style: {
                fill: {
                  type: 'pattern',
                  pattern: 'solid',
                  bgColor: { argb: EXCEL_COLORS.DANGER + '30' }, // 30% opacity
                },
              },
            }],
          })
          break

        case 'number':
          // Color scale for numbers
          addConditionalFormatting({
            ref: range,
            rules: [{
              type: 'colorScale',
              cfvo: [
                { type: 'min' },
                { type: 'max' },
              ],
              color: [
                { argb: EXCEL_COLORS.DANGER },
                { argb: EXCEL_COLORS.SUCCESS },
              ],
            }],
          })
          break
      }

      // Highlight required empty cells
      if (col.required) {
        addConditionalFormatting({
          ref: range,
          rules: [{
            type: 'containsText',
            operator: 'equal',
            text: '',
            style: {
              fill: {
                type: 'pattern',
                pattern: 'solid',
                bgColor: { argb: EXCEL_COLORS.WARNING + '50' }, // 50% opacity
              },
            },
          }],
        })
      }
    })
  }

  /**
   * Add metadata worksheet with template information
   */
  private addMetadataWorksheet(config: ExcelTemplateConfig): ExcelWorksheet {
    if (!this.workbook) {
      throw new Error('Excel workbook not initialized')
    }

    const worksheet = this.workbook.addWorksheet('README', { state: 'hidden' })
    
    const metadata: ExcelTemplateMetadata = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      description: config.description || config.name,
      author: 'LiveOps Event Calendar System',
      columns: config.worksheets.reduce((sum, ws) => sum + ws.columns.length, 0),
      expectedRows: 1000,
      validationRules: config.worksheets.reduce(
        (sum, ws) => sum + ws.columns.filter(col => col.validation).length, 
        0
      ),
      formulas: config.worksheets.reduce(
        (sum, ws) => sum + (ws.formulas?.length || 0), 
        0
      ),
    }

    // Add metadata as key-value pairs
    let row = 1
    Object.entries(metadata).forEach(([key, value]) => {
      const currentRow = worksheet.getRow(row++)
      currentRow.getCell(1).value = key
      currentRow.getCell(2).value = value
    })

    return worksheet
  }

  /**
   * Protect worksheet while allowing data entry in unlocked cells
   */
  private protectWorksheet(worksheet: ExcelWorksheet): void {
    // Note: ExcelJS worksheet protection implementation
    // This would need to be implemented based on the actual ExcelJS API
    try {
      const worksheetWithProtection = worksheet as ExcelWorksheet & {
        protect?: (password: string, options: Record<string, unknown>) => void
      }
      worksheetWithProtection.protect?.('readonly', {
        selectLockedCells: false,
        selectUnlockedCells: true,
        formatCells: false,
        formatColumns: false,
        formatRows: false,
        insertColumns: false,
        insertRows: false,
        insertHyperlinks: false,
        deleteColumns: false,
        deleteRows: false,
        sort: false,
        autoFilter: false,
        pivotTables: false,
      })
    } catch (error) {
      console.warn('Worksheet protection not available:', error)
    }
  }

  /**
   * Get template metadata for validation and display
   */
  static getTemplateMetadata(config: ExcelTemplateConfig): ExcelTemplateMetadata {
    return {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      description: config.description || config.name,
      author: 'LiveOps Event Calendar System',
      columns: config.worksheets.reduce((sum, ws) => sum + ws.columns.length, 0),
      expectedRows: 1000,
      validationRules: config.worksheets.reduce(
        (sum, ws) => sum + ws.columns.filter(col => col.validation).length, 
        0
      ),
      formulas: config.worksheets.reduce(
        (sum, ws) => sum + (ws.formulas?.length || 0), 
        0
      ),
    }
  }
}