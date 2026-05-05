'use client'

import { useMemo, useCallback } from 'react'
import { useEventStore } from './useEventStore'
import { FilterState, EventType, EventStatus } from '../types/events'
import { useDebounce } from './useDebounce'

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
    const cohorts = Array.from(new Set(events.map(e => e.cohort))).sort()
    const eventTypes = Array.from(new Set(events.map(e => e.eventType))).sort()
    const statuses = Array.from(new Set(events.map(e => e.status))).sort()
    const placements = Array.from(new Set(events.map(e => e.placement))).sort()
    
    return {
      cohorts,
      eventTypes,
      statuses,
      placements,
    }
  }, [events])
  
  // Filter statistics
  const filterStats = useMemo(() => {
    const total = events.length
    const filtered = filteredEvents.length
    const hasActiveFilters = Boolean(
      filters.searchQuery.trim() ||
      filters.eventTypes.length > 0 ||
      filters.cohorts.length > 0 ||
      filters.statuses.length > 0 ||
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
  const toggleCohort = useCallback((cohort: string) => {
    const currentCohorts = filters.cohorts
    const newCohorts = currentCohorts.includes(cohort)
      ? currentCohorts.filter(c => c !== cohort)
      : [...currentCohorts, cohort]
    
    setFilters({ cohorts: newCohorts })
  }, [filters.cohorts, setFilters])
  
  const setCohorts = useCallback((cohorts: string[]) => {
    setFilters({ cohorts })
  }, [setFilters])
  
  const clearCohorts = useCallback(() => {
    setFilters({ cohorts: [] })
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
          dateRange: undefined
        })
        break
        
      case 'scheduled':
        setFilters({ 
          statuses: ['Scheduled'],
          eventTypes: [],
          cohorts: [],
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
  const selectAll = useCallback((filterType: 'eventTypes' | 'cohorts' | 'statuses') => {
    switch (filterType) {
      case 'eventTypes':
        setEventTypes(filterOptions.eventTypes as EventType[])
        break
      case 'cohorts':
        setCohorts(filterOptions.cohorts)
        break
      case 'statuses':
        setStatuses(filterOptions.statuses as EventStatus[])
        break
    }
  }, [filterOptions, setEventTypes, setCohorts, setStatuses])
  
  const selectNone = useCallback((filterType: 'eventTypes' | 'cohorts' | 'statuses') => {
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
    }
  }, [clearEventTypes, clearCohorts, clearStatuses])
  
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