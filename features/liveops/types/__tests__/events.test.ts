import { describe, it, expect } from 'vitest'
import {
  CLIENT_OPTIONS,
  EVENT_TYPES,
  EventInputSchema,
  EventFormSchema,
  LiveOpsEventSchema,
  OS_TYPES,
  PLAYER_TYPES,
  normalizeClient,
  normalizeCohorts,
  normalizeEventType,
  normalizeEventRecordForLoad,
  normalizeOsType,
  normalizePlayerType,
} from '../events'

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

  it('defaults to All for non-string, non-array values (malformed persisted data)', () => {
    expect(normalizeCohorts(42)).toEqual(['All'])
    expect(normalizeCohorts({ cohort: 'x' })).toEqual(['All'])
  })

  it('filters to string entries only in mixed arrays', () => {
    expect(normalizeCohorts(['D0', 99, 'D1'] as unknown)).toEqual(['D0', 'D1'])
  })
})

describe('schema option constants', () => {
  it('exposes player, OS, and client option lists', () => {
    expect(PLAYER_TYPES).toEqual(['All', 'Payer', 'Non payer'])
    expect(OS_TYPES).toEqual(['All', 'Android', 'iOS'])
    expect(CLIENT_OPTIONS).toEqual(['Kinoa', 'In-game'])
  })

  it('uses updated event types including Rolling Retention and Engagement', () => {
    expect(EVENT_TYPES).toContain('Rolling Retention')
    expect(EVENT_TYPES).toContain('Engagement')
    expect(EVENT_TYPES).not.toContain('System')
    expect(EVENT_TYPES).not.toContain('Progression')
  })
})

describe('normalizeEventType', () => {
  it('maps legacy System and Progression to Unknown', () => {
    expect(normalizeEventType('System')).toBe('Unknown')
    expect(normalizeEventType('system')).toBe('Unknown')
    expect(normalizeEventType('Progression')).toBe('Unknown')
    expect(normalizeEventType('PROGRESSION')).toBe('Unknown')
  })

  it('preserves supported event types', () => {
    expect(normalizeEventType('IAP')).toBe('IAP')
    expect(normalizeEventType('Retention')).toBe('Retention')
    expect(normalizeEventType('rolling retention')).toBe('Rolling Retention')
    expect(normalizeEventType('Engagement')).toBe('Engagement')
  })

  it('normalizes unknown values to Unknown', () => {
    expect(normalizeEventType('')).toBe('Unknown')
    expect(normalizeEventType(null)).toBe('Unknown')
    expect(normalizeEventType('Seasonal')).toBe('Unknown')
  })
})

describe('normalizePlayerType', () => {
  it('defaults invalid or missing input to All', () => {
    expect(normalizePlayerType(undefined)).toBe('All')
    expect(normalizePlayerType('')).toBe('All')
    expect(normalizePlayerType('VIP')).toBe('All')
  })

  it('normalizes known values case-insensitively', () => {
    expect(normalizePlayerType('payer')).toBe('Payer')
    expect(normalizePlayerType('NON PAYER')).toBe('Non payer')
  })
})

describe('normalizeOsType', () => {
  it('defaults invalid or missing input to All', () => {
    expect(normalizeOsType(undefined)).toBe('All')
    expect(normalizeOsType('Windows')).toBe('All')
  })

  it('normalizes Android and iOS', () => {
    expect(normalizeOsType('android')).toBe('Android')
    expect(normalizeOsType('IOS')).toBe('iOS')
  })
})

describe('normalizeClient', () => {
  it('defaults invalid or missing input to Kinoa', () => {
    expect(normalizeClient(undefined)).toBe('Kinoa')
    expect(normalizeClient('Web')).toBe('Kinoa')
  })

  it('normalizes Kinoa and In-game', () => {
    expect(normalizeClient('kinoa')).toBe('Kinoa')
    expect(normalizeClient('in-game')).toBe('In-game')
    expect(normalizeClient('In game')).toBe('In-game')
  })
})

describe('EventInputSchema audience and client fields', () => {
  it('defaults playerType, osType, and client when omitted', () => {
    const result = EventInputSchema.safeParse(baseEvent)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.playerType).toBe('All')
    expect(result.data.osType).toBe('All')
    expect(result.data.client).toBe('Kinoa')
  })

  it('accepts explicit audience and client values', () => {
    const result = EventInputSchema.safeParse({
      ...baseEvent,
      playerType: 'Payer',
      osType: 'iOS',
      client: 'In-game',
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.playerType).toBe('Payer')
    expect(result.data.osType).toBe('iOS')
    expect(result.data.client).toBe('In-game')
  })

  it('coerces legacy event types via normalizeEventType', () => {
    const result = EventInputSchema.safeParse({ ...baseEvent, eventType: 'Progression' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.eventType).toBe('Unknown')
  })
})

describe('EventFormSchema', () => {
  it('includes defaulted playerType, osType, and client', () => {
    const result = EventFormSchema.safeParse({
      ...baseEvent,
      end: null,
      neverEnds: true,
      eventType: 'System',
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.eventType).toBe('Unknown')
    expect(result.data.playerType).toBe('All')
    expect(result.data.client).toBe('Kinoa')
  })
})

describe('LiveOpsEventSchema', () => {
  const full = {
    id: 'evt-1',
    title: 'T',
    start: '2026-05-01T00:00:00.000Z',
    end: '2026-05-02T00:00:00.000Z',
    cohort: ['All'],
    eventType: 'Rolling Retention',
    placement: 'Lobby',
    description: '',
    status: 'Draft',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    playerType: 'Non payer',
    osType: 'Android',
    client: 'In-game',
  }

  it('parses persisted shape with new fields', () => {
    const result = LiveOpsEventSchema.safeParse(full)
    expect(result.success).toBe(true)
  })

  it('normalizes legacy event type on persisted records', () => {
    const result = LiveOpsEventSchema.safeParse({ ...full, eventType: 'System' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.eventType).toBe('Unknown')
  })
})

describe('normalizeEventRecordForLoad', () => {
  it('fills and normalizes fields for raw storage rows', () => {
    const row = {
      id: '1',
      title: 'X',
      start: '2026-05-01T00:00:00.000Z',
      end: '2026-05-02T00:00:00.000Z',
      cohort: ['D0'],
      eventType: 'Progression',
      placement: 'P',
      description: '',
      status: 'Draft',
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
    }
    expect(normalizeEventRecordForLoad(row)).toMatchObject({
      eventType: 'Unknown',
      playerType: 'All',
      osType: 'All',
      client: 'Kinoa',
    })
  })
})
