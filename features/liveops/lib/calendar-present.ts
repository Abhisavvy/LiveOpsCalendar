import type { LucideIcon } from 'lucide-react'
import {
  CircleDollarSign,
  RefreshCcw,
  Repeat,
  Sparkles,
  HelpCircle,
  Pencil,
  CalendarClock,
  PlayCircle,
  CheckCircle2,
} from 'lucide-react'

import {
  formatCohorts,
  formatPlacements,
  type EventStatus,
  type EventType,
  type LiveOpsEvent,
} from '../types/events'

export type EventTypeMeta = {
  label: string
  Icon: LucideIcon
  colorVar: string // CSS var name (without `var()`)
}

export type StatusMeta = {
  label: string
  Icon: LucideIcon
  colorVar: string // CSS var name (without `var()`)
}

const EVENT_TYPE_META: Record<EventType, EventTypeMeta> = {
  IAP: { label: 'IAP', Icon: CircleDollarSign, colorVar: '--event-iap' },
  Retention: { label: 'Retention', Icon: RefreshCcw, colorVar: '--event-retention' },
  'Rolling Retention': {
    label: 'Rolling Retention',
    Icon: Repeat,
    colorVar: '--event-rolling-retention',
  },
  Engagement: { label: 'Engagement', Icon: Sparkles, colorVar: '--event-engagement' },
  Unknown: { label: 'Unknown', Icon: HelpCircle, colorVar: '--event-unknown' },
}

const STATUS_META: Record<EventStatus, StatusMeta> = {
  Draft: { label: 'Draft', Icon: Pencil, colorVar: '--status-draft' },
  Scheduled: { label: 'Scheduled', Icon: CalendarClock, colorVar: '--status-scheduled' },
  Active: { label: 'Active', Icon: PlayCircle, colorVar: '--status-active' },
  Ended: { label: 'Ended', Icon: CheckCircle2, colorVar: '--status-ended' },
}

export function getEventTypeMeta(eventType: EventType | string): EventTypeMeta {
  return EVENT_TYPE_META[(eventType as EventType) ?? 'Unknown'] ?? EVENT_TYPE_META.Unknown
}

export function getStatusMeta(status: EventStatus | string): StatusMeta {
  return STATUS_META[(status as EventStatus) ?? 'Draft'] ?? STATUS_META.Draft
}

export function formatEventA11yLabel(event: LiveOpsEvent): string {
  const type = getEventTypeMeta(event.eventType).label
  const status = getStatusMeta(event.status).label
  const cohorts = formatCohorts(event.cohort)
  const placements = formatPlacements(event.placement)
  const endLabel = event.end ? '' : ' Never ends.'
  return `${event.title}. Type: ${type}. Status: ${status}. Cohort: ${cohorts}. Placement: ${placements}.${endLabel}`
}

