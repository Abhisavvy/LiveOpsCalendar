import { describe, it, expect, beforeEach } from 'vitest'
import { useEventStore } from '../useEventStore'
import type { EventInput, LiveOpsEvent } from '../../types/events'
import { nowISO, addDurationToDate } from '../../lib/date-utils'

function baseInput(overrides: Partial<EventInput> = {}): EventInput {
  const start = nowISO()
  return {
    title: 'Test Event',
    start,
    end: addDurationToDate(start, '1d'),
    cohort: ['All'],
    eventType: 'IAP',
    placement: ['Home screen'],
    description: '',
    status: 'Draft',
    playerType: 'All',
    osType: 'All',
    client: 'Kinoa',
    ...overrides,
  }
}

function resetStore() {
  useEventStore.setState({
    events: [],
    filteredEvents: [],
    filters: {
      searchQuery: '',
      eventTypes: [],
      cohorts: [],
      statuses: [],
      playerTypes: [],
      osTypes: [],
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

    const created = useEventStore.getState().addEvent(
      baseInput({ title: 'Test Event', start, end }),
    )

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

    const created = useEventStore.getState().addEvent(
      baseInput({ title: 'Test Event', start, end }),
    )

    const restored = useEventStore.getState().restoreEvent(created as LiveOpsEvent)
    expect(restored).toBe(false)
    expect(useEventStore.getState().events).toHaveLength(1)
  })
})

describe('useEventStore applyFilters (audience semantics)', () => {
  beforeEach(() => resetStore())

  it('includes events targeted at cohort All when cohort filters are active', () => {
    useEventStore.getState().addEvent(baseInput({ title: 'Broad', cohort: ['All'] }))
    useEventStore.getState().addEvent(baseInput({ title: 'Narrow', cohort: ['D0'] }))

    useEventStore.getState().setFilters({ cohorts: ['D0'] })

    expect(useEventStore.getState().filteredEvents.map(e => e.title).sort()).toEqual(['Broad', 'Narrow'])
  })

  it('excludes specificity mismatched cohort rows when cohort filters are active', () => {
    useEventStore.getState().addEvent(baseInput({ title: 'Broad', cohort: ['All'] }))
    useEventStore.getState().addEvent(baseInput({ title: 'D1 only', cohort: ['D1'] }))

    useEventStore.getState().setFilters({ cohorts: ['D0'] })

    expect(useEventStore.getState().filteredEvents.map(e => e.title)).toEqual(['Broad'])
  })

  it('requires every selected cohort on the event (AND), not just any overlap', () => {
    useEventStore.getState().addEvent(baseInput({ title: 'Both D0+D1', cohort: ['D0', 'D1'] }))
    useEventStore.getState().addEvent(baseInput({ title: 'D0 only', cohort: ['D0'] }))
    useEventStore.getState().addEvent(baseInput({ title: 'D1 only', cohort: ['D1'] }))

    useEventStore.getState().setFilters({ cohorts: ['D0', 'D1'] })

    expect(useEventStore.getState().filteredEvents.map(e => e.title)).toEqual(['Both D0+D1'])
  })

  it('still matches cohort All events when multiple cohort filters are selected', () => {
    useEventStore.getState().addEvent(baseInput({ title: 'Broad', cohort: ['All'] }))
    useEventStore.getState().addEvent(baseInput({ title: 'D0+D1', cohort: ['D0', 'D1'] }))
    useEventStore.getState().addEvent(baseInput({ title: 'D0 only', cohort: ['D0'] }))

    useEventStore.getState().setFilters({ cohorts: ['D0', 'D1'] })

    expect(useEventStore.getState().filteredEvents.map(e => e.title).sort()).toEqual(['Broad', 'D0+D1'])
  })

  it('includes events with playerType All when playerType filters are active', () => {
    useEventStore.getState().addEvent(baseInput({ title: 'All players', playerType: 'All' }))
    useEventStore.getState().addEvent(baseInput({ title: 'Payers only', playerType: 'Payer' }))

    useEventStore.getState().setFilters({ playerTypes: ['Payer'] })

    expect(useEventStore.getState().filteredEvents.map(e => e.title).sort()).toEqual([
      'All players',
      'Payers only',
    ])
  })

  it('normalizes legacy playerType values when filtering', () => {
    useEventStore.getState().addEvent(
      baseInput({
        title: 'Legacy payer',
        playerType: 'payer' as unknown as EventInput['playerType'],
      }),
    )
    useEventStore.getState().addEvent(baseInput({ title: 'All players', playerType: 'All' }))

    useEventStore.getState().setFilters({ playerTypes: ['Payer'] })

    expect(useEventStore.getState().filteredEvents.map(e => e.title).sort()).toEqual([
      'All players',
      'Legacy payer',
    ])
  })

  it('excludes payer-only rows when filtering to Non payer only', () => {
    useEventStore.getState().addEvent(baseInput({ title: 'Broad', playerType: 'All' }))
    useEventStore.getState().addEvent(baseInput({ title: 'Payers', playerType: 'Payer' }))

    useEventStore.getState().setFilters({ playerTypes: ['Non payer'] })

    expect(useEventStore.getState().filteredEvents.map(e => e.title)).toEqual(['Broad'])
  })

  it('includes events with osType All when OS filters are active', () => {
    useEventStore.getState().addEvent(baseInput({ title: 'Cross-platform', osType: 'All' }))
    useEventStore.getState().addEvent(baseInput({ title: 'Android only', osType: 'Android' }))

    useEventStore.getState().setFilters({ osTypes: ['iOS'] })

    expect(useEventStore.getState().filteredEvents.map(e => e.title)).toEqual(['Cross-platform'])
  })

  it('does not apply cohort filter when selection includes All', () => {
    useEventStore.getState().addEvent(baseInput({ title: 'D0 row', cohort: ['D0'] }))
    useEventStore.getState().addEvent(baseInput({ title: 'D1 row', cohort: ['D1'] }))

    useEventStore.getState().setFilters({ cohorts: ['All'] })

    expect(useEventStore.getState().filteredEvents.map(e => e.title).sort()).toEqual([
      'D0 row',
      'D1 row',
    ])
  })

  it('ignores cohort filtering when cohort selection mixes All with specifics', () => {
    useEventStore.getState().addEvent(baseInput({ title: 'D0 row', cohort: ['D0'] }))
    useEventStore.getState().addEvent(baseInput({ title: 'D1 row', cohort: ['D1'] }))

    useEventStore.getState().setFilters({ cohorts: ['All', 'D0'] })

    expect(useEventStore.getState().filteredEvents.map(e => e.title).sort()).toEqual([
      'D0 row',
      'D1 row',
    ])
  })

  it('does not apply player type filter when selection includes All', () => {
    useEventStore.getState().addEvent(baseInput({ title: 'Payers', playerType: 'Payer' }))
    useEventStore.getState().addEvent(baseInput({ title: 'Non payers', playerType: 'Non payer' }))

    useEventStore.getState().setFilters({ playerTypes: ['All'] })

    expect(useEventStore.getState().filteredEvents.map(e => e.title).sort()).toEqual([
      'Non payers',
      'Payers',
    ])
  })

  it('does not apply OS filter when selection includes All', () => {
    useEventStore.getState().addEvent(baseInput({ title: 'Android', osType: 'Android' }))
    useEventStore.getState().addEvent(baseInput({ title: 'iOS row', osType: 'iOS' }))

    useEventStore.getState().setFilters({ osTypes: ['All'] })

    expect(useEventStore.getState().filteredEvents.map(e => e.title).sort()).toEqual([
      'Android',
      'iOS row',
    ])
  })
})

