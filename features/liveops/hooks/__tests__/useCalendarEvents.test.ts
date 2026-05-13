import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCalendarEvents } from '../useCalendarEvents'
import { useEventStore } from '../useEventStore'
import { OPEN_ENDED_EVENT_END } from '../../types/events'

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
          placement: 'Lobby',
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
          placement: 'Lobby',
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
})
