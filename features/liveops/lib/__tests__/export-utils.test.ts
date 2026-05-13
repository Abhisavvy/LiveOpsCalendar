import { describe, it, expect } from 'vitest'
import Papa from 'papaparse'
import {
  exportEventsToCSV,
  getDefaultColumnMapping,
  getExtendedColumnMapping,
} from '../export-utils'
import { LiveOpsEvent, createEventId } from '../../types/events'

function baseEvent(overrides: Partial<LiveOpsEvent> = {}): LiveOpsEvent {
  const id = createEventId()
  return {
    id,
    title: 'Test Flow',
    start: '2024-06-01T12:00:00.000Z',
    end: '2024-06-02T12:00:00.000Z',
    cohort: ['D0'],
    eventType: 'IAP',
    playerType: 'Payer',
    osType: 'iOS',
    client: 'In-game',
    placement: 'Lobby',
    description: 'Desc',
    status: 'Draft',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('export-utils', () => {
  describe('getExtendedColumnMapping', () => {
    it('includes recurrence columns frequency, interval, daysOfWeek, dayOfMonth, monthlyPattern, until, count', () => {
      const mapping = getExtendedColumnMapping()
      expect(mapping.frequency).toBe('frequency')
      expect(mapping.interval).toBe('interval')
      expect(mapping.daysOfWeek).toBe('daysOfWeek')
      expect(mapping.dayOfMonth).toBe('dayOfMonth')
      expect(mapping.monthlyPattern).toBe('monthlyPattern')
      expect(mapping.until).toBe('until')
      expect(mapping.count).toBe('count')
      expect(mapping['Player Type']).toBe('playerType')
      expect(mapping.OS).toBe('osType')
      expect(mapping.Client).toBe('client')
      expect(mapping['Recurrence Frequency']).toBeUndefined()
    })
  })

  describe('getDefaultColumnMapping', () => {
    it('still targets core columns only', () => {
      const mapping = getDefaultColumnMapping()
      expect(mapping['Flow Name']).toBe('title')
      expect(mapping.frequency).toBeUndefined()
      expect(mapping['Player Type']).toBeUndefined()
    })
  })

  describe('exportEventsToCSV extended mapping', () => {
    it('serializes recurrence and audience columns', () => {
      const events: LiveOpsEvent[] = [
        baseEvent({
          recurrence: {
            frequency: 'weekly',
            interval: 2,
            daysOfWeek: [1, 3],
            monthlyPattern: 'weekday',
            until: '2025-01-01T00:00:00.000Z',
            count: 10,
          },
        }),
      ]
      const csv = exportEventsToCSV(events, {
        columnMapping: getExtendedColumnMapping(),
        dateFormat: 'YYYY-MM-DD',
      })
      const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
      const row = (parsed.data[0] as Record<string, string>) ?? {}

      expect(row.frequency).toBe('weekly')
      expect(row.interval).toBe('2')
      expect(row.daysOfWeek).toBe('1,3')
      expect(row.monthlyPattern).toBe('weekday')
      expect(row.until).toBe('2025-01-01')
      expect(row.count).toBe('10')
      expect(row['Player Type']).toBe('Payer')
      expect(row.OS).toBe('iOS')
      expect(row.Client).toBe('In-game')
    })

    it('exports Event ID when included in the mapping', () => {
      const event = baseEvent()
      const csv = exportEventsToCSV([event], {
        columnMapping: getExtendedColumnMapping(),
        dateFormat: 'YYYY-MM-DD',
      })
      const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
      const row = (parsed.data[0] as Record<string, string>) ?? {}
      expect(row['Event ID']).toBe(event.id)
    })

    it('exports empty recurrence cells when recurrence is absent', () => {
      const csv = exportEventsToCSV([baseEvent({ recurrence: undefined })], {
        columnMapping: getExtendedColumnMapping(),
        dateFormat: 'YYYY-MM-DD',
      })
      const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
      const row = (parsed.data[0] as Record<string, string>) ?? {}

      expect(row.frequency).toBe('')
      expect(row.interval).toBe('')
      expect(row.daysOfWeek).toBe('')
      expect(row.dayOfMonth).toBe('')
      expect(row.count).toBe('')
    })

    it('exports dayOfMonth when set', () => {
      const events: LiveOpsEvent[] = [
        baseEvent({
          recurrence: {
            frequency: 'monthly',
            interval: 1,
            dayOfMonth: 15,
            monthlyPattern: 'date',
          },
        }),
      ]
      const csv = exportEventsToCSV(events, {
        columnMapping: getExtendedColumnMapping(),
        dateFormat: 'YYYY-MM-DD',
      })
      const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
      const row = (parsed.data[0] as Record<string, string>) ?? {}
      expect(row.dayOfMonth).toBe('15')
      expect(row.monthlyPattern).toBe('date')
    })
  })
})
