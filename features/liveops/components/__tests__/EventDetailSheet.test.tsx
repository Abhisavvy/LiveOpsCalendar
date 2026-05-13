import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { LiveOpsEvent } from '../../types/events'
import { EventDetailSheet } from '../EventDetailSheet'

const FOLLOWING = Node.DOCUMENT_POSITION_FOLLOWING

function baseStoredEvent(): LiveOpsEvent {
  return {
    id: 'evt-1',
    title: 'Stored title',
    start: '2026-05-01T00:00:00.000Z',
    end: '2026-05-03T00:00:00.000Z',
    cohort: ['All'],
    eventType: 'Unknown',
    playerType: 'Payer',
    osType: 'Android',
    client: 'In-game',
    placement: 'Lobby',
    description: '',
    status: 'Draft',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-02T00:00:00.000Z',
  }
}

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

  it('renders Duplicate and Delete before Title when editing', () => {
    render(
      <EventDetailSheet isOpen onOpenChange={vi.fn()} event={baseStoredEvent()} />,
    )
    const duplicate = screen.getByRole('button', { name: /duplicate/i })
    const deleteBtn = screen.getByRole('button', { name: /^delete$/i })
    const titleInput = screen.getByPlaceholderText('Enter event title')
    expect(duplicate.compareDocumentPosition(titleInput) & FOLLOWING).toBeTruthy()
    expect(deleteBtn.compareDocumentPosition(titleInput) & FOLLOWING).toBeTruthy()
  })

  it('does not render Duplicate or Delete when creating', () => {
    render(<EventDetailSheet isOpen onOpenChange={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /duplicate/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument()
  })

  it('defaults audience and client selects to schema defaults when creating', () => {
    render(<EventDetailSheet isOpen onOpenChange={vi.fn()} />)

    expect(screen.getByLabelText(/^Player Type/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^OS Type/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Client$/)).toBeInTheDocument()

    const playerSel = screen.getByLabelText(/^Player Type/)
    expect(playerSel.textContent?.includes('All')).toBe(true)
    const osSel = screen.getByLabelText(/^OS Type/)
    expect(osSel.textContent?.includes('All')).toBe(true)
    const clientSel = screen.getByLabelText(/^Client$/)
    expect(clientSel.textContent?.includes('Kinoa')).toBe(true)
  })

  it('loads audience and client from the event into selects when editing', () => {
    render(
      <EventDetailSheet isOpen onOpenChange={vi.fn()} event={baseStoredEvent()} />,
    )

    const playerSel = screen.getByLabelText(/^Player Type/)
    expect(playerSel.textContent?.includes('Payer')).toBe(true)
    const osSel = screen.getByLabelText(/^OS Type/)
    expect(osSel.textContent?.includes('Android')).toBe(true)
    const clientSel = screen.getByLabelText(/^Client$/)
    expect(clientSel.textContent?.includes('In-game')).toBe(true)
  })

  it('uses DateTimePicker date + time inputs for start/end', () => {
    render(<EventDetailSheet isOpen onOpenChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: /^start$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^end$/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/start time/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/end time/i)).toBeInTheDocument()
    expect(document.querySelector('input[type="datetime-local"]')).toBeNull()
  })

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
