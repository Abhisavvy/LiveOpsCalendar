import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCsvProcessor } from '../useCsvProcessor'

const importFromCSV = vi.fn()

vi.mock('../useEventStore', () => ({
  useEventStore: (selector: (state: { importFromCSV: typeof importFromCSV }) => unknown) =>
    selector({ importFromCSV }),
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock('../../lib/csv-processor', () => ({
  processCsvFile: vi.fn().mockResolvedValue({
    events: [],
    errors: [],
    totalRows: 1,
    successfulRows: 1,
  }),
  generateSampleCsv: vi.fn(),
}))

describe('useCsvProcessor (Approach A)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not call importFromCSV after successful parse', async () => {
    const file = new File(['a'], 't.csv', { type: 'text/csv' })
    const { result } = renderHook(() => useCsvProcessor())

    await act(async () => {
      await result.current.processFile(file)
    })

    expect(importFromCSV).not.toHaveBeenCalled()
  })
})
