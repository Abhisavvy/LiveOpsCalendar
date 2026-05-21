'use client'

import React, { useState, useEffect } from 'react'
import { CalendarView } from './CalendarView'
import { CsvDropzone } from './CsvDropzone'
import { EventDetailSheet } from './EventDetailSheet'
import { SidebarFilters } from './SidebarFilters'
import { ExportButton } from './ExportButton'
import { LiveOpsEvent } from '../types/events'
import { useEventStore } from '../hooks/useEventStore'
import { Button } from '@/components/ui/button'
import { Menu, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CalendarLegend } from './CalendarLegend'
import { CalendarEmptyStateCallout } from './CalendarEmptyStateCallout'

export function LiveOpsDashboard() {
  const [selectedEvent, setSelectedEvent] = useState<LiveOpsEvent | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isEventSheetOpen, setIsEventSheetOpen] = useState(false)
  const [createEventDates, setCreateEventDates] = useState<{ start?: string; end?: string }>({})
  
  const loadFromStorage = useEventStore(state => state.loadFromStorage)
  const totalEventCount = useEventStore(state => state.events.length)
  const visibleEventCount = useEventStore(state => state.filteredEvents.length)
  const clearFilters = useEventStore(state => state.clearFilters)
  const applyFilters = useEventStore(state => state.applyFilters)

  // Load events from storage on mount
  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    const interval = window.setInterval(() => {
      applyFilters()
    }, 60000)
    return () => window.clearInterval(interval)
  }, [applyFilters])

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleEventClick = (event: LiveOpsEvent) => {
    setSelectedEvent(event)
    setCreateEventDates({})
    setIsEventSheetOpen(true)
  }

  const handleDateSelect = (start: string, end: string) => {
    setSelectedEvent(null)
    setCreateEventDates({ start, end })
    setIsEventSheetOpen(true)
  }

  const handleCreateEvent = () => {
    setSelectedEvent(null)
    setCreateEventDates({})
    setIsEventSheetOpen(true)
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col bg-card border-r transition-all duration-300 ease-in-out",
          isMobile
            ? "fixed inset-y-0 left-0 z-50 w-80 shadow-lg transform"
            : "relative min-h-full",
          isMobile
            ? (isSidebarOpen ? "translate-x-0" : "-translate-x-full pointer-events-none")
            : (isSidebarOpen ? "w-80" : "w-14")
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {isSidebarOpen && (
            <div className="flex-1">
              <h2 className="text-lg font-semibold">LiveOps Events</h2>
              <p className="text-sm text-muted-foreground">
                {totalEventCount === visibleEventCount
                  ? `${totalEventCount} event${totalEventCount === 1 ? '' : 's'} loaded`
                  : `${totalEventCount} loaded • ${visibleEventCount} visible`}
              </p>
            </div>
          )}
          
          {/* Toggle button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
              "shrink-0",
              !isSidebarOpen && "mx-auto"
            )}
          >
            {isSidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Sidebar Content */}
        {isSidebarOpen && (
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* CSV Import Section */}
            <div>
              <h3 className="text-sm font-medium mb-3">Import Events</h3>
              <CsvDropzone />
            </div>

            {/* Filters Section */}
            <div>
              <SidebarFilters />
            </div>

            {/* Export Section */}
            <div>
              <h3 className="text-sm font-medium mb-3">Export</h3>
              <ExportButton className="w-full" />
            </div>
          </div>
        )}

        {/* Mobile overlay */}
        {isMobile && isSidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">LiveOps Event Calendar</h1>
              <p className="text-sm text-muted-foreground">
                Manage and schedule your mobile game events
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCreateEvent}>
                <Plus className="h-4 w-4 mr-1" />
                Add Event
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Content */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="space-y-3">
            <CalendarLegend />

            {totalEventCount === 0 ? (
              <CalendarEmptyStateCallout mode="noEvents" onCreateEvent={handleCreateEvent} />
            ) : visibleEventCount === 0 ? (
              <CalendarEmptyStateCallout mode="noMatches" onClearFilters={clearFilters} />
            ) : null}

            <CalendarView
              className="w-full"
              initialView={isMobile ? 'listWeek' : 'dayGridMonth'}
              onEventClick={handleEventClick}
              onDateSelect={handleDateSelect}
            />
          </div>
        </div>
      </div>

      {/* Event Detail Sheet */}
      <EventDetailSheet
        event={selectedEvent}
        isOpen={isEventSheetOpen}
        onOpenChange={setIsEventSheetOpen}
        {...(createEventDates.start ? { defaultStart: createEventDates.start } : {})}
        {...(createEventDates.end ? { defaultEnd: createEventDates.end } : {})}
      />
    </div>
  )
}