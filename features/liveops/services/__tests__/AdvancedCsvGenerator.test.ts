import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AdvancedCsvGenerator } from '../AdvancedCsvGenerator'
import Papa from 'papaparse'

// Mock date functions for consistent testing
vi.mock('date-fns', () => ({
  addDays: vi.fn((date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
  format: vi.fn(() => '2024-01-15'),
}))

// Mock Papa Parse
vi.mock('papaparse', () => ({
  default: {
    unparse: vi.fn((data: string[][]) => {
      // Simple CSV mock - just join with commas
      return data.map((row: string[]) => row.join(',')).join('\n')
    }),
  },
}))

// Mock DOM APIs for download tests
global.URL.createObjectURL = vi.fn(() => 'mock-blob-url')
global.URL.revokeObjectURL = vi.fn()
const originalCreateElement = document.createElement.bind(document)
let createElementSpy: ReturnType<typeof vi.spyOn> | null = null
let mockLink: HTMLAnchorElement
let mockClick: ReturnType<typeof vi.fn>

describe('AdvancedCsvGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLink = originalCreateElement('a')
    mockClick = vi.fn()
    Object.defineProperty(mockLink, 'click', { value: mockClick })
    mockLink.href = ''
    mockLink.download = ''

    if (createElementSpy) {
      createElementSpy.mockRestore()
    }
    createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        if (tagName.toLowerCase() === 'a') {
          return mockLink
        }
        return originalCreateElement(tagName)
      })
  })

  afterEach(() => {
    if (createElementSpy) {
      createElementSpy.mockRestore()
      createElementSpy = null
    }
  })

  describe('generateTemplate', () => {
    it('should generate CSV template for comprehensive type', () => {
      const csv = AdvancedCsvGenerator.generateTemplate('comprehensive')
      
      expect(csv).toBeDefined()
      expect(typeof csv).toBe('string')
      expect(Papa.unparse).toHaveBeenCalled()
    })

    it('should generate CSV template for seasonal type', () => {
      const csv = AdvancedCsvGenerator.generateTemplate('seasonal')
      
      expect(csv).toBeDefined()
      expect(Papa.unparse).toHaveBeenCalled()
    })

    it('should generate CSV template for monetization type', () => {
      const csv = AdvancedCsvGenerator.generateTemplate('monetization')
      
      expect(csv).toBeDefined()
      expect(Papa.unparse).toHaveBeenCalled()
    })

    it('should generate CSV template for retention type', () => {
      const csv = AdvancedCsvGenerator.generateTemplate('retention')
      
      expect(csv).toBeDefined()
      expect(Papa.unparse).toHaveBeenCalled()
    })

    it('should generate CSV template for A/B testing type', () => {
      const csv = AdvancedCsvGenerator.generateTemplate('abTesting')
      
      expect(csv).toBeDefined()
      expect(Papa.unparse).toHaveBeenCalled()
    })

    it('should generate CSV template for progression type', () => {
      const csv = AdvancedCsvGenerator.generateTemplate('progression')
      
      expect(csv).toBeDefined()
      expect(Papa.unparse).toHaveBeenCalled()
    })

    it('should throw error for invalid template type', () => {
      expect(() => {
        AdvancedCsvGenerator.generateTemplate('invalid' as any)
      }).toThrow('Template type "invalid" not found')
    })

    it('should use Papa Parse with correct options', () => {
      AdvancedCsvGenerator.generateTemplate('comprehensive')
      
      expect(Papa.unparse).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          quotes: true,
          quoteChar: '"',
          delimiter: ',',
          header: false,
        })
      )
    })
  })

  describe('generateBlob', () => {
    it('should create blob with correct type and content', () => {
      const blob = AdvancedCsvGenerator.generateBlob('comprehensive')
      
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('text/csv;charset=utf-8;')
    })
  })

  describe('downloadTemplate', () => {
    it('should trigger download with correct filename', () => {
      AdvancedCsvGenerator.downloadTemplate('comprehensive')

      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(mockLink.download).toBe('comprehensive_liveops_template.csv')
      expect(mockClick).toHaveBeenCalled()
      expect(global.URL.createObjectURL).toHaveBeenCalled()
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-blob-url')
    })

    it('should trigger download for all template types', () => {
      const templateTypes = ['comprehensive', 'seasonal', 'monetization', 'retention', 'abTesting', 'progression'] as const
      
      templateTypes.forEach(templateType => {
        mockClick.mockClear()
        mockLink.download = ''

        AdvancedCsvGenerator.downloadTemplate(templateType)
        
        expect(mockClick).toHaveBeenCalled()
      })
    })
  })

  describe('getTemplateInfo', () => {
    it('should return template info for valid template type', () => {
      const info = AdvancedCsvGenerator.getTemplateInfo('comprehensive')
      
      expect(info).toMatchObject({
        name: expect.any(String),
        description: expect.any(String),
        filename: expect.any(String),
        columnCount: expect.any(Number),
        sampleRowCount: expect.any(Number),
        requiredFields: expect.any(Number),
        optionalFields: expect.any(Number),
        dateStrategy: expect.any(String),
        hasValidationExamples: expect.any(Boolean),
      })
    })

    it('should return null for invalid template type', () => {
      const info = AdvancedCsvGenerator.getTemplateInfo('invalid' as any)
      expect(info).toBeNull()
    })

    it('should have correct field counts for comprehensive template', () => {
      const info = AdvancedCsvGenerator.getTemplateInfo('comprehensive')
      
      expect(info?.columnCount).toBeGreaterThan(10)
      expect(info?.requiredFields).toBeGreaterThan(0)
      expect(info?.optionalFields).toBeGreaterThan(0)
      expect((info?.requiredFields || 0) + (info?.optionalFields || 0)).toBe(info?.columnCount)
    })
  })

  describe('getAllTemplates', () => {
    it('should return info for all template types', () => {
      const allTemplates = AdvancedCsvGenerator.getAllTemplates()
      
      const expectedTypes = ['comprehensive', 'seasonal', 'monetization', 'retention', 'abTesting', 'progression']
      expectedTypes.forEach(type => {
        expect(allTemplates).toHaveProperty(type)
        expect(allTemplates[type as keyof typeof allTemplates]).toMatchObject({
          name: expect.any(String),
          columnCount: expect.any(Number),
        })
      })
    })

    it('should have consistent structure across all templates', () => {
      const allTemplates = AdvancedCsvGenerator.getAllTemplates()
      
      Object.values(allTemplates).forEach(template => {
        expect(template).toMatchObject({
          name: expect.any(String),
          description: expect.any(String),
          filename: expect.any(String),
          columnCount: expect.any(Number),
          sampleRowCount: expect.any(Number),
          requiredFields: expect.any(Number),
          optionalFields: expect.any(Number),
          dateStrategy: expect.any(String),
          hasValidationExamples: expect.any(Boolean),
        })
      })
    })
  })

  describe('template content validation', () => {
    it('should generate different content for different template types', () => {
      const comprehensiveCsv = AdvancedCsvGenerator.generateTemplate('comprehensive')
      const seasonalCsv = AdvancedCsvGenerator.generateTemplate('seasonal')
      
      expect(comprehensiveCsv).not.toBe(seasonalCsv)
    })

    it('should include validation examples when configured', () => {
      // This test verifies that validation examples are included based on configuration
      const comprehensiveInfo = AdvancedCsvGenerator.getTemplateInfo('comprehensive')
      const seasonalInfo = AdvancedCsvGenerator.getTemplateInfo('seasonal')
      
      expect(comprehensiveInfo?.hasValidationExamples).toBeDefined()
      expect(seasonalInfo?.hasValidationExamples).toBeDefined()
    })

    it('should generate consistent sample row counts', () => {
      const info = AdvancedCsvGenerator.getTemplateInfo('comprehensive')
      expect(info?.sampleRowCount).toBeGreaterThan(0)
      expect(info?.sampleRowCount).toBeLessThan(20) // Reasonable upper bound
    })
  })

  describe('CSV structure validation', () => {
    it('should call Papa.unparse with headers and data rows', () => {
      AdvancedCsvGenerator.generateTemplate('comprehensive')
      
      const [callData] = (Papa.unparse as any).mock.calls[0]
      expect(Array.isArray(callData)).toBe(true)
      expect(callData.length).toBeGreaterThan(1) // At least header + 1 data row
    })

    it('should generate appropriate number of columns for each template', () => {
      const templateTypes = ['comprehensive', 'seasonal', 'monetization', 'retention', 'abTesting', 'progression'] as const
      
      templateTypes.forEach(templateType => {
        vi.clearAllMocks()
        AdvancedCsvGenerator.generateTemplate(templateType)
        
        const [callData] = (Papa.unparse as any).mock.calls[0]
        const headerRow = callData[0]
        
        expect(Array.isArray(headerRow)).toBe(true)
        expect(headerRow.length).toBeGreaterThan(5) // Each template should have more than 5 columns
      })
    })
  })
})