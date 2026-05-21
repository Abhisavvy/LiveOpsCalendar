'use client'

import React, { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Filter, Calendar, Users, Target, Activity, ChevronDown, ChevronRight, Smartphone, UserCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Checkbox } from '@/components/ui/checkbox'
import { useEventFilters } from '../hooks/useEventFilters'
import { useEventStore } from '../hooks/useEventStore'
import { FilterChips } from './FilterChips'
import { EVENT_TYPES, EVENT_STATUSES, PLAYER_TYPES, OS_TYPES } from '../types/events'
import { useToast } from '@/hooks/use-toast'

interface SidebarFiltersProps {
  className?: string
}

function AnimatedCollapsibleContent({
  open,
  className,
  children,
}: {
  open: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <CollapsibleContent asChild>
          <motion.div
            className={className}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            {children}
          </motion.div>
        </CollapsibleContent>
      )}
    </AnimatePresence>
  )
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
    togglePlayerType,
    toggleOsType,
    setDateRange,
    applyPreset,
    selectAll,
    selectNone,
    clearFilters,
  } = useEventFilters()

  const events = useEventStore(state => state.events)
  const { toast } = useToast()

  const [openSections, setOpenSections] = useState({
    search: true,
    eventTypes: true,
    cohorts: true,
    playerTypes: true,
    osTypes: true,
    statuses: true,
    dateRange: false,
    presets: false,
  })

  const setSectionOpen = (section: keyof typeof openSections, open: boolean) => {
    setOpenSections(prev => ({ ...prev, [section]: open }))
  }

  const handleClearFilters = () => {
    clearFilters()
    toast({
      title: 'Filters cleared',
      description: 'Showing all events.',
    })
  }

  const counts = useMemo(() => {
    const byEventType: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    const byCohort: Record<string, number> = {}

    const byPlayerType: Record<string, number> = {}
    const byOsType: Record<string, number> = {}

    for (const e of events) {
      byEventType[e.eventType] = (byEventType[e.eventType] || 0) + 1
      byStatus[e.status] = (byStatus[e.status] || 0) + 1
      byPlayerType[e.playerType] = (byPlayerType[e.playerType] || 0) + 1
      byOsType[e.osType] = (byOsType[e.osType] || 0) + 1
      for (const c of e.cohort) {
        byCohort[c] = (byCohort[c] || 0) + 1
      }
    }

    return { byEventType, byStatus, byCohort, byPlayerType, byOsType }
  }, [events])

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="sticky top-0 z-10 -mx-2 rounded-xl border border-border/60 bg-card/80 px-2 py-2 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Active filters</span>
            <Badge variant="secondary" className="text-xs">
              {filterStats.filtered}/{filterStats.total}
            </Badge>
          </div>
          {filterStats.hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      <FilterChips />

      {/* Search */}
      <Collapsible open={openSections.search} onOpenChange={(open) => setSectionOpen('search', open)}>
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
        <AnimatedCollapsibleContent open={openSections.search} className="space-y-2 mt-2">
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
        </AnimatedCollapsibleContent>
      </Collapsible>

      {/* Event Types */}
      <Collapsible open={openSections.eventTypes} onOpenChange={(open) => setSectionOpen('eventTypes', open)}>
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
        <AnimatedCollapsibleContent open={openSections.eventTypes} className="space-y-2 mt-2">
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
                    ({counts.byEventType[eventType] || 0})
                  </span>
                </div>
              )
            })}
          </div>
        </AnimatedCollapsibleContent>
      </Collapsible>

      {/* Cohorts */}
      <Collapsible open={openSections.cohorts} onOpenChange={(open) => setSectionOpen('cohorts', open)}>
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
        <AnimatedCollapsibleContent open={openSections.cohorts} className="space-y-2 mt-2">
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
                    ({counts.byCohort[cohort] || 0})
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
        </AnimatedCollapsibleContent>
      </Collapsible>

      {/* Player types */}
      <Collapsible open={openSections.playerTypes} onOpenChange={(open) => setSectionOpen('playerTypes', open)}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2 h-auto">
            <div className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Player Types</span>
              {filters.playerTypes.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.playerTypes.length}
                </Badge>
              )}
            </div>
            {openSections.playerTypes ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <AnimatedCollapsibleContent open={openSections.playerTypes} className="space-y-2 mt-2">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectAll('playerTypes')}
              className="h-6 px-2 text-xs"
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectNone('playerTypes')}
              className="h-6 px-2 text-xs"
            >
              None
            </Button>
          </div>

          <div className="space-y-2">
            {PLAYER_TYPES.map(playerType => {
              const isSelected = filters.playerTypes.includes(playerType)

              return (
                <div key={playerType} className="flex items-center space-x-2">
                  <Checkbox
                    id={`playerType-${playerType}`}
                    checked={isSelected}
                    onCheckedChange={() => togglePlayerType(playerType)}
                  />
                  <Label
                    htmlFor={`playerType-${playerType}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {playerType}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    ({counts.byPlayerType[playerType] || 0})
                  </span>
                </div>
              )
            })}
          </div>
        </AnimatedCollapsibleContent>
      </Collapsible>

      {/* OS types */}
      <Collapsible open={openSections.osTypes} onOpenChange={(open) => setSectionOpen('osTypes', open)}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2 h-auto">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <span className="text-sm font-medium">OS</span>
              {filters.osTypes.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.osTypes.length}
                </Badge>
              )}
            </div>
            {openSections.osTypes ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <AnimatedCollapsibleContent open={openSections.osTypes} className="space-y-2 mt-2">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectAll('osTypes')}
              className="h-6 px-2 text-xs"
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectNone('osTypes')}
              className="h-6 px-2 text-xs"
            >
              None
            </Button>
          </div>

          <div className="space-y-2">
            {OS_TYPES.map(osType => {
              const isSelected = filters.osTypes.includes(osType)

              return (
                <div key={osType} className="flex items-center space-x-2">
                  <Checkbox
                    id={`osType-${osType}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleOsType(osType)}
                  />
                  <Label
                    htmlFor={`osType-${osType}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {osType}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    ({counts.byOsType[osType] || 0})
                  </span>
                </div>
              )
            })}
          </div>
        </AnimatedCollapsibleContent>
      </Collapsible>

      {/* Statuses */}
      <Collapsible open={openSections.statuses} onOpenChange={(open) => setSectionOpen('statuses', open)}>
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
        <AnimatedCollapsibleContent open={openSections.statuses} className="space-y-2 mt-2">
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
                    ({counts.byStatus[status] || 0})
                  </span>
                </div>
              )
            })}
          </div>
        </AnimatedCollapsibleContent>
      </Collapsible>

      {/* Date Range */}
      <Collapsible open={openSections.dateRange} onOpenChange={(open) => setSectionOpen('dateRange', open)}>
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
        <AnimatedCollapsibleContent open={openSections.dateRange} className="space-y-2 mt-2">
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
        </AnimatedCollapsibleContent>
      </Collapsible>

      {/* Quick Presets */}
      <Collapsible open={openSections.presets} onOpenChange={(open) => setSectionOpen('presets', open)}>
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
        <AnimatedCollapsibleContent open={openSections.presets} className="space-y-2 mt-2">
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
        </AnimatedCollapsibleContent>
      </Collapsible>

      {/* Clear All Button removed in favor of sticky active bar */}
    </div>
  )
}