'use client'

import { useMemo } from 'react'
import { EventInput } from '@fullcalendar/core'
import { formatCohorts, formatPlacements, LiveOpsEvent } from '../types/events'
import { getDisplayEnd } from '../lib/calendar-utils'
import { useEventStore } from './useEventStore'
import { expandRecurrence, getRecurrenceWindow } from '../lib/recurrence-utils'
import { getAutomaticStatus } from '../lib/event-status'

export interface CalendarExtendedProps {
  eventType: LiveOpsEvent['eventType']
  status: LiveOpsEvent['status']
  cohort: string
  placement: string
  description: LiveOpsEvent['description']
  recurrence: LiveOpsEvent['recurrence']
  isOpenEnded: boolean
  liveOpsData: LiveOpsEvent
}

/**
 * Hook to format LiveOps events for FullCalendar consumption
 */
export function useCalendarEvents() {
  const filteredEvents = useEventStore(state => state.filteredEvents)
  
  const calendarEvents = useMemo<EventInput[]>(() => {
    const { rangeStart, rangeEnd } = getRecurrenceWindow()

    /**
     * Create a calendar event with series-level data but optional per-occurrence status.
     */
    const buildCalendarEvent = (
      event: LiveOpsEvent,
      start: string,
      end: string | null,
      idSuffix?: string,
      statusOverride?: LiveOpsEvent['status']
    ): EventInput => {
      const derivedStatus = getAutomaticStatus(event)
      const eventStatus = statusOverride ?? derivedStatus
      const liveOpsData = derivedStatus === event.status ? event : { ...event, status: derivedStatus }
      const eventTypeClass = `event-${event.eventType.toLowerCase().replace(/\s+/g, '-')}`
      const clientValue = event.client ?? 'Kinoa'
      const clientClass = `client-${clientValue.toLowerCase().replace(/\s+/g, '-')}`
      return {
        id: idSuffix ? `${event.id}::${idSuffix}` : event.id,
        title: event.title,
        start,
        end: getDisplayEnd(end),
        classNames: [
          eventTypeClass,
          clientClass,
          'fc-event-liveops',
        ],
        extendedProps: {
          eventType: event.eventType,
          status: eventStatus,
          cohort: formatCohorts(event.cohort),
          placement: formatPlacements(event.placement),
          description: event.description,
          recurrence: event.recurrence,
          isOpenEnded: event.end === null,
          liveOpsData,
        } satisfies CalendarExtendedProps,
        // Make events draggable for rescheduling
        editable: true,
        // Custom display
        display: 'block',
      }
    }

    return filteredEvents.flatMap((event): EventInput[] => {
      if (!event.recurrence) {
        return [buildCalendarEvent(event, event.start, event.end)]
      }

      const occurrences = expandRecurrence(event, { rangeStart, rangeEnd })
      return occurrences.map((occurrence) => {
        const occurrenceStatus = getAutomaticStatus({
          ...event,
          start: occurrence.start,
          end: occurrence.end,
          recurrence: undefined,
        })
        return buildCalendarEvent(
          event,
          occurrence.start,
          occurrence.end,
          occurrence.start,
          occurrenceStatus
        )
      })
    })
  }, [filteredEvents])

  return {
    events: calendarEvents,
    eventCount: filteredEvents.length,
  }
}