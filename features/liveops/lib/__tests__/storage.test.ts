import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadEvents, importAllData } from '../storage'

const EVENTS_KEY = 'liveops-events'

/** Persisted KV: global setup mocks localStorage with vi.fn() defaults (no persistence). */
const memoryStore = new Map<string, string>()

beforeEach(() => {
  memoryStore.clear()
  vi.mocked(localStorage.getItem).mockImplementation((key) => memoryStore.get(key) ?? null)
  vi.mocked(localStorage.setItem).mockImplementation((key, value) => {
    memoryStore.set(key, value)
  })
  vi.mocked(localStorage.removeItem).mockImplementation((key) => {
    memoryStore.delete(key)
  })
  vi.mocked(localStorage.clear).mockImplementation(() => {
    memoryStore.clear()
  })
})

function minimalStoredEvent(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: 'e1',
    title: 'Test',
    start: '2026-05-01T00:00:00.000Z',
    end: null,
    cohort: ['D0'],
    eventType: 'IAP',
    placement: ['Home screen'],
    description: '',
    status: 'Draft',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('loadEvents', () => {
  it('keeps events with end null', () => {
    localStorage.setItem(
      EVENTS_KEY,
      JSON.stringify([
        minimalStoredEvent({
          id: 'open-ended',
          end: null,
        }),
      ]),
    )
    const loaded = loadEvents()
    expect(loaded).toHaveLength(1)
    expect(loaded[0]?.end).toBeNull()
  })

  it('drops events that are still invalid after normalization', () => {
    localStorage.setItem(
      EVENTS_KEY,
      JSON.stringify([
        minimalStoredEvent({ id: 'valid-event' }),
        minimalStoredEvent({ id: 'missing-required-fields', placement: undefined, createdAt: undefined }),
      ]),
    )
    const loaded = loadEvents()
    expect(loaded).toHaveLength(1)
    expect(loaded[0]?.id).toBe('valid-event')
  })

  it('does not throw on malformed cohort and coerces cohort to a safe default', () => {
    localStorage.setItem(
      EVENTS_KEY,
      JSON.stringify([
        minimalStoredEvent({
          id: 'bad-cohort',
          cohort: { invalid: true },
        }),
      ]),
    )
    expect(() => loadEvents()).not.toThrow()
    const loaded = loadEvents()
    expect(loaded).toHaveLength(1)
    expect(loaded[0]?.cohort).toEqual(['All'])
  })
})

describe('importAllData', () => {
  it('coerces invalid filter payloads to a safe default', () => {
    const payload = {
      events: [minimalStoredEvent()],
      filters: { invalid: true },
    }
    const result = importAllData(JSON.stringify(payload))
    expect(result.success).toBe(true)
    expect(localStorage.getItem('liveops-filters')).toBe(
      JSON.stringify({
        searchQuery: '',
        eventTypes: [],
        cohorts: [],
        statuses: [],
        playerTypes: [],
        osTypes: [],
      }),
    )
  })
})
