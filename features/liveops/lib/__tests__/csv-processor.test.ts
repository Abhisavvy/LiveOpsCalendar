import { describe, it, expect } from 'vitest'
import { processCsvFile, generateSampleCsv, exportEventsToCsv } from '../csv-processor'
import { LiveOpsEvent, createEventId } from '../../types/events'

// Ensure File is a proper Blob subclass (PapaParse uses FileReader on the input).
if (typeof globalThis.File === 'undefined' || !(globalThis.File.prototype instanceof Blob)) {
  globalThis.File = class File extends Blob implements File {
    name: string
    lastModified: number
    readonly webkitRelativePath: string = ''

    constructor(bits: BlobPart[], filename: string, options?: FilePropertyBag) {
      super(bits, options)
      this.name = filename
      this.lastModified = options?.lastModified ?? Date.now()
    }
  } as typeof File
}

describe('CSV Processor', () => {
  describe('processCsvFile', () => {
    it('should reject files that are too large', async () => {
      const largeCsvContent = 'a'.repeat(15 * 1024 * 1024) // 15MB
      const file = new File([largeCsvContent], 'large.csv', { type: 'text/csv' })
      
      const result = await processCsvFile(file)
      
      expect(result.events).toHaveLength(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.message).toContain('File size too large')
    })

    it('should reject non-CSV files', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      
      const result = await processCsvFile(file)
      
      expect(result.events).toHaveLength(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.message).toContain('Invalid file type')
    })

    it('parses Player Type, OS, Client and recurrence pattern columns', async () => {
      const csv =
        'Flow Name,Starting Date,Timer,Cohort,Pop-up type,Lobby Icon | Where,Conditions/ Intent,Player Type,OS,Client,frequency,interval,daysOfWeek,dayOfMonth,monthlyPattern,until,count\r\n' +
        '"Imp","2024-02-01","1d","D0","Retention","Lobby","fine","Payer","iOS","In-game","weekly","2","1,3","","","",""'

      const file = new File([csv], 'events.csv', { type: 'text/csv' })
      const result = await processCsvFile(file)

      expect(result.successfulRows).toBe(1)
      expect(result.errors).toHaveLength(0)
      const evt = result.events[0]
      expect(evt?.playerType).toBe('Payer')
      expect(evt?.osType).toBe('iOS')
      expect(evt?.client).toBe('In-game')
      expect(evt?.recurrence).toMatchObject({
        frequency: 'weekly',
        interval: 2,
        daysOfWeek: [1, 3],
      })
    })

    it('parses legacy Recurrence Frequency / Interval column names', async () => {
      const csv =
        'Flow Name,Starting Date,Timer,Cohort,Pop-up type,Lobby Icon | Where,Conditions/ Intent,Recurrence Frequency,Recurrence Interval\r\n' +
        '"Legacy","2024-03-01","1d","All","Retention","Lobby","note","daily","3"'

      const file = new File([csv], 'legacy.csv', { type: 'text/csv' })
      const result = await processCsvFile(file)

      expect(result.successfulRows).toBe(1)
      expect(result.errors).toHaveLength(0)
      expect(result.events[0]?.recurrence).toMatchObject({
        frequency: 'daily',
        interval: 3,
      })
    })

    it('records an error when recurrence frequency is invalid', async () => {
      const csv =
        'Flow Name,Starting Date,Timer,Cohort,Pop-up type,Lobby Icon | Where,Conditions/ Intent,frequency\r\n' +
        '"Bad","2024-04-01","1d","All","Retention","Lobby","n","not-a-real-frequency"'

      const file = new File([csv], 'bad.csv', { type: 'text/csv' })
      const result = await processCsvFile(file)

      expect(result.events).toHaveLength(0)
      expect(result.errors.some((e) => e.message.includes('Invalid recurrence frequency'))).toBe(
        true
      )
    })
  })

  describe('generateSampleCsv', () => {
    it('should generate valid CSV with headers', () => {
      const csv = generateSampleCsv()
      
      expect(csv).toContain('Flow Name')
      expect(csv).toContain('Starting Date')
      expect(csv).toContain('Timer')
      expect(csv).toContain('Player Type')
      expect(csv).toContain('frequency')
      expect(csv).toContain('daysOfWeek')
    })
  })

  describe('exportEventsToCsv', () => {
    it('should export events to CSV format', () => {
      const mockEvent: LiveOpsEvent = {
        id: createEventId(),
        title: 'Test Event',
        start: '2024-01-15T00:00:00.000Z',
        end: '2024-01-16T00:00:00.000Z',
        cohort: ['All'],
        eventType: 'IAP',
        playerType: 'All',
        osType: 'All',
        client: 'Kinoa',
        placement: ['Home screen', 'Game board'],
        description: 'Test description',
        status: 'Draft',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }

      const csv = exportEventsToCsv([mockEvent])

      expect(csv).toContain('Flow Name')
      expect(csv).toContain('Test Event')
      expect(csv).toContain('All')
      expect(csv).toContain('IAP')
      expect(csv).toContain('Player Type')
      expect(csv).toContain('frequency')
    })

    it('should throw error for empty events array', () => {
      expect(() => exportEventsToCsv([])).toThrow('No events to export')
    })
  })
})