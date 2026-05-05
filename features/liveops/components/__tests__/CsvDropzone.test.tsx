import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CsvDropzone } from '../CsvDropzone'

// Mock the CSV processor hook
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

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: ({ onDrop, accept, maxFiles, maxSize, disabled }: any) => ({
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
  }),
}))

describe('CsvDropzone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCsvProcessor.isProcessing = false
    mockUseCsvProcessor.result = null
    mockUseCsvProcessor.error = null
  })

  it('should render upload area with correct text', () => {
    render(<CsvDropzone />)
    
    expect(screen.getByText('Click to upload or drag CSV file')).toBeInTheDocument()
    expect(screen.getByText('Supports .csv files up to 10MB with max 10,000 rows')).toBeInTheDocument()
  })

  it('should show processing state when processing', () => {
    mockUseCsvProcessor.isProcessing = true
    
    render(<CsvDropzone />)
    
    expect(screen.getByText('Processing CSV...')).toBeInTheDocument()
  })

  it('should display error when present', () => {
    mockUseCsvProcessor.error = 'Failed to process file'
    
    render(<CsvDropzone />)
    
    expect(screen.getByText('Processing Error')).toBeInTheDocument()
    expect(screen.getByText('Failed to process file')).toBeInTheDocument()
  })

  it('should display success results', () => {
    mockUseCsvProcessor.result = {
      events: [
        {
          id: 'test-id',
          title: 'Test Event',
          start: '2024-01-15T00:00:00.000Z',
          end: '2024-01-16T00:00:00.000Z',
          cohort: 'All',
          eventType: 'IAP' as const,
          placement: 'Test',
          description: 'Test',
          status: 'Draft' as const,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }
      ],
      errors: [],
      totalRows: 1,
      successfulRows: 1,
    }
    
    render(<CsvDropzone />)
    
    expect(screen.getByText('Import Successful')).toBeInTheDocument()
    expect(screen.getByText('Successfully imported 1 of 1 events')).toBeInTheDocument()
  })

  it('should display errors with download option', () => {
    mockUseCsvProcessor.result = {
      events: [],
      errors: [
        { row: 2, message: 'Invalid date format', column: 'Starting Date' },
        { row: 3, message: 'Missing title', column: 'Flow Name' },
      ],
      totalRows: 2,
      successfulRows: 0,
    }
    
    render(<CsvDropzone />)
    
    expect(screen.getByText('2 Row Errors')).toBeInTheDocument()
    expect(screen.getByText('Row 2: Invalid date format (Starting Date)')).toBeInTheDocument()
    expect(screen.getByText('Download Report')).toBeInTheDocument()
  })

  it('should call downloadSample when template button is clicked', () => {
    render(<CsvDropzone />)
    
    const downloadButton = screen.getByText('Download Template')
    fireEvent.click(downloadButton)
    
    expect(mockUseCsvProcessor.downloadSample).toHaveBeenCalledOnce()
  })

  it('should call clearResult when clear button is clicked', () => {
    mockUseCsvProcessor.result = {
      events: [],
      errors: [],
      totalRows: 0,
      successfulRows: 0,
    }
    
    render(<CsvDropzone />)
    
    const clearButton = screen.getByText('Clear Results')
    fireEvent.click(clearButton)
    
    expect(mockUseCsvProcessor.clearResult).toHaveBeenCalledOnce()
  })

  it('should show partial success with warnings', () => {
    mockUseCsvProcessor.result = {
      events: [
        {
          id: 'test-id',
          title: 'Test Event',
          start: '2024-01-15T00:00:00.000Z',
          end: '2024-01-16T00:00:00.000Z',
          cohort: 'All',
          eventType: 'IAP' as const,
          placement: 'Test',
          description: 'Test',
          status: 'Draft' as const,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }
      ],
      errors: [
        { row: 3, message: 'Invalid date format' },
      ],
      totalRows: 2,
      successfulRows: 1,
    }
    
    render(<CsvDropzone />)
    
    expect(screen.getByText('Import Successful')).toBeInTheDocument()
    expect(screen.getByText('Successfully imported 1 of 2 events')).toBeInTheDocument()
    expect(screen.getByText('1 Row Error')).toBeInTheDocument()
  })
})