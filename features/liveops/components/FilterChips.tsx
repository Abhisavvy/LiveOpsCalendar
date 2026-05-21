'use client'

import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useEventFilters } from '../hooks/useEventFilters'
import { formatDate } from '../lib/date-utils'

interface FilterChipsProps {
  className?: string
}

export function FilterChips({ className }: FilterChipsProps) {
  const {
    filters,
    filterStats,
    clearSearch,
    toggleEventType,
    toggleCohort,
    toggleStatus,
    togglePlayerType,
    toggleOsType,
    clearDateRange,
  } = useEventFilters()

  if (!filterStats.hasActiveFilters) {
    return null
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1 rounded-xl border border-border/60 bg-background/40 p-2 backdrop-blur max-h-24 overflow-hidden">
        {/* Search Query */}
        {filters.searchQuery.trim() && (
          <FilterChip
            label="Search"
            value={`"${filters.searchQuery}"`}
            onRemove={clearSearch}
          />
        )}

        {/* Event Types */}
        {filters.eventTypes.map(eventType => (
          <FilterChip
            key={`eventType-${eventType}`}
            label="Type"
            value={eventType}
            onRemove={() => toggleEventType(eventType)}
            color="blue"
          />
        ))}

        {/* Cohorts */}
        {filters.cohorts.filter(c => c !== 'All').map(cohort => (
          <FilterChip
            key={`cohort-${cohort}`}
            label="Cohort"
            value={cohort}
            onRemove={() => toggleCohort(cohort)}
            color="green"
          />
        ))}

        {/* Player types */}
        {filters.playerTypes.filter(pt => pt !== 'All').map(playerType => (
          <FilterChip
            key={`playerType-${playerType}`}
            label="Players"
            value={playerType}
            onRemove={() => togglePlayerType(playerType)}
            color="teal"
          />
        ))}

        {/* OS types */}
        {filters.osTypes.filter(ot => ot !== 'All').map(osType => (
          <FilterChip
            key={`osType-${osType}`}
            label="OS"
            value={osType}
            onRemove={() => toggleOsType(osType)}
            color="indigo"
          />
        ))}

        {/* Statuses */}
        {filters.statuses.map(status => (
          <FilterChip
            key={`status-${status}`}
            label="Status"
            value={status}
            onRemove={() => toggleStatus(status)}
            color="purple"
          />
        ))}

        {/* Date Range */}
        {filters.dateRange && (
          <FilterChip
            label="Date Range"
            value={formatDateRange(filters.dateRange.start, filters.dateRange.end)}
            onRemove={clearDateRange}
            color="orange"
          />
        )}
      </div>
    </div>
  )
}

interface FilterChipProps {
  label: string
  value: string
  onRemove: () => void
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'gray' | 'teal' | 'indigo'
}

function FilterChip({ label, value, onRemove, color = 'gray' }: FilterChipProps) {
  const colorClasses = {
    blue: 'border-blue-400/40 text-blue-100 bg-blue-500/15',
    green: 'border-emerald-400/40 text-emerald-100 bg-emerald-500/15',
    purple: 'border-violet-400/40 text-violet-100 bg-violet-500/15',
    orange: 'border-orange-400/40 text-orange-100 bg-orange-500/15',
    teal: 'border-teal-400/40 text-teal-100 bg-teal-500/15',
    indigo: 'border-indigo-400/40 text-indigo-100 bg-indigo-500/15',
    gray: 'border-border/60 text-foreground/80 bg-background/30',
  }

  return (
    <Badge
      variant="secondary"
      className={`group flex items-center gap-1 rounded-full border px-2 py-1 text-xs backdrop-blur transition-colors ${colorClasses[color]}`}
    >
      <span className="text-xs">
        {label}: <span className="font-medium">{value}</span>
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-11 w-11 p-0 hover:bg-transparent"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </Button>
    </Badge>
  )
}

/**
 * Format date range for display
 */
function formatDateRange(start?: string, end?: string): string {
  if (start && end) {
    const startFormatted = formatDate(start, 'MMM D')
    const endFormatted = formatDate(end, 'MMM D, YYYY')
    
    // Check if same year
    const startYear = new Date(start).getFullYear()
    const endYear = new Date(end).getFullYear()
    
    if (startYear === endYear) {
      return `${startFormatted} - ${endFormatted}`
    } else {
      return `${formatDate(start, 'MMM D, YYYY')} - ${endFormatted}`
    }
  } else if (start) {
    return `From ${formatDate(start, 'MMM D, YYYY')}`
  } else if (end) {
    return `Until ${formatDate(end, 'MMM D, YYYY')}`
  }
  
  return 'Date Range'
}