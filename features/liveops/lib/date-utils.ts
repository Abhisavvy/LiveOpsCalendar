import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'

// Configure dayjs plugins
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(duration)
dayjs.extend(relativeTime)
dayjs.extend(customParseFormat)
dayjs.extend(quarterOfYear)

import { DurationOption, DURATION_OPTIONS } from '../types/events'

/**
 * Convert a duration option to hours
 */
export function durationToHours(duration: DurationOption): number {
  const option = DURATION_OPTIONS.find(opt => opt.value === duration)
  return option?.hours ?? 24 // Default to 24 hours if not found
}

/**
 * Add duration to a date and return ISO string
 */
export function addDurationToDate(isoDate: string, duration: DurationOption): string {
  const hours = durationToHours(duration)
  return dayjs(isoDate).add(hours, 'hours').toISOString()
}

/**
 * Format date for display
 */
export function formatDate(isoDate: string, format: string = 'MMM D, YYYY'): string {
  return dayjs(isoDate).format(format)
}

/**
 * Format date and time for display
 */
export function formatDateTime(isoDate: string, format: string = 'MMM D, YYYY h:mm A'): string {
  return dayjs(isoDate).format(format)
}

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(isoDate: string): string {
  return dayjs(isoDate).fromNow()
}

/**
 * Check if a date is in the past
 */
export function isPastDate(isoDate: string): boolean {
  return dayjs(isoDate).isBefore(dayjs())
}

/**
 * Check if a date is today
 */
export function isToday(isoDate: string): boolean {
  return dayjs(isoDate).isSame(dayjs(), 'day')
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(isoDate: string): boolean {
  return dayjs(isoDate).isAfter(dayjs())
}

/**
 * Get the start of today in ISO format
 */
export function getStartOfToday(): string {
  return dayjs().startOf('day').toISOString()
}

/**
 * Get the end of today in ISO format
 */
export function getEndOfToday(): string {
  return dayjs().endOf('day').toISOString()
}

/**
 * Parse various date formats and return ISO string
 */
export function parseToISO(dateString: string): string | null {
  const trimmed = dateString.trim()
  if (!trimmed) return null

  // Common date formats to try (strict parsing).
  const formats = [
    'YYYY-MM-DD',
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'YYYY-MM-DD HH:mm:ss',
    'MM/DD/YYYY HH:mm:ss',
    'DD/MM/YYYY HH:mm:ss',
    'YYYY-MM-DDTHH:mm:ss',
    'YYYY-MM-DDTHH:mm:ssZ',
  ] as const

  // IMPORTANT:
  // - Avoid Dayjs auto-parsing: it's permissive and can accept invalid dates.
  // - Parse as UTC to keep date inputs stable across timezones.
  for (const format of formats) {
    const parsed = dayjs.utc(trimmed, format, true)
    if (parsed.isValid()) return parsed.toISOString()
  }
  return null
}

/**
 * Calculate the duration between two dates
 */
export function calculateDuration(startISO: string, endISO: string): {
  hours: number
  days: number
  readable: string
} {
  const start = dayjs(startISO)
  const end = dayjs(endISO)
  const diff = end.diff(start)
  const duration = dayjs.duration(diff)
  
  const hours = Math.floor(duration.asHours())
  const days = Math.floor(duration.asDays())
  
  let readable: string
  if (days > 0) {
    readable = `${days} day${days === 1 ? '' : 's'}`
    if (hours % 24 > 0) {
      readable += ` ${hours % 24}h`
    }
  } else {
    readable = `${hours} hour${hours === 1 ? '' : 's'}`
  }
  
  return { hours, days, readable }
}

/**
 * Check if two date ranges overlap
 */
export function doDateRangesOverlap(
  start1: string, 
  end1: string, 
  start2: string, 
  end2: string
): boolean {
  const s1 = dayjs(start1)
  const e1 = dayjs(end1)
  const s2 = dayjs(start2)
  const e2 = dayjs(end2)
  
  return s1.isBefore(e2) && s2.isBefore(e1)
}

/**
 * Generate date range for a given period
 */
export function getDateRange(period: 'today' | 'week' | 'month' | 'quarter'): {
  start: string
  end: string
} {
  const now = dayjs()
  
  switch (period) {
    case 'today':
      return {
        start: now.startOf('day').toISOString(),
        end: now.endOf('day').toISOString(),
      }
    case 'week':
      return {
        start: now.startOf('week').toISOString(),
        end: now.endOf('week').toISOString(),
      }
    case 'month':
      return {
        start: now.startOf('month').toISOString(),
        end: now.endOf('month').toISOString(),
      }
    case 'quarter':
      return {
        start: now.startOf('quarter').toISOString(),
        end: now.endOf('quarter').toISOString(),
      }
    default:
      return {
        start: now.startOf('day').toISOString(),
        end: now.endOf('day').toISOString(),
      }
  }
}

/**
 * Create a new ISO date string for now
 */
export function nowISO(): string {
  return dayjs().toISOString()
}

/**
 * Format date for form inputs (YYYY-MM-DD format)
 */
export function formatForInput(isoDate: string): string {
  return dayjs(isoDate).format('YYYY-MM-DD')
}

/**
 * Format datetime for form inputs (YYYY-MM-DDTHH:mm format)
 */
export function formatDateTimeForInput(isoDate: string | null | undefined): string {
  if (!isoDate) return ''
  return dayjs(isoDate).format('YYYY-MM-DDTHH:mm')
}

/**
 * Convert form input date to ISO string
 *
 * HTML `datetime-local` and `date` inputs use the user's **local** calendar and
 * clock with no timezone suffix. Parsing those strings with `dayjs.utc(...)`
 * misinterprets them as UTC wall time, which shifts the stored instant when
 * `formatDateTimeForInput` (local) and FullCalendar (`timeZone: 'local'`) agree
 * on local semantics. Parse as local, then persist as ISO (UTC instant).
 */
export function inputDateToISO(inputDate: string, inputTime?: string): string | null {
  const trimmed = inputDate.trim()
  if (!trimmed) return null

  if (inputTime) {
    const parsed = dayjs(`${trimmed} ${inputTime.trim()}`, 'YYYY-MM-DD HH:mm', true)
    return parsed.isValid() ? parsed.toISOString() : null
  }

  if (trimmed.includes('T')) {
    const formats = ['YYYY-MM-DDTHH:mm', 'YYYY-MM-DDTHH:mm:ss'] as const
    for (const format of formats) {
      const parsed = dayjs(trimmed, format, true)
      if (parsed.isValid()) return parsed.toISOString()
    }
    return null
  }

  const parsed = dayjs(trimmed, 'YYYY-MM-DD', true)
  return parsed.isValid() ? parsed.startOf('day').toISOString() : null
}

/**
 * Get timezone name
 */
export function getTimezone(): string {
  return dayjs.tz.guess()
}

/**
 * Convert UTC time to local time
 */
export function utcToLocal(isoDate: string): string {
  return dayjs.utc(isoDate).local().toISOString()
}

/**
 * Convert local time to UTC
 */
export function localToUTC(isoDate: string): string {
  return dayjs(isoDate).utc().toISOString()
}