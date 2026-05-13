import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import dayjs from 'dayjs'
import { DateTimePicker } from '../date-time-picker'

describe('DateTimePicker', () => {
  it('opens the calendar at the month of the last clicked day even when controlled value stays on an older month', async () => {
    const user = userEvent.setup()
    const noop = vi.fn()
    const january = new Date(Date.UTC(2026, 0, 5, 10, 0, 0)).toISOString()

    const { rerender } = render(
      <DateTimePicker label="Scheduled" value={january} onChange={noop} />,
    )

    await user.click(screen.getByRole('button', { name: /^scheduled$/i }))
    await screen.findByRole('grid', { name: /^calendar$/i })
    let panel = screen.getByRole('grid', { name: /^calendar$/i }).closest('[data-datepicker-panel="true"]')
    expect(panel).toBeTruthy()
    panel = panel as HTMLElement

    expect(within(panel).getByText(/January 2026/i)).toBeInTheDocument()

    await user.click(within(panel).getByRole('button', { name: /^next month$/i }))
    await user.click(within(panel).getByRole('button', { name: /^next month$/i }))

    expect(within(panel).getByText(/March 2026/i)).toBeInTheDocument()

    await user.click(screen.getByRole('gridcell', { name: /March 12, 2026/i }))

    expect(noop).toHaveBeenCalled()
    rerender(<DateTimePicker label="Scheduled" value={january} onChange={noop} />)

    await user.click(screen.getByRole('button', { name: /^scheduled$/i }))
    await screen.findByRole('grid', { name: /^calendar$/i })

    panel = screen.getByRole('grid', { name: /^calendar$/i }).closest('[data-datepicker-panel="true"]') as HTMLElement

    expect(within(panel).getByText(/March 2026/i)).toBeInTheDocument()
    expect(within(panel).queryByText(/May 2026/i)).not.toBeInTheDocument()
    expect(within(panel).queryByText(/January 2026/i)).not.toBeInTheDocument()
  })

  it('reopens on last picked calendar month—not system today—when value stays null after pick', async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    })
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 4, 20, 12, 0, 0))

    try {
      const noop = vi.fn()
      const { rerender } = render(
        <DateTimePicker label="Pick" value={null} onChange={noop} />,
      )

      await user.click(screen.getByRole('button', { name: /^pick$/i }))
      await screen.findByRole('grid', { name: /^calendar$/i })
      let panel = screen
        .getByRole('grid', { name: /^calendar$/i })
        .closest('[data-datepicker-panel="true"]') as HTMLElement

      expect(within(panel).getByText(/May 2026/i)).toBeInTheDocument()

      await user.click(within(panel).getByRole('button', { name: /^previous month$/i }))
      await user.click(within(panel).getByRole('button', { name: /^previous month$/i }))
      await user.click(within(panel).getByRole('button', { name: /^previous month$/i }))
      expect(within(panel).getByText(/February 2026/i)).toBeInTheDocument()

      await user.click(screen.getByRole('gridcell', { name: /February 10, 2026/i }))
      expect(noop).toHaveBeenCalled()

      rerender(<DateTimePicker label="Pick" value={null} onChange={noop} />)

      await user.click(screen.getByRole('button', { name: /^pick$/i }))
      await screen.findByRole('grid', { name: /^calendar$/i })
      panel = screen
        .getByRole('grid', { name: /^calendar$/i })
        .closest('[data-datepicker-panel="true"]') as HTMLElement

      expect(within(panel).getByText(/February 2026/i)).toBeInTheDocument()
      expect(within(panel).queryByText(/May 2026/i)).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('renders separate date + time inputs with AM/PM', () => {
    const iso = '2026-01-05T13:45:00.000Z'
    render(<DateTimePicker label="Start" value={iso} onChange={vi.fn()} />)

    expect(screen.getByLabelText(/start date/i)).toHaveValue(dayjs(iso).format('YYYY-MM-DD'))
    expect(screen.getByLabelText(/start time/i)).toHaveValue(dayjs(iso).format('h:mm'))
    expect(screen.getByRole('combobox', { name: /start meridiem/i }))
      .toHaveTextContent(dayjs(iso).format('A'))
  })

  it('emits ISO when date, time, and meridiem are valid', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DateTimePicker label="Start" value={null} onChange={onChange} />)

    const dateInput = screen.getByLabelText(/start date/i)
    const timeInput = screen.getByLabelText(/start time/i)
    const meridiem = screen.getByRole('combobox', { name: /start meridiem/i })

    await user.type(dateInput, '2026-02-10')
    await user.type(timeInput, '3:15')
    await user.click(meridiem)
    await user.click(screen.getByRole('option', { name: 'PM' }))

    const expected = dayjs('2026-02-10 3:15 PM', 'YYYY-MM-DD h:mm A', true).toISOString()
    expect(onChange).toHaveBeenCalledWith(expected)
  })

  it('wraps controls to prevent overlap in narrow layouts', () => {
    render(<DateTimePicker label="Start" value={null} onChange={vi.fn()} />)

    const dateRow = document.querySelector('[data-datetime-row="date"]')
    const timeRow = document.querySelector('[data-datetime-row="time"]')
    const wrapper = document.querySelector('[data-datetime-controls="true"]')

    expect(wrapper).not.toBeNull()
    expect(wrapper).toHaveClass('flex-col')
    expect(dateRow).not.toBeNull()
    expect(timeRow).not.toBeNull()
  })
})
