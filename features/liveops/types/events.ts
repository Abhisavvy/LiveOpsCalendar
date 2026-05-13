import { z } from 'zod'

// Branded types for type safety (align with Zod's `.brand()` typing)
export type EventId = string & z.BRAND<'EventId'>
export type CohortType = string
export type PlacementType = string

// Event Types
export const EVENT_TYPES = ['IAP', 'Retention', 'Rolling Retention', 'Engagement', 'Unknown'] as const
export type EventType = typeof EVENT_TYPES[number]

export const PLAYER_TYPES = ['All', 'Payer', 'Non payer'] as const
export type PlayerType = typeof PLAYER_TYPES[number]

export const OS_TYPES = ['All', 'Android', 'iOS'] as const
export type OsType = typeof OS_TYPES[number]

export const CLIENT_OPTIONS = ['Kinoa', 'In-game'] as const
export type ClientOption = typeof CLIENT_OPTIONS[number]

const EVENT_TYPE_LOOKUP = EVENT_TYPES.reduce<Record<string, EventType>>((acc, value) => {
  acc[value.toLowerCase()] = value
  return acc
}, {})

const PLAYER_TYPE_LOOKUP: Record<string, PlayerType> = {
  all: 'All',
  payer: 'Payer',
  'non payer': 'Non payer',
  nonpayer: 'Non payer',
  'non-payer': 'Non payer',
}

const OS_TYPE_LOOKUP: Record<string, OsType> = {
  all: 'All',
  android: 'Android',
  ios: 'iOS',
}

const CLIENT_LOOKUP: Record<string, ClientOption> = {
  kinoa: 'Kinoa',
  'in-game': 'In-game',
  ingame: 'In-game',
  'in game': 'In-game',
}

export function normalizeEventType(input: unknown): EventType {
  if (typeof input !== 'string' || !input.trim()) return 'Unknown'
  const lower = input.trim().toLowerCase()
  if (lower === 'system' || lower === 'progression') return 'Unknown'
  return EVENT_TYPE_LOOKUP[lower] ?? 'Unknown'
}

export function normalizePlayerType(input: unknown): PlayerType {
  if (typeof input !== 'string' || !input.trim()) return 'All'
  const key = input.trim().toLowerCase()
  return PLAYER_TYPE_LOOKUP[key] ?? 'All'
}

export function normalizeOsType(input: unknown): OsType {
  if (typeof input !== 'string' || !input.trim()) return 'All'
  const key = input.trim().toLowerCase()
  return OS_TYPE_LOOKUP[key] ?? 'All'
}

export function normalizeClient(input: unknown): ClientOption {
  if (typeof input !== 'string' || !input.trim()) return 'Kinoa'
  const key = input.trim().toLowerCase()
  return CLIENT_LOOKUP[key] ?? 'Kinoa'
}

export const EVENT_STATUSES = ['Draft', 'Scheduled', 'Active', 'Ended'] as const
export type EventStatus = typeof EVENT_STATUSES[number]

export const COHORT_OPTIONS = [
  'All',
  'D0',
  'D1',
  'D2-D7',
  'D7-D14',
  'D14-D30',
  'D30-D60',
  'D60-D120',
  'D120+',
] as const

export type CohortOption = typeof COHORT_OPTIONS[number]

export const OPEN_ENDED_EVENT_END = '2100-01-01T00:00:00.000Z'

const COHORT_LOOKUP = COHORT_OPTIONS.reduce<Record<string, CohortOption>>((acc, value) => {
  acc[value.toLowerCase()] = value
  return acc
}, {})

function mapRawStringsToCohorts(raw: string[]): CohortOption[] {
  const normalized = raw
    .map((value) => COHORT_LOOKUP[value.trim().toLowerCase()])
    .filter(Boolean) as CohortOption[]
  if (normalized.includes('All')) return ['All']
  return normalized.length ? normalized : ['All']
}

/** Safe for malformed persisted data (non-string cohorts, wrong types). */
export function normalizeCohorts(input: unknown): CohortOption[] {
  if (input == null) return ['All']
  if (typeof input === 'string') {
    if (!input.trim()) return ['All']
    return mapRawStringsToCohorts(input.split(','))
  }
  if (Array.isArray(input)) {
    const strings = input.filter((v): v is string => typeof v === 'string')
    return mapRawStringsToCohorts(strings)
  }
  return ['All']
}

