import dayjs, { type Dayjs } from 'dayjs'
import type { LiveOpsEvent, RecurrenceConfig } from '../types/events'

export type RecurrenceWindow = {
  rangeStart: Dayjs
  rangeEnd: Dayjs
}

export type RecurrenceOccurrence = {
  start: string
  end: string | null
}

/**
 * Compute the recurrence window (past 12 months through next 24 months).
 */
export function getRecurrenceWindow(now: Dayjs = dayjs()): RecurrenceWindow {
  const rangeStart = now.startOf('month').subtract(12, 'month')
  const rangeEnd = now.startOf('month').add(24, 'month').endOf('month')
  return { rangeStart, rangeEnd }
}

const isSameOrAfter = (value: Dayjs, compare: Dayjs) =>
  value.isSame(compare) || value.isAfter(compare)

const isSameOrBefore = (value: Dayjs, compare: Dayjs) =>
  value.isSame(compare) || value.isBefore(compare)

const withStartTime = (candidate: Dayjs, start: Dayjs) =>
  candidate
    .hour(start.hour())
    .minute(start.minute())
    .second(start.second())
    .millisecond(start.millisecond())

function buildOccurrence(event: LiveOpsEvent, start: Dayjs): RecurrenceOccurrence {
  if (!event.end) {
    return { start: start.toISOString(), end: null }
  }
  const durationMs = dayjs(event.end).diff(dayjs(event.start))
  const end = start.add(durationMs, 'millisecond').toISOString()
  return { start: start.toISOString(), end }
}

function generateDailyOccurrences(
  start: Dayjs,
  interval: number,
  rangeEnd: Dayjs
): Dayjs[] {
  const occurrences: Dayjs[] = []
  let cursor = start
  while (isSameOrBefore(cursor, rangeEnd)) {
    occurrences.push(cursor)
    cursor = cursor.add(interval, 'day')
  }
  return occurrences
}

function generateWeeklyOccurrences(
  start: Dayjs,
  config: RecurrenceConfig,
  rangeEnd: Dayjs
): Dayjs[] {
  const occurrences: Dayjs[] = []
  const interval = config.interval || 1
  const daysOfWeek =
    config.daysOfWeek && config.daysOfWeek.length > 0
      ? config.daysOfWeek
      : [start.day()]
  let weekCursor = start.startOf('week')
  while (isSameOrBefore(weekCursor, rangeEnd)) {
    daysOfWeek.forEach((day) => {
      const candidate = withStartTime(weekCursor.add(day, 'day'), start)
      occurrences.push(candidate)
    })
    weekCursor = weekCursor.add(interval, 'week')
  }
  return occurrences
}

function generateMonthlyOccurrences(
  start: Dayjs,
  config: RecurrenceConfig,
  rangeEnd: Dayjs
): Dayjs[] {
  const occurrences: Dayjs[] = []
  const interval = config.interval || 1
  const baseMonth = start.startOf('month')
  const startWeekday = start.day()
  const weekdayOrdinal = Math.ceil(start.date() / 7)

  let monthCursor = baseMonth
  while (isSameOrBefore(monthCursor, rangeEnd)) {
    let candidate: Dayjs | null = null

    if (config.monthlyPattern === 'weekday') {
      const firstOfMonth = monthCursor.startOf('month')
      const offset = (startWeekday - firstOfMonth.day() + 7) % 7
      const firstWeekday = firstOfMonth.add(offset, 'day')
      const nthWeekday = firstWeekday.add((weekdayOrdinal - 1) * 7, 'day')
      if (nthWeekday.month() === monthCursor.month()) {
        candidate = withStartTime(nthWeekday, start)
      }
    } else {
      const desiredDay = config.dayOfMonth || start.date()
      const clampedDay = Math.min(desiredDay, monthCursor.daysInMonth())
      candidate = withStartTime(monthCursor.date(clampedDay), start)
    }

    if (candidate) {
      occurrences.push(candidate)
    }

    monthCursor = monthCursor.add(interval, 'month')
  }
  return occurrences
}

/**
 * Expand a recurring event into occurrences within the recurrence window.
 */
export function expandRecurrence(
  event: LiveOpsEvent,
  window: RecurrenceWindow = getRecurrenceWindow()
): RecurrenceOccurrence[] {
  const recurrence = event.recurrence
  if (!recurrence) return []

  const start = dayjs(event.start)
  const until = recurrence.until ? dayjs(recurrence.until) : null
  const { rangeStart, rangeEnd } = window

  let candidates: Dayjs[] = []

  if (recurrence.frequency === 'daily') {
    candidates = generateDailyOccurrences(start, recurrence.interval, rangeEnd)
  } else if (recurrence.frequency === 'weekly') {
    candidates = generateWeeklyOccurrences(start, recurrence, rangeEnd)
  } else if (recurrence.frequency === 'monthly') {
    candidates = generateMonthlyOccurrences(start, recurrence, rangeEnd)
  } else {
    const weeklyCandidates =
      recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0
        ? generateWeeklyOccurrences(start, recurrence, rangeEnd)
        : []
    const monthlyCandidates =
      recurrence.monthlyPattern || recurrence.dayOfMonth
        ? generateMonthlyOccurrences(start, recurrence, rangeEnd)
        : []
    if (weeklyCandidates.length === 0 && monthlyCandidates.length === 0) {
      candidates = generateDailyOccurrences(start, recurrence.interval, rangeEnd)
    } else {
      const seen = new Set<string>()
      candidates = [...weeklyCandidates, ...monthlyCandidates].filter((candidate) => {
        const key = candidate.toISOString()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    }
  }

  const filtered = candidates
    .filter((candidate) => isSameOrAfter(candidate, start))
    .filter((candidate) => isSameOrAfter(candidate, rangeStart))
    .filter((candidate) => isSameOrBefore(candidate, rangeEnd))
    .filter((candidate) => (until ? isSameOrBefore(candidate, until) : true))
    .sort((a, b) => a.valueOf() - b.valueOf())

  const limited = recurrence.count ? filtered.slice(0, recurrence.count) : filtered
  return limited.map((candidate) => buildOccurrence(event, candidate))
}
