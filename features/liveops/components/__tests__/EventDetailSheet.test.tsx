import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EventDetailSheet } from '../EventDetailSheet'

const addEventMock = vi.fn(() => ({
  id: 'event-1',
  title: 'Test',
  start: '2026-05-01T00:00:00.000Z',
  end: null,
  cohort: ['All'],
  eventType: 'IAP',
  placement: 'Lobby',
  description: '',
  status: 'Draft',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
}))

vi.mock('../../hooks/useEventStore', () => ({
  useEventStore: (selector: unknown) =>
    (
      selector as (state: Record<string, unknown>) => unknown
    )({
      addEvent: addEventMock,
      updateEvent: vi.fn(() => true),
      deleteEvent: vi.fn(() => true),
      restoreEvent: vi.fn(() => true),
      duplicateEvent: vi.fn(() => null),
    }),
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

describe('EventDetailSheet', () => {
  beforeEach(() => addEventMock.mockClear())

  it('disables the end input when "Never ends" is checked', () => {
    render(<EventDetailSheet isOpen onOpenChange={vi.fn()} />)

    const endInput = screen.getByLabelText(/end date/i)
    const neverEnds = screen.getByRole('checkbox', { name: /never ends/i })

    expect(endInput).not.toBeDisabled()
    fireEvent.click(neverEnds)
    expect(endInput).toBeDisabled()
  })

  it('renders cohort options', () => {
    render(<EventDetailSheet isOpen onOpenChange={vi.fn()} />)

    expect(screen.getByText('D0')).toBeInTheDocument()
    expect(screen.getByText('D120+')).toBeInTheDocument()
  })

  it('enforces All exclusivity', () => {
    render(<EventDetailSheet isOpen onOpenChange={vi.fn()} />)

    const allCheckbox = screen.getByRole('checkbox', { name: 'All' })
    const d0Checkbox = screen.getByRole('checkbox', { name: 'D0' })

    fireEvent.click(d0Checkbox)
    fireEvent.click(allCheckbox)

    expect(allCheckbox).toBeChecked()
    expect(d0Checkbox).not.toBeChecked()
  })
})
