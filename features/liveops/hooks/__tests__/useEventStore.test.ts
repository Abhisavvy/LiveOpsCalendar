import { describe, it, expect, beforeEach } from 'vitest'
import { useEventStore } from '../useEventStore'
import type { LiveOpsEvent } from '../../types/events'
import { nowISO, addDurationToDate } from '../../lib/date-utils'

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

describe('useEventStore (Phase 1)', () => {
  beforeEach(() => resetStore())

  it('restores a deleted event (undo delete)', () => {
    const start = nowISO()
    const end = addDurationToDate(start, '1d')

    const created = useEventStore.getState().addEvent({
      title: 'Test Event',
      start,
      end,
      cohort: 'All',
      eventType: 'IAP',
      placement: 'Homescreen',
      description: '',
      status: 'Draft',
    })

    const deleted = useEventStore.getState().deleteEvent(created.id)
    expect(deleted).toBe(true)
    expect(useEventStore.getState().events).toHaveLength(0)

    const restored = useEventStore.getState().restoreEvent(created as LiveOpsEvent)
    expect(restored).toBe(true)
    expect(useEventStore.getState().events).toHaveLength(1)
    expect(useEventStore.getState().events[0]?.id).toBe(created.id)
  })

  it('does not restore if the id already exists', () => {
    const start = nowISO()
    const end = addDurationToDate(start, '1d')

    const created = useEventStore.getState().addEvent({
      title: 'Test Event',
      start,
      end,
      cohort: 'All',
      eventType: 'IAP',
      placement: 'Homescreen',
      description: '',
      status: 'Draft',
    })

    const restored = useEventStore.getState().restoreEvent(created as LiveOpsEvent)
    expect(restored).toBe(false)
    expect(useEventStore.getState().events).toHaveLength(1)
  })
})

