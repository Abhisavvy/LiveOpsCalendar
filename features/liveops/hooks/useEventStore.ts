'use client'

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { LiveOpsEvent, EventInput, FilterState, createEventId, CsvProcessingResult } from '../types/events'
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
            placement: input.placement,
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
              Object.assign(event, input, { updatedAt: nowISO() })
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
            placement: input.placement,
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
            placement: input.placement,
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
            }
          })
          get().applyFilters()
          saveFilters(get().filters)
        },

        applyFilters: () => {
          const { events, filters } = get()
          
          let filtered = events

          // Search query filter
          if (filters.searchQuery.trim()) {
            const query = filters.searchQuery.toLowerCase().trim()
            filtered = filtered.filter(event => 
              event.title.toLowerCase().includes(query) ||
              event.description.toLowerCase().includes(query) ||
              event.placement.toLowerCase().includes(query) ||
              event.cohort.toLowerCase().includes(query)
            )
          }

          // Event type filter
          if (filters.eventTypes.length > 0) {
            filtered = filtered.filter(event => 
              filters.eventTypes.includes(event.eventType)
            )
          }

          // Cohort filter
          if (filters.cohorts.length > 0) {
            filtered = filtered.filter(event => 
              filters.cohorts.includes(event.cohort)
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

          set((state) => {
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
              state.filters = filters || state.filters
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