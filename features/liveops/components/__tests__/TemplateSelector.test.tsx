import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TemplateSelector } from '../TemplateSelector'

const mockDownloadCsvTemplate = vi.fn()
const mockDownloadExcelTemplate = vi.fn()
const mockGetTemplatePreview = vi.fn()
const mockGetCsvTemplateInfo = vi.fn()

vi.mock('../../hooks/useCsvTemplates', () => ({
  useCsvTemplates: () => ({
    state: { isGenerating: false, error: null },
    downloadCsvTemplate: mockDownloadCsvTemplate,
    getCsvTemplateInfo: mockGetCsvTemplateInfo,
  }),
}))

vi.mock('../../hooks/useExcelTemplates', () => ({
  useExcelTemplates: () => ({
    state: { isGenerating: false, progress: 0, currentStep: '', error: null },
    isLibraryReady: true,
    downloadTemplate: mockDownloadExcelTemplate,
    getTemplatePreview: mockGetTemplatePreview,
  }),
}))

describe('TemplateSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetTemplatePreview.mockReturnValue({
      config: {},
      metadata: { columns: 12, validationRules: 3, formulas: 2 },
    })
    mockGetCsvTemplateInfo.mockReturnValue({
      columnCount: 12,
      sampleRowCount: 6,
      requiredFields: 4,
      optionalFields: 2,
      hasValidationExamples: true,
      dateStrategy: 'mixed',
      name: 'Comprehensive Events',
      filename: 'comprehensive_events',
    })
  })

  it('opens modal and advances through guided steps', () => {
    render(<TemplateSelector />)

    fireEvent.click(screen.getByRole('button', { name: /browse example templates/i }))
    expect(screen.getByText('Select a template')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /comprehensive events/i }))
    fireEvent.click(screen.getByRole('button', { name: /continue to preview/i }))

    expect(screen.getByRole('heading', { name: /preview template/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /continue to download/i }))
    expect(screen.getByText('Download template')).toBeInTheDocument()
  })

  it('downloads the selected CSV template', async () => {
    render(<TemplateSelector />)

    fireEvent.click(screen.getByRole('button', { name: /browse example templates/i }))
    fireEvent.click(screen.getByRole('button', { name: /comprehensive events/i }))
    fireEvent.click(screen.getByRole('button', { name: /continue to preview/i }))
    fireEvent.click(screen.getByRole('button', { name: /continue to download/i }))

    fireEvent.click(screen.getByRole('button', { name: /download csv/i }))

    await waitFor(() => {
      expect(mockDownloadCsvTemplate).toHaveBeenCalledWith('comprehensive')
    })
  })
})
