'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

export type CalendarEmptyStateMode = 'noEvents' | 'noMatches'

export function CalendarEmptyStateCallout({
  mode,
  onCreateEvent,
  onClearFilters,
}: {
  mode: CalendarEmptyStateMode
  onCreateEvent?: () => void
  onClearFilters?: () => void
}) {
  if (mode === 'noMatches') {
    return (
      <div className="rounded-xl border bg-card/70 backdrop-blur p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">No matching events</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting filters, or clear them to see all events.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClearFilters}>
              Clear filters
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card/70 backdrop-blur p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">No events yet</p>
          <p className="text-sm text-muted-foreground">
            Import a CSV or create your first event to get started.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCreateEvent}>
            Create Event
          </Button>
        </div>
      </div>
    </div>
  )
}

