import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CalendarEmptyStateCallout } from '../CalendarEmptyStateCallout'

describe('CalendarEmptyStateCallout', () => {
  it('renders no-events message + Create Event CTA', async () => {
    const onCreateEvent = vi.fn()

    render(<CalendarEmptyStateCallout mode="noEvents" onCreateEvent={onCreateEvent} />)

    expect(screen.getByText('No events yet')).toBeInTheDocument()
    const cta = screen.getByRole('button', { name: /create event/i })
    fireEvent.click(cta)
    expect(onCreateEvent).toHaveBeenCalledTimes(1)
  })

  it('renders no-matches message + Clear filters CTA', async () => {
    const onClearFilters = vi.fn()

    render(<CalendarEmptyStateCallout mode="noMatches" onClearFilters={onClearFilters} />)

    expect(screen.getByText('No matching events')).toBeInTheDocument()
    const cta = screen.getByRole('button', { name: /clear filters/i })
    fireEvent.click(cta)
    expect(onClearFilters).toHaveBeenCalledTimes(1)
  })
})

