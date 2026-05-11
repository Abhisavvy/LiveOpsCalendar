import Papa from 'papaparse'
import { 
  CsvRow, 
  LiveOpsEvent, 
  CsvProcessingError, 
  CsvProcessingResult,
  createEventId,
  isEventType,
  EventType,
  EventStatus,
  DurationOption,
  DURATION_OPTIONS
} from '../types/events'
import { parseToISO, addDurationToDate, nowISO } from './date-utils'

// CSV Security: Check for formula injection
const FORMULA_PATTERNS = /^[=+\-@]/
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_ROWS = 10000

/**
 * Check if a cell value could be a formula injection attempt
 */
function isSuspiciousFormula(value: string): boolean {
  if (!value || typeof value !== 'string') return false
  return FORMULA_PATTERNS.test(value.trim())
}

/**
 * Sanitize cell values to prevent CSV injection
 */
function sanitizeValue(value: string): string {
  if (!value || typeof value !== 'string') return ''
  
  const trimmed = value.trim()
  if (isSuspiciousFormula(trimmed)) {
    // Add a space prefix to neutralize formulas
    return ` ${trimmed}`
  }
  
  return trimmed
}

/**
 * Map duration string to DurationOption
 */
function mapDurationOption(durationStr: string): DurationOption {
  if (!durationStr) return '1d'
  
  const normalized = durationStr.toLowerCase().replace(/\s+/g, '')
  
  // Try to find exact matches first
  const exactMatch = DURATION_OPTIONS.find(opt => 
    opt.value.toLowerCase() === normalized ||
    opt.label.toLowerCase() === normalized.replace(/s$/, '') // Handle plurals
  )
  
  if (exactMatch) return exactMatch.value
  
  // Try pattern matching
  if (normalized.includes('1h') || normalized === '1hour') return '1h'
  if (normalized.includes('6h') || normalized === '6hours') return '6h'
  if (normalized.includes('12h') || normalized === '12hours') return '12h'
  if (normalized.includes('24h') || normalized.includes('1d') || normalized.includes('1day')) return '1d'
  if (normalized.includes('3d') || normalized.includes('3days')) return '3d'
  if (normalized.includes('1w') || normalized.includes('1week')) return '1w'
  if (normalized.includes('2w') || normalized.includes('2weeks')) return '2w'
  if (normalized.includes('1m') || normalized.includes('1month')) return '1m'
  
  // Default fallback
  return '1d'
}

/**
 * Extract title from CSV row using multiple possible column names
 */
function extractTitle(row: CsvRow): string {
  const titleFields = ['Flow Name', 'Theme', 'Event Name', 'Name']
  for (const field of titleFields) {
    const value = row[field as keyof CsvRow]
    if (value && typeof value === 'string' && value.trim()) {
      return sanitizeValue(value)
    }
  }
  return 'Untitled Event'
}

/**
 * Extract start date from CSV row
 */
function extractStartDate(row: CsvRow): string | null {
  const dateFields = ['Starting Date', 'Start Date', 'Start', 'Begin Date']
  for (const field of dateFields) {
    const value = row[field as keyof CsvRow]
    if (value && typeof value === 'string' && value.trim()) {
      return parseToISO(sanitizeValue(value))
    }
  }
  return null
}

/**
 * Extract duration from CSV row
 */
function extractDuration(row: CsvRow): DurationOption {
  const durationFields = ['Timer', 'Duration', 'Length', 'Time']
  for (const field of durationFields) {
    const value = row[field as keyof CsvRow]
    if (value && typeof value === 'string' && value.trim()) {
      return mapDurationOption(sanitizeValue(value))
    }
  }
  return '1d' // Default duration
}

/**
 * Extract cohort from CSV row
 */
function extractCohort(row: CsvRow): string {
  const cohortFields = ['Cohort', 'Target', 'Audience']
  for (const field of cohortFields) {
    const value = row[field as keyof CsvRow]
    if (value && typeof value === 'string' && value.trim()) {
      return sanitizeValue(value)
    }
  }
  return 'All'
}

/**
 * Extract event type from CSV row
 */
