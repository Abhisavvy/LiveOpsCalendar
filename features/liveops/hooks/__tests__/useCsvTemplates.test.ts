import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCsvTemplates } from '../useCsvTemplates'

// Mock the AdvancedCsvGenerator
vi.mock('../../services/AdvancedCsvGenerator', () => ({
  AdvancedCsvGenerator: {
    generateTemplate: vi.fn(),
    getTemplateInfo: vi.fn(),
    getAllTemplates: vi.fn(),
  },
}))

// Mock useToast
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

// Mock DOM APIs
global.URL.createObjectURL = vi.fn(() => 'mock-blob-url')
global.URL.revokeObjectURL = vi.fn()
global.Blob = vi.fn(function MockBlob(content, options) {
  return {
    content,
    options,
    size: content?.[0]?.length || 0,
    type: options?.type || '',
  }
}) as unknown as typeof Blob

let mockLink: HTMLAnchorElement
const originalCreateElement = document.createElement.bind(document)
let createElementSpy: ReturnType<typeof vi.spyOn> | null = null

describe('useCsvTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset DOM mocks
    mockLink = originalCreateElement('a')
    Object.defineProperty(mockLink, 'click', { value: vi.fn() })
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

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useCsvTemplates())
      
      expect(result.current.state).toEqual({
        isGenerating: false,
        error: null,
      })
    })
  })

  describe('generateCsvTemplate', () => {
    it('should generate CSV template successfully', async () => {
      const mockCsv = 'header1,header2\nvalue1,value2'
      const { AdvancedCsvGenerator } = await import('../../services/AdvancedCsvGenerator')
      ;(AdvancedCsvGenerator.generateTemplate as any).mockReturnValue(mockCsv)

      const { result } = renderHook(() => useCsvTemplates())

      let generatedCsv = ''
      act(() => {
        generatedCsv = result.current.generateCsvTemplate('comprehensive')
      })

      expect(generatedCsv).toBe(mockCsv)
      expect(AdvancedCsvGenerator.generateTemplate).toHaveBeenCalledWith('comprehensive')
      expect(result.current.state.isGenerating).toBe(false)
      expect(result.current.state.error).toBe(null)
    })

    it('should handle generation errors', async () => {
      const error = new Error('Generation failed')
      const { AdvancedCsvGenerator } = await import('../../services/AdvancedCsvGenerator')
      ;(AdvancedCsvGenerator.generateTemplate as any).mockImplementation(() => {
        throw error
      })

      const { result } = renderHook(() => useCsvTemplates())

      let thrown: unknown
      act(() => {
        try {
          result.current.generateCsvTemplate('comprehensive')
        } catch (err) {
          thrown = err
        }
      })

      expect((thrown as Error)?.message).toBe('Generation failed')

      expect(result.current.state.isGenerating).toBe(false)
      expect(result.current.state.error).toBe('Generation failed')
    })

    it('should set generating state during generation', async () => {
      const { AdvancedCsvGenerator } = await import('../../services/AdvancedCsvGenerator')
      ;(AdvancedCsvGenerator.generateTemplate as any).mockReturnValue('test-csv')

      const { result } = renderHook(() => useCsvTemplates())

      act(() => {
        result.current.generateCsvTemplate('comprehensive')
      })

      expect(result.current.state.isGenerating).toBe(false) // Should be false after synchronous completion
    })
  })

  describe('downloadCsvTemplate', () => {
    beforeEach(async () => {
      const { AdvancedCsvGenerator } = await import('../../services/AdvancedCsvGenerator')
      ;(AdvancedCsvGenerator.generateTemplate as any).mockReturnValue('test-csv-content')
      ;(AdvancedCsvGenerator.getTemplateInfo as any).mockReturnValue({
        name: 'Test Template',
        filename: 'test_template',
      })
    })

    it('should download CSV template successfully', async () => {
      const { result } = renderHook(() => useCsvTemplates())

      act(() => {
        result.current.downloadCsvTemplate('comprehensive')
      })

      expect(global.Blob).toHaveBeenCalledWith(
        ['test-csv-content'],
        { type: 'text/csv;charset=utf-8;' }
      )
      expect(global.URL.createObjectURL).toHaveBeenCalled()
      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(mockLink.download).toBe('test_template.csv')
      expect(mockLink.click).toHaveBeenCalled()
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-blob-url')

      expect(mockToast).toHaveBeenCalledWith({
        title: "CSV Template Downloaded",
        description: "Test Template CSV template has been downloaded successfully.",
      })
    })

    it('should handle custom filename', async () => {
      const { result } = renderHook(() => useCsvTemplates())

      act(() => {
        result.current.downloadCsvTemplate('comprehensive', 'My Custom Template')
      })

      expect(mockLink.download).toBe('my_custom_template.csv')
    })

    it('should handle download errors', async () => {
      const { AdvancedCsvGenerator } = await import('../../services/AdvancedCsvGenerator')
      ;(AdvancedCsvGenerator.getTemplateInfo as any).mockReturnValue(null)

      const { result } = renderHook(() => useCsvTemplates())

      act(() => {
        result.current.downloadCsvTemplate('comprehensive')
      })

      expect(result.current.state.error).toBe('Template type "comprehensive" not found')
      expect(mockToast).toHaveBeenCalledWith({
        title: "Download Error",
        description: 'Template type "comprehensive" not found',
        variant: "destructive",
      })
    })

    it('should handle generation errors during download', async () => {
      const { AdvancedCsvGenerator } = await import('../../services/AdvancedCsvGenerator')
      ;(AdvancedCsvGenerator.generateTemplate as any).mockImplementation(() => {
        throw new Error('Generation failed during download')
      })

      const { result } = renderHook(() => useCsvTemplates())

      act(() => {
        result.current.downloadCsvTemplate('comprehensive')
      })

      expect(result.current.state.error).toBe('Generation failed during download')
      expect(mockToast).toHaveBeenCalledWith({
        title: "Download Error",
        description: 'Generation failed during download',
        variant: "destructive",
      })
    })

    it('should clean up URLs after download', async () => {
      const { result } = renderHook(() => useCsvTemplates())

      act(() => {
        result.current.downloadCsvTemplate('comprehensive')
      })

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-blob-url')
    })
  })

  describe('getCsvTemplateInfo', () => {
    it('should return template info', async () => {
      const mockInfo = { name: 'Test Template', columnCount: 10 }
      const { AdvancedCsvGenerator } = await import('../../services/AdvancedCsvGenerator')
      ;(AdvancedCsvGenerator.getTemplateInfo as any).mockReturnValue(mockInfo)

      const { result } = renderHook(() => useCsvTemplates())

      let info: any
      act(() => {
        info = result.current.getCsvTemplateInfo('comprehensive')
      })

      expect(info).toBe(mockInfo)
      expect(AdvancedCsvGenerator.getTemplateInfo).toHaveBeenCalledWith('comprehensive')
    })
  })

  describe('getAllCsvTemplates', () => {
    it('should return all templates', async () => {
      const mockTemplates = { 
        comprehensive: { name: 'Comprehensive' },
        seasonal: { name: 'Seasonal' }
      }
      const { AdvancedCsvGenerator } = await import('../../services/AdvancedCsvGenerator')
      ;(AdvancedCsvGenerator.getAllTemplates as any).mockReturnValue(mockTemplates)

      const { result } = renderHook(() => useCsvTemplates())

      let templates: any
      act(() => {
        templates = result.current.getAllCsvTemplates()
      })

      expect(templates).toBe(mockTemplates)
      expect(AdvancedCsvGenerator.getAllTemplates).toHaveBeenCalled()
    })
  })

  describe('resetState', () => {
    it('should reset state to initial values', async () => {
      const { AdvancedCsvGenerator } = await import('../../services/AdvancedCsvGenerator')
      ;(AdvancedCsvGenerator.generateTemplate as any).mockImplementation(() => {
        throw new Error('Generation failed')
      })
      const { result } = renderHook(() => useCsvTemplates())

      act(() => {
        try {
          result.current.generateCsvTemplate('comprehensive')
        } catch {
          // Expected error
        }
      })

      expect(result.current.state.error).toBe('Generation failed')

      act(() => {
        result.current.resetState()
      })

      expect(result.current.state).toEqual({
        isGenerating: false,
        error: null,
      })
    })
  })

  describe('filename sanitization', () => {
    beforeEach(async () => {
      const { AdvancedCsvGenerator } = await import('../../services/AdvancedCsvGenerator')
      ;(AdvancedCsvGenerator.generateTemplate as any).mockReturnValue('test-csv')
      ;(AdvancedCsvGenerator.getTemplateInfo as any).mockReturnValue({
        name: 'Test Template',
        filename: 'test_template',
      })
    })

    it('should sanitize custom filenames', async () => {
      const { result } = renderHook(() => useCsvTemplates())

      act(() => {
        result.current.downloadCsvTemplate('comprehensive', 'My Custom Template!@#$%^&*()')
      })

      expect(mockLink.download).toBe('my_custom_template__________.csv')
    })

    it('should handle empty custom filename', async () => {
      const { result } = renderHook(() => useCsvTemplates())

      act(() => {
        result.current.downloadCsvTemplate('comprehensive', '')
      })

      expect(mockLink.download).toBe('test_template.csv')
    })

    it('should handle special characters in custom filename', async () => {
      const { result } = renderHook(() => useCsvTemplates())

      act(() => {
        result.current.downloadCsvTemplate('comprehensive', 'Event: Spring 2024 (Final)')
      })

      expect(mockLink.download).toBe('event__spring_2024__final_.csv')
    })
  })
})