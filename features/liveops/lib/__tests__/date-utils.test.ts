import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import {
  durationToHours,
  addDurationToDate,
  formatDate,
  isPastDate,
  isToday,
  isFutureDate,
  parseToISO,
  calculateDuration,
  doDateRangesOverlap,
  formatForInput,
  formatDateTimeForInput,
  formatTimeForInput,
  formatMeridiemForInput,
  inputDateToISO,
} from '../date-utils'
import { DurationOption } from '../../types/events'

dayjs.extend(customParseFormat)

describe('Date Utilities', () => {
  describe('durationToHours', () => {
    it('should convert duration options to hours correctly', () => {
      expect(durationToHours('1h')).toBe(1)
      expect(durationToHours('6h')).toBe(6)
      expect(durationToHours('1d')).toBe(24)
      expect(durationToHours('1w')).toBe(168)
      expect(durationToHours('1m')).toBe(720)
    })

    it('should return default 24 hours for unknown duration', () => {
      expect(durationToHours('unknown' as DurationOption)).toBe(24)
    })
  })

  describe('addDurationToDate', () => {
    it('should add duration to ISO date string', () => {
      const startDate = '2024-01-15T10:00:00.000Z'
      const result = addDurationToDate(startDate, '1d')
      
      const expected = new Date(startDate)
      expected.setHours(expected.getHours() + 24)
      
      expect(result).toBe(expected.toISOString())
    })
  })

  describe('formatDate', () => {
    it('should format ISO date to readable format', () => {
      const isoDate = '2024-01-15T10:30:00.000Z'
      const formatted = formatDate(isoDate, 'YYYY-MM-DD')
      
      expect(formatted).toBe('2024-01-15')
    })

    it('should use default format when none provided', () => {
      const isoDate = '2024-01-15T10:30:00.000Z'
      const formatted = formatDate(isoDate)
      
      expect(formatted).toMatch(/Jan 15, 2024/)
    })
  })

  describe('isPastDate, isToday, isFutureDate', () => {
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    it('should correctly identify past dates', () => {
      expect(isPastDate(yesterday.toISOString())).toBe(true)
      expect(isPastDate(tomorrow.toISOString())).toBe(false)
    })

    it('should correctly identify future dates', () => {
      expect(isFutureDate(tomorrow.toISOString())).toBe(true)
      expect(isFutureDate(yesterday.toISOString())).toBe(false)
    })

    it('should correctly identify today', () => {
      const todayStart = new Date(now)
      todayStart.setHours(0, 0, 0, 0)
      
      expect(isToday(todayStart.toISOString())).toBe(true)
      expect(isToday(yesterday.toISOString())).toBe(false)
    })
  })

  describe('parseToISO', () => {
    it('should parse various date formats', () => {
      expect(parseToISO('2024-01-15')).toBeTruthy()
      expect(parseToISO('01/15/2024')).toBeTruthy()
      expect(parseToISO('15/01/2024')).toBeTruthy()
    })

    it('should return null for invalid dates', () => {
      expect(parseToISO('invalid-date')).toBeNull()
      expect(parseToISO('32/15/2024')).toBeNull()
    })
  })

  describe('calculateDuration', () => {
    it('should calculate duration between two dates', () => {
      const start = '2024-01-15T10:00:00.000Z'
      const end = '2024-01-16T14:00:00.000Z' // 28 hours later
      
      const duration = calculateDuration(start, end)
      
      expect(duration.hours).toBe(28)
      expect(duration.days).toBe(1)
      expect(duration.readable).toBe('1 day 4h')
    })

    it('should handle same-day durations', () => {
      const start = '2024-01-15T10:00:00.000Z'
      const end = '2024-01-15T15:00:00.000Z' // 5 hours later
      
      const duration = calculateDuration(start, end)
      
      expect(duration.hours).toBe(5)
      expect(duration.days).toBe(0)
      expect(duration.readable).toBe('5 hours')
    })
  })

  describe('doDateRangesOverlap', () => {
    it('should detect overlapping ranges', () => {
      const start1 = '2024-01-15T00:00:00.000Z'
      const end1 = '2024-01-17T00:00:00.000Z'
      const start2 = '2024-01-16T00:00:00.000Z'
      const end2 = '2024-01-18T00:00:00.000Z'
      
      expect(doDateRangesOverlap(start1, end1, start2, end2)).toBe(true)
    })

    it('should detect non-overlapping ranges', () => {
      const start1 = '2024-01-15T00:00:00.000Z'
      const end1 = '2024-01-16T00:00:00.000Z'
      const start2 = '2024-01-17T00:00:00.000Z'
      const end2 = '2024-01-18T00:00:00.000Z'
      
      expect(doDateRangesOverlap(start1, end1, start2, end2)).toBe(false)
    })
  })

  describe('formatForInput and inputDateToISO', () => {
    it('should format ISO date for HTML input', () => {
      const isoDate = '2024-01-15T10:30:00.000Z'
      const formatted = formatForInput(isoDate)
      
      expect(formatted).toBe('2024-01-15')
    })

    it('should convert plain date input to ISO using local start-of-day', () => {
      const inputDate = '2024-01-15'
      const expected = dayjs(inputDate, 'YYYY-MM-DD', true).startOf('day').toISOString()
      expect(inputDateToISO(inputDate)).toBe(expected)
    })

    it('should parse separate date + time as local wall clock', () => {
      const inputDate = '2024-01-15'
      const inputTime = '14:30'
      const expected = dayjs(`${inputDate} ${inputTime}`, 'YYYY-MM-DD HH:mm', true).toISOString()
      expect(inputDateToISO(inputDate, inputTime)).toBe(expected)
    })

    it('parses 12-hour time with AM/PM', () => {
      const inputDate = '2024-01-15'
      const inputTime = '2:30 PM'
      const expected = dayjs(`${inputDate} ${inputTime}`, 'YYYY-MM-DD h:mm A', true).toISOString()
      expect(inputDateToISO(inputDate, inputTime)).toBe(expected)
    })

    it('should parse datetime-local-shaped strings as local wall clock', () => {
      const datetimeLocal = '2024-01-15T14:30'
      const expected = dayjs(datetimeLocal, 'YYYY-MM-DDTHH:mm', true).toISOString()
      expect(inputDateToISO(datetimeLocal)).toBe(expected)
    })

    it('should round-trip ISO → datetime-local display → ISO (same instant)', () => {
      const iso = '2024-06-01T15:30:00.000Z'
      const displayed = formatDateTimeForInput(iso)
      const roundTrip = inputDateToISO(displayed)
      expect(roundTrip).not.toBeNull()
      expect(dayjs(roundTrip).startOf('minute').valueOf()).toBe(dayjs(iso).startOf('minute').valueOf())
    })

    it('should return null for empty/invalid input instead of throwing', () => {
      expect(inputDateToISO('')).toBeNull()
      expect(inputDateToISO('not-a-date')).toBeNull()
    })

    it('formats time + meridiem parts for inputs', () => {
      const iso = '2024-06-01T15:05:00.000Z'
      expect(formatTimeForInput(iso)).toBe(dayjs(iso).format('h:mm'))
      expect(formatMeridiemForInput(iso)).toBe(dayjs(iso).format('A'))
    })
  })
})