function extractEventType(row: CsvRow): EventType {
  const typeFields = ['Pop-up type', 'Intent', 'Event Type', 'Category']
  for (const field of typeFields) {
    const value = row[field as keyof CsvRow]
    if (value && typeof value === 'string' && value.trim()) {
      const sanitized = sanitizeValue(value)
      
      // Try exact match first
      if (isEventType(sanitized)) {
        return sanitized
      }
      
      // Try fuzzy matching
      const lower = sanitized.toLowerCase()
      if (lower.includes('iap') || lower.includes('purchase') || lower.includes('buy')) return 'IAP'
      if (lower.includes('progression') || lower.includes('progress') || lower.includes('level')) return 'Progression'
      if (lower.includes('retention') || lower.includes('return') || lower.includes('comeback')) return 'Retention'
      if (lower.includes('system') || lower.includes('maintenance') || lower.includes('update')) return 'System'
    }
  }
  return 'Unknown'
}

/**
 * Extract placement from CSV row
 */
function extractPlacement(row: CsvRow): string {
  const placementFields = ['Lobby Icon | Where', 'Placement', 'Location']
  for (const field of placementFields) {
    const value = row[field as keyof CsvRow]
    if (value && typeof value === 'string' && value.trim()) {
      return sanitizeValue(value)
    }
  }
  return 'Unknown'
}

/**
 * Extract description from CSV row
 */
function extractDescription(row: CsvRow): string {
  const descriptionFields = ['Conditions/ Intent', 'Fine Print', 'Description', 'Details']
  for (const field of descriptionFields) {
    const value = row[field as keyof CsvRow]
    if (value && typeof value === 'string' && value.trim()) {
      return sanitizeValue(value)
    }
  }
  return ''
}

/**
 * Transform a CSV row into a LiveOpsEvent
 */
function transformRowToEvent(row: CsvRow, rowIndex: number): { event?: LiveOpsEvent; errors: CsvProcessingError[] } {
  const errors: CsvProcessingError[] = []
  
  // Extract and validate fields
  const title = extractTitle(row)
  const startDateISO = extractStartDate(row)
  
  if (!startDateISO) {
    errors.push({
      row: rowIndex,
      column: 'Starting Date',
      message: 'Invalid or missing start date',
    })
    return { errors }
  }
  
  const duration = extractDuration(row)
  const endDateISO = addDurationToDate(startDateISO, duration)
  
  const cohort = extractCohort(row)
  const eventType = extractEventType(row)
  const placement = extractPlacement(row)
  const description = extractDescription(row)
  
  // Validate required fields
  if (!title || title === 'Untitled Event') {
    errors.push({
      row: rowIndex,
      column: 'Title',
      message: 'Missing event title',
    })
  }
  
  if (title.length > 200) {
    errors.push({
      row: rowIndex,
      column: 'Title',
      message: 'Event title too long (max 200 characters)',
    })
  }
  
  if (description.length > 1000) {
    errors.push({
      row: rowIndex,
      column: 'Description',
      message: 'Description too long (max 1000 characters)',
    })
  }
  
  // If there are validation errors, don't create the event
  if (errors.length > 0) {
    return { errors }
  }
  
  const event: LiveOpsEvent = {
    id: createEventId(),
    title,
    start: startDateISO,
    end: endDateISO,
    cohort,
    eventType,
    placement,
    description,
    status: 'Draft' as EventStatus,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  }
  
  return { event, errors }
}

/**
 * Validate file before processing
 */
