import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  readStoredCalendarView,
  storeCalendarView,
  CALENDAR_VIEW_STORAGE_KEY,
} from '../calendar-view-persistence'

describe('calendar view persistence', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    Object.assign(window.localStorage, {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, value)
      }),
      removeItem: vi.fn((key: string) => {
        store.delete(key)
      }),
      clear: vi.fn(() => {
        store.clear()
      }),
    })
  })

  it('returns the stored view when it is valid', () => {
    window.localStorage.setItem(CALENDAR_VIEW_STORAGE_KEY, 'timeGridWeek')

    expect(readStoredCalendarView('dayGridMonth')).toBe('timeGridWeek')
  })

  it('falls back when storage is empty or invalid', () => {
    expect(readStoredCalendarView('dayGridMonth')).toBe('dayGridMonth')

    window.localStorage.setItem(CALENDAR_VIEW_STORAGE_KEY, 'unknown')
    expect(readStoredCalendarView('listWeek')).toBe('listWeek')
  })

  it('persists the selected view', () => {
    storeCalendarView('timeGridDay')

    expect(window.localStorage.getItem(CALENDAR_VIEW_STORAGE_KEY)).toBe('timeGridDay')
  })
})