export function formatCohorts(cohorts: CohortOption[] | string[]): string {
  return normalizeCohorts(cohorts).join(', ')
}

/** Apply cohort, event type, and audience defaults when reading from storage. */
export function normalizeEventRecordForLoad(event: Record<string, unknown>): Record<string, unknown> {
  return {
    ...event,
    cohort: normalizeCohorts(event.cohort),
    eventType: normalizeEventType(event.eventType),
    playerType: normalizePlayerType(event.playerType),
    osType: normalizeOsType(event.osType),
    client: normalizeClient(event.client),
  }
}

// Duration options for dropdown
export const DURATION_OPTIONS = [
  { value: '1h', label: '1 Hour', hours: 1 },
  { value: '6h', label: '6 Hours', hours: 6 },
  { value: '12h', label: '12 Hours', hours: 12 },
  { value: '1d', label: '1 Day', hours: 24 },
  { value: '3d', label: '3 Days', hours: 72 },
  { value: '1w', label: '1 Week', hours: 168 },
  { value: '2w', label: '2 Weeks', hours: 336 },
  { value: '1m', label: '1 Month', hours: 720 }, // Approximate
] as const

export type DurationOption = typeof DURATION_OPTIONS[number]['value']

// Recurrence Configuration Schema
export const RecurrenceConfigSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  interval: z.number().min(1).max(365), // e.g., every 2 weeks
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(), // 0-6, for weekly patterns
  dayOfMonth: z.number().min(1).max(31).optional(), // 1-31, for monthly patterns
  monthlyPattern: z.enum(['date', 'weekday']).optional(), // "15th" vs "2nd Tuesday"
  until: z.string().datetime().optional(), // ISO date for end condition
  count: z.number().min(1).optional(), // Alternative to until - number of occurrences
})

export type RecurrenceConfig = z.infer<typeof RecurrenceConfigSchema>

const preprocessedEventType = z.preprocess(normalizeEventType, z.enum(EVENT_TYPES))
const preprocessedPlayerType = z.preprocess(normalizePlayerType, z.enum(PLAYER_TYPES))
const preprocessedOsType = z.preprocess(normalizeOsType, z.enum(OS_TYPES))
const preprocessedClient = z.preprocess(normalizeClient, z.enum(CLIENT_OPTIONS))

function refineCohortAllExclusive(data: { cohort: CohortOption[] }, ctx: z.RefinementCtx) {
  if (data.cohort.includes('All') && data.cohort.length > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['cohort'],
      message: '"All" cannot be combined with other cohorts.',
    })
  }
}

