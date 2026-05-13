import { describe, it, expect } from 'vitest'
import { EventInputSchema, EventFormSchema, normalizeCohorts } from '../events'

const baseEvent = {
  title: 'Open Ended Event',
  start: '2026-05-01T00:00:00.000Z',
  end: '2026-05-02T00:00:00.000Z',
  cohort: ['All'],
  eventType: 'IAP',
  placement: 'Lobby',
  description: '',
  status: 'Draft',
}

describe('Event schemas', () => {
  it('allows null end in EventInputSchema', () => {
    const result = EventInputSchema.safeParse({ ...baseEvent, end: null })
    expect(result.success).toBe(true)
  })

  it('accepts multiple cohorts', () => {
    const result = EventInputSchema.safeParse({ ...baseEvent, cohort: ['D0', 'D1'] })
    expect(result.success).toBe(true)
  })

  it('rejects All mixed with other cohorts', () => {
    const result = EventInputSchema.safeParse({ ...baseEvent, cohort: ['All', 'D1'] })
    expect(result.success).toBe(false)
  })

  it('requires end when neverEnds is false', () => {
    const result = EventFormSchema.safeParse({ ...baseEvent, end: null, neverEnds: false })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('end')
  })

  it('allows null end when neverEnds is true', () => {
    const result = EventFormSchema.safeParse({ ...baseEvent, end: null, neverEnds: true })
    expect(result.success).toBe(true)
  })
})

describe('normalizeCohorts', () => {
  it('parses comma-separated strings', () => {
    expect(normalizeCohorts('D0, D1')).toEqual(['D0', 'D1'])
  })

  it('normalizes All to exclusive', () => {
    expect(normalizeCohorts(['All', 'D0'])).toEqual(['All'])
  })
})
