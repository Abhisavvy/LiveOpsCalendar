'use client'

import React, { useState } from 'react'
import { Search, Filter, Calendar, Users, Target, Activity, ChevronDown, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Checkbox } from '@/components/ui/checkbox'
import { useEventFilters } from '../hooks/useEventFilters'
import { FilterChips } from './FilterChips'
import { EVENT_TYPES, EVENT_STATUSES } from '../types/events'

interface SidebarFiltersProps {
  className?: string
}

export function SidebarFilters({ className }: SidebarFiltersProps) {
  const {
    filters,
    filterOptions,
    filterStats,
    setSearchQuery,
    toggleEventType,
    toggleCohort,
    toggleStatus,
    setDateRange,
    applyPreset,
    selectAll,
    selectNone,
    clearFilters,
  } = useEventFilters()

  const [openSections, setOpenSections] = useState({
    search: true,
    eventTypes: true,
    cohorts: true,
    statuses: true,
    dateRange: false,
    presets: false,
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Summary */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">Filters</span>
        {filterStats.hasActiveFilters && (
          <Badge variant="secondary" className="text-xs">
            {filterStats.filtered}/{filterStats.total}
          </Badge>
        )}
      </div>

      {/* Active Filter Chips */}
      <FilterChips />

      {/* Search */}
      <Collapsible open={openSections.search} onOpenChange={() => toggleSection('search')}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2 h-auto">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="text-sm font-medium">Search</span>
            </div>
            {openSections.search ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={filters.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Search by title, description, placement, or cohort
          </p>
        </CollapsibleContent>
      </Collapsible>

      {/* Event Types */}
      <Collapsible open={openSections.eventTypes} onOpenChange={() => toggleSection('eventTypes')}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2 h-auto">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">Event Types</span>
              {filters.eventTypes.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.eventTypes.length}
                </Badge>
              )}
            </div>
            {openSections.eventTypes ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectAll('eventTypes')}
              className="h-6 px-2 text-xs"
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectNone('eventTypes')}
              className="h-6 px-2 text-xs"
            >
              None
            </Button>
          </div>
          
          <div className="space-y-2">
            {EVENT_TYPES.map(eventType => {
              const count = filterOptions.eventTypes.filter(t => t === eventType).length > 0 
                ? filterOptions.eventTypes.filter(t => t === eventType).length 
                : 0
              const isSelected = filters.eventTypes.includes(eventType)
              
              return (
                <div key={eventType} className="flex items-center space-x-2">
                  <Checkbox
                    id={`eventType-${eventType}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleEventType(eventType)}
                  />
                  <Label
                    htmlFor={`eventType-${eventType}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {eventType}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    ({filterOptions.eventTypes.filter(t => t === eventType).length || 0})
                  </span>
                </div>
              )
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Cohorts */}
      <Collapsible open={openSections.cohorts} onOpenChange={() => toggleSection('cohorts')}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2 h-auto">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Cohorts</span>
              {filters.cohorts.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.cohorts.length}
                </Badge>
              )}
            </div>
            {openSections.cohorts ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectAll('cohorts')}
              className="h-6 px-2 text-xs"
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectNone('cohorts')}
              className="h-6 px-2 text-xs"
            >
              None
            </Button>
          </div>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {filterOptions.cohorts.map(cohort => {
              const count = filterOptions.cohorts.filter(c => c === cohort).length
              const isSelected = filters.cohorts.includes(cohort)
              
              return (
                <div key={cohort} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cohort-${cohort}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleCohort(cohort)}
                  />
                  <Label
                    htmlFor={`cohort-${cohort}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {cohort}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    ({count})
                  </span>
                </div>
              )
            })}
            
            {filterOptions.cohorts.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No cohorts available
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Statuses */}
      <Collapsible open={openSections.statuses} onOpenChange={() => toggleSection('statuses')}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2 h-auto">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">Status</span>
              {filters.statuses.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.statuses.length}
                </Badge>
              )}
            </div>
            {openSections.statuses ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectAll('statuses')}
              className="h-6 px-2 text-xs"
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectNone('statuses')}
              className="h-6 px-2 text-xs"
            >
              None
            </Button>
          </div>
          
          <div className="space-y-2">
            {EVENT_STATUSES.map(status => {
              const count = filterOptions.statuses.filter(s => s === status).length
              const isSelected = filters.statuses.includes(status)
              
              return (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleStatus(status)}
                  />
                  <Label
                    htmlFor={`status-${status}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {status}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    ({count})
                  </span>
                </div>
              )
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Date Range */}
      <Collapsible open={openSections.dateRange} onOpenChange={() => toggleSection('dateRange')}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2 h-auto">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Date Range</span>
              {filters.dateRange && <Badge variant="secondary" className="text-xs">Active</Badge>}
            </div>
            {openSections.dateRange ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">From</Label>
              <Input
                type="date"
                value={filters.dateRange?.start ? new Date(filters.dateRange.start).toISOString().split('T')[0] : ''}
                onChange={(e) => setDateRange(
                  e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  filters.dateRange?.end
                )}
                className="text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input
                type="date"
                value={filters.dateRange?.end ? new Date(filters.dateRange.end).toISOString().split('T')[0] : ''}
                onChange={(e) => setDateRange(
                  filters.dateRange?.start,
                  e.target.value ? new Date(e.target.value).toISOString() : undefined
                )}
                className="text-xs"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Quick Presets */}
      <Collapsible open={openSections.presets} onOpenChange={() => toggleSection('presets')}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2 h-auto">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Quick Filters</span>
            </div>
            {openSections.presets ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset('active')}
              className="h-8 text-xs"
            >
              Active Events
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset('scheduled')}
              className="h-8 text-xs"
            >
              Scheduled
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset('thisWeek')}
              className="h-8 text-xs"
            >
              This Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset('thisMonth')}
              className="h-8 text-xs"
            >
              This Month
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Clear All Button */}
      {filterStats.hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="w-full text-xs"
        >
          Clear All Filters
        </Button>
      )}
    </div>
  )
}