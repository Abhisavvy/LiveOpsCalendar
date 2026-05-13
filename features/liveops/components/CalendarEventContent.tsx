'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { EventStatus, EventType } from '../types/events'
import { getStatusMeta } from '../lib/calendar-present'

export function CalendarEventContent({
  title,
  eventType,
  status,
  cohort,
  isOpenEnded = false,
  a11yLabel,
  className,
}: {
  title: string
  eventType: EventType | string
  status: EventStatus | string
  cohort: string
  isOpenEnded?: boolean
  a11yLabel?: string
  className?: string
}) {
  const statusMeta = getStatusMeta(status)
  const StatusIcon = statusMeta.Icon

  return (
    <div className={cn('fc-event-main-frame', className)} title={a11yLabel}>
      {a11yLabel ? <span className="sr-only">{a11yLabel}</span> : null}
      <div className="fc-event-title-container">
        <div className="fc-event-title fc-sticky flex items-center gap-1">
          <span className="event-type-dot" data-event-type={String(eventType)} aria-hidden="true" />
          <span className="event-title-text truncate">{title}</span>
        </div>

        <div className="fc-event-subtitle mt-0.5 flex items-center gap-1.5">
          <span className="truncate text-[11px] text-foreground/70">{cohort}</span>
          {isOpenEnded ? (
            <>
              <span className="text-foreground/50">•</span>
              <span className="shrink-0 text-[11px] text-foreground/70">Never</span>
            </>
          ) : null}
          <span className="text-foreground/50">•</span>
          <span className={cn('status-badge', `status-${String(status).toLowerCase()}`)}>
            <StatusIcon className="h-3 w-3" aria-hidden="true" />
            <span>{String(status)}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

