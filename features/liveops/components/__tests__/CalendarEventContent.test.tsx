import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalendarEventContent } from '../CalendarEventContent'

describe('CalendarEventContent', () => {
  it('renders title/cohort/status as text (no HTML injection)', () => {
    render(
      <CalendarEventContent
        title={`Hello <img src=x onerror=alert(1)>`}
        eventType="IAP"
        status="Draft"
        cohort="All"
        a11yLabel="A11Y label text"
      />
    )

    // The title should be present as text
    expect(screen.getByText(/Hello <img src=x onerror=alert/)).toBeInTheDocument()
    // And it should not create an actual <img>
    expect(document.querySelector('img')).toBeNull()
    // And a11y label is present for screen readers
    expect(screen.getByText('A11Y label text')).toBeInTheDocument()
  })
})

