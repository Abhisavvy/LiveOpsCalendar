'use client'

import { useMemo, useCallback } from 'react'
import { useEventStore } from './useEventStore'
import type { EventType, EventStatus, OsType, PlayerType } from '../types/events'
import { useDebounce } from './useDebounce'

function audienceFilterActive(values: readonly string[]) {
  return values.length > 0 && !values.includes('All')
}

/** Multi-select with `All` sentinel: selecting `All` clears specifics; specifics clear `All`. */
function toggleAudienceValue(prev: readonly string[], value: string): string[] {
  if (value === 'All') {
    return prev.includes('All') ? [] : ['All']
  }
  const withoutAll = prev.filter(v => v !== 'All')
  if (withoutAll.includes(value)) {
    return withoutAll.filter(v => v !== value)
  }
  return [...withoutAll, value]
}

function normalizeAudienceSetter(values: readonly string[]): string[] {
  if (values.includes('All') && values.length > 1) {
    return values.filter(v => v !== 'All')
  }
  return [...values]
}

export function useEventFilters() {
  const filters = useEventStore(state => state.filters)
  const setFilters = useEventStore(state => state.setFilters)
  const clearFilters = useEventStore(state => state.clearFilters)
  const events = useEventStore(state => state.events)
  const filteredEvents = useEventStore(state => state.filteredEvents)
  
  // Debounce search query to avoid excessive filtering
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300)
  
  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const cohorts = Array.from(new Set(events.map(e => e.cohort).flat())).sort()
    const eventTypes = Array.from(new Set(events.map(e => e.eventType))).sort()
    const statuses = Array.from(new Set(events.map(e => e.status))).sort()
    const placements = Array.from(new Set(events.map(e => e.placement))).sort()
    const playerTypes = Array.from(new Set(events.map(e => e.playerType))).sort()
    const osTypes = Array.from(new Set(events.map(e => e.osType))).sort()

    return {
      cohorts,
      eventTypes,
      statuses,
      placements,
      playerTypes,
      osTypes,
    }
  }, [events])
  
  // Filter statistics
  const filterStats = useMemo(() => {
    const total = events.length
    const filtered = filteredEvents.length
    const hasActiveFilters = Boolean(
      filters.searchQuery.trim() ||
      filters.eventTypes.length > 0 ||
      audienceFilterActive(filters.cohorts) ||
      filters.statuses.length > 0 ||
      audienceFilterActive(filters.playerTypes) ||
      audienceFilterActive(filters.osTypes) ||
      filters.dateRange
    )
    
    return {
      total,
      filtered,
      hidden: total - filtered,
      hasActiveFilters,
      percentage: total > 0 ? Math.round((filtered / total) * 100) : 0,
    }
  }, [events.length, filteredEvents.length, filters])
  
  // Search handlers
  const setSearchQuery = useCallback((query: string) => {
    setFilters({ searchQuery: query })
  }, [setFilters])
  
  const clearSearch = useCallback(() => {
    setFilters({ searchQuery: '' })
  }, [setFilters])
  
  // Event type filters
  const toggleEventType = useCallback((eventType: EventType) => {
    const currentTypes = filters.eventTypes
    const newTypes = currentTypes.includes(eventType)
      ? currentTypes.filter(t => t !== eventType)
      : [...currentTypes, eventType]
    
    setFilters({ eventTypes: newTypes })
  }, [filters.eventTypes, setFilters])
  
  const setEventTypes = useCallback((eventTypes: EventType[]) => {
    setFilters({ eventTypes })
  }, [setFilters])
  
  const clearEventTypes = useCallback(() => {
    setFilters({ eventTypes: [] })
  }, [setFilters])
  
  // Cohort filters
  const toggleCohort = useCallback(
    (cohort: string) => {
      setFilters({ cohorts: toggleAudienceValue(filters.cohorts, cohort) })
    },
    [filters.cohorts, setFilters],
  )
  
  const setCohorts = useCallback(
    (cohorts: string[]) => {
      setFilters({ cohorts: normalizeAudienceSetter(cohorts) })
    },
    [setFilters],
  )
  
  const clearCohorts = useCallback(() => {
    setFilters({ cohorts: [] })
  }, [setFilters])

  // Player type filters
  const togglePlayerType = useCallback(
    (playerType: PlayerType) => {
      setFilters({
        playerTypes: toggleAudienceValue(filters.playerTypes, playerType),
      })
    },
    [filters.playerTypes, setFilters],
  )

  const setPlayerTypes = useCallback(
    (playerTypes: PlayerType[]) => {
      setFilters({
        playerTypes: normalizeAudienceSetter(playerTypes) as PlayerType[],
      })
    },
    [setFilters],
  )

  const clearPlayerTypes = useCallback(() => {
    setFilters({ playerTypes: [] })
  }, [setFilters])

  // OS type filters
  const toggleOsType = useCallback(
    (osType: OsType) => {
      setFilters({ osTypes: toggleAudienceValue(filters.osTypes, osType) })
    },
    [filters.osTypes, setFilters],
  )

  const setOsTypes = useCallback(
    (osTypes: OsType[]) => {
      setFilters({ osTypes: normalizeAudienceSetter(osTypes) as OsType[] })
    },
    [setFilters],
  )

  const clearOsTypes = useCallback(() => {
    setFilters({ osTypes: [] })
  }, [setFilters])

  // Status filters
  const toggleStatus = useCallback((status: EventStatus) => {
    const currentStatuses = filters.statuses
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status]
    
    setFilters({ statuses: newStatuses })
  }, [filters.statuses, setFilters])
  
  const setStatuses = useCallback((statuses: EventStatus[]) => {
    setFilters({ statuses })
  }, [setFilters])
  
  const clearStatuses = useCallback(() => {
    setFilters({ statuses: [] })
  }, [setFilters])
  
  // Date range filters
  const setDateRange = useCallback((startDate?: string, endDate?: string) => {
    setFilters({ 
      dateRange: (startDate || endDate) ? { start: startDate, end: endDate } : undefined 
    })
  }, [setFilters])
  
  const clearDateRange = useCallback(() => {
    setFilters({ dateRange: undefined })
  }, [setFilters])
  
  // Preset filters
  const applyPreset = useCallback((preset: 'active' | 'scheduled' | 'thisWeek' | 'thisMonth') => {
    const now = new Date()
    
    switch (preset) {
      case 'active':
        setFilters({
          statuses: ['Active'],
          eventTypes: [],
          cohorts: [],
          playerTypes: [],
          osTypes: [],
          dateRange: undefined
        })
        break
        
      case 'scheduled':
        setFilters({
          statuses: ['Scheduled'],
          eventTypes: [],
          cohorts: [],
          playerTypes: [],
          osTypes: [],
          dateRange: undefined
        })
        break
        
      case 'thisWeek':
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startOfWeek.setHours(0, 0, 0, 0)
        
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        endOfWeek.setHours(23, 59, 59, 999)
        
        setFilters({
          dateRange: {
            start: startOfWeek.toISOString(),
            end: endOfWeek.toISOString()
          }
        })
        break
        
      case 'thisMonth':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        
        setFilters({
          dateRange: {
            start: startOfMonth.toISOString(),
            end: endOfMonth.toISOString()
          }
        })
        break
    }
  }, [setFilters])
  
  // Quick actions
  const selectAll = useCallback(
    (filterType: 'eventTypes' | 'cohorts' | 'statuses' | 'playerTypes' | 'osTypes') => {
    switch (filterType) {
      case 'eventTypes':
        setEventTypes(filterOptions.eventTypes as EventType[])
        break
      case 'cohorts':
        setCohorts(['All'])
        break
      case 'statuses':
        setStatuses(filterOptions.statuses as EventStatus[])
        break
      case 'playerTypes':
        setPlayerTypes(['All'])
        break
      case 'osTypes':
        setOsTypes(['All'])
        break
    }
  },
  [filterOptions, setEventTypes, setCohorts, setStatuses, setPlayerTypes, setOsTypes],
)

  const selectNone = useCallback(
    (filterType: 'eventTypes' | 'cohorts' | 'statuses' | 'playerTypes' | 'osTypes') => {
    switch (filterType) {
      case 'eventTypes':
        clearEventTypes()
        break
      case 'cohorts':
        clearCohorts()
        break
      case 'statuses':
        clearStatuses()
        break
      case 'playerTypes':
        clearPlayerTypes()
        break
      case 'osTypes':
        clearOsTypes()
        break
    }
  },
  [
    clearEventTypes,
    clearCohorts,
    clearStatuses,
    clearPlayerTypes,
    clearOsTypes,
  ],
)
  
  return {
    // Current filter state
    filters,
    debouncedSearchQuery,
    
    // Filter options
    filterOptions,
    
    // Statistics
    filterStats,
    
    // Search
    setSearchQuery,
    clearSearch,
    
    // Event types
    toggleEventType,
    setEventTypes,
    clearEventTypes,
    
    // Cohorts
    toggleCohort,
    setCohorts,
    clearCohorts,

    // Player types
    togglePlayerType,
    setPlayerTypes,
    clearPlayerTypes,

    // OS types
    toggleOsType,
    setOsTypes,
    clearOsTypes,

    // Statuses
    toggleStatus,
    setStatuses,
    clearStatuses,
    
    // Date range
    setDateRange,
    clearDateRange,
    
    // Preset filters
    applyPreset,
    
    // Quick actions
    selectAll,
    selectNone,
    
    // Global actions
    clearFilters,
  }
}