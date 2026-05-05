'use client'

import { useMemo } from 'react'
import { EventInput } from '@fullcalendar/core'
import { LiveOpsEvent } from '../types/events'
import { useEventStore } from './useEventStore'

export interface CalendarEventInput extends EventInput {
  // Extend FullCalendar's EventInput with our custom properties
  eventType: string
  status: string
  cohort: string
  placement: string
  liveOpsData: LiveOpsEvent
}

/**
 * Hook to format LiveOps events for FullCalendar consumption
 */
export function useCalendarEvents() {
  const filteredEvents = useEventStore(state => state.filteredEvents)
  
  const calendarEvents = useMemo<CalendarEventInput[]>(() => {
    return filteredEvents.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      backgroundColor: getEventBackgroundColor(event.eventType),
      borderColor: getEventBorderColor(event.eventType),
      textColor: getEventTextColor(event.eventType),
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
      },
      // Make events draggable for rescheduling
      editable: true,
      // Custom display
      display: 'block',
      // Accessibility
      title: `${event.title} (${event.eventType} - ${event.cohort})`,
    }))
  }, [filteredEvents])

  return {
    events: calendarEvents,
    eventCount: filteredEvents.length,
  }
}

/**
 * Get background color for event type
 */
function getEventBackgroundColor(eventType: string): string {
  const colorMap: Record<string, string> = {
    'IAP': 'hsl(var(--event-iap) / 0.2)',
    'Progression': 'hsl(var(--event-progression) / 0.2)',
    'Retention': 'hsl(var(--event-retention) / 0.2)',
    'System': 'hsl(var(--event-system) / 0.2)',
    'Unknown': 'hsl(var(--event-unknown) / 0.2)',
  }
  return colorMap[eventType] || colorMap['Unknown']!
}

/**
 * Get border color for event type
 */
function getEventBorderColor(eventType: string): string {
  const colorMap: Record<string, string> = {
    'IAP': 'hsl(var(--event-iap))',
    'Progression': 'hsl(var(--event-progression))',
    'Retention': 'hsl(var(--event-retention))',
    'System': 'hsl(var(--event-system))',
    'Unknown': 'hsl(var(--event-unknown))',
  }
  return colorMap[eventType] || colorMap['Unknown']!
}

/**
 * Get text color for event type
 */
function getEventTextColor(eventType: string): string {
  const colorMap: Record<string, string> = {
    'IAP': 'hsl(var(--event-iap))',
    'Progression': 'hsl(var(--event-progression))',
    'Retention': 'hsl(var(--event-retention))',
    'System': 'hsl(var(--event-system))',
    'Unknown': 'hsl(var(--event-unknown))',
  }
  return colorMap[eventType] || colorMap['Unknown']!
}

/**
 * Get event type icon
 */
export function getEventTypeIcon(eventType: string): string {
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
 * Get status indicator
 */
export function getStatusIndicator(status: string): string {
  const indicatorMap: Record<string, string> = {
    'Draft': '📝',
    'Scheduled': '⏰',
    'Active': '✅',
    'Ended': '🏁',
  }
  return indicatorMap[status] || '❓'
}

/**
 * Format event for tooltip display
 */
export function formatEventTooltip(event: LiveOpsEvent): string {
  return [
    `📅 ${event.title}`,
    `🎯 ${event.eventType} - ${event.cohort}`,
    `📍 ${event.placement}`,
    `⏱️ ${new Date(event.start).toLocaleDateString()} - ${new Date(event.end).toLocaleDateString()}`,
    event.description && `📄 ${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}`,
  ].filter(Boolean).join('\n')
}