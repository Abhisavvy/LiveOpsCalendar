'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { EventStatus, EventType } from '../types/events'
import { getEventTypeMeta, getStatusMeta } from '../lib/calendar-present'

export function CalendarEventContent({
  title,
  eventType,
  status,
  cohort,
  a11yLabel,
  className,
}: {
  title: string
  eventType: EventType | string
  status: EventStatus | string
  cohort: string
  a11yLabel?: string
  className?: string
}) {
  const typeMeta = getEventTypeMeta(eventType)
  const statusMeta = getStatusMeta(status)

  const TypeIcon = typeMeta.Icon
  const StatusIcon = statusMeta.Icon

  return (
    <div className={cn('fc-event-main-frame', className)} title={a11yLabel}>
      {a11yLabel ? <span className="sr-only">{a11yLabel}</span> : null}
      <div className="fc-event-title-container">
        <div className="fc-event-title fc-sticky flex items-center gap-1">
          <TypeIcon className="h-3.5 w-3.5 opacity-90" aria-hidden="true" />
          <span className="truncate">{title}</span>
        </div>

        <div className="fc-event-subtitle mt-0.5 flex items-center gap-1.5">
          <span className="truncate text-[11px] text-muted-foreground">{cohort}</span>
          <span className="text-muted-foreground/50">•</span>
          <span className={cn('status-badge', `status-${String(status).toLowerCase()}`)}>
            <StatusIcon className="h-3 w-3" aria-hidden="true" />
            <span>{String(status)}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

