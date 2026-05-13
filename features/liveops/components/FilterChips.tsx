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
    clearFilters,
  } = useEventFilters()

  if (!filterStats.hasActiveFilters) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Filter Summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Showing {filterStats.filtered} of {filterStats.total} events
          {filterStats.percentage < 100 && (
            <span className="ml-1">({filterStats.percentage}%)</span>
          )}
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      </div>

      {/* Active Filter Chips */}
      <div className="flex flex-wrap gap-2">
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
    blue: 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200',
    green: 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200',
    purple: 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200',
    orange: 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200',
    teal: 'bg-teal-100 text-teal-800 hover:bg-teal-200 dark:bg-teal-900 dark:text-teal-200',
    indigo: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200',
    gray: 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200',
  }

  return (
    <Badge
      variant="secondary"
      className={`group flex items-center gap-1 pr-1 ${colorClasses[color]} transition-colors cursor-default`}
    >
      <span className="text-xs">
        {label}: <span className="font-medium">{value}</span>
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-4 w-4 p-0 hover:bg-transparent"
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