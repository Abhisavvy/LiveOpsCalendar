import dayjs, { type Dayjs } from 'dayjs'
import type { EventStatus, LiveOpsEvent } from '../types/events'
import { expandRecurrence } from './recurrence-utils'

function getStatusForWindow(start: Dayjs, end: Dayjs | null, now: Dayjs): EventStatus {
  if (start.isAfter(now)) {
    return 'Scheduled'
  }

  if (end && end.isBefore(now)) {
    return 'Ended'
  }

  return 'Active'
}

/**
 * Derive a status from event timing, preserving Draft when set manually.
 */
export function getAutomaticStatus(event: LiveOpsEvent, now: Dayjs = dayjs()): EventStatus {
  if (event.status === 'Draft') {
    return 'Draft'
  }

  if (!event.recurrence) {
    return getStatusForWindow(dayjs(event.start), event.end ? dayjs(event.end) : null, now)
  }

  const occurrences = expandRecurrence(event)
  if (occurrences.length === 0) {
    return getStatusForWindow(dayjs(event.start), event.end ? dayjs(event.end) : null, now)
  }

  const hasActive = occurrences.some(occurrence => {
    const start = dayjs(occurrence.start)
    const end = occurrence.end ? dayjs(occurrence.end) : null
    return !start.isAfter(now) && (!end || !end.isBefore(now))
  })

  if (hasActive) {
    return 'Active'
  }

  const hasFuture = occurrences.some(occurrence => dayjs(occurrence.start).isAfter(now))
  return hasFuture ? 'Scheduled' : 'Ended'
}
