import {
  CsvRow,
  CsvProcessingError,
  RecurrenceConfig,
  RecurrenceConfigSchema,
} from '../types/events'
import { parseToISO } from './date-utils'

const REC_FREQUENCIES = new Set(['daily', 'weekly', 'monthly', 'custom'])

function sanitizeValue(value: string): string {
  if (!value || typeof value !== 'string') return ''
  const trimmed = value.trim()
  const FORMULA_PATTERNS = /^[=+\-@]/
  if (FORMULA_PATTERNS.test(trimmed)) {
    return ` ${trimmed}`
  }
  return trimmed
}

export function pickCsvCell(row: CsvRow, ...fieldNames: string[]): string {
  for (const field of fieldNames) {
    const value = row[field as keyof CsvRow]
    if (value && typeof value === 'string' && value.trim()) {
      return sanitizeValue(value)
    }
  }
  return ''
}

function hasAnyNonEmptyCells(row: CsvRow, fieldNames: string[]): boolean {
  return fieldNames.some((f) => {
    const v = row[f as keyof CsvRow]
    return typeof v === 'string' && v.trim().length > 0
  })
}

/**
 * Parse recurrence columns from an import row. Supports legacy headers
 * (Recurrence Frequency, etc.) and explicit pattern columns (frequency, …).
 */
export function parseRecurrenceFromCsvRow(
  row: CsvRow,
  rowIndex: number
): { recurrence?: RecurrenceConfig; errors: CsvProcessingError[] } {
  const errors: CsvProcessingError[] = []

  const recurrenceFieldNames = [
    'frequency',
    'Frequency',
    'Recurrence Frequency',
    'interval',
    'Interval',
    'Recurrence Interval',
    'daysOfWeek',
    'Days Of Week',
    'Days of Week',
    'dayOfMonth',
    'Day Of Month',
    'Day of month',
    'monthlyPattern',
    'Monthly Pattern',
    'Monthly pattern',
    'until',
    'Until',
    'Recurrence Until',
    'count',
    'Count',
  ]

  if (!hasAnyNonEmptyCells(row, recurrenceFieldNames)) {
    return { errors }
  }

  const freqRaw = pickCsvCell(
    row,
    'frequency',
    'Frequency',
    'Recurrence Frequency'
  )
    .trim()
    .toLowerCase()

  if (!freqRaw) {
    errors.push({
      row: rowIndex,
      column: 'frequency',
      message: 'Recurrence fields are present but frequency is missing or invalid',
    })
    return { errors }
  }

  if (!REC_FREQUENCIES.has(freqRaw)) {
    errors.push({
      row: rowIndex,
      column: 'frequency',
      message: `Invalid recurrence frequency: ${freqRaw}`,
    })
    return { errors }
  }

  const intervalStr = pickCsvCell(
    row,
    'interval',
    'Interval',
    'Recurrence Interval'
  )
  let interval = 1
  if (intervalStr) {
    const n = Number.parseInt(intervalStr, 10)
    if (Number.isNaN(n) || n < 1 || n > 365) {
      errors.push({
        row: rowIndex,
        column: 'interval',
        message: 'Recurrence interval must be a number between 1 and 365',
      })
      return { errors }
    }
    interval = n
  }

  const daysRaw = pickCsvCell(
    row,
    'daysOfWeek',
    'Days Of Week',
    'Days of Week'
  )
  let daysOfWeek: number[] | undefined
  if (daysRaw) {
    const parts = daysRaw.split(',').map((p) => p.trim()).filter(Boolean)
    const nums = parts.map((p) => Number.parseInt(p, 10))
    if (nums.some((n) => Number.isNaN(n) || n < 0 || n > 6)) {
      errors.push({
        row: rowIndex,
        column: 'daysOfWeek',
        message: 'daysOfWeek must be comma-separated integers 0–6 (e.g. 0,1,2)',
      })
      return { errors }
    }
    daysOfWeek = nums
  }

  const domRaw = pickCsvCell(
    row,
    'dayOfMonth',
    'Day Of Month',
    'Day of month'
  )
  let dayOfMonth: number | undefined
  if (domRaw) {
    const n = Number.parseInt(domRaw, 10)
    if (Number.isNaN(n) || n < 1 || n > 31) {
      errors.push({
        row: rowIndex,
        column: 'dayOfMonth',
        message: 'dayOfMonth must be a number between 1 and 31',
      })
      return { errors }
    }
    dayOfMonth = n
  }

  const mpRaw = pickCsvCell(
    row,
    'monthlyPattern',
    'Monthly Pattern',
    'Monthly pattern'
  )
    .trim()
    .toLowerCase()
  let monthlyPattern: 'date' | 'weekday' | undefined
  if (mpRaw) {
    if (mpRaw !== 'date' && mpRaw !== 'weekday') {
      errors.push({
        row: rowIndex,
        column: 'monthlyPattern',
        message: 'monthlyPattern must be "date" or "weekday"',
      })
      return { errors }
    }
    monthlyPattern = mpRaw
  }

  const untilRaw = pickCsvCell(row, 'until', 'Until', 'Recurrence Until')
  let until: string | undefined
  if (untilRaw) {
    const iso = parseToISO(untilRaw)
    if (!iso) {
      errors.push({
        row: rowIndex,
        column: 'until',
        message: 'Invalid recurrence until date',
      })
      return { errors }
    }
    until = iso
  }

  const countRaw = pickCsvCell(row, 'count', 'Count')
  let count: number | undefined
  if (countRaw) {
    const n = Number.parseInt(countRaw, 10)
    if (Number.isNaN(n) || n < 1) {
      errors.push({
        row: rowIndex,
        column: 'count',
        message: 'count must be a positive integer',
      })
      return { errors }
    }
    count = n
  }

  const draft: RecurrenceConfig = {
    frequency: freqRaw as RecurrenceConfig['frequency'],
    interval,
    ...(daysOfWeek !== undefined ? { daysOfWeek } : {}),
    ...(dayOfMonth !== undefined ? { dayOfMonth } : {}),
    ...(monthlyPattern !== undefined ? { monthlyPattern } : {}),
    ...(until !== undefined ? { until } : {}),
    ...(count !== undefined ? { count } : {}),
  }

  const parsed = RecurrenceConfigSchema.safeParse(draft)
  if (!parsed.success) {
    errors.push({
      row: rowIndex,
      column: 'recurrence',
      message: `Invalid recurrence: ${parsed.error.message}`,
    })
    return { errors }
  }

  return { recurrence: parsed.data, errors }
}
