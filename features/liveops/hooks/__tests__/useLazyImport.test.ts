import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLazyImport } from '../useLazyImport'

// Mock toast
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

describe('useLazyImport', () => {
  const mockModule = { someFunction: vi.fn() }
  const successfulImportFn = vi.fn().mockResolvedValue({ default: mockModule })
  const directExportImportFn = vi.fn().mockResolvedValue(mockModule)
  const failingImportFn = vi.fn().mockRejectedValue(new Error('Import failed'))

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with idle state', () => {
    const { result } = renderHook(() =>
      useLazyImport(successfulImportFn, 'test-module')
    )

    expect(result.current.state.status).toBe('idle')
    expect(result.current.state.module).toBeNull()
    expect(result.current.state.error).toBeNull()
    expect(result.current.state.progress).toBe(0)
  })

  it('should load module successfully with default export', async () => {
    const { result } = renderHook(() =>
      useLazyImport(successfulImportFn, 'test-module')
    )

    let loadedModule: any
    await act(async () => {
      loadedModule = await result.current.load()
    })

    expect(loadedModule).toBe(mockModule)
    expect(result.current.state.status).toBe('loaded')
    expect(result.current.state.module).toBe(mockModule)
    expect(result.current.state.progress).toBe(100)
    expect(successfulImportFn).toHaveBeenCalledTimes(1)
  })

  it('should load module successfully with direct export', async () => {
    const { result } = renderHook(() =>
      useLazyImport(directExportImportFn, 'test-direct-module')
    )

    let loadedModule: any
    await act(async () => {
      loadedModule = await result.current.load()
    })

    expect(loadedModule).toBe(mockModule)
    expect(result.current.state.status).toBe('loaded')
    expect(result.current.state.module).toBe(mockModule)
  })

  it('should cache loaded modules', async () => {
    const { result } = renderHook(() =>
      useLazyImport(successfulImportFn, 'cached-module')
    )

    // First load
    await act(async () => {
      await result.current.load()
    })

    // Second load should use cache
    await act(async () => {
      await result.current.load()
    })

    expect(successfulImportFn).toHaveBeenCalledTimes(1) // Only called once
    expect(result.current.state.status).toBe('loaded')
  })

  it('should handle import failures with retries', async () => {
    const { result } = renderHook(() =>
      useLazyImport(failingImportFn, 'failing-module', { retryCount: 1, retryDelay: 10 })
    )

    await act(async () => {
      await expect(result.current.load()).rejects.toThrow('Failed to load module after 1 attempts')
    })

    expect(result.current.state.status).toBe('error')
    expect(result.current.state.error).toBe('Import failed')
  })

  it('should use fallback module on error', async () => {
    const fallbackModule = { fallback: true }
    const { result } = renderHook(() =>
      useLazyImport(failingImportFn, 'fallback-module', { 
        fallback: fallbackModule, 
        retryCount: 1 
      })
    )

    await act(async () => {
      try {
        await result.current.load()
      } catch {
        // Expected to fail
      }
    })

    expect(result.current.state.module).toBe(fallbackModule)
  })

  it('should reset module state', async () => {
    const { result } = renderHook(() =>
      useLazyImport(successfulImportFn, 'reset-module')
    )

    // Load module first
    await act(async () => {
      await result.current.load()
    })

    // Reset
    act(() => {
      result.current.reset()
    })

    expect(result.current.state.status).toBe('idle')
    expect(result.current.state.module).toBeNull()
    expect(result.current.state.error).toBeNull()
    expect(result.current.state.progress).toBe(0)
  })

  it('should preload module when requested', async () => {
    const { result } = renderHook(() =>
      useLazyImport(successfulImportFn, 'preload-module')
    )

    await act(async () => {
      await result.current.preload()
    })

    expect(result.current.state.status).toBe('loaded')
    expect(successfulImportFn).toHaveBeenCalledTimes(1)
  })

  it('should handle preload failures silently', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    const { result } = renderHook(() =>
      useLazyImport(failingImportFn, 'preload-fail-module', { retryCount: 1 })
    )

    await act(async () => {
      await result.current.preload() // Should not throw
    })

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Preload failed for preload-fail-module:',
      expect.any(Error)
    )
    
    consoleWarnSpy.mockRestore()
  })

  it('should show loading progress during import', async () => {
    const { result } = renderHook(() =>
      useLazyImport(successfulImportFn, 'progress-module')
    )

    await act(async () => {
      await result.current.load()
    })

    // After completion, progress should be 100
    expect(result.current.state.progress).toBe(100)
  })

  it('should return existing loading promise for concurrent requests', async () => {
    const { result } = renderHook(() =>
      useLazyImport(successfulImportFn, 'concurrent-module')
    )

    const promise1 = result.current.load()
    const promise2 = result.current.load()

    await act(async () => {
      await Promise.all([promise1, promise2])
    })

    expect(successfulImportFn).toHaveBeenCalledTimes(1) // Only called once despite two calls
  })

  it('should show toast on load failure', async () => {
    const { result } = renderHook(() =>
      useLazyImport(failingImportFn, 'toast-fail-module', { retryCount: 1 })
    )

    await act(async () => {
      try {
        await result.current.load()
      } catch {
        // Expected to fail
      }
    })

    expect(mockToast).toHaveBeenCalledWith({
      title: "Module Loading Error",
      description: "Failed to load toast-fail-module: Failed to load module after 1 attempts: Import failed",
      variant: "destructive",
    })
  })
})