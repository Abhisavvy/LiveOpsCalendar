import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SidebarFilters } from '../SidebarFilters'

const clearFilters = vi.fn()

vi.mock('../../hooks/useEventFilters', () => ({
  useEventFilters: () => ({
    filters: {
      searchQuery: '',
      eventTypes: [],
      cohorts: [],
      statuses: [],
      playerTypes: [],
      osTypes: [],
      dateRange: undefined,
    },
    filterOptions: {
      cohorts: ['All'],
      eventTypes: ['IAP'],
      statuses: ['Draft'],
      placements: ['Home screen'],
      playerTypes: ['All'],
      osTypes: ['All'],
    },
    filterStats: {
      total: 5,
      filtered: 2,
      hidden: 3,
      hasActiveFilters: true,
      percentage: 40,
    },
    setSearchQuery: vi.fn(),
    toggleEventType: vi.fn(),
    toggleCohort: vi.fn(),
    toggleStatus: vi.fn(),
    togglePlayerType: vi.fn(),
    toggleOsType: vi.fn(),
    setDateRange: vi.fn(),
    applyPreset: vi.fn(),
    selectAll: vi.fn(),
    selectNone: vi.fn(),
    clearFilters,
  }),
}))

vi.mock('../../hooks/useEventStore', () => ({
  useEventStore: (selector: unknown) =>
    (selector as (state: Record<string, unknown>) => unknown)({
      events: [],
    }),
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

describe('SidebarFilters', () => {
  it('shows active filter bar with counts and clear action', () => {
    render(<SidebarFilters />)

    expect(screen.getByText('Active filters')).toBeInTheDocument()
    expect(screen.getByText('2/5')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /clear all/i }))
    expect(clearFilters).toHaveBeenCalled()
  })
})