// Core object shape (omit/extend before superRefine — ZodObject only)
const LiveOpsEventObjectSchema = z.object({
  id: z.string().brand<'EventId'>(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  start: z.string().datetime('Invalid start date format'),
  end: z.string().datetime('Invalid end date format').nullable(),
  cohort: z.array(z.enum(COHORT_OPTIONS)).min(1, 'Cohort is required'),
  eventType: preprocessedEventType,
  playerType: preprocessedPlayerType,
  osType: preprocessedOsType,
  client: preprocessedClient,
  placement: z.string().min(1, 'Placement is required'),
  description: z.string().max(1000, 'Description too long').default(''),
  status: z.enum(EVENT_STATUSES).default('Draft'),
  recurrence: RecurrenceConfigSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// Core LiveOps Event Schema
export const LiveOpsEventSchema = LiveOpsEventObjectSchema.superRefine(refineCohortAllExclusive)

export type LiveOpsEvent = z.infer<typeof LiveOpsEventSchema>

// CSV Import Row Schema - for parsing raw CSV data
export const CsvRowSchema = z.object({
  // Title mapping - multiple possible column names
  'Flow Name': z.string().optional(),
  'Theme': z.string().optional(),
  'Event Name': z.string().optional(),
  'Name': z.string().optional(),
  
  // Start date mapping
  'Starting Date': z.string().optional(),
  'Start Date': z.string().optional(),
  'Start': z.string().optional(),
  'Begin Date': z.string().optional(),
  
  // Duration/Timer mapping
  'Timer': z.string().optional(),
  'Duration': z.string().optional(),
  'Length': z.string().optional(),
  'Time': z.string().optional(),
  
  // Cohort mapping
  'Cohort': z.string().optional(),
  'Target': z.string().optional(),
  'Audience': z.string().optional(),
  
  // Event Type mapping
  'Pop-up type': z.string().optional(),
  'Intent': z.string().optional(),
  'Event Type': z.string().optional(),
  'Category': z.string().optional(),
  
  // Placement mapping
  'Lobby Icon | Where': z.string().optional(),
  'Placement': z.string().optional(),
  'Location': z.string().optional(),
  
  // Description mapping
  'Conditions/ Intent': z.string().optional(),
  'Fine Print': z.string().optional(),
  'Description': z.string().optional(),
  'Details': z.string().optional(),

  // Audience (export / import alignment)
  'Player Type': z.string().optional(),
  OS: z.string().optional(),
  Client: z.string().optional(),

  // Recurrence pattern columns (explicit + legacy headings)
  frequency: z.string().optional(),
  interval: z.string().optional(),
  daysOfWeek: z.string().optional(),
  dayOfMonth: z.string().optional(),
  monthlyPattern: z.string().optional(),
  until: z.string().optional(),
  count: z.string().optional(),

  Frequency: z.string().optional(),
  Interval: z.string().optional(),
  'Days Of Week': z.string().optional(),
  'Days of Week': z.string().optional(),
  'Day Of Month': z.string().optional(),
  'Day of month': z.string().optional(),
  'Monthly Pattern': z.string().optional(),
  'Monthly pattern': z.string().optional(),
  Until: z.string().optional(),
  Count: z.string().optional(),

  'Recurrence Frequency': z.string().optional(),
  'Recurrence Interval': z.string().optional(),
  'Recurrence Until': z.string().optional(),
})

export type CsvRow = z.infer<typeof CsvRowSchema>

const EventInputObjectSchema = LiveOpsEventObjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: z.string().optional(),
})

// Event creation/update input schema
export const EventInputSchema = EventInputObjectSchema.superRefine(refineCohortAllExclusive)

export type EventInput = z.infer<typeof EventInputSchema>

export const EventFormSchema = EventInputObjectSchema.extend({
  neverEnds: z.boolean().default(false),
}).superRefine((data, ctx) => {
  refineCohortAllExclusive(data, ctx)
  if (!data.neverEnds && !data.end) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['end'],
      message: 'End date is required unless "Never ends" is enabled.',
    })
  }
})

export type EventFormInput = z.infer<typeof EventFormSchema>

// CSV Processing Error Types
export interface CsvProcessingError {
  row: number
  column?: string
  message: string
  rawValue?: string
}

export interface CsvProcessingResult {
  events: LiveOpsEvent[]
  errors: CsvProcessingError[]
  totalRows: number
  successfulRows: number
}

// Filter State Schema
export const FilterStateSchema = z.object({
  searchQuery: z.string().default(''),
  eventTypes: z.array(z.enum(EVENT_TYPES)).default([]),
  cohorts: z.array(z.string()).default([]),
  statuses: z.array(z.enum(EVENT_STATUSES)).default([]),
  playerTypes: z.array(z.enum(PLAYER_TYPES)).default([]),
  osTypes: z.array(z.enum(OS_TYPES)).default([]),
  dateRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
  }).optional(),
})

export type FilterState = z.infer<typeof FilterStateSchema>

// Export Configuration Schema
export const ExportConfigSchema = z.object({
  includeAll: z.boolean().default(false),
  columnMapping: z.record(z.string()).optional(),
  dateFormat: z.string().default('YYYY-MM-DD'),
})

// Use Zod *input* type so callers can omit defaults (e.g. `dateFormat`)
export type ExportConfig = z.input<typeof ExportConfigSchema>

// Utility functions for branded types
export function createEventId(): EventId {
  return crypto.randomUUID() as EventId
}

export function isValidEventId(id: string): id is EventId {
  return typeof id === 'string' && id.length > 0
}

// Type guards
export function isEventType(value: string): value is EventType {
  return EVENT_TYPES.includes(value as EventType)
}

export function isEventStatus(value: string): value is EventStatus {
  return EVENT_STATUSES.includes(value as EventStatus)
}

// Validation helpers
export function validateEvent(data: unknown): { success: true; data: LiveOpsEvent } | { success: false; error: z.ZodError } {
  const result = LiveOpsEventSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

export function validateEventInput(data: unknown): { success: true; data: EventInput } | { success: false; error: z.ZodError } {
  const result = EventInputSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}