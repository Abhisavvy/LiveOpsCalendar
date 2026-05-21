export type CalendarViewId = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'

export const CALENDAR_VIEW_STORAGE_KEY = 'liveops.calendarView'

function isCalendarViewId(value: string): value is CalendarViewId {
  return (
    value === 'dayGridMonth' ||
    value === 'timeGridWeek' ||
    value === 'timeGridDay' ||
    value === 'listWeek'
  )
}

/**
 * Read the persisted calendar view from localStorage, falling back to the provided default.
 */
export function readStoredCalendarView(fallback: CalendarViewId): CalendarViewId {
  if (typeof window === 'undefined') {
    return fallback
  }

  const stored = window.localStorage.getItem(CALENDAR_VIEW_STORAGE_KEY)
  if (stored && isCalendarViewId(stored)) {
    return stored
  }

  return fallback
}

/**
 * Persist the current calendar view in localStorage for the next session.
 */
export function storeCalendarView(view: CalendarViewId): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(CALENDAR_VIEW_STORAGE_KEY, view)
}
