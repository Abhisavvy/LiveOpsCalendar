import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import { getAutomaticStatus } from '../event-status'
import type { LiveOpsEvent } from '../../types/events'

function baseEvent(overrides: Partial<LiveOpsEvent> = {}): LiveOpsEvent {
  return {
    id: 'evt-1' as LiveOpsEvent['id'],
    title: 'Event',
    start: '2026-05-01T10:00:00.000Z',
    end: '2026-05-01T12:00:00.000Z',
    cohort: ['All'],
    eventType: 'IAP',
    playerType: 'All',
    osType: 'All',
    client: 'Kinoa',
    placement: ['Home screen'],
    description: '',
    status: 'Scheduled',
    recurrence: undefined,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('getAutomaticStatus', () => {
  it('preserves Draft regardless of timing', () => {
    const now = dayjs('2026-05-10T10:00:00.000Z')
    const event = baseEvent({
      status: 'Draft',
      start: now.subtract(5, 'day').toISOString(),
      end: now.subtract(4, 'day').toISOString(),
    })

    expect(getAutomaticStatus(event, now)).toBe('Draft')
  })

  it('marks future events as Scheduled', () => {
    const now = dayjs('2026-05-10T10:00:00.000Z')
    const event = baseEvent({
      status: 'Active',
      start: now.add(2, 'day').toISOString(),
      end: now.add(3, 'day').toISOString(),
    })

    expect(getAutomaticStatus(event, now)).toBe('Scheduled')
  })

  it('marks past events as Ended', () => {
    const now = dayjs('2026-05-10T10:00:00.000Z')
    const event = baseEvent({
      status: 'Scheduled',
      start: now.subtract(3, 'day').toISOString(),
      end: now.subtract(2, 'day').toISOString(),
    })

    expect(getAutomaticStatus(event, now)).toBe('Ended')
  })

  it('marks active window events as Active', () => {
    const now = dayjs('2026-05-10T10:00:00.000Z')
    const event = baseEvent({
      status: 'Scheduled',
      start: now.subtract(1, 'hour').toISOString(),
      end: now.add(1, 'hour').toISOString(),
    })

    expect(getAutomaticStatus(event, now)).toBe('Active')
  })

  it('treats open-ended events as Active once started', () => {
    const now = dayjs('2026-05-10T10:00:00.000Z')
    const event = baseEvent({
      start: now.subtract(2, 'day').toISOString(),
      end: null,
    })

    expect(getAutomaticStatus(event, now)).toBe('Active')
  })

  it('uses recurrence occurrences to mark Active', () => {
    const now = dayjs('2026-05-10T10:00:00.000Z')
    const event = baseEvent({
      start: now.subtract(1, 'hour').toISOString(),
      end: now.add(1, 'hour').toISOString(),
      recurrence: {
        frequency: 'daily',
        interval: 1,
        count: 3,
      },
    })

    expect(getAutomaticStatus(event, now)).toBe('Active')
  })

  it('marks recurring events as Scheduled when next occurrence is future', () => {
    const now = dayjs('2026-05-10T10:00:00.000Z')
    const event = baseEvent({
      start: now.add(1, 'day').toISOString(),
      end: now.add(1, 'day').add(2, 'hour').toISOString(),
      recurrence: {
        frequency: 'daily',
        interval: 1,
        count: 2,
      },
    })

    expect(getAutomaticStatus(event, now)).toBe('Scheduled')
  })

  it('marks recurring events as Ended when all occurrences are past', () => {
    const now = dayjs('2026-05-10T10:00:00.000Z')
    const event = baseEvent({
      start: now.subtract(5, 'day').toISOString(),
      end: now.subtract(5, 'day').add(2, 'hour').toISOString(),
      recurrence: {
        frequency: 'daily',
        interval: 1,
        count: 2,
      },
    })

    expect(getAutomaticStatus(event, now)).toBe('Ended')
  })
})
