'use client'

import React, { useState } from 'react'
import { Download, FileDown, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ExportDialog } from './ExportDialog'
import { useEventStore } from '../hooks/useEventStore'
import { useEventFilters } from '../hooks/useEventFilters'
import { useToast } from '@/hooks/use-toast'
import { 
  exportEventsToCSV, 
  downloadCSV, 
  generateExportFilename,
  getDefaultColumnMapping
} from '../lib/export-utils'

interface ExportButtonProps {
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
}

export function ExportButton({ 
  size = 'sm', 
  variant = 'outline',
  className 
}: ExportButtonProps) {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  
  const events = useEventStore(state => state.events)
  const filteredEvents = useEventStore(state => state.filteredEvents)
  const { filterStats } = useEventFilters()

  const hasEvents = events.length > 0
  const hasFilteredEvents = filteredEvents.length > 0
  const hasActiveFilters = filterStats.hasActiveFilters

  const quickExportAll = async () => {
    if (events.length === 0) {
      toast({
        title: "No Events to Export",
        description: "Import some events first.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    try {
      const csvContent = exportEventsToCSV(events, {
        includeAll: true,
        columnMapping: getDefaultColumnMapping(),
      })
      const filename = generateExportFilename(events.length, false)
      downloadCSV(csvContent, filename)
      
      toast({
        title: "Export Successful",
        description: `Downloaded ${events.length} events`,
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const quickExportFiltered = async () => {
    if (filteredEvents.length === 0) {
      toast({
        title: "No Filtered Events to Export",
        description: "Adjust your filters or import some events first.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    try {
      const csvContent = exportEventsToCSV(filteredEvents, {
        includeAll: false,
        columnMapping: getDefaultColumnMapping(),
      })
      const filename = generateExportFilename(filteredEvents.length, hasActiveFilters)
      downloadCSV(csvContent, filename)
      
      toast({
        title: "Export Successful",
        description: `Downloaded ${filteredEvents.length} filtered events`,
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  if (!hasEvents) {
    return (
      <Button 
        size={size} 
        variant={variant} 
        disabled 
        className={className}
      >
        <Download className="h-4 w-4 mr-1" />
        Export
      </Button>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            size={size} 
            variant={variant} 
            disabled={isExporting}
            className={className}
          >
            {isExporting ? (
              <>
                <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-1" />
                Export
                <ChevronDown className="h-3 w-3 ml-1" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Quick Export</DropdownMenuLabel>
          
          <DropdownMenuItem
            onClick={quickExportFiltered}
            disabled={!hasFilteredEvents || isExporting}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              <span>Export Filtered</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs">
                {filteredEvents.length}
              </Badge>
              {hasActiveFilters && (
                <Badge variant="outline" className="text-xs">
                  Filtered
                </Badge>
              )}
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={quickExportAll}
            disabled={!hasEvents || isExporting}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              <span>Export All</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {events.length}
            </Badge>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setIsDialogOpen(true)}
            disabled={!hasEvents || isExporting}
          >
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>Advanced Export...</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  )
}