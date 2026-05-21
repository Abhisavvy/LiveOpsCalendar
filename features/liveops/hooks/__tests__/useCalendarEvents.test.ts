import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCalendarEvents } from '../useCalendarEvents'
import { useEventStore } from '../useEventStore'
import { OPEN_ENDED_EVENT_END } from '../../types/events'
import dayjs from 'dayjs'

describe('useCalendarEvents', () => {
  beforeEach(() => {
    useEventStore.setState({ filteredEvents: [] } as any)
  })

  it('maps open-ended events to display end', () => {
    useEventStore.setState({
      filteredEvents: [
        {
          id: 'event-1',
          title: 'Open',
          start: '2026-05-01T00:00:00.000Z',
          end: null,
          cohort: ['D0', 'D1'],
          eventType: 'IAP',
          placement: ['Home screen'],
          description: '',
          status: 'Draft',
          createdAt: '2026-05-01T00:00:00.000Z',
          updatedAt: '2026-05-01T00:00:00.000Z',
        },
      ],
    } as any)

    const { result } = renderHook(() => useCalendarEvents())
    expect(result.current.events[0]?.end).toBe(OPEN_ENDED_EVENT_END)
  })

  it('adds client and normalized event type classes', () => {
    useEventStore.setState({
      filteredEvents: [
        {
          id: 'event-2',
          title: 'Rolling Retention',
          start: '2026-05-02T00:00:00.000Z',
          end: '2026-05-03T00:00:00.000Z',
          cohort: ['All'],
          eventType: 'Rolling Retention',
          playerType: 'All',
          osType: 'All',
          client: 'In-game',
          placement: ['Home screen'],
          description: '',
          status: 'Active',
          createdAt: '2026-05-01T00:00:00.000Z',
          updatedAt: '2026-05-01T00:00:00.000Z',
        },
      ],
    } as any)

    const { result } = renderHook(() => useCalendarEvents())
    expect(result.current.events[0]?.classNames).toEqual(
      expect.arrayContaining(['event-rolling-retention', 'client-in-game'])
    )
  })

  it('expands recurring events into multiple calendar entries', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-15T00:00:00.000Z'))
    const start = '2026-01-01T08:00:00.000Z'
    useEventStore.setState({
      filteredEvents: [
        {
          id: 'event-3',
          title: 'Daily',
          start,
          end: '2026-01-01T09:00:00.000Z',
          cohort: ['All'],
          eventType: 'IAP',
          playerType: 'All',
          osType: 'All',
          client: 'Kinoa',
          placement: ['Home screen'],
          description: '',
          status: 'Draft',
          recurrence: {
            frequency: 'daily',
            interval: 1,
            count: 3,
          },
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    } as any)

    const { result } = renderHook(() => useCalendarEvents())
    const starts = result.current.events.map((event) =>
      dayjs(event.start as string).format('YYYY-MM-DD')
    )
    expect(starts).toEqual(['2026-01-01', '2026-01-02', '2026-01-03'])
    vi.useRealTimers()
  })

  it('derives per-occurrence status for recurring events', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-01T08:30:00.000Z'))
    const start = '2026-04-30T08:00:00.000Z'
    useEventStore.setState({
      filteredEvents: [
        {
          id: 'event-4',
          title: 'Status Recurrence',
          start,
          end: '2026-04-30T09:00:00.000Z',
          cohort: ['All'],
          eventType: 'IAP',
          playerType: 'All',
          osType: 'All',
          client: 'Kinoa',
          placement: ['Home screen'],
          description: '',
          status: 'Scheduled',
          recurrence: {
            frequency: 'daily',
            interval: 1,
            count: 3,
          },
          createdAt: '2026-04-30T00:00:00.000Z',
          updatedAt: '2026-04-30T00:00:00.000Z',
        },
      ],
    } as any)

    const { result } = renderHook(() => useCalendarEvents())
    const statusTimeline = result.current.events.map((event) => {
      const date = dayjs(event.start as string).format('YYYY-MM-DD')
      const status = (event.extendedProps as { status?: string } | undefined)?.status ?? 'Unknown'
      return { date, status }
    })

    expect(statusTimeline).toEqual([
      { date: '2026-04-30', status: 'Ended' },
      { date: '2026-05-01', status: 'Active' },
      { date: '2026-05-02', status: 'Scheduled' },
    ])
    vi.useRealTimers()
  })
})
