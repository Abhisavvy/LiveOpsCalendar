'use client'

import { useMemo } from 'react'
import { EventInput } from '@fullcalendar/core'
import { LiveOpsEvent } from '../types/events'
import { useEventStore } from './useEventStore'

export interface CalendarExtendedProps {
  eventType: LiveOpsEvent['eventType']
  status: LiveOpsEvent['status']
  cohort: LiveOpsEvent['cohort']
  placement: LiveOpsEvent['placement']
  description: LiveOpsEvent['description']
  recurrence: LiveOpsEvent['recurrence']
  liveOpsData: LiveOpsEvent
}

/**
 * Hook to format LiveOps events for FullCalendar consumption
 */
export function useCalendarEvents() {
  const filteredEvents = useEventStore(state => state.filteredEvents)
  
  const calendarEvents = useMemo<EventInput[]>(() => {
    return filteredEvents.map((event): EventInput => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      classNames: [
        `event-${event.eventType.toLowerCase()}`,
        `status-${event.status.toLowerCase()}`,
        'fc-event-liveops'
      ],
      extendedProps: {
        eventType: event.eventType,
        status: event.status,
        cohort: event.cohort,
        placement: event.placement,
        description: event.description,
        recurrence: event.recurrence,
        liveOpsData: event,
      } satisfies CalendarExtendedProps,
      // Make events draggable for rescheduling
      editable: true,
      // Custom display
      display: 'block',
    }))
  }, [filteredEvents])

  return {
    events: calendarEvents,
    eventCount: filteredEvents.length,
  }
}