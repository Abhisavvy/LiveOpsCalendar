import Papa from 'papaparse'
import { 
  CsvRow, 
  LiveOpsEvent, 
  CsvProcessingError, 
  createEventId,
  isEventType,
  EventType,
  EventStatus,
  DurationOption,
  DURATION_OPTIONS,
  normalizeCohorts,
  normalizePlayerType,
  normalizeOsType,
  normalizeClient,
  normalizePlacements,
} from '../types/events'
import { parseToISO, addDurationToDate, nowISO } from '../lib/date-utils'
import { parseRecurrenceFromCsvRow, pickCsvCell } from '../lib/csv-import-fields'

// Batch processing configuration
const BATCH_SIZE = 200
const PROCESSING_DELAY = 10 // ms between batches to allow UI updates

// Worker message types
export interface BatchProcessorMessage {
  type: 'PROCESS_FILE' | 'PROGRESS' | 'COMPLETE' | 'ERROR' | 'BATCH_COMPLETE'
  payload?: unknown
}

export interface ProcessFilePayload {
  fileContent: string
  fileName: string
  fileSize: number
  fileType?: string
}

export interface ProgressPayload {
  processed: number
  total: number
  currentBatch: number
  totalBatches: number
  batchResults: {
    successful: number
    failed: number
    errors: CsvProcessingError[]
  }
  performance: {
    startTime: number
    estimatedCompletion: number
    eventsPerSecond: number
  }
}

export interface BatchCompletePayload {
  events: LiveOpsEvent[]
  errors: CsvProcessingError[]
  batchNumber: number
  performance: {
    processingTime: number
    eventsProcessed: number
  }
}

export interface CompletePayload {
  events: LiveOpsEvent[]
  errors: CsvProcessingError[]
  totalRows: number
  successfulRows: number
  performance: {
    totalTime: number
    averageEventsPerSecond: number
    memoryUsage?: number
  }
}

// Security and validation functions (duplicated from csv-processor.ts for worker isolation)
const FORMULA_PATTERNS = /^[=+\-@]/
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_ROWS = 10000

function isSuspiciousFormula(value: string): boolean {
  if (!value || typeof value !== 'string') return false
  return FORMULA_PATTERNS.test(value.trim())
}

function sanitizeValue(value: string): string {
  if (!value || typeof value !== 'string') return ''
  
  const trimmed = value.trim()
  if (isSuspiciousFormula(trimmed)) {
    return ` ${trimmed}` // Add space prefix to neutralize formulas
  }
  
  return trimmed
}

function mapDurationOption(durationStr: string): DurationOption {
  if (!durationStr) return '1d'
  
  const normalized = durationStr.toLowerCase().replace(/\s+/g, '')
  
  const exactMatch = DURATION_OPTIONS.find(opt => 
    opt.value.toLowerCase() === normalized ||
    opt.label.toLowerCase() === normalized.replace(/s$/, '')
  )
  
  if (exactMatch) return exactMatch.value
  
  // Pattern matching fallbacks
  if (normalized.includes('1h') || normalized === '1hour') return '1h'
  if (normalized.includes('6h') || normalized === '6hours') return '6h'
  if (normalized.includes('12h') || normalized === '12hours') return '12h'
  if (normalized.includes('24h') || normalized.includes('1d') || normalized.includes('1day')) return '1d'
  if (normalized.includes('3d') || normalized.includes('3days')) return '3d'
  if (normalized.includes('1w') || normalized.includes('1week')) return '1w'
  if (normalized.includes('2w') || normalized.includes('2weeks')) return '2w'
  if (normalized.includes('1m') || normalized.includes('1month')) return '1m'
  
  return '1d'
}

export function parseCsvContent(fileContent: string): Promise<Papa.ParseResult<CsvRow>> {
  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      complete: resolve,
      error: (error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown parsing error'
        reject(new Error(message))
      },
    })
  })
}

// Field extraction functions
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

function extractDuration(row: CsvRow): DurationOption {
  const durationFields = ['Timer', 'Duration', 'Length', 'Time']
  for (const field of durationFields) {
    const value = row[field as keyof CsvRow]
    if (value && typeof value === 'string' && value.trim()) {
      return mapDurationOption(sanitizeValue(value))
    }
  }
  return '1d'
}

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

function extractEventType(row: CsvRow): EventType {
  const typeFields = ['Pop-up type', 'Intent', 'Event Type', 'Category']
  for (const field of typeFields) {
    const value = row[field as keyof CsvRow]
    if (value && typeof value === 'string' && value.trim()) {
      const sanitized = sanitizeValue(value)
      
      if (isEventType(sanitized)) {
        return sanitized
      }
      
      // Fuzzy matching
      const lower = sanitized.toLowerCase()
      if (lower.includes('iap') || lower.includes('purchase') || lower.includes('buy')) return 'IAP'
      if (lower.includes('progression') || lower.includes('progress') || lower.includes('level')) return 'Progression'
      if (lower.includes('retention') || lower.includes('return') || lower.includes('comeback')) return 'Retention'
      if (lower.includes('system') || lower.includes('maintenance') || lower.includes('update')) return 'System'
    }
  }
  return 'Unknown'
}

function extractPlacement(row: CsvRow): string[] {
  const placementFields = ['Lobby Icon | Where', 'Placement', 'Location']
  for (const field of placementFields) {
    const value = row[field as keyof CsvRow]
    if (value && typeof value === 'string' && value.trim()) {
      return normalizePlacements(sanitizeValue(value))
    }
  }
  return normalizePlacements(undefined)
}

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

