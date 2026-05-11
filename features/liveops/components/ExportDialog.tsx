'use client'

import React, { useState, useMemo } from 'react'
import { Download, FileText, AlertTriangle, Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useEventStore } from '../hooks/useEventStore'
import { useEventFilters } from '../hooks/useEventFilters'
import { 
  exportEventsToCSV, 
  downloadCSV, 
  generateExportFilename,
  validateExportData,
  getExportSummary,
  getDefaultColumnMapping,
  getExtendedColumnMapping
} from '../lib/export-utils'
import { ExportConfig } from '../types/events'

interface ExportDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportDialog({ isOpen, onOpenChange }: ExportDialogProps) {
  const { toast } = useToast()
  const events = useEventStore(state => state.events)
  const filteredEvents = useEventStore(state => state.filteredEvents)
  const { filterStats } = useEventFilters()
  
  const [exportType, setExportType] = useState<'all' | 'filtered'>('filtered')
  const [columnSet, setColumnSet] = useState<'default' | 'extended'>('default')
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD')
  const [isExporting, setIsExporting] = useState(false)

  // Determine which events to export
  const eventsToExport = exportType === 'all' ? events : filteredEvents
  
  // Validation and summary
  const validation = useMemo(() => validateExportData(eventsToExport), [eventsToExport])
  const summary = useMemo(() => getExportSummary(eventsToExport), [eventsToExport])

  const handleExport = async () => {
    if (!validation.isValid) {
      toast({
        title: "Export Failed",
        description: validation.errors[0] || "Cannot export events",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    
    try {
      const config: ExportConfig = {
        includeAll: exportType === 'all',
        columnMapping: columnSet === 'default' 
          ? getDefaultColumnMapping() 
          : getExtendedColumnMapping(),
        dateFormat,
      }
      
      const csvContent = exportEventsToCSV(eventsToExport, config)
      const filename = generateExportFilename(
        eventsToExport.length, 
        exportType === 'filtered' && filterStats.hasActiveFilters
      )
      
      downloadCSV(csvContent, filename)
      
      toast({
        title: "Export Successful",
        description: `Downloaded ${eventsToExport.length} events as ${filename}`,
      })
      
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "An error occurred during export",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Events to CSV
          </DialogTitle>
          <DialogDescription>
            Configure your export settings and download events as a CSV file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Scope */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Scope</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={exportType === 'filtered' ? 'default' : 'outline'}
                onClick={() => setExportType('filtered')}
                className="h-auto p-3 flex-col items-start"
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Filtered Events</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {filteredEvents.length} events
                </span>
                {filterStats.hasActiveFilters && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Filters Applied
                  </Badge>
                )}
              </Button>
              
              <Button
                variant={exportType === 'all' ? 'default' : 'outline'}
                onClick={() => setExportType('all')}
                className="h-auto p-3 flex-col items-start"
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">All Events</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {events.length} events
                </span>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Column Configuration */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Column Set</Label>
            <Select value={columnSet} onValueChange={(value: 'default' | 'extended') => setColumnSet(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  Default Columns (9 columns - Excel compatible)
                </SelectItem>
                <SelectItem value="extended">
                  Extended Columns (16 columns - Full data)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Default columns match the original CSV import format. Extended includes all event data.
            </p>
          </div>

          {/* Date Format */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Date Format</Label>
            <Select value={dateFormat} onValueChange={setDateFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YYYY-MM-DD">2024-01-15 (ISO format)</SelectItem>
                <SelectItem value="MM/DD/YYYY">01/15/2024 (US format)</SelectItem>
                <SelectItem value="DD/MM/YYYY">15/01/2024 (EU format)</SelectItem>
                <SelectItem value="MMM D, YYYY">Jan 15, 2024 (Readable)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Export Summary */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Summary</Label>
            <div className="bg-muted/20 rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Total Events:</span>
                  <div className="font-medium">{summary.totalEvents}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Event Types:</span>
                  <div className="font-medium">{Object.keys(summary.byEventType).length}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Cohorts:</span>
                  <div className="font-medium">{Object.keys(summary.byCohort).length}</div>
                </div>
              </div>
              
              {summary.dateRange.earliest && summary.dateRange.latest && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Date Range:</span>
                  <div className="font-medium">
                    {new Date(summary.dateRange.earliest).toLocaleDateString()} - {' '}
                    {new Date(summary.dateRange.latest).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Validation Messages */}
          {(validation.warnings.length > 0 || !validation.isValid) && (
            <div className="space-y-2">
              {!validation.isValid && validation.errors.map((error, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              ))}
              
              {validation.warnings.map((warning, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                  <Info className="h-4 w-4" />
                  {warning}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={!validation.isValid || isExporting}
            className="min-w-[120px]"
          >
            {isExporting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Exporting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}