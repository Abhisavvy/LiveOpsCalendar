import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LibraryLoader } from '../LibraryLoader'
import type { LazyImportState } from '../../hooks/useLazyImport'

const createMockState = (overrides: Partial<LazyImportState> = {}): LazyImportState => ({
  status: 'idle',
  module: null,
  error: null,
  progress: 0,
  ...overrides,
})

describe('LibraryLoader', () => {
  it('renders minimal variant correctly', () => {
    const state = createMockState({ status: 'loading', progress: 50 })
    
    render(
      <LibraryLoader 
        libraryName="exceljs"
        state={state}
        variant="minimal"
      />
    )

    expect(screen.getByText('Exceljs')).toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders inline variant with progress', () => {
    const state = createMockState({ status: 'loading', progress: 75 })
    
    render(
      <LibraryLoader 
        libraryName="exceljs"
        state={state}
        variant="inline"
      />
    )

    expect(screen.getByText('Loading Exceljs')).toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    // Progress bar should be present
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('renders card variant with full details', () => {
    const state = createMockState({ 
      status: 'loaded',
      module: { someFunction: vi.fn() },
      progress: 100 
    })
    
    render(
      <LibraryLoader 
        libraryName="exceljs"
        state={state}
        variant="card"
      />
    )

    expect(screen.getByText('Exceljs Library')).toBeInTheDocument()
    expect(screen.getByText('Ready for use')).toBeInTheDocument()
    expect(screen.getByText('Ready')).toBeInTheDocument()
  })

  it('displays error state correctly', () => {
    const state = createMockState({ 
      status: 'error',
      error: 'Network timeout'
    })
    const onRetry = vi.fn()
    
    render(
      <LibraryLoader 
        libraryName="exceljs"
        state={state}
        variant="card"
        onRetry={onRetry}
      />
    )

    expect(screen.getByText('Failed to load')).toBeInTheDocument()
    expect(screen.getByText('Loading Failed')).toBeInTheDocument()
    expect(screen.getByText('Network timeout')).toBeInTheDocument()
    
    const retryButton = screen.getByText('Retry')
    expect(retryButton).toBeInTheDocument()
    
    fireEvent.click(retryButton)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('calls onRetry when retry button is clicked in minimal variant', () => {
    const state = createMockState({ status: 'error', error: 'Load failed' })
    const onRetry = vi.fn()
    
    render(
      <LibraryLoader 
        libraryName="exceljs"
        state={state}
        variant="minimal"
        onRetry={onRetry}
      />
    )

    const retryButton = screen.getByRole('button')
    fireEvent.click(retryButton)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when cancel button is clicked', () => {
    const state = createMockState({ status: 'loading' })
    const onCancel = vi.fn()
    
    render(
      <LibraryLoader 
        libraryName="exceljs"
        state={state}
        variant="card"
        onCancel={onCancel}
      />
    )

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('formats library names correctly', () => {
    const state = createMockState()
    
    render(
      <LibraryLoader 
        libraryName="my-awesome-library"
        state={state}
        variant="card"
      />
    )

    expect(screen.getByText('My Awesome Library Library')).toBeInTheDocument()
  })

  it('handles camelCase library names', () => {
    const state = createMockState()
    
    render(
      <LibraryLoader 
        libraryName="myAwesomeLibrary"
        state={state}
        variant="card"
      />
    )

    expect(screen.getByText('My Awesome Library Library')).toBeInTheDocument()
  })

  it('shows progress bar only when showProgress is true and status is loading', () => {
    const state = createMockState({ status: 'loading', progress: 50 })
    
    const { rerender } = render(
      <LibraryLoader 
        libraryName="exceljs"
        state={state}
        variant="card"
        showProgress={true}
      />
    )

    expect(screen.getByRole('progressbar')).toBeInTheDocument()

    rerender(
      <LibraryLoader 
        libraryName="exceljs"
        state={state}
        variant="card"
        showProgress={false}
      />
    )

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('applies size variants correctly', () => {
    const state = createMockState()
    
    render(
      <LibraryLoader 
        libraryName="exceljs"
        state={state}
        variant="card"
        size="lg"
      />
    )

    // Large size should have larger text
    const title = screen.getByText('Exceljs Library')
    expect(title).toHaveClass('text-lg')
  })

  it('does not show retry button when onRetry is not provided', () => {
    const state = createMockState({ status: 'error', error: 'Load failed' })
    
    render(
      <LibraryLoader 
        libraryName="exceljs"
        state={state}
        variant="card"
      />
    )

    expect(screen.queryByText('Retry')).not.toBeInTheDocument()
  })

  it('shows loading badge for loading state', () => {
    const state = createMockState({ status: 'loading' })
    
    render(
      <LibraryLoader 
        libraryName="exceljs"
        state={state}
        variant="card"
      />
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows loaded badge for loaded state', () => {
    const state = createMockState({ 
      status: 'loaded',
      module: { test: true }
    })
    
    render(
      <LibraryLoader 
        libraryName="exceljs"
        state={state}
        variant="card"
      />
    )

    expect(screen.getByText('Ready')).toBeInTheDocument()
    expect(screen.getByText('Loaded')).toBeInTheDocument()
  })
})