function validateFile(file: File): CsvProcessingError[] {
  const errors: CsvProcessingError[] = []
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push({
      row: 0,
      message: `File size too large. Maximum allowed: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    })
  }
  
  // Check file type
  if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
    errors.push({
      row: 0,
      message: 'Invalid file type. Please upload a CSV file.',
    })
  }
  
  return errors
}

/**
 * Process CSV file and return LiveOps events
 */
export function processCsvFile(file: File): Promise<CsvProcessingResult> {
  return new Promise((resolve) => {
    // Validate file first
    const fileErrors = validateFile(file)
    if (fileErrors.length > 0) {
      resolve({
        events: [],
        errors: fileErrors,
        totalRows: 0,
        successfulRows: 0,
      })
      return
    }
    
    const events: LiveOpsEvent[] = []
    const errors: CsvProcessingError[] = []
    let totalRows = 0
    let successfulRows = 0
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(), // Clean headers
      complete: (results) => {
        totalRows = results.data.length
        
        // Check row count limit
        if (totalRows > MAX_ROWS) {
          errors.push({
            row: 0,
            message: `Too many rows. Maximum allowed: ${MAX_ROWS}, found: ${totalRows}`,
          })
          resolve({
            events: [],
            errors,
            totalRows,
            successfulRows: 0,
          })
          return
        }
        
        // Process each row
        results.data.forEach((row, index) => {
          const rowNumber = index + 2 // +2 because index is 0-based and we have a header row
          
          try {
            const result = transformRowToEvent(row as CsvRow, rowNumber)
            
            if (result.event) {
              events.push(result.event)
              successfulRows++
            }
            
            if (result.errors.length > 0) {
              errors.push(...result.errors)
            }
          } catch (error) {
            errors.push({
              row: rowNumber,
              message: `Unexpected error processing row: ${error instanceof Error ? error.message : 'Unknown error'}`,
            })
          }
        })
        
        // Include Papa Parse errors
        if (results.errors.length > 0) {
          results.errors.forEach((error) => {
            errors.push({
              row: error.row || 0,
              message: `Parse error: ${error.message}`,
            })
          })
        }
        
        resolve({
          events,
          errors,
          totalRows,
          successfulRows,
        })
      },
      error: (error) => {
        resolve({
          events: [],
          errors: [{
            row: 0,
            message: `Failed to parse CSV: ${error.message}`,
          }],
          totalRows: 0,
          successfulRows: 0,
        })
      },
    })
  })
}

/**
 * Generate a sample CSV template for download
 */
export function generateSampleCsv(): string {
  const headers = [
    'Flow Name',
    'Starting Date',
    'Timer',
    'Cohort',
    'Pop-up type',
    'Lobby Icon | Where',
    'Conditions/ Intent',
  ]
  
  const sampleRows = [
    [
      'Move Master Promo',
      '2024-01-15',
      '3d',
      'D0',
      'IAP',
      'Homescreen | Left',
      'Play 50 moves to earn 500 coins and unlock premium features',
    ],
    [
      'Daily Login Bonus',
      '2024-01-16',
      '1d',
      'All',
      'Retention',
      'Homescreen | Right',
      'Login daily for 7 days to get increasing rewards',
    ],
    [
      'Weekend Tournament',
      '2024-01-20',
      '2d',
      'Repeat Payers',
      'Progression',
      'Events Tab',
      'Compete with other players to win exclusive prizes',
    ],
  ]
  
  const csvContent = [
    headers.join(','),
    ...sampleRows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')
  
  return csvContent
}

/**
 * Export events to CSV format
 */
export function exportEventsToCsv(events: LiveOpsEvent[], originalColumnNames: boolean = true): string {
  if (events.length === 0) {
    throw new Error('No events to export')
  }
  
  const headers = originalColumnNames 
    ? ['Flow Name', 'Starting Date', 'Timer', 'Cohort', 'Pop-up type', 'Lobby Icon | Where', 'Conditions/ Intent']
    : ['Title', 'Start Date', 'End Date', 'Cohort', 'Event Type', 'Placement', 'Description', 'Status']
    
  const rows = events.map(event => {
    if (originalColumnNames) {
      // Calculate duration from start/end dates
      const startDate = new Date(event.start)
      const endDate = new Date(event.end)
      const durationHours = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))
      const durationOption = DURATION_OPTIONS.find(opt => opt.hours === durationHours)?.value || '1d'
      
      return [
        event.title,
        startDate.toISOString().split('T')[0], // YYYY-MM-DD format
        durationOption,
        event.cohort,
        event.eventType,
        event.placement,
        event.description,
      ]
    } else {
      return [
        event.title,
        event.start.split('T')[0], // YYYY-MM-DD format
        event.end.split('T')[0],   // YYYY-MM-DD format
        event.cohort,
        event.eventType,
        event.placement,
        event.description,
        event.status,
      ]
    }
  })
  
  // Use Papa Parse to generate clean CSV
  const csv = Papa.unparse({
    fields: headers,
    data: rows,
  })
  
  return csv
}