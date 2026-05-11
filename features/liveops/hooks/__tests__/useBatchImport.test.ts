import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBatchImport } from '../useBatchImport'

// Mock the event store
const mockAddMultipleEvents = vi.fn()
vi.mock('../useEventStore', () => ({
  useEventStore: () => mockAddMultipleEvents,
}))

// Mock toast
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

// Mock Web Worker
const mockWorker = {
  postMessage: vi.fn(),
  terminate: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}

// Mock Worker constructor  
const MockWorker = vi.fn().mockImplementation(function(this: any) {
  return mockWorker
})

// Mock FileReader
const mockFileReader = {
  readAsText: vi.fn(),
  onload: null as ((event: any) => void) | null,
  onerror: null as ((event: any) => void) | null,
  result: 'test content',
}

describe('useBatchImport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup global Worker mock
    Object.defineProperty(global, 'Worker', {
      writable: true,
      value: MockWorker,
    })
    // Setup global FileReader mock
    Object.defineProperty(global, 'FileReader', {
      writable: true,
      value: vi.fn().mockImplementation(function (this: any) {
        return mockFileReader
      }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with idle state', () => {
    const { result } = renderHook(() => useBatchImport())

    expect(result.current.state.status).toBe('idle')
    expect(result.current.state.progress.processed).toBe(0)
    expect(result.current.state.progress.total).toBe(0)
    expect(result.current.state.results.successful).toBe(0)
    expect(result.current.state.results.failed).toBe(0)
  })

  it('should reset state to initial values', () => {
    const { result } = renderHook(() => useBatchImport())

    act(() => {
      result.current.resetState()
    })

    expect(result.current.state.status).toBe('idle')
    expect(result.current.state.progress.processed).toBe(0)
  })

  it('should handle worker initialization failure gracefully', async () => {
    // Mock Worker constructor to throw
    Object.defineProperty(global, 'Worker', {
      writable: true,
      value: vi.fn().mockImplementation(() => {
        throw new Error('Worker not supported')
      }),
    })

    const { result } = renderHook(() => useBatchImport())
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' })

    await act(async () => {
      await expect(result.current.importFile(file)).rejects.toThrow('Web Worker not available')
    })
  })

  it('should cancel import and reset state', () => {
    const { result } = renderHook(() => useBatchImport())

    act(() => {
      result.current.cancelImport()
    })

    expect(mockWorker.terminate).toHaveBeenCalled()
    expect(result.current.state.status).toBe('idle')
    expect(mockToast).toHaveBeenCalledWith({
      title: "Import Cancelled",
      description: "The batch import has been cancelled.",
    })
  })

  it('resolves COMPLETE without calling addMultipleEvents', async () => {
    const { result } = renderHook(() => useBatchImport())
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' })

    let importPromise: Promise<any> | undefined

    await act(async () => {
      importPromise = result.current.importFile(file)
      const messageHandler = mockWorker.addEventListener.mock.calls.find(
        ([event]) => event === 'message'
      )?.[1]
      expect(messageHandler).toBeDefined()

      messageHandler?.({
        data: {
          type: 'COMPLETE',
          payload: {
            events: [],
            errors: [],
            totalRows: 0,
            successfulRows: 0,
            performance: {
              totalTime: 1,
              averageEventsPerSecond: 0,
            },
          },
        },
      })
      await importPromise
    })

    expect(mockAddMultipleEvents).not.toHaveBeenCalled()
  })
})