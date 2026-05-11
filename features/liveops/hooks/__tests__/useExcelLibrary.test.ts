import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useExcelLibrary } from '../useExcelLibrary'

// Mock the useLazyImport hook
const mockLoad = vi.fn()
const mockReset = vi.fn()
const mockState: any = {
  status: 'idle' as const,
  module: null,
  error: null,
  progress: 0,
}

vi.mock('../useLazyImport', () => ({
  useLazyImport: () => ({
    state: mockState,
    load: mockLoad,
    reset: mockReset,
  }),
}))

describe('useExcelLibrary', () => {
  const mockWorkbook = {
    addWorksheet: vi.fn(),
    xlsx: {
      writeBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
      load: vi.fn().mockResolvedValue(undefined),
    },
  }

  const mockExcelJS = {
    Workbook: vi.fn(function MockWorkbookConstructor() {
      return mockWorkbook
    }),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset mock state
    Object.assign(mockState, {
      status: 'idle' as const,
      module: null,
      error: null,
      progress: 0,
    })

    // Mock browser environment properly
    global.window = global.window || ({} as any)
    global.ArrayBuffer = global.ArrayBuffer || class MockArrayBuffer {}
    global.Blob = global.Blob || class MockBlob {}
    global.FileReader = global.FileReader || class MockFileReader {}
  })

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useExcelLibrary())

    expect(result.current.state).toBe(mockState)
    expect(result.current.ExcelJS).toBeNull()
    expect(result.current.isSupported).toBe(true)
  })

  it('should detect browser support correctly', () => {
    const { result } = renderHook(() => useExcelLibrary())
    expect(result.current.isSupported).toBe(true)
  })

  it('should load Excel library successfully', async () => {
    mockLoad.mockResolvedValue(mockExcelJS)
    mockState.status = 'loaded'
    mockState.module = mockExcelJS

    const { result } = renderHook(() => useExcelLibrary())

    let loadedExcel: any
    await act(async () => {
      loadedExcel = await result.current.loadExcel()
    })

    expect(loadedExcel).toBe(mockExcelJS)
    expect(mockLoad).toHaveBeenCalledTimes(1)
  })

  it('should create workbook after loading library', async () => {
    mockLoad.mockResolvedValue(mockExcelJS)
    
    const { result } = renderHook(() => useExcelLibrary())

    let workbook: any
    await act(async () => {
      workbook = await result.current.createWorkbook()
    })

    expect(workbook).toBe(mockWorkbook)
    expect(mockExcelJS.Workbook).toHaveBeenCalledTimes(1)
    expect(mockLoad).toHaveBeenCalledTimes(1)
  })

  it('should handle Excel library loading failures', async () => {
    const error = new Error('Failed to load ExcelJS')
    mockLoad.mockRejectedValue(error)

    const { result } = renderHook(() => useExcelLibrary())

    await act(async () => {
      await expect(result.current.loadExcel()).rejects.toThrow('Failed to load ExcelJS')
    })
  })

  it('should handle workbook creation failures', async () => {
    const error = new Error('Failed to create workbook')
    mockLoad.mockRejectedValue(error)

    const { result } = renderHook(() => useExcelLibrary())

    await act(async () => {
      await expect(result.current.createWorkbook()).rejects.toThrow('Failed to create workbook')
    })
  })

  it('should return loaded ExcelJS from state', () => {
    mockState.status = 'loaded'
    mockState.module = mockExcelJS

    const { result } = renderHook(() => useExcelLibrary())

    expect(result.current.ExcelJS).toBe(mockExcelJS)
  })

  it('should handle error state', () => {
    mockState.status = 'error'
    mockState.error = 'Load failed'
    mockState.module = null

    const { result } = renderHook(() => useExcelLibrary())

    expect(result.current.ExcelJS).toBeNull()
    expect(result.current.state.error).toBe('Load failed')
  })

  it('should handle loading state with progress', () => {
    mockState.status = 'loading'
    mockState.progress = 50

    const { result } = renderHook(() => useExcelLibrary())

    expect(result.current.state.status).toBe('loading')
    expect(result.current.state.progress).toBe(50)
  })

  it('should detect missing browser features for support', () => {
    // Remove ArrayBuffer support
    const originalArrayBuffer = global.ArrayBuffer
    const globalAny = global as typeof globalThis & { ArrayBuffer?: typeof ArrayBuffer }
    delete globalAny.ArrayBuffer

    const { result } = renderHook(() => useExcelLibrary())
    expect(result.current.isSupported).toBe(false)

    // Restore
    global.ArrayBuffer = originalArrayBuffer
  })
})