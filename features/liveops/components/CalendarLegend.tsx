'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CLIENT_OPTIONS, EVENT_STATUSES, EVENT_TYPES } from '../types/events'
import { getEventTypeMeta, getStatusMeta } from '../lib/calendar-present'

const CLIENT_META: Record<
  (typeof CLIENT_OPTIONS)[number],
  { label: string; colorVar: string; alphaVar: string }
> = {
  Kinoa: { label: 'Kinoa', colorVar: '--client-kinoa', alphaVar: '--client-kinoa-alpha' },
  'In-game': {
    label: 'In-game',
    colorVar: '--client-in-game',
    alphaVar: '--client-in-game-alpha',
  },
}

export function CalendarLegend({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} aria-label="Calendar legend">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Types</span>
        {EVENT_TYPES.map((t) => {
          const meta = getEventTypeMeta(t)
          const Icon = meta.Icon
          return (
            <Badge key={t} variant="secondary" className="gap-1.5 py-1">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: `hsl(var(${meta.colorVar}))` }}
                aria-hidden="true"
              />
              <Icon className="h-3.5 w-3.5 opacity-90" aria-hidden="true" />
              <span className="text-[11px]">{meta.label}</span>
            </Badge>
          )
        })}
      </div>

      <div className="mx-1 h-4 w-px bg-border/60 hidden sm:block" aria-hidden="true" />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Client</span>
        {CLIENT_OPTIONS.map((client) => {
          const meta = CLIENT_META[client]
          return (
            <Badge key={client} variant="secondary" className="gap-1.5 py-1">
              <span
                className="h-2.5 w-2.5 rounded-sm border border-border"
                style={{
                  backgroundColor: `hsl(var(${meta.colorVar}) / var(${meta.alphaVar}))`,
                }}
                aria-hidden="true"
              />
              <span className="text-[11px]">{meta.label}</span>
            </Badge>
          )
        })}
      </div>

      <div className="mx-1 h-4 w-px bg-border/60 hidden sm:block" aria-hidden="true" />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Status</span>
        {EVENT_STATUSES.map((s) => {
          const meta = getStatusMeta(s)
          const Icon = meta.Icon
          return (
            <Badge
              key={s}
              variant="outline"
              className={cn('gap-1.5 py-1 status-badge', `status-${s.toLowerCase()}`)}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-[11px]">{meta.label}</span>
            </Badge>
          )
        })}
      </div>
    </div>
  )
}

