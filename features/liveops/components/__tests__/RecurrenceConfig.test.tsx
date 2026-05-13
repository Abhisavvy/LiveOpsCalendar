import React from 'react'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RecurrenceConfig } from '../RecurrenceConfig'
import type { RecurrenceConfig as RecurrenceConfigModel } from '../../types/events'

function RecurrenceHarness({ initial }: { initial: RecurrenceConfigModel }) {
  const [value, setValue] = React.useState<RecurrenceConfigModel | undefined>(initial)
  return <RecurrenceConfig value={value} onChange={setValue} />
}

describe('RecurrenceConfig', () => {
  it('renders a DateTimePicker for Until', () => {
    const handleChange = vi.fn()
    render(
      <RecurrenceConfig
        value={{ frequency: 'daily', interval: 1 }}
        onChange={handleChange}
      />
    )

    expect(screen.getByRole('button', { name: /until/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/until time/i)).toBeInTheDocument()
    expect(document.querySelector('input[type="datetime-local"]')).toBeNull()
  })
})

describe('RecurrenceConfig (custom)', () => {
  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  it('shows custom basis selector and toggles weekly/monthly controls', async () => {
    render(<RecurrenceHarness initial={{ frequency: 'custom', interval: 1 }} />)

    expect(screen.getByText('Custom basis')).toBeInTheDocument()
    expect(screen.getByText('On these days')).toBeInTheDocument()

    const comboBoxes = screen.getAllByRole('combobox')
    const customBasisTrigger = comboBoxes[1] as HTMLElement
    fireEvent.click(customBasisTrigger)
    const monthlyOption = await screen.findByText('Monthly basis')
    fireEvent.click(monthlyOption)

    expect(screen.getByText('Monthly pattern')).toBeInTheDocument()
    expect(screen.queryByText('On these days')).not.toBeInTheDocument()
  })

  it('combines summary for custom weekly + monthly data', () => {
    render(
      <RecurrenceHarness
        initial={{
          frequency: 'custom',
          interval: 2,
          daysOfWeek: [1, 3],
          monthlyPattern: 'date',
          dayOfMonth: 15,
        }}
      />
    )

    const summary = screen.getByText(/Summary:/).parentElement
    expect(summary?.textContent).toContain('Every 2')
    expect(summary?.textContent).toContain('Mon')
    expect(summary?.textContent).toContain('day 15')
  })

  it('allows empty custom recurrence without weekday/monthly selections', () => {
    render(<RecurrenceHarness initial={{ frequency: 'custom', interval: 3 }} />)

    const summary = screen.getByText(/Summary:/).parentElement
    expect(summary?.textContent).toContain('Every 3')
  })
})
