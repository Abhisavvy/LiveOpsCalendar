'use client'

import React, { useCallback } from 'react'
import dynamic from 'next/dynamic'
import { EventClickArg, EventDropArg, DateSelectArg, EventContentArg } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import { LiveOpsEvent } from '../types/events'
import { useEventStore } from '../hooks/useEventStore'
import { useCalendarEvents, type CalendarExtendedProps } from '../hooks/useCalendarEvents'
import { addDurationToDate } from '../lib/date-utils'
import { useToast } from '@/hooks/use-toast'
import { CalendarEventContent } from './CalendarEventContent'
import { formatEventA11yLabel } from '../lib/calendar-present'

// Dynamically import FullCalendar to prevent SSR issues
const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-background border rounded-lg">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading calendar...</p>
      </div>
    </div>
  ),
})

interface CalendarViewProps {
  className?: string
  onEventClick?: (event: LiveOpsEvent) => void
  onDateSelect?: (start: string, end: string) => void
  initialView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'
}

export function CalendarView({
  className,
  onEventClick,
  onDateSelect,
  initialView = 'dayGridMonth',
}: CalendarViewProps) {
  const { events } = useCalendarEvents()
  const updateEvent = useEventStore(state => state.updateEvent)
  const { toast } = useToast()

  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const liveOpsEvent = clickInfo.event.extendedProps.liveOpsData as LiveOpsEvent
      if (liveOpsEvent && onEventClick) {
        onEventClick(liveOpsEvent)
      }
    },
    [onEventClick]
  )

  const handleEventDrop = useCallback(
    (dropInfo: EventDropArg) => {
      const liveOpsEvent = dropInfo.event.extendedProps.liveOpsData as LiveOpsEvent
      
      if (liveOpsEvent) {
        const newStart = dropInfo.event.startStr
        const originalDuration = new Date(liveOpsEvent.end).getTime() - new Date(liveOpsEvent.start).getTime()
        const newEnd = new Date(new Date(newStart).getTime() + originalDuration).toISOString()
        
        const success = updateEvent(liveOpsEvent.id, {
          start: newStart,
          end: newEnd,
        })
        
        if (success) {
          toast({
            title: "Event Rescheduled",
            description: `${liveOpsEvent.title} has been moved to ${new Date(newStart).toLocaleDateString()}`,
          })
        } else {
          // Revert the change in the calendar if update failed
          dropInfo.revert()
          toast({
            title: "Reschedule Failed",
            description: "Could not reschedule the event. Please try again.",
            variant: "destructive",
          })
        }
      }
    },
    [updateEvent, toast]
  )

  const handleDateSelect = useCallback(
    (selectInfo: DateSelectArg) => {
      if (onDateSelect) {
        const startISO = selectInfo.startStr
        const endISO = selectInfo.endStr || addDurationToDate(startISO, '1d')
        onDateSelect(startISO, endISO)
      }
      
      // Clear the selection
      const calendarApi = selectInfo.view.calendar
      calendarApi.unselect()
    },
    [onDateSelect]
  )

  const handleEventContent = useCallback((eventInfo: EventContentArg) => {
    const props = eventInfo.event.extendedProps as Partial<CalendarExtendedProps> | undefined
    const eventType = props?.eventType ?? 'Unknown'
    const status = props?.status ?? 'Draft'
    const cohort = props?.cohort ?? 'All'
    const placement = props?.placement ?? ''
    const description = props?.description ?? ''

    const liveOps = props?.liveOpsData as LiveOpsEvent | undefined
    const a11yLabel = liveOps
      ? formatEventA11yLabel(liveOps)
      : `${eventInfo.event.title}. Type: ${String(eventType)}. Status: ${String(status)}. Cohort: ${String(
          cohort
        )}.${placement ? ` Placement: ${placement}.` : ''}${description ? ` Description: ${description}.` : ''}`

    // React rendering here is safe (escapes text) and allows Lucide icons.
    return (
      <CalendarEventContent
        title={eventInfo.event.title}
        eventType={eventType}
        status={status}
        cohort={cohort}
        a11yLabel={a11yLabel}
      />
    )
  }, [])

  const calendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    initialView,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    events: events,
    eventClick: handleEventClick,
    eventDrop: handleEventDrop,
    select: handleDateSelect,
    eventContent: handleEventContent,
    height: 'auto',
    aspectRatio: 1.8,
    eventDisplay: 'block',
    displayEventTime: true,
    // Performance optimizations
    rerenderDelay: 100,
    progressiveEventRendering: true,
    // Accessibility
    eventOrder: 'start,-duration,allDay,title',
    // Styling
    themeSystem: 'standard',
    // Custom styling through CSS classes is provided via `classNames` on EventInput
    // (see `useCalendarEvents`), so we don't add additional classes here.
    // Timezone handling
    timeZone: 'local',
    // Event constraints
    eventConstraint: {
      start: '1900-01-01',
      end: '2100-01-01'
    },
  }

  return (
    <div className={className}>
      <FullCalendar {...calendarOptions} />
    </div>
  )
}