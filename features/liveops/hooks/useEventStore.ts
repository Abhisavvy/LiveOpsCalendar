'use client'

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import {
  LiveOpsEvent,
  EventInput,
  FilterState,
  FilterStateSchema,
  createEventId,
  CsvProcessingResult,
  formatCohorts,
  formatPlacements,
  normalizeCohorts,
  normalizePlayerType,
  normalizePlacements,
} from '../types/events'
import { saveEvents, loadEvents, saveFilters, loadFilters } from '../lib/storage'
import { nowISO } from '../lib/date-utils'

interface EventStore {
  // State
  events: LiveOpsEvent[]
  filteredEvents: LiveOpsEvent[]
  filters: FilterState
  selectedEvent: LiveOpsEvent | null
  isLoading: boolean
  error: string | null
  lastUpdated: string | null

  // Event CRUD operations
  addEvent: (input: EventInput) => LiveOpsEvent
  updateEvent: (id: string, input: Partial<EventInput>) => boolean
  deleteEvent: (id: string) => boolean
  restoreEvent: (event: LiveOpsEvent) => boolean
  duplicateEvent: (id: string) => LiveOpsEvent | null
  getEvent: (id: string) => LiveOpsEvent | null
  setSelectedEvent: (event: LiveOpsEvent | null) => void

  // Bulk operations
  addMultipleEvents: (inputs: EventInput[]) => LiveOpsEvent[]
  replaceCalendarWithImported: (inputs: EventInput[]) => LiveOpsEvent[]
  deleteMultipleEvents: (ids: string[]) => number
  clearAllEvents: () => void

  // CSV Import
  importFromCSV: (result: CsvProcessingResult) => void
  
  // Filtering
  setFilters: (filters: Partial<FilterState>) => void
  clearFilters: () => void
  applyFilters: () => void

  // Persistence
  saveToStorage: () => boolean
  loadFromStorage: () => void
  
  // Utility
  getEventsByType: (eventType: string) => LiveOpsEvent[]
  getEventsByCohort: (cohort: string) => LiveOpsEvent[]
  getEventsInDateRange: (startDate: string, endDate: string) => LiveOpsEvent[]
  getUniqueValues: (field: 'cohort' | 'eventType' | 'placement') => string[]
  
  // Error handling
  setError: (error: string | null) => void
  clearError: () => void
}

