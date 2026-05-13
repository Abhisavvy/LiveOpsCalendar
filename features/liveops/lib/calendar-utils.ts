import type { LiveOpsEvent } from '../types/events'
import { OPEN_ENDED_EVENT_END } from '../types/events'

export function getDisplayEnd(end: string | null): string {
  return end ?? OPEN_ENDED_EVENT_END
}

export function getEventDropUpdate(
  event: LiveOpsEvent,
  newStart: string
): { start: string; end: string | null } {
  if (!event.end) {
    return { start: newStart, end: null }
  }

  const durationMs = new Date(event.end).getTime() - new Date(event.start).getTime()
  const nextEnd = new Date(new Date(newStart).getTime() + durationMs).toISOString()
  return { start: newStart, end: nextEnd }
}
