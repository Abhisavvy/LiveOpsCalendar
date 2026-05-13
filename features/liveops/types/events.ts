import { z } from 'zod'

// Branded types for type safety (align with Zod's `.brand()` typing)
export type EventId = string & z.BRAND<'EventId'>
export type CohortType = string
export type PlacementType = string

// Event Types
export const EVENT_TYPES = ['IAP', 'Progression', 'Retention', 'System', 'Unknown'] as const
export type EventType = typeof EVENT_TYPES[number]

// Event Statuses
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

export function normalizeCohorts(input: string[] | string | null | undefined): CohortOption[] {
  if (!input) return ['All']
  const raw = Array.isArray(input) ? input : input.split(',')
  const normalized = raw
    .map((value) => COHORT_LOOKUP[value.trim().toLowerCase()])
    .filter(Boolean) as CohortOption[]

  if (normalized.includes('All')) return ['All']
  return normalized.length ? normalized : ['All']
}

export function formatCohorts(cohorts: CohortOption[] | string[]): string {
  return normalizeCohorts(cohorts as CohortOption[]).join(', ')
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
  eventType: z.enum(EVENT_TYPES),
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