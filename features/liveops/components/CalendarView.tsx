'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { EventClickArg, EventDropArg, DateSelectArg, EventContentArg } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import type FullCalendarType from '@fullcalendar/react'
import { LiveOpsEvent } from '../types/events'
import { useEventStore } from '../hooks/useEventStore'
import { useCalendarEvents, type CalendarExtendedProps } from '../hooks/useCalendarEvents'
import { addDurationToDate } from '../lib/date-utils'
import { getEventDropUpdate } from '../lib/calendar-utils'
import { readStoredCalendarView, storeCalendarView, type CalendarViewId } from '../lib/calendar-view-persistence'
import { useToast } from '@/hooks/use-toast'
import { CalendarEventContent } from './CalendarEventContent'
import { formatEventA11yLabel } from '../lib/calendar-present'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const calendarRef = useRef<FullCalendarType | null>(null)
  const [calendarTitle, setCalendarTitle] = useState('')
  const [activeView, setActiveView] = useState<CalendarViewId>(
    () => readStoredCalendarView(initialView)
  )

  const viewOptions = useMemo(
    () =>
      [
        { id: 'dayGridMonth', label: 'Month' },
        { id: 'timeGridWeek', label: 'Week' },
        { id: 'timeGridDay', label: 'Day' },
        { id: 'listWeek', label: 'List' },
      ] satisfies Array<{ id: CalendarViewId; label: string }>,
    []
  )

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
        const updates = getEventDropUpdate(liveOpsEvent, newStart)

        const success = updateEvent(liveOpsEvent.id, updates)
        
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
      ? formatEventA11yLabel(liveOps, props?.status)
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
        isOpenEnded={Boolean(props?.isOpenEnded)}
        a11yLabel={a11yLabel}
      />
    )
  }, [])

  const handleDatesSet = useCallback(
    (info: { view: { title: string; type: string } }) => {
      setCalendarTitle(info.view.title)
      const match = viewOptions.find(option => option.id === info.view.type)
      if (!match) return
      setActiveView(match.id)
      storeCalendarView(match.id)
    },
    [viewOptions]
  )

  const handleViewChange = useCallback((nextView: CalendarViewId) => {
    const api = calendarRef.current?.getApi()
    if (!api) return
    api.changeView(nextView)
  }, [])

  const handleNavigate = useCallback((direction: 'prev' | 'next' | 'today') => {
    const api = calendarRef.current?.getApi()
    if (!api) return
    if (direction === 'prev') api.prev()
    if (direction === 'next') api.next()
    if (direction === 'today') api.today()
  }, [])

  const calendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    headerToolbar: false,
    initialView: activeView,
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
    datesSet: handleDatesSet,
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
      <div className="sticky top-0 z-20 mb-3 rounded-xl border border-border/60 bg-card/70 px-3 py-2 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Calendar</p>
              <p className="text-base font-semibold text-foreground">{calendarTitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/40 p-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => handleNavigate('prev')}
                aria-label="Previous period"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => handleNavigate('today')}
              >
                Today
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => handleNavigate('next')}
                aria-label="Next period"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {viewOptions.map(option => (
                <Button
                  key={option.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewChange(option.id)}
                  className={cn(
                    'h-7 px-2 text-xs',
                    activeView === option.id && 'border-primary/60 bg-primary/20 text-foreground'
                  )}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <FullCalendar ref={calendarRef} {...calendarOptions} />
    </div>
  )
}