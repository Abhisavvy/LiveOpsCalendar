import { describe, it, expect, vi } from 'vitest'
import Papa from 'papaparse'
import { parseCsvContent } from '../csv-batch-processor'

vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn(),
  },
}))

describe('parseCsvContent', () => {
  it('rejects when Papa.parse reports an error', async () => {
    vi.mocked(Papa.parse).mockImplementation((_content, config) => {
      config.error?.(new Error('parse failed'))
    })

    await expect(parseCsvContent('bad')).rejects.toThrow('parse failed')
  })
})
