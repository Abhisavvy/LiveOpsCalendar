import { describe, it, expect, beforeEach } from 'vitest'
import { useEventStore } from '../useEventStore'

function resetStore() {
  useEventStore.setState({
    events: [],
    filteredEvents: [],
    filters: {
      searchQuery: '',
      eventTypes: [],
      cohorts: [],
      statuses: [],
    },
    selectedEvent: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
  } as any)
}

describe('useEventStore import flow helpers', () => {
  beforeEach(() => resetStore())

  it('replaceCalendarWithImported does not emit a transient empty state', () => {
    useEventStore.getState().addEvent({
      title: 'Existing',
      start: '2026-01-01T10:00:00.000Z',
      end: '2026-01-01T11:00:00.000Z',
      cohort: ['All'],
      eventType: 'IAP',
      placement: ['Home screen'],
      description: '',
      status: 'Draft',
    })

    const seenLengths: number[] = []
    const unsub = useEventStore.subscribe((state) => {
      seenLengths.push(state.events.length)
    })

    useEventStore.getState().replaceCalendarWithImported([
      {
        id: 'new-1',
        title: 'Imported',
        start: '2026-02-01T10:00:00.000Z',
        end: '2026-02-01T11:00:00.000Z',
        cohort: ['All'],
        eventType: 'Retention',
        placement: ['Game board'],
        description: '',
        status: 'Draft',
      },
    ])

    unsub()
    expect(useEventStore.getState().events).toHaveLength(1)
    expect(useEventStore.getState().events[0]?.title).toBe('Imported')
    expect(seenLengths).not.toContain(0)
  })
})
