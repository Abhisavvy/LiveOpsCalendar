import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { LiveOpsEvent } from '../../types/events'
import { createEventId } from '../../types/events'
import { nowISO, addDurationToDate } from '../../lib/date-utils'
import { useEventStore } from '../useEventStore'
import { useEventFilters } from '../useEventFilters'

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

function makeStoredEvent(overrides: Partial<LiveOpsEvent> = {}): LiveOpsEvent {
  const start = overrides.start ?? nowISO()
  const end = overrides.end ?? addDurationToDate(start, '1d')
  return {
    id: overrides.id ?? createEventId(),
    title: overrides.title ?? 'E',
    start,
    end,
    cohort: overrides.cohort ?? ['All'],
    eventType: overrides.eventType ?? 'IAP',
    playerType: overrides.playerType ?? 'All',
    osType: overrides.osType ?? 'All',
    client: overrides.client ?? 'Kinoa',
    placement: overrides.placement ?? 'Homescreen',
    description: overrides.description ?? '',
    status: overrides.status ?? 'Draft',
    createdAt: overrides.createdAt ?? nowISO(),
    updatedAt: overrides.updatedAt ?? nowISO(),
    ...overrides,
  } as LiveOpsEvent
}

describe('useEventFilters', () => {
  beforeEach(() => resetStore())

  it('exposes playerTypes and osTypes alongside cohorts and eventTypes in filterOptions', () => {
    useEventStore.setState({
      events: [
        makeStoredEvent({ cohort: ['D0'], playerType: 'Payer', osType: 'Android' }),
        makeStoredEvent({ cohort: ['D1'], playerType: 'Non payer', osType: 'iOS' }),
      ],
      filteredEvents: [],
    })

    const { result } = renderHook(() => useEventFilters())

    expect(result.current.filterOptions.playerTypes.sort()).toEqual(['Non payer', 'Payer'])
    expect(result.current.filterOptions.osTypes.sort()).toEqual(['Android', 'iOS'])
  })

  it('treats playerType filters as active in filterStats', () => {
    const { result } = renderHook(() => useEventFilters())

    expect(result.current.filterStats.hasActiveFilters).toBe(false)

    act(() => {
      useEventStore.getState().setFilters({ playerTypes: ['Payer'] })
    })

    expect(result.current.filterStats.hasActiveFilters).toBe(true)
  })

  it('treats only All sentinel as inactive in filterStats (player / cohort / OS)', () => {
    useEventStore.setState({ events: [makeStoredEvent()], filteredEvents: [] })
    useEventStore.getState().applyFilters()

    const { result } = renderHook(() => useEventFilters())

    expect(result.current.filterStats.hasActiveFilters).toBe(false)

    act(() => {
      useEventStore.getState().setFilters({ playerTypes: ['All'] })
    })
    expect(result.current.filterStats.hasActiveFilters).toBe(false)

    act(() => {
      useEventStore.getState().setFilters({
        cohorts: ['All'],
        osTypes: ['All'],
      })
    })
    expect(result.current.filterStats.hasActiveFilters).toBe(false)
  })

  it('togglePlayerType: selecting All clears specifics; specifics clear All', () => {
    const { result } = renderHook(() => useEventFilters())

    act(() => {
      result.current.togglePlayerType('Payer')
    })
    expect(result.current.filters.playerTypes).toEqual(['Payer'])

    act(() => {
      result.current.togglePlayerType('All')
    })
    expect(result.current.filters.playerTypes).toEqual(['All'])

    act(() => {
      result.current.togglePlayerType('Non payer')
    })
    expect(result.current.filters.playerTypes).toEqual(['Non payer'])

    act(() => {
      result.current.togglePlayerType('All')
    })
    expect(result.current.filters.playerTypes).toEqual(['All'])

    act(() => {
      result.current.togglePlayerType('All')
    })
    expect(result.current.filters.playerTypes).toEqual([])
  })

  it('toggleOsType: selecting All clears specifics; specifics clear All', () => {
    const { result } = renderHook(() => useEventFilters())

    act(() => {
      result.current.toggleOsType('Android')
    })
    expect(result.current.filters.osTypes).toEqual(['Android'])

    act(() => {
      result.current.toggleOsType('All')
    })
    expect(result.current.filters.osTypes).toEqual(['All'])

    act(() => {
      result.current.toggleOsType('iOS')
    })
    expect(result.current.filters.osTypes).toEqual(['iOS'])
  })

  it('toggleCohort respects All exclusivity', () => {
    const { result } = renderHook(() => useEventFilters())

    act(() => {
      result.current.toggleCohort('D0')
    })
    expect(result.current.filters.cohorts).toEqual(['D0'])

    act(() => {
      result.current.toggleCohort('All')
    })
    expect(result.current.filters.cohorts).toEqual(['All'])

    act(() => {
      result.current.toggleCohort('D1')
    })
    expect(result.current.filters.cohorts).toEqual(['D1'])
  })

  it('selectAll for cohorts/player/OS sets All sentinel only', () => {
    useEventStore.setState({
      events: [
        makeStoredEvent({
          cohort: ['D0'],
          playerType: 'Payer',
          osType: 'Android',
        }),
      ],
      filteredEvents: [],
    })
    useEventStore.getState().applyFilters()

    const { result } = renderHook(() => useEventFilters())

    act(() => {
      result.current.selectAll('cohorts')
      result.current.selectAll('playerTypes')
      result.current.selectAll('osTypes')
    })

    expect(result.current.filters.cohorts).toEqual(['All'])
    expect(result.current.filters.playerTypes).toEqual(['All'])
    expect(result.current.filters.osTypes).toEqual(['All'])
  })

  it('setPlayerTypes/setOsTypes strip All when mixed with specifics', () => {
    const { result } = renderHook(() => useEventFilters())

    act(() => {
      result.current.setPlayerTypes(['All', 'Payer'])
    })
    expect(result.current.filters.playerTypes).toEqual(['Payer'])

    act(() => {
      result.current.setOsTypes(['All', 'iOS'])
    })
    expect(result.current.filters.osTypes).toEqual(['iOS'])
  })
})
