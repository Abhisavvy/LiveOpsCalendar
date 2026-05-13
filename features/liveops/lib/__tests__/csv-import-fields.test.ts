import { describe, it, expect } from 'vitest'
import type { CsvRow } from '../../types/events'
import { parseRecurrenceFromCsvRow, pickCsvCell } from '../csv-import-fields'

describe('csv-import-fields', () => {
  it('parses explicit recurrence columns into a config', () => {
    const row: CsvRow = {
      frequency: 'weekly',
      interval: '2',
      daysOfWeek: '1,3',
    }
    const result = parseRecurrenceFromCsvRow(row, 2)
    expect(result.errors).toHaveLength(0)
    expect(result.recurrence).toMatchObject({
      frequency: 'weekly',
      interval: 2,
      daysOfWeek: [1, 3],
    })
  })

  it('returns an error when frequency is invalid', () => {
    const row: CsvRow = {
      frequency: 'never',
    }
    const result = parseRecurrenceFromCsvRow(row, 4)
    expect(result.recurrence).toBeUndefined()
    expect(result.errors[0]?.message).toContain('Invalid recurrence frequency')
  })

  it('sanitizes formula-like values in pickCsvCell', () => {
    const row: CsvRow = {
      'Player Type': '=2+2',
    }
    expect(pickCsvCell(row, 'Player Type')).toBe(' =2+2')
  })
})