export const useEventStore = create<EventStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
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

        // Event CRUD operations
        addEvent: (input: EventInput) => {
          const event: LiveOpsEvent = {
            id: input.id ? (input.id as unknown as LiveOpsEvent['id']) : createEventId(),
            title: input.title,
            start: input.start,
            end: input.end,
            cohort: input.cohort,
            eventType: input.eventType,
            playerType: input.playerType,
            osType: input.osType,
            client: input.client,
            placement: normalizePlacements(input.placement),
            description: input.description,
            status: input.status || 'Draft',
            recurrence: input.recurrence,
            createdAt: nowISO(),
            updatedAt: nowISO(),
          }

          set((state) => {
            state.events.push(event)
            state.lastUpdated = nowISO()
          })

          get().applyFilters()
          get().saveToStorage()
          return event
        },

        updateEvent: (id: string, input: Partial<EventInput>) => {
          const eventIndex = get().events.findIndex(e => e.id === id)
          if (eventIndex === -1) return false

          set((state) => {
            const event = state.events[eventIndex]
            if (event) {
              const normalizedInput = input.placement
                ? { ...input, placement: normalizePlacements(input.placement) }
                : input
              Object.assign(event, normalizedInput, { updatedAt: nowISO() })
            }
            state.lastUpdated = nowISO()
          })

          get().applyFilters()
          get().saveToStorage()
          return true
        },

        deleteEvent: (id: string) => {
          const initialLength = get().events.length
          
          set((state) => {
            state.events = state.events.filter(e => e.id !== id)
            if (state.selectedEvent?.id === id) {
              state.selectedEvent = null
            }
            state.lastUpdated = nowISO()
          })

          const deleted = get().events.length < initialLength
          if (deleted) {
            get().applyFilters()
            get().saveToStorage()
          }
          return deleted
        },

        restoreEvent: (event: LiveOpsEvent) => {
          const exists = get().events.some(e => e.id === event.id)
          if (exists) return false

          set((state) => {
            state.events.push(event)
            state.lastUpdated = nowISO()
          })

          get().applyFilters()
          get().saveToStorage()
          return true
        },

        duplicateEvent: (id: string) => {
          const originalEvent = get().events.find(e => e.id === id)
          if (!originalEvent) return null

          const duplicatedEvent: LiveOpsEvent = {
            ...originalEvent,
            id: createEventId(),
            title: `${originalEvent.title} (Copy)`,
            status: 'Draft',
            createdAt: nowISO(),
            updatedAt: nowISO(),
          }

          set((state) => {
            state.events.push(duplicatedEvent)
            state.lastUpdated = nowISO()
          })

          get().applyFilters()
          get().saveToStorage()
          return duplicatedEvent
        },

        getEvent: (id: string) => {
          return get().events.find(e => e.id === id) || null
        },

        setSelectedEvent: (event: LiveOpsEvent | null) => {
          set((state) => {
            state.selectedEvent = event
          })
        },

        // Bulk operations
        addMultipleEvents: (inputs: EventInput[]) => {
          const newEvents = inputs.map(input => ({
            id: input.id ? (input.id as unknown as LiveOpsEvent['id']) : createEventId(),
            title: input.title,
            start: input.start,
            end: input.end,
            cohort: input.cohort,
            eventType: input.eventType,
            playerType: input.playerType,
            osType: input.osType,
            client: input.client,
            placement: normalizePlacements(input.placement),
            description: input.description,
            status: input.status || 'Draft',
            recurrence: input.recurrence,
            createdAt: nowISO(),
            updatedAt: nowISO(),
          }))

          set((state) => {
            state.events.push(...newEvents)
            state.lastUpdated = nowISO()
          })

          get().applyFilters()
          get().saveToStorage()
          return newEvents
        },

        replaceCalendarWithImported: (inputs: EventInput[]) => {
          const newEvents = inputs.map(input => ({
            id: input.id ? (input.id as unknown as LiveOpsEvent['id']) : createEventId(),
            title: input.title,
            start: input.start,
            end: input.end,
            cohort: input.cohort,
            eventType: input.eventType,
            playerType: input.playerType,
            osType: input.osType,
            client: input.client,
            placement: normalizePlacements(input.placement),
            description: input.description,
            status: input.status || 'Draft',
            recurrence: input.recurrence,
            createdAt: nowISO(),
            updatedAt: nowISO(),
          }))

          set((state) => {
            state.events = newEvents
            state.filteredEvents = newEvents
            state.selectedEvent = null
            state.lastUpdated = nowISO()
          })

          get().applyFilters()
          get().saveToStorage()
          return newEvents
        },

        deleteMultipleEvents: (ids: string[]) => {
          const initialLength = get().events.length

          set((state) => {
            state.events = state.events.filter(e => !ids.includes(e.id))
            if (state.selectedEvent && ids.includes(state.selectedEvent.id)) {
              state.selectedEvent = null
            }
            state.lastUpdated = nowISO()
          })

          const deletedCount = initialLength - get().events.length
          if (deletedCount > 0) {
            get().applyFilters()
            get().saveToStorage()
          }
          return deletedCount
        },

        clearAllEvents: () => {
          set((state) => {
            state.events = []
            state.filteredEvents = []
            state.selectedEvent = null
            state.lastUpdated = nowISO()
          })
          get().saveToStorage()
        },

        // CSV Import
        importFromCSV: (result: CsvProcessingResult) => {
          set((state) => {
            state.events = result.events
            state.lastUpdated = nowISO()
          })
          get().applyFilters()
          get().saveToStorage()
        },

        // Filtering
        setFilters: (newFilters: Partial<FilterState>) => {
          set((state) => {
            Object.assign(state.filters, newFilters)
          })
          get().applyFilters()
          // Save filters to localStorage
          saveFilters(get().filters)
        },

        clearFilters: () => {
          set((state) => {
            state.filters = {
              searchQuery: '',
              eventTypes: [],
              cohorts: [],
              statuses: [],
              playerTypes: [],
              osTypes: [],
            }
          })
          get().applyFilters()
          saveFilters(get().filters)
        },

        applyFilters: () => {
          const { events } = get()
          const rawFilters = get().filters
          const parsedFilters = FilterStateSchema.safeParse(rawFilters)
          const filters = parsedFilters.success
            ? parsedFilters.data
            : FilterStateSchema.parse({})

          let filtered = events

          // Search query filter
          if (filters.searchQuery.trim()) {
            const query = filters.searchQuery.toLowerCase().trim()
            filtered = filtered.filter(event => 
              event.title.toLowerCase().includes(query) ||
              event.description.toLowerCase().includes(query) ||
              formatPlacements(event.placement).toLowerCase().includes(query) ||
              formatCohorts(event.cohort).toLowerCase().includes(query)
            )
          }

          // Event type filter
          if (filters.eventTypes.length > 0) {
            filtered = filtered.filter(event => 
              filters.eventTypes.includes(event.eventType)
            )
          }

          const cohortSelections =
            filters.cohorts.includes('All') ? [] : filters.cohorts
          const playerTypeSelections =
            filters.playerTypes.includes('All') ? [] : filters.playerTypes
          const osTypeSelections =
            filters.osTypes.includes('All') ? [] : filters.osTypes

          // Cohort filter (AND across selected cohorts; inactive when UI "All"; event "All" matches any narrow selection)
          if (cohortSelections.length > 0) {
            filtered = filtered.filter(event => {
              const eventCohorts = normalizeCohorts(event.cohort)
              if (eventCohorts.includes('All')) return true
              return cohortSelections.every(c =>
                eventCohorts.includes(c as (typeof eventCohorts)[number]),
              )
            })
          }

          // Player type filter
          if (playerTypeSelections.length > 0) {
            filtered = filtered.filter(
              event => {
                const normalizedPlayerType = normalizePlayerType(event.playerType)
                return (
                  normalizedPlayerType === 'All' ||
                  playerTypeSelections.includes(normalizedPlayerType)
                )
              },
            )
          }

          // OS type filter
          if (osTypeSelections.length > 0) {
            filtered = filtered.filter(
              event =>
                event.osType === 'All' ||
                osTypeSelections.includes(event.osType),
            )
          }

          // Status filter
          if (filters.statuses.length > 0) {
            filtered = filtered.filter(event => 
              filters.statuses.includes(event.status)
            )
          }

          // Date range filter
          if (filters.dateRange?.start || filters.dateRange?.end) {
            filtered = filtered.filter(event => {
              const eventStart = new Date(event.start)
              const eventEnd = new Date(event.end)
              
              let inRange = true
              
              if (filters.dateRange?.start) {
                const rangeStart = new Date(filters.dateRange.start)
                inRange = inRange && eventEnd >= rangeStart
              }
              
              if (filters.dateRange?.end) {
                const rangeEnd = new Date(filters.dateRange.end)
                inRange = inRange && eventStart <= rangeEnd
              }
              
              return inRange
            })
          }

          const needsFilterShapeFix =
            !parsedFilters.success ||
            rawFilters.playerTypes === undefined ||
            rawFilters.osTypes === undefined

          set((state) => {
            if (needsFilterShapeFix) {
              state.filters = filters
            }
            state.filteredEvents = filtered
          })
        },

        // Persistence
        saveToStorage: () => {
          const success = saveEvents(get().events)
          if (!success) {
            get().setError('Failed to save events to storage')
          }
          return success
        },

        loadFromStorage: () => {
          set((state) => {
            state.isLoading = true
          })

          try {
            const events = loadEvents()
            const filters = loadFilters()

            set((state) => {
              state.events = events
              const parsed = filters ? FilterStateSchema.safeParse(filters) : null
              state.filters = parsed?.success ? parsed.data : FilterStateSchema.parse({})
              state.isLoading = false
            })

            get().applyFilters()
          } catch (error) {
            get().setError(`Failed to load events: ${error}`)
            set((state) => {
              state.isLoading = false
            })
          }
        },

        // Utility methods
        getEventsByType: (eventType: string) => {
          return get().events.filter(e => e.eventType === eventType)
        },

        getEventsByCohort: (cohort: string) => {
          return get().events.filter(e => e.cohort === cohort)
        },

        getEventsInDateRange: (startDate: string, endDate: string) => {
          return get().events.filter(event => {
            const eventStart = new Date(event.start)
            const eventEnd = new Date(event.end)
            const rangeStart = new Date(startDate)
            const rangeEnd = new Date(endDate)
            
            return eventEnd >= rangeStart && eventStart <= rangeEnd
          })
        },

        getUniqueValues: (field: 'cohort' | 'eventType' | 'placement') => {
          if (field === 'placement') {
            const placements = get().events.flatMap(event => event.placement)
            return Array.from(new Set(placements)).sort()
          }
          const values = get().events.map(e => e[field])
          return Array.from(new Set(values)).sort()
        },

        // Error handling
        setError: (error: string | null) => {
          set((state) => {
            state.error = error
          })
        },

        clearError: () => {
          set((state) => {
            state.error = null
          })
        },
      })),
      {
        name: 'liveops-event-store',
        partialize: (state) => ({
          // Only persist filters, load events from storage separately
          filters: state.filters,
        }),
      }
    ),
    {
      name: 'liveops-event-store',
    }
  )
)