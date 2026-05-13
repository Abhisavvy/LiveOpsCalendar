import {
  LiveOpsEvent,
  FilterState,
  FilterStateSchema,
  LiveOpsEventSchema,
  normalizeEventRecordForLoad,
} from '../types/events'

// Storage keys
const STORAGE_KEYS = {
  EVENTS: 'liveops-events',
  FILTERS: 'liveops-filters',
  APP_VERSION: 'liveops-version',
  SETTINGS: 'liveops-settings',
} as const

// Current data version for migration handling
const CURRENT_VERSION = '1.0.0'

// Storage limits
const MAX_STORAGE_SIZE = 5 * 1024 * 1024 // 5MB limit
const MAX_EVENTS_COUNT = 1000 // Maximum number of events

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Get the current storage usage in bytes
 */
export function getStorageUsage(): number {
  if (!isStorageAvailable()) return 0
  
  let total = 0
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key) && key.startsWith('liveops-')) {
      total += localStorage[key]?.length ?? 0
    }
  }
  return total
}

/**
 * Check if storage is near capacity
 */
export function isStorageNearCapacity(): boolean {
  return getStorageUsage() > MAX_STORAGE_SIZE * 0.8 // 80% of limit
}

/**
 * Safely parse JSON with error handling
 */
function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

/**
 * Safely stringify JSON with error handling
 */
function safeJSONStringify(data: unknown): string | null {
  try {
    return JSON.stringify(data)
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Save events to localStorage with error handling
 */
export function saveEvents(events: LiveOpsEvent[]): boolean {
  if (!isStorageAvailable()) {
    console.warn('localStorage not available')
    return false
  }

  // Validate events count
  if (events.length > MAX_EVENTS_COUNT) {
    console.warn(`Too many events: ${events.length}. Maximum allowed: ${MAX_EVENTS_COUNT}`)
    return false
  }

  const serialized = safeJSONStringify(events)
  if (!serialized) {
    console.error('Failed to serialize events')
    return false
  }

  // Check storage size before saving
  if (serialized.length > MAX_STORAGE_SIZE) {
    console.error('Events data too large for storage')
    return false
  }

  try {
    localStorage.setItem(STORAGE_KEYS.EVENTS, serialized)
    localStorage.setItem(STORAGE_KEYS.APP_VERSION, CURRENT_VERSION)
    return true
  } catch (error) {
    console.error('Failed to save events to storage:', error)
    return false
  }
}

/**
 * Load events from localStorage, normalizing legacy fields and dropping invalid rows.
 */
export function loadEvents(): LiveOpsEvent[] {
  if (!isStorageAvailable()) {
    return []
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.EVENTS)
    if (!stored) {
      return []
    }

    const events = safeJSONParse<unknown[]>(stored, [])

    // Validate events structure, then normalize enums and defaults for migrated fields
    return events
      .filter(isRecord)
      .filter((event) => {
        const endOk = event.end === null || typeof event.end === 'string'
        return (
          typeof event.id === 'string' &&
          typeof event.title === 'string' &&
          typeof event.start === 'string' &&
          endOk
        )
      })
      .map((event) => normalizeEventRecordForLoad(event as Record<string, unknown>))
      .flatMap((event) => {
        const parsed = LiveOpsEventSchema.safeParse(event)
        return parsed.success ? [parsed.data] : []
      })
  } catch (error) {
    console.error('Failed to load events from storage:', error)
    return []
  }
}

/**
 * Save filter state to localStorage
 */
export function saveFilters(filters: FilterState): boolean {
  if (!isStorageAvailable()) {
    return false
  }

  const serialized = safeJSONStringify(filters)
  if (!serialized) {
    return false
  }

  try {
    localStorage.setItem(STORAGE_KEYS.FILTERS, serialized)
    return true
  } catch {
    return false
  }
}

/**
 * Load filter state from localStorage
 */
export function loadFilters(): FilterState | null {
  if (!isStorageAvailable()) {
    return null
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FILTERS)
    if (!stored) {
      return null
    }

    return safeJSONParse<FilterState>(stored, {
      searchQuery: '',
      eventTypes: [],
      cohorts: [],
      statuses: [],
    })
  } catch {
    return null
  }
}

/**
 * Clear all LiveOps data from storage
 */
export function clearAllData(): boolean {
  if (!isStorageAvailable()) {
    return false
  }

  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
    return true
  } catch {
    return false
  }
}

/**
 * Get storage statistics
 */
export function getStorageStats() {
  const usage = getStorageUsage()
  const events = loadEvents()
  
  return {
    totalBytes: usage,
    totalMB: (usage / (1024 * 1024)).toFixed(2),
    percentUsed: ((usage / MAX_STORAGE_SIZE) * 100).toFixed(1),
    eventsCount: events.length,
    maxEvents: MAX_EVENTS_COUNT,
    version: localStorage.getItem(STORAGE_KEYS.APP_VERSION) || 'unknown',
    isNearCapacity: isStorageNearCapacity(),
  }
}

/**
 * Export all data for backup/migration
 */
export function exportAllData(): string | null {
  if (!isStorageAvailable()) {
    return null
  }

  const data = {
    events: loadEvents(),
    filters: loadFilters(),
    version: CURRENT_VERSION,
    exportDate: new Date().toISOString(),
  }

  return safeJSONStringify(data)
}

/**
 * Import data from backup, validating event and filter payloads.
 */
export function importAllData(jsonData: string): { success: boolean; error?: string } {
  try {
    const data = safeJSONParse<Record<string, unknown>>(jsonData, {})
    
    if (!data.events || !Array.isArray(data.events)) {
      return { success: false, error: 'Invalid data format: missing events array' }
    }

    const parsedEvents = data.events
      .filter(isRecord)
      .map((event) => normalizeEventRecordForLoad(event))
      .flatMap((event) => {
        const parsed = LiveOpsEventSchema.safeParse(event)
        return parsed.success ? [parsed.data] : []
      })

    if (parsedEvents.length === 0) {
      return { success: false, error: 'No valid events found in import data' }
    }

    // Save imported data
    const saveSuccess = saveEvents(parsedEvents)
    if (!saveSuccess) {
      return { success: false, error: 'Failed to save imported events' }
    }

    // Save filters if present
    if (data.filters) {
      const filters = FilterStateSchema.safeParse(data.filters)
      if (filters.success) {
        saveFilters(filters.data)
      }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to parse import data: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

/**
 * Migrate data from older versions if needed
 */
export function migrateDataIfNeeded(): boolean {
  const storedVersion = localStorage.getItem(STORAGE_KEYS.APP_VERSION)
  
  if (!storedVersion || storedVersion !== CURRENT_VERSION) {
    console.log(`Migrating data from version ${storedVersion || 'unknown'} to ${CURRENT_VERSION}`)
    
    // For now, just update the version
    // Future migrations can be added here
    try {
      localStorage.setItem(STORAGE_KEYS.APP_VERSION, CURRENT_VERSION)
      return true
    } catch {
      return false
    }
  }
  
  return true
}