function transformRowToEvent(row: CsvRow, rowIndex: number): { event?: LiveOpsEvent; errors: CsvProcessingError[] } {
  const errors: CsvProcessingError[] = []
  
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
  const recurrenceParsed = parseRecurrenceFromCsvRow(row, rowIndex)
  errors.push(...recurrenceParsed.errors)

  const playerType = normalizePlayerType(pickCsvCell(row, 'Player Type'))
  const osType = normalizeOsType(pickCsvCell(row, 'OS'))
  const client = normalizeClient(pickCsvCell(row, 'Client'))
  
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
  
  if (errors.length > 0) {
    return { errors }
  }
  
  const event: LiveOpsEvent = {
    id: createEventId(),
    title,
    start: startDateISO,
    end: endDateISO,
    cohort: normalizeCohorts(cohort),
    eventType,
    playerType,
    osType,
    client,
    placement,
    description,
    status: 'Draft' as EventStatus,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    ...(recurrenceParsed.recurrence ?
      { recurrence: recurrenceParsed.recurrence }
    : {}),
  }
  
  return { event, errors }
}

// Main worker processing function
function processBatch(
  rows: CsvRow[], 
  batchNumber: number, 
  startIndex: number
): BatchCompletePayload {
  const batchStartTime = performance.now()
  const events: LiveOpsEvent[] = []
  const errors: CsvProcessingError[] = []
  
  rows.forEach((row, index) => {
    const rowNumber = startIndex + index + 2 // +2 for header and 1-based indexing
    
    try {
      const result = transformRowToEvent(row, rowNumber)
      
      if (result.event) {
        events.push(result.event)
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
  
  const processingTime = performance.now() - batchStartTime
  
  return {
    events,
    errors,
    batchNumber,
    performance: {
      processingTime,
      eventsProcessed: events.length,
    }
  }
}

// Worker message handler
if (typeof self !== 'undefined') {
  self.addEventListener('message', async (event: MessageEvent<BatchProcessorMessage>) => {
    const { type, payload } = event.data
    
    if (type === 'PROCESS_FILE') {
      const { fileContent, fileName, fileSize, fileType } = payload as ProcessFilePayload
      const processingStartTime = performance.now()

      if (fileSize > MAX_FILE_SIZE) {
        self.postMessage({
          type: 'ERROR',
          payload: {
            message: `File size too large. Maximum allowed: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          },
        })
        return
      }

      const invalidType = !fileName.toLowerCase().endsWith('.csv') && fileType !== 'text/csv'
      if (invalidType) {
        self.postMessage({
          type: 'ERROR',
          payload: { message: 'Invalid file type. Please upload a CSV file.' },
        })
        return
      }
      
      try {
        const parseResult = await parseCsvContent(fileContent)
        const rows = parseResult.data
        const totalRows = rows.length
        
        // Validate row count
        if (totalRows > MAX_ROWS) {
          self.postMessage({
            type: 'ERROR',
            payload: { 
              message: `Too many rows. Maximum allowed: ${MAX_ROWS}, found: ${totalRows}` 
            }
          })
          return
        }
      
      const totalBatches = Math.ceil(totalRows / BATCH_SIZE)
      const allEvents: LiveOpsEvent[] = []
      const allErrors: CsvProcessingError[] = []
      
      // Process in batches
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * BATCH_SIZE
        const endIndex = Math.min(startIndex + BATCH_SIZE, totalRows)
        const batchRows = rows.slice(startIndex, endIndex)
        
        // Process current batch
        const batchResult = processBatch(batchRows, batchIndex, startIndex)
        
        allEvents.push(...batchResult.events)
        allErrors.push(...batchResult.errors)
        
        // Send batch completion message
        self.postMessage({
          type: 'BATCH_COMPLETE',
          payload: batchResult
        })
        
        // Send progress update
        const currentTime = performance.now()
        const elapsedTime = currentTime - processingStartTime
        const processedRows = endIndex
        const eventsPerSecond = processedRows / (elapsedTime / 1000)
        const remainingRows = totalRows - processedRows
        const estimatedCompletion = processingStartTime + (remainingRows / eventsPerSecond * 1000)
        
        self.postMessage({
          type: 'PROGRESS',
          payload: {
            processed: processedRows,
            total: totalRows,
            currentBatch: batchIndex + 1,
            totalBatches,
            batchResults: {
              successful: allEvents.length,
              failed: allErrors.length,
              errors: allErrors.slice(-10) // Only send recent errors to avoid message bloat
            },
            performance: {
              startTime: processingStartTime,
              estimatedCompletion,
              eventsPerSecond
            }
          } as ProgressPayload
        })
        
        // Small delay to allow UI updates
        if (batchIndex < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, PROCESSING_DELAY))
        }
      }
      
      // Include Papa Parse errors
      if (parseResult.errors.length > 0) {
        parseResult.errors.forEach((error) => {
          allErrors.push({
            row: error.row || 0,
            message: `Parse error: ${error.message}`,
          })
        })
      }
      
      const totalTime = performance.now() - processingStartTime
      const averageEventsPerSecond = allEvents.length / (totalTime / 1000)
      
      // Send completion message
      self.postMessage({
        type: 'COMPLETE',
        payload: {
          events: allEvents,
          errors: allErrors,
          totalRows,
          successfulRows: allEvents.length,
          performance: {
            totalTime,
            averageEventsPerSecond,
            memoryUsage: (
              self as typeof self & { performance?: Performance & { memory?: { usedJSHeapSize?: number } } }
            ).performance?.memory?.usedJSHeapSize || undefined
          }
        } as CompletePayload
      })
      
      } catch (error) {
        self.postMessage({
          type: 'ERROR',
          payload: { 
            message: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
          }
        })
      }
    }
  })
}

// Note: Types are already exported as interfaces above and will be available for import