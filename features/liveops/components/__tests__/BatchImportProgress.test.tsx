import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BatchImportProgress } from '../BatchImportProgress'
import type { BatchImportState } from '../../hooks/useBatchImport'

const createMockState = (overrides: Partial<BatchImportState> = {}): BatchImportState => ({
  status: 'idle',
  progress: {
    processed: 0,
    total: 0,
    percentage: 0,
    currentBatch: 0,
    totalBatches: 0,
  },
  results: {
    successful: 0,
    failed: 0,
    errors: [],
  },
  performance: {
    eventsPerSecond: 0,
    elapsedTime: 0,
  },
  ...overrides,
})

describe('BatchImportProgress', () => {
  it('renders initializing state correctly', () => {
    const state = createMockState({
      status: 'initializing',
      file: { name: 'test.csv', size: 1024 },
    })

    render(<BatchImportProgress state={state} />)

    expect(screen.getByText('Batch Import Initializing...')).toBeInTheDocument()
    // Use getByText with a function to find text split across elements
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'test.csv • 1 KB'
    })).toBeInTheDocument()
  })

  it('renders processing state with progress', () => {
    const state = createMockState({
      status: 'processing',
      progress: {
        processed: 500,
        total: 1000,
        percentage: 50,
        currentBatch: 3,
        totalBatches: 5,
      },
      performance: {
        eventsPerSecond: 25.5,
        elapsedTime: 30000, // 30 seconds
      },
    })

    render(<BatchImportProgress state={state} />)

    expect(screen.getByText('Processing')).toBeInTheDocument()
    expect(screen.getByText('500 / 1,000 rows')).toBeInTheDocument()
    expect(screen.getByText('(Batch 3/5)')).toBeInTheDocument()
    expect(screen.getByText('50% complete')).toBeInTheDocument()
    expect(screen.getByText('26 events/sec')).toBeInTheDocument()
    expect(screen.getByText('30s')).toBeInTheDocument()
  })

  it('renders completed state with results', () => {
    const state = createMockState({
      status: 'completed',
      progress: {
        processed: 1000,
        total: 1000,
        percentage: 100,
        currentBatch: 5,
        totalBatches: 5,
      },
      results: {
        successful: 950,
        failed: 50,
        errors: [],
      },
    })

    render(<BatchImportProgress state={state} />)

    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('950')).toBeInTheDocument()
    expect(screen.getByText('Successful')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(screen.getByText('Import Complete')).toBeInTheDocument()
  })

  it('renders error state', () => {
    const state = createMockState({
      status: 'error',
    })

    render(<BatchImportProgress state={state} />)

    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Import Failed')).toBeInTheDocument()
  })

  it('displays errors when present', () => {
    const state = createMockState({
      status: 'processing',
      results: {
        successful: 100,
        failed: 3,
        errors: [
          { row: 5, column: 'Title', message: 'Missing title' },
          { row: 10, message: 'Invalid date format' },
          { row: 15, column: 'Duration', message: 'Invalid duration' },
        ],
      },
    })

    render(<BatchImportProgress state={state} />)

    expect(screen.getByText('Recent Errors')).toBeInTheDocument()
    // Check for text split across elements
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Row 5(Title)'
    })).toBeInTheDocument()
    expect(screen.getByText('Missing title')).toBeInTheDocument()
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Row 10'
    })).toBeInTheDocument()
    expect(screen.getByText('Invalid date format')).toBeInTheDocument()
  })

  it('shows only first 5 errors and indicates more', () => {
    const errors = Array.from({ length: 10 }, (_, i) => ({
      row: i + 1,
      message: `Error ${i + 1}`,
    }))

    const state = createMockState({
      status: 'processing',
      results: {
        successful: 100,
        failed: 10,
        errors,
      },
    })

    render(<BatchImportProgress state={state} />)

    expect(screen.getByText('Row 1')).toBeInTheDocument()
    expect(screen.getByText('Row 5')).toBeInTheDocument()
    expect(screen.queryByText('Row 6')).not.toBeInTheDocument()
    expect(screen.getByText('... and 5 more errors')).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn()
    const state = createMockState({
      status: 'processing',
    })

    render(<BatchImportProgress state={state} onCancel={onCancel} />)

    const cancelButton = screen.getByText('Cancel Import')
    fireEvent.click(cancelButton)

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when close button is clicked in completed state', () => {
    const onClose = vi.fn()
    const state = createMockState({
      status: 'completed',
    })

    render(<BatchImportProgress state={state} onClose={onClose} />)

    const closeButton = screen.getByRole('button', { name: '' }) // X button has no text
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('formats large file sizes correctly', () => {
    const state = createMockState({
      status: 'processing',
      file: { name: 'large-file.csv', size: 5 * 1024 * 1024 }, // 5MB
    })

    render(<BatchImportProgress state={state} />)

    expect(screen.getByText((content, element) => {
      return element?.textContent === 'large-file.csv • 5 MB'
    })).toBeInTheDocument()
  })

  it('formats time correctly', () => {
    const state = createMockState({
      status: 'processing',
      performance: {
        eventsPerSecond: 10,
        elapsedTime: 3661000, // 1 hour, 1 minute, 1 second
      },
    })

    render(<BatchImportProgress state={state} />)

    expect(screen.getByText('1h 1m 1s')).toBeInTheDocument()
  })

  it('does not show cancel button when onCancel is not provided', () => {
    const state = createMockState({
      status: 'processing',
    })

    render(<BatchImportProgress state={state} />)

    expect(screen.queryByText('Cancel Import')).not.toBeInTheDocument()
  })

  it('does not show close button when onClose is not provided', () => {
    const state = createMockState({
      status: 'completed',
    })

    render(<BatchImportProgress state={state} />)

    expect(screen.queryByRole('button', { name: '' })).not.toBeInTheDocument()
  })
})