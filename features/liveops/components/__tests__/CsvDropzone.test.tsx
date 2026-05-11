import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { CsvDropzone } from '../CsvDropzone'

const BATCH_THRESHOLD = 2 * 1024 * 1024

const { dropzoneMocks } = vi.hoisted(() => ({
  dropzoneMocks: {
    onDrop: null as null | ((files: File[]) => void | Promise<void>),
  },
}))

const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

const mockUseCsvProcessor = {
  isProcessing: false,
  result: null,
  error: null,
  processFile: vi.fn(),
  downloadSample: vi.fn(),
  clearResult: vi.fn(),
}
vi.mock('../../hooks/useCsvProcessor', () => ({
  useCsvProcessor: () => mockUseCsvProcessor,
}))

const mockBatchImport: any = {
  state: {
    status: 'idle',
    progress: { processed: 0, total: 0, percentage: 0, currentBatch: 0, totalBatches: 0 },
    results: { successful: 0, failed: 0, errors: [] },
    performance: { eventsPerSecond: 0, elapsedTime: 0 },
  },
  importFile: vi.fn(),
  cancelImport: vi.fn(),
  resetState: vi.fn(),
}
vi.mock('../../hooks/useBatchImport', () => ({
  useBatchImport: () => mockBatchImport,
}))

const mockWizard: any = {
  state: {
    step: 'upload',
    pending: null,
    appendReplace: 'append',
    replaceConfirmOpen: false,
  },
  dispatch: vi.fn(),
  previewEvents: [],
}
vi.mock('../../hooks/useImportWizard', () => ({
  useImportWizard: () => mockWizard,
}))

const mockAddMultipleEvents = vi.fn()
const mockReplaceCalendarWithImported = vi.fn()
vi.mock('../../hooks/useEventStore', () => ({
  useEventStore: (selector: any) =>
    selector({
      addMultipleEvents: mockAddMultipleEvents,
      replaceCalendarWithImported: mockReplaceCalendarWithImported,
      events: [],
    }),
}))

vi.mock('../../lib/import-commit', () => ({
  commitImportAppend: vi.fn(),
  commitImportReplace: vi.fn(),
}))

vi.mock('react-dropzone', () => ({
  useDropzone: ({ accept, onDrop }: any) => {
    dropzoneMocks.onDrop = onDrop
    return {
      getRootProps: () => ({
        onClick: vi.fn(),
        onDrop: vi.fn(),
      }),
      getInputProps: () => ({
        type: 'file',
        accept: Object.keys(accept || {}).join(','),
      }),
      isDragActive: false,
      fileRejections: [],
    }
  },
}))

describe('CsvDropzone (wizard)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dropzoneMocks.onDrop = null
    mockWizard.state.step = 'upload'
    mockWizard.previewEvents = []
    mockUseCsvProcessor.error = null
    mockBatchImport.importFile = vi.fn()
    mockBatchImport.resetState = vi.fn()
    mockBatchImport.state = {
      status: 'idle',
      progress: { processed: 0, total: 0, percentage: 0, currentBatch: 0, totalBatches: 0 },
      results: { successful: 0, failed: 0, errors: [] },
      performance: { eventsPerSecond: 0, elapsedTime: 0 },
    }
  })

  it('renders upload area with template download', () => {
    render(<CsvDropzone />)

    expect(screen.getByText('Click to upload or drag CSV file')).toBeInTheDocument()
    expect(screen.getByText('Download Template')).toBeInTheDocument()
  })

  it('calls downloadSample when template button is clicked', () => {
    render(<CsvDropzone />)

    fireEvent.click(screen.getByText('Download Template'))
    expect(mockUseCsvProcessor.downloadSample).toHaveBeenCalledOnce()
  })

  it('renders validate panel when wizard step is validate', () => {
    mockWizard.state.step = 'validate'
    mockBatchImport.state = {
      ...mockBatchImport.state,
      results: {
        successful: 0,
        failed: 1,
        errors: [{ row: 2, message: 'Invalid date format', column: 'Start' }],
      },
    }

    render(<CsvDropzone />)
    expect(screen.getByText('Validation issues detected')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('resets batch state, clears batch-processing flag, and toast on batch import failure', async () => {
    mockBatchImport.importFile.mockRejectedValueOnce(new Error('network failure'))

    render(<CsvDropzone />)

    const largeCsv = new File(
      [new Uint8Array(BATCH_THRESHOLD).fill(97)],
      'large.csv',
      { type: 'text/csv' }
    )

    await act(async () => {
      await dropzoneMocks.onDrop?.([largeCsv])
    })

    await waitFor(() => {
      expect(mockBatchImport.resetState).toHaveBeenCalled()
    })

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
        title: 'Batch import failed',
        description: 'network failure',
      })
    )
    expect(mockWizard.dispatch).toHaveBeenCalledWith({ type: 'RESET' })
    expect(screen.getByText('Click to upload or drag CSV file')).toBeInTheDocument()
    expect(screen.queryByText('Initializing batch processing...')).not.toBeInTheDocument()
  })

  it('renders review panel when wizard step is review', () => {
    mockWizard.state.step = 'review'
    mockWizard.previewEvents = [
      {
        id: 'event-1',
        title: 'Test Event',
        start: '2026-01-01T10:00:00.000Z',
        end: '2026-01-01T11:00:00.000Z',
        cohort: 'All',
        eventType: 'IAP',
        placement: 'Lobby',
        description: '',
        status: 'Draft',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]

    render(<CsvDropzone />)
    expect(screen.getByText('Commit import')).toBeInTheDocument()
  })
})
