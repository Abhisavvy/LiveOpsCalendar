import Papa from 'papaparse'
import { LiveOpsEvent, ExportConfig, formatCohorts, formatPlacements } from '../types/events'
import { formatDate, calculateDuration } from './date-utils'

/**
 * Export events to CSV with configurable options
 */
export function exportEventsToCSV(
  events: LiveOpsEvent[],
  config: ExportConfig = { includeAll: false, dateFormat: 'YYYY-MM-DD' }
): string {
  if (events.length === 0) {
    throw new Error('No events to export')
  }

  const { columnMapping = getDefaultColumnMapping(), dateFormat } = config

  // Prepare headers
  const headers = Object.keys(columnMapping)

  // Transform events to CSV rows
  const rows = events.map(event => {
    const row: Record<string, string> = {}
    
    Object.entries(columnMapping).forEach(([csvColumn, eventField]) => {
      switch (eventField) {
        case 'id':
          row[csvColumn] = event.id
          break
        case 'title':
          row[csvColumn] = event.title
          break
        case 'start':
          row[csvColumn] = formatDate(event.start, dateFormat || 'YYYY-MM-DD')
          break
        case 'end':
          row[csvColumn] = formatDate(event.end, dateFormat || 'YYYY-MM-DD')
          break
        case 'startDateTime':
          row[csvColumn] = formatDate(event.start, 'YYYY-MM-DD HH:mm:ss')
          break
        case 'endDateTime':
          row[csvColumn] = formatDate(event.end, 'YYYY-MM-DD HH:mm:ss')
          break
        case 'duration':
          const duration = calculateDuration(event.start, event.end)
          row[csvColumn] = duration.readable
          break
        case 'cohort':
          row[csvColumn] = formatCohorts(event.cohort)
          break
        case 'eventType':
          row[csvColumn] = event.eventType
          break
        case 'placement':
          row[csvColumn] = formatPlacements(event.placement)
          break
        case 'description':
          row[csvColumn] = event.description
          break
        case 'status':
          row[csvColumn] = event.status
          break
        case 'createdAt':
          row[csvColumn] = formatDate(event.createdAt, dateFormat || 'YYYY-MM-DD HH:mm:ss')
          break
        case 'updatedAt':
          row[csvColumn] = formatDate(event.updatedAt, dateFormat || 'YYYY-MM-DD HH:mm:ss')
          break
        case 'frequency':
        case 'recurrenceFrequency':
          row[csvColumn] = event.recurrence?.frequency || ''
          break
        case 'interval':
        case 'recurrenceInterval':
          row[csvColumn] = event.recurrence?.interval?.toString() ?? ''
          break
        case 'daysOfWeek':
          row[csvColumn] =
            event.recurrence?.daysOfWeek?.length ?
              event.recurrence.daysOfWeek.join(',')
            : ''
          break
        case 'dayOfMonth':
          row[csvColumn] = event.recurrence?.dayOfMonth?.toString() ?? ''
          break
        case 'monthlyPattern':
          row[csvColumn] = event.recurrence?.monthlyPattern ?? ''
          break
        case 'until':
        case 'recurrenceUntil':
          row[csvColumn] = event.recurrence?.until
            ? formatDate(event.recurrence.until, dateFormat || 'YYYY-MM-DD')
            : ''
          break
        case 'count':
          row[csvColumn] = event.recurrence?.count?.toString() ?? ''
          break
        case 'playerType':
          row[csvColumn] = event.playerType
          break
        case 'osType':
          row[csvColumn] = event.osType
          break
        case 'client':
          row[csvColumn] = event.client
          break
        default:
          row[csvColumn] = ''
      }
    })
    
    return row
  })

  // Generate CSV using Papa Parse
  const csv = Papa.unparse({
    fields: headers,
    data: rows,
  }, {
    quotes: true,
    quoteChar: '"',
    escapeChar: '"',
    delimiter: ',',
    header: true,
    newline: '\r\n',
  })

  return csv
}

/**
 * Get default column mapping for LiveOps events
 */
export function getDefaultColumnMapping(): Record<string, string> {
  return {
    'Flow Name': 'title',
    'Starting Date': 'start', 
    'Ending Date': 'end',
    'Cohort': 'cohort',
    'Pop-up type': 'eventType',
    'Lobby Icon | Where': 'placement',
    'Conditions/ Intent': 'description',
    'Status': 'status',
    'Duration': 'duration',
  }
}

/**
 * Get extended column mapping with all available fields
 */
export function getExtendedColumnMapping(): Record<string, string> {
  return {
    'Event ID': 'id',
    'Flow Name': 'title',
    'Starting Date': 'start',
    'Starting Date Time': 'startDateTime',
    'Ending Date': 'end',
    'Ending Date Time': 'endDateTime',
    'Duration': 'duration',
    'Cohort': 'cohort',
    'Pop-up type': 'eventType',
    'Lobby Icon | Where': 'placement',
    'Conditions/ Intent': 'description',
    'Status': 'status',
    'Created At': 'createdAt',
    'Updated At': 'updatedAt',
    'Player Type': 'playerType',
    'OS': 'osType',
    'Client': 'client',
    frequency: 'frequency',
    interval: 'interval',
    daysOfWeek: 'daysOfWeek',
    dayOfMonth: 'dayOfMonth',
    monthlyPattern: 'monthlyPattern',
    until: 'until',
    count: 'count',
  }
}

/**
 * Download CSV file to user's computer
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  })
  
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up the URL
    URL.revokeObjectURL(url)
  } else {
    throw new Error('CSV download not supported in this browser')
  }
}

/**
 * Generate filename for export
 */
export function generateExportFilename(
  eventCount: number, 
  isFiltered: boolean = false,
  prefix: string = 'liveops-events'
): string {
  const timestamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-')
  const filterSuffix = isFiltered ? '-filtered' : ''
  const countSuffix = `(${eventCount})`
  
  return `${prefix}${filterSuffix}-${timestamp}-${countSuffix}.csv`
}

/**
 * Validate export data
 */
export function validateExportData(events: LiveOpsEvent[]): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (events.length === 0) {
    errors.push('No events to export')
  }
  
  if (events.length > 10000) {
    warnings.push(`Exporting ${events.length} events may take a while`)
  }
  
  // Check for potential data issues
  const eventsWithoutTitle = events.filter(e => !e.title.trim())
  if (eventsWithoutTitle.length > 0) {
    warnings.push(`${eventsWithoutTitle.length} events have empty titles`)
  }
  
  const eventsWithLongDescriptions = events.filter(e => e.description.length > 500)
  if (eventsWithLongDescriptions.length > 0) {
    warnings.push(`${eventsWithLongDescriptions.length} events have very long descriptions`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Get export summary statistics
 */
export function getExportSummary(events: LiveOpsEvent[]): {
  totalEvents: number
  byEventType: Record<string, number>
  byStatus: Record<string, number>
  byCohort: Record<string, number>
  dateRange: { earliest: string; latest: string }
} {
  if (events.length === 0) {
    return {
      totalEvents: 0,
      byEventType: {},
      byStatus: {},
      byCohort: {},
      dateRange: { earliest: '', latest: '' },
    }
  }
  
  const byEventType: Record<string, number> = {}
  const byStatus: Record<string, number> = {}
  const byCohort: Record<string, number> = {}
  
  const firstEvent = events[0]
  if (!firstEvent) {
    return {
      totalEvents: 0,
      byEventType: {},
      byStatus: {},
      byCohort: {},
      dateRange: { earliest: '', latest: '' },
    }
  }

  let earliest = firstEvent.start
  let latest = firstEvent.end
  
  events.forEach(event => {
    // Count by event type
    byEventType[event.eventType] = (byEventType[event.eventType] || 0) + 1
    
    // Count by status
    byStatus[event.status] = (byStatus[event.status] || 0) + 1
    
    // Count by cohort
    byCohort[event.cohort] = (byCohort[event.cohort] || 0) + 1
    
    // Track date range
    if (earliest && event.start < earliest) {
      earliest = event.start
    }
    if (latest && event.end > latest) {
      latest = event.end
    }
  })
  
  return {
    totalEvents: events.length,
    byEventType,
    byStatus,
    byCohort,
    dateRange: { earliest, latest },
  }
}