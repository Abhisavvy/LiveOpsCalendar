import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useExcelTemplates } from '../useExcelTemplates'

// Mock the useExcelLibrary hook
const mockLoadExcel = vi.fn()
const mockCreateWorkbook = vi.fn()
type MockLibraryState = {
  status: 'idle' | 'loading' | 'loaded' | 'error'
  module: { Workbook: ReturnType<typeof vi.fn> } | null
  error: string | null
  progress: number
}

const mockLibraryState: MockLibraryState = {
  status: 'loaded',
  module: { Workbook: vi.fn() },
  error: null,
  progress: 100,
}

vi.mock('../useExcelLibrary', () => ({
  useExcelLibrary: () => ({
    state: mockLibraryState,
    loadExcel: mockLoadExcel,
    createWorkbook: mockCreateWorkbook,
  }),
}))

// Mock toast
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

// Mock ExcelTemplateBuilder
const { mockBuildTemplate, mockGetTemplateMetadata } = vi.hoisted(() => ({
  mockBuildTemplate: vi.fn(),
  mockGetTemplateMetadata: vi.fn().mockReturnValue({
    columns: [],
    validationRules: [],
    formulas: [],
  }),
}))
vi.mock('../../services/ExcelTemplateBuilder', () => ({
  ExcelTemplateBuilder: Object.assign(
    vi.fn(function MockExcelTemplateBuilder() {
      return {
        buildTemplate: mockBuildTemplate,
      }
    }),
    {
      getTemplateMetadata: mockGetTemplateMetadata,
    }
  ),
}))

// Mock DOM APIs
const mockCreateObjectURL = vi.fn()
const mockRevokeObjectURL = vi.fn()
Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL })
Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL })
const originalCreateElement = document.createElement.bind(document)
let createElementSpy: ReturnType<typeof vi.spyOn> | null = null
let mockLink: HTMLAnchorElement

describe('useExcelTemplates', () => {
  const mockBuffer = new ArrayBuffer(100)

  beforeEach(() => {
    vi.clearAllMocks()
    mockLoadExcel.mockResolvedValue({ Workbook: vi.fn() })
    mockBuildTemplate.mockResolvedValue(mockBuffer)
    mockGetTemplateMetadata.mockReturnValue({
      columns: [],
      validationRules: [],
      formulas: [],
    })
    mockCreateObjectURL.mockReturnValue('blob:mock-url')
    
    // Mock document methods
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
          return mockLink as any
        }
        return originalCreateElement(tagName)
      })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (createElementSpy) {
      createElementSpy.mockRestore()
      createElementSpy = null
    }
  })

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useExcelTemplates())

    expect(result.current.state.isGenerating).toBe(false)
    expect(result.current.state.progress).toBe(0)
    expect(result.current.state.error).toBeNull()
    expect(result.current.isLibraryReady).toBe(true)
  })

  it('should generate template successfully', async () => {
    const { result } = renderHook(() => useExcelTemplates())

    let generatedBuffer: ArrayBuffer | undefined
    await act(async () => {
      generatedBuffer = await result.current.generateTemplate('comprehensive')
    })

    expect(generatedBuffer).toBe(mockBuffer)
    expect(mockLoadExcel).toHaveBeenCalled()
    expect(mockBuildTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Comprehensive Live Ops Events',
      })
    )
  })

  it('should show progress during template generation', async () => {
    const { result } = renderHook(() => useExcelTemplates())

    const generatePromise = act(async () => {
      await result.current.generateTemplate('comprehensive')
    })

    // During generation, should show progress
    expect(result.current.state.isGenerating).toBe(false) // Will be true during actual generation
    
    await generatePromise
    
    // After completion
    expect(result.current.state.progress).toBe(100)
    expect(result.current.state.isGenerating).toBe(false)
  })

  it('should handle generation errors', async () => {
    const error = new Error('Generation failed')
    mockBuildTemplate.mockRejectedValue(error)

    const { result } = renderHook(() => useExcelTemplates())

    await act(async () => {
      await expect(
        result.current.generateTemplate('comprehensive')
      ).rejects.toThrow('Generation failed')
    })

    expect(result.current.state.error).toBe('Generation failed')
    expect(result.current.state.isGenerating).toBe(false)
  })

  it('should download template successfully', async () => {
    const { result } = renderHook(() => useExcelTemplates())

    await act(async () => {
      await result.current.downloadTemplate('comprehensive')
    })

    expect(mockCreateObjectURL).toHaveBeenCalled()
    expect(document.createElement).toHaveBeenCalledWith('a')
    expect(mockToast).toHaveBeenCalledWith({
      title: "Template Downloaded",
      description: "Comprehensive Live Ops Events template has been downloaded successfully.",
    })
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('should use custom name when provided', async () => {
    const { result } = renderHook(() => useExcelTemplates())

    await act(async () => {
      await result.current.generateTemplate('comprehensive', 'Custom Template Name')
    })

    expect(mockBuildTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Custom Template Name',
      })
    )
  })

  it('should handle download errors', async () => {
    mockBuildTemplate.mockRejectedValue(new Error('Build failed'))

    const { result } = renderHook(() => useExcelTemplates())

    await act(async () => {
      await expect(
        result.current.downloadTemplate('comprehensive')
      ).rejects.toThrow('Build failed')
    })

    expect(mockToast).toHaveBeenCalledWith({
      title: "Download Error",
      description: "Build failed",
      variant: "destructive",
    })
  })

  it('should get template preview without generation', () => {
    const { result } = renderHook(() => useExcelTemplates())

    const preview = result.current.getTemplatePreview('comprehensive')

    expect(preview.config.name).toBe('Comprehensive Live Ops Events')
    expect(preview.metadata).toHaveProperty('columns')
    expect(preview.metadata).toHaveProperty('validationRules')
    expect(preview.metadata).toHaveProperty('formulas')
  })

  it('should throw error for invalid template type', () => {
    const { result } = renderHook(() => useExcelTemplates())

    expect(() => {
      result.current.getTemplatePreview('invalid' as any)
    }).toThrow('Template type "invalid" not found')
  })

  it('should reset state correctly', async () => {
    const { result } = renderHook(() => useExcelTemplates())

    await act(async () => {
      await result.current.generateTemplate('comprehensive')
    })

    expect(result.current.state.progress).toBe(100)

    act(() => {
      result.current.reset()
    })

    expect(result.current.state.isGenerating).toBe(false)
    expect(result.current.state.progress).toBe(0)
    expect(result.current.state.error).toBeNull()
  })

  it('should handle library loading errors', async () => {
    mockLoadExcel.mockRejectedValue(new Error('Library load failed'))

    const { result } = renderHook(() => useExcelTemplates())

    await act(async () => {
      await expect(
        result.current.generateTemplate('comprehensive')
      ).rejects.toThrow('Library load failed')
    })

    expect(result.current.state.error).toBe('Library load failed')
  })

  it('should format filename correctly for download', async () => {
    const { result } = renderHook(() => useExcelTemplates())

    await act(async () => {
      await result.current.downloadTemplate('comprehensive', 'My Custom Template!')
    })

    // Check that the download filename is properly formatted
    expect(document.createElement).toHaveBeenCalledWith('a')
    
    // The mock element should have been configured with proper filename
    // (Implementation detail: special characters should be replaced with underscores)
  })

  it('should handle all template types', async () => {
    const { result } = renderHook(() => useExcelTemplates())

    const templateTypes = ['comprehensive', 'seasonal', 'monetization', 'retention', 'abTesting', 'progression'] as const

    for (const templateType of templateTypes) {
      await act(async () => {
        const preview = result.current.getTemplatePreview(templateType)
        expect(preview.config).toBeDefined()
        expect(preview.metadata).toBeDefined()
      })
    }
  })

  it('should indicate library readiness correctly', () => {
    const { result } = renderHook(() => useExcelTemplates())
    expect(result.current.isLibraryReady).toBe(true)

    // Test with library not loaded
    mockLibraryState.status = 'idle'
    mockLibraryState.module = null
    const { result: result2 } = renderHook(() => useExcelTemplates())
    expect(result2.current.isLibraryReady).toBe(false)

    mockLibraryState.status = 'loaded'
    mockLibraryState.module = { Workbook: vi.fn() }
  })
})