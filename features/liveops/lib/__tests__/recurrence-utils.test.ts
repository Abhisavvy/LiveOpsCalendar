import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import { expandRecurrence, getRecurrenceWindow } from '../recurrence-utils'
import type { LiveOpsEvent } from '../../types/events'

function baseEvent(overrides: Partial<LiveOpsEvent> = {}): LiveOpsEvent {
  return {
    id: 'event-1' as LiveOpsEvent['id'],
    title: 'Test',
    start: '2026-05-05T10:00:00.000Z',
    end: '2026-05-05T12:00:00.000Z',
    cohort: ['All'],
    eventType: 'IAP',
    playerType: 'All',
    osType: 'All',
    client: 'Kinoa',
    placement: ['Home screen'],
    description: '',
    status: 'Draft',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('getRecurrenceWindow', () => {
  it('expands to past 12 and next 24 months', () => {
    const { rangeStart, rangeEnd } = getRecurrenceWindow(dayjs('2026-05-15T12:00:00.000Z'))
    expect(rangeStart.format('YYYY-MM-DD')).toBe('2025-05-01')
    expect(rangeEnd.format('YYYY-MM-DD')).toBe('2028-05-31')
  })
})

describe('expandRecurrence', () => {
  it('anchors weekly intervals to the start week', () => {
    const event = baseEvent({
      recurrence: {
        frequency: 'weekly',
        interval: 2,
        daysOfWeek: [2],
      },
    })
    const occurrences = expandRecurrence(event, {
      rangeStart: dayjs('2026-05-01T00:00:00.000Z'),
      rangeEnd: dayjs('2026-06-30T23:59:59.999Z'),
    })
    const dates = occurrences.map((occurrence) =>
      dayjs(occurrence.start).format('YYYY-MM-DD')
    )
    expect(dates).toEqual([
      '2026-05-05',
      '2026-05-19',
      '2026-06-02',
      '2026-06-16',
      '2026-06-30',
    ])
  })

  it('respects count limits', () => {
    const event = baseEvent({
      start: '2026-01-01T08:00:00.000Z',
      end: '2026-01-01T09:00:00.000Z',
      recurrence: {
        frequency: 'daily',
        interval: 1,
        count: 3,
      },
    })
    const occurrences = expandRecurrence(event, {
      rangeStart: dayjs('2026-01-01T00:00:00.000Z'),
      rangeEnd: dayjs('2026-12-31T23:59:59.999Z'),
    })
    expect(occurrences).toHaveLength(3)
    expect(dayjs(occurrences[0]?.start).format('YYYY-MM-DD')).toBe('2026-01-01')
  })
})
