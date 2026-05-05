'use client'

import React, { useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { EventClickArg, EventDropArg, DateSelectArg } from '@fullcalendar/core'
import { LiveOpsEvent } from '../types/events'
import { useEventStore } from '../hooks/useEventStore'
import { useCalendarEvents, CalendarEventInput } from '../hooks/useCalendarEvents'
import { addDurationToDate, nowISO } from '../lib/date-utils'
import { useToast } from '@/hooks/use-toast'

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

// Import FullCalendar plugins dynamically
const dayGridPlugin = dynamic(() => import('@fullcalendar/daygrid'))
const timeGridPlugin = dynamic(() => import('@fullcalendar/timegrid'))
const interactionPlugin = dynamic(() => import('@fullcalendar/interaction'))
const listPlugin = dynamic(() => import('@fullcalendar/list'))

interface CalendarViewProps {
  className?: string
  onEventClick?: (event: LiveOpsEvent) => void
  onDateSelect?: (start: string, end: string) => void
}

export function CalendarView({
  className,
  onEventClick,
  onDateSelect,
}: CalendarViewProps) {
  const calendarRef = useRef<any>(null)
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

  const handleEventContent = useCallback((eventInfo: any) => {
    const event = eventInfo.event as CalendarEventInput
    const eventType = event.extendedProps.eventType
    const status = event.extendedProps.status
    const cohort = event.extendedProps.cohort
    
    return {
      html: `
        <div class="fc-event-main-frame">
          <div class="fc-event-title-container">
            <div class="fc-event-title fc-sticky">
              ${getEventTypeIcon(eventType)} ${eventInfo.event.title}
            </div>
            <div class="fc-event-subtitle">
              ${cohort} • ${getStatusBadge(status)}
            </div>
          </div>
        </div>
      `
    }
  }, [])

  const calendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    initialView: 'dayGridMonth',
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
    // Custom styling through CSS classes
    eventClassNames: (event) => {
      const eventType = event.event.extendedProps.eventType
      const status = event.event.extendedProps.status
      return [
        `fc-event-${eventType?.toLowerCase() || 'unknown'}`,
        `fc-event-status-${status?.toLowerCase() || 'draft'}`,
      ]
    },
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
      <FullCalendar ref={calendarRef} {...calendarOptions} />
    </div>
  )
}

/**
 * Get event type icon
 */
function getEventTypeIcon(eventType: string): string {
  const iconMap: Record<string, string> = {
    'IAP': '💰',
    'Progression': '🎯',
    'Retention': '🔄',
    'System': '⚙️',
    'Unknown': '❓',
  }
  return iconMap[eventType] || iconMap['Unknown']!
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status: string): string {
  const colorMap: Record<string, string> = {
    'Draft': 'gray',
    'Scheduled': 'orange',
    'Active': 'green',
    'Ended': 'red',
  }
  
  const color = colorMap[status] || 'gray'
  return `<span class="status-badge status-${color.toLowerCase()}">${status}</span>`
}