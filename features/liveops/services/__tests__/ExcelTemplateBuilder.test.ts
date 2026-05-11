import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExcelTemplateBuilder, type ExcelTemplateConfig } from '../ExcelTemplateBuilder'

// Mock ExcelJS
const mockWorksheet = {
  name: 'Test Sheet',
  addRow: vi.fn(),
  getRow: vi.fn().mockReturnValue({
    height: 0,
    values: [],
    getCell: vi.fn().mockReturnValue({
      value: null,
      font: {},
      fill: {},
      border: {},
      alignment: {},
      note: {},
    }),
    commit: vi.fn(),
  }),
  columns: [],
  addTable: vi.fn(),
  addDataValidation: vi.fn(),
  addConditionalFormatting: vi.fn(),
  views: [],
  getCell: vi.fn().mockReturnValue({
    value: null,
    font: {},
    note: {},
  }),
}

const mockWorkbook = {
  creator: '',
  lastModifiedBy: '',
  created: new Date(),
  modified: new Date(),
  addWorksheet: vi.fn().mockReturnValue(mockWorksheet),
  xlsx: {
    writeBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
  },
}

const mockExcelJS = {
  Workbook: vi.fn(function MockWorkbookConstructor() {
    return mockWorkbook
  }),
}

describe('ExcelTemplateBuilder', () => {
  let builder: ExcelTemplateBuilder

  beforeEach(() => {
    vi.clearAllMocks()
    builder = new ExcelTemplateBuilder(mockExcelJS as any)
  })

  describe('constructor', () => {
    it('should initialize with ExcelJS instance', () => {
      expect(mockExcelJS.Workbook).toHaveBeenCalled()
      expect(mockWorkbook.creator).toBe('LiveOps Event Calendar')
    })
  })

  describe('buildTemplate', () => {
    const simpleConfig: ExcelTemplateConfig = {
      name: 'Test Template',
      description: 'A test template',
      worksheets: [
        {
          name: 'Events',
          columns: [
            {
              key: 'title',
              header: 'Event Title',
              type: 'text',
              required: true,
              width: 25,
            },
            {
              key: 'startDate',
              header: 'Start Date', 
              type: 'date',
              required: true,
              width: 12,
              validation: {
                type: 'date',
                allowBlank: false,
              },
            },
          ],
          sampleRows: 2,
        },
      ],
    }

    it('should build a complete Excel template', async () => {
      const buffer = await builder.buildTemplate(simpleConfig)

      expect(buffer).toBeInstanceOf(ArrayBuffer)
      expect(buffer.byteLength).toBeGreaterThan(0)
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledTimes(2) // Main + metadata
      expect(mockWorkbook.xlsx.writeBuffer).toHaveBeenCalled()
    })

    it('should create worksheets for each configuration', async () => {
      await builder.buildTemplate(simpleConfig)

      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('README', { state: 'hidden' })
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Events')
    })

    it('should apply data validation to columns', async () => {
      await builder.buildTemplate(simpleConfig)

      expect(mockWorksheet.addDataValidation).toHaveBeenCalledWith(
        expect.objectContaining({
          sqref: 'B2:B1000', // Second column (Start Date)
          type: 'date',
          allowBlank: false,
        })
      )
    })

    it('should add sample rows when specified', async () => {
      await builder.buildTemplate(simpleConfig)

      // Should get rows for header + sample rows
      expect(mockWorksheet.getRow).toHaveBeenCalledWith(1) // Header
      expect(mockWorksheet.getRow).toHaveBeenCalledWith(2) // Sample row 1
      expect(mockWorksheet.getRow).toHaveBeenCalledWith(3) // Sample row 2
    })

    it('should handle templates with formulas', async () => {
      const configWithFormulas: ExcelTemplateConfig = {
        ...simpleConfig,
        worksheets: [
          {
            name: simpleConfig.worksheets[0]?.name || 'Events',
            columns: simpleConfig.worksheets[0]?.columns || [],
            sampleRows: simpleConfig.worksheets[0]?.sampleRows || 2,
            formulas: [
              {
                cell: 'D1',
                formula: '=COUNTA(A2:A1000)',
                description: 'Count of events',
              },
            ],
          },
        ],
      }

      await builder.buildTemplate(configWithFormulas)

      expect(mockWorksheet.getCell).toHaveBeenCalledWith('D1')
    })

    it('should throw error if workbook not initialized', async () => {
      const builderWithoutWorkbook = new (ExcelTemplateBuilder as any)(mockExcelJS)
      builderWithoutWorkbook.workbook = null

      await expect(
        builderWithoutWorkbook.buildTemplate(simpleConfig)
      ).rejects.toThrow('Excel workbook not initialized')
    })
  })

  describe('getTemplateMetadata', () => {
    it('should calculate correct metadata', () => {
      const config: ExcelTemplateConfig = {
        name: 'Test',
        worksheets: [
          {
            name: 'Sheet1',
            columns: [
              { key: 'col1', header: 'Column 1', type: 'text' },
              { key: 'col2', header: 'Column 2', type: 'date', validation: { type: 'date' } },
            ],
            formulas: [{ cell: 'A1', formula: '=SUM(B:B)' }],
          },
          {
            name: 'Sheet2',
            columns: [
              { key: 'col3', header: 'Column 3', type: 'number', validation: { type: 'whole' } },
            ],
          },
        ],
      }

      const metadata = ExcelTemplateBuilder.getTemplateMetadata(config)

      expect(metadata.columns).toBe(3) // 2 + 1
      expect(metadata.validationRules).toBe(2) // col2 + col3
      expect(metadata.formulas).toBe(1) // Only Sheet1 has formulas
      expect(metadata.author).toBe('LiveOps Event Calendar System')
      expect(metadata.version).toBe('1.0.0')
    })

    it('should handle empty worksheets', () => {
      const config: ExcelTemplateConfig = {
        name: 'Empty',
        worksheets: [],
      }

      const metadata = ExcelTemplateBuilder.getTemplateMetadata(config)

      expect(metadata.columns).toBe(0)
      expect(metadata.validationRules).toBe(0)
      expect(metadata.formulas).toBe(0)
    })
  })

  describe('column types and validation', () => {
    it('should handle different column types', async () => {
      const configWithTypes: ExcelTemplateConfig = {
        name: 'Types Test',
        worksheets: [
          {
            name: 'Types',
            columns: [
              { key: 'text', header: 'Text', type: 'text' },
              { key: 'number', header: 'Number', type: 'number' },
              { key: 'date', header: 'Date', type: 'date' },
              { key: 'boolean', header: 'Boolean', type: 'boolean' },
              { key: 'dropdown', header: 'Dropdown', type: 'dropdown' },
              { key: 'formula', header: 'Formula', type: 'formula' },
            ],
            sampleRows: 1,
          },
        ],
      }

      await builder.buildTemplate(configWithTypes)

      // Should complete without errors
      expect(mockWorkbook.xlsx.writeBuffer).toHaveBeenCalled()
    })

    it('should apply conditional formatting based on column type', async () => {
      const configWithConditional: ExcelTemplateConfig = {
        name: 'Conditional',
        worksheets: [
          {
            name: 'Sheet',
            columns: [
              { key: 'date', header: 'Date', type: 'date' },
              { key: 'number', header: 'Number', type: 'number' },
            ],
          },
        ],
      }

      await builder.buildTemplate(configWithConditional)

      // Should apply conditional formatting for date and number columns
      expect(mockWorksheet.addConditionalFormatting).toHaveBeenCalledTimes(2)
    })
  })

  describe('validation rules', () => {
    it('should create proper validation ranges', async () => {
      const configWithValidation: ExcelTemplateConfig = {
        name: 'Validation Test',
        worksheets: [
          {
            name: 'Sheet',
            columns: [
              {
                key: 'dropdown',
                header: 'Dropdown',
                type: 'dropdown',
                validation: {
                  type: 'list',
                  formula1: '"Option1,Option2,Option3"',
                  allowBlank: false,
                },
              },
            ],
          },
        ],
      }

      await builder.buildTemplate(configWithValidation)

      expect(mockWorksheet.addDataValidation).toHaveBeenCalledWith(
        expect.objectContaining({
          sqref: 'A2:A1000',
          type: 'list',
          formulae: ['"Option1,Option2,Option3"'],
          allowBlank: false,
        })
      )
    })
  })
})