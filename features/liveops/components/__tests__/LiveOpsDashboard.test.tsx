import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { LiveOpsDashboard } from '../LiveOpsDashboard'

const applyFilters = vi.fn()
const loadFromStorage = vi.fn()
const clearFilters = vi.fn()

vi.mock('../../hooks/useEventStore', () => ({
  useEventStore: (selector: unknown) =>
    (selector as (state: Record<string, unknown>) => unknown)({
      events: [],
      filteredEvents: [],
      loadFromStorage,
      clearFilters,
      applyFilters,
    }),
}))

vi.mock('../CalendarView', () => ({
  CalendarView: () => <div />,
}))

vi.mock('../CsvDropzone', () => ({
  CsvDropzone: () => <div />,
}))

vi.mock('../SidebarFilters', () => ({
  SidebarFilters: () => <div />,
}))

vi.mock('../ExportButton', () => ({
  ExportButton: () => <button type="button">Export</button>,
}))

vi.mock('../CalendarLegend', () => ({
  CalendarLegend: () => <div />,
}))

vi.mock('../CalendarEmptyStateCallout', () => ({
  CalendarEmptyStateCallout: () => <div />,
}))

vi.mock('../EventDetailSheet', () => ({
  EventDetailSheet: () => <div />,
}))

describe('LiveOpsDashboard', () => {
  beforeEach(() => {
    applyFilters.mockClear()
    loadFromStorage.mockClear()
    clearFilters.mockClear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('refreshes filters on an interval for automatic status updates', () => {
    render(<LiveOpsDashboard />)

    vi.advanceTimersByTime(60000)

    expect(applyFilters).toHaveBeenCalled()
  })
})
