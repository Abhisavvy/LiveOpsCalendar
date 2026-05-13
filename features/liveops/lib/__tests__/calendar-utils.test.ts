import { describe, it, expect } from 'vitest'
import { getDisplayEnd, getEventDropUpdate } from '../calendar-utils'
import type { LiveOpsEvent } from '../../types/events'
import { OPEN_ENDED_EVENT_END } from '../../types/events'

const baseEvent: LiveOpsEvent = {
  id: 'event-1' as any,
  title: 'Test',
  start: '2026-05-01T00:00:00.000Z',
  end: '2026-05-02T00:00:00.000Z',
  cohort: ['All'],
  eventType: 'IAP',
  placement: 'Lobby',
  description: '',
  status: 'Draft',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
}

describe('calendar-utils', () => {
  it('returns far-future end for open-ended events', () => {
    expect(getDisplayEnd(null)).toBe(OPEN_ENDED_EVENT_END)
  })

  it('keeps end null for open-ended drag updates', () => {
    const updated = getEventDropUpdate({ ...baseEvent, end: null }, '2026-05-10T00:00:00.000Z')
    expect(updated).toEqual({ start: '2026-05-10T00:00:00.000Z', end: null })
  })

  it('preserves duration when updating start', () => {
    const updated = getEventDropUpdate(baseEvent, '2026-05-10T00:00:00.000Z')
    expect(updated.end).toBe('2026-05-11T00:00:00.000Z')
  })
})
