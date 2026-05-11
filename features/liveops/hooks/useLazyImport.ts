'use client'

import { useState, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'

export type LazyImportStatus = 'idle' | 'loading' | 'loaded' | 'error'

export interface LazyImportState<T = unknown> {
  status: LazyImportStatus
  module: T | null
  error: string | null
  progress: number
}

export interface UseLazyImportOptions<T = unknown> {
  retryCount?: number
  retryDelay?: number
  preload?: boolean
  fallback?: T | null
}

export interface UseLazyImportReturn<T = unknown> {
  state: LazyImportState<T>
  load: () => Promise<T>
  reset: () => void
  preload: () => Promise<void>
}

// Cache for loaded modules to avoid re-importing
const moduleCache = new Map<string, unknown>()
const loadingPromises = new Map<string, Promise<unknown>>()

/**
 * Hook for lazy loading modules with caching, retries, and loading states
 */
export function useLazyImport<T = unknown>(
  importFn: () => Promise<{ default: T } | T>,
  key: string,
  options: UseLazyImportOptions<T> = {}
): UseLazyImportReturn<T> {
  const {
    retryCount = 3,
    retryDelay = 1000,
    preload = false,
    fallback = null
  } = options

  const [state, setState] = useState<LazyImportState<T>>(() => {
    const cachedModule = moduleCache.get(key) as T | undefined
    return {
      status: cachedModule ? 'loaded' : 'idle',
      module: cachedModule ?? fallback ?? null,
      error: null,
      progress: cachedModule ? 100 : 0,
    }
  })

  const retryCountRef = useRef(0)
  const { toast } = useToast()

  const updateState = useCallback((updates: Partial<LazyImportState<T>>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const loadWithRetry = useCallback(async (attempt = 1): Promise<T> => {
    try {
      updateState({ 
        status: 'loading', 
        error: null, 
        progress: Math.min(20 + (attempt - 1) * 20, 80) 
      })

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }))
      }, 100)

      const moduleResult = await importFn()
      clearInterval(progressInterval)

      // Handle both default exports and direct exports
      const loadedModule = (moduleResult as { default?: T }).default !== undefined
        ? (moduleResult as { default?: T }).default as T
        : moduleResult as T

      // Cache the module
      moduleCache.set(key, loadedModule as unknown)

      updateState({
        status: 'loaded',
        module: loadedModule,
        error: null,
        progress: 100,
      })

      return loadedModule
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown import error'
      
      if (attempt < retryCount) {
        // Retry with exponential backoff
        const delay = retryDelay * Math.pow(2, attempt - 1)
        
        await new Promise(resolve => setTimeout(resolve, delay))
        return loadWithRetry(attempt + 1)
      }

      // Final failure
      updateState({
        status: 'error',
        module: fallback,
        error: errorMessage,
        progress: 0,
      })

      throw new Error(`Failed to load module after ${retryCount} attempts: ${errorMessage}`)
    }
  }, [importFn, key, retryCount, retryDelay, fallback, updateState])

  const load = useCallback(async (): Promise<T> => {
    // Return cached module if available
    const cachedModule = moduleCache.get(key) as T | undefined
    if (cachedModule) {
      updateState({
        status: 'loaded',
        module: cachedModule,
        error: null,
        progress: 100,
      })
      return cachedModule
    }

    // Return existing loading promise if in progress
    const existingPromise = loadingPromises.get(key) as Promise<T> | undefined
    if (existingPromise) {
      return existingPromise
    }

    // Start new loading process
    const loadingPromise = loadWithRetry()
    loadingPromises.set(key, loadingPromise as Promise<unknown>)

    try {
      const result = await loadingPromise
      return result
    } catch (error) {
      toast({
        title: "Module Loading Error",
        description: `Failed to load ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
      throw error
    } finally {
      loadingPromises.delete(key)
    }
  }, [key, loadWithRetry, updateState, toast])

  const preloadModule = useCallback(async (): Promise<void> => {
    try {
      await load()
    } catch (error) {
      // Preload errors are silent
      console.warn(`Preload failed for ${key}:`, error)
    }
  }, [load, key])

  const reset = useCallback(() => {
    // Clear from cache and reset state
    moduleCache.delete(key)
    loadingPromises.delete(key)
    
    updateState({
      status: 'idle',
      module: fallback,
      error: null,
      progress: 0,
    })
    
    retryCountRef.current = 0
  }, [key, fallback, updateState])

  // Auto-preload if requested
  useState(() => {
    if (preload && !moduleCache.has(key)) {
      preloadModule()
    }
  })

  return {
    state,
    load,
    reset,
    preload: preloadModule,
  }
}