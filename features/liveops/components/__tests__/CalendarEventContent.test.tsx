import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { CalendarEventContent } from '../CalendarEventContent'

describe('CalendarEventContent', () => {
  const requireConfig = createRequire(import.meta.url)

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

  it('renders cohort list and never label', () => {
    render(
      <CalendarEventContent
        title="Open Ended"
        eventType="IAP"
        status="Draft"
        cohort="D0, D1"
        isOpenEnded
      />
    )

    expect(screen.getByText('D0, D1')).toBeInTheDocument()
    expect(screen.getByText('Never')).toBeInTheDocument()
  })

  it('renders a colored dot before the event title', () => {
    render(
      <CalendarEventContent
        title="Neutral Title"
        eventType="IAP"
        status="Draft"
        cohort="All"
      />
    )

    const title = screen.getByText('Neutral Title')
    expect(title).toHaveClass('event-title-text')

    const dot = document.querySelector('.event-type-dot')
    expect(dot).not.toBeNull()
  })

  it('styles FullCalendar day numbers and headers in globals', () => {
    const cssPath = path.join(process.cwd(), 'app/globals.css')
    const css = readFileSync(cssPath, 'utf-8')

    expect(css).toMatch(/\.fc-daygrid-day-number/)
    expect(css).toMatch(/\.fc-col-header-cell-cushion/)
    expect(css).toMatch(/\.fc-day-other\s+\.fc-daygrid-day-number/)
    expect(css).toMatch(/\.fc-day-other\s+\.fc-daygrid-day-top\s*\{[^}]*opacity:\s*0\.6/)
    expect(css).toMatch(
      /\.fc-col-header-cell\s*\{[^}]*background-color:\s*hsl\(var\(--background\)(?:\s*\/\s*0\.7)?\)/
    )
    expect(css).toMatch(/\.fc-col-header-cell\s*\{[^}]*color:\s*hsl\(var\(--foreground\)\)/)
    expect(css).toMatch(/\.fc\s+\.fc-scrollgrid-section-header\s+th/)
  })

  it('forces event backgrounds to use client-aware color tokens', () => {
    const cssPath = path.join(process.cwd(), 'app/globals.css')
    const css = readFileSync(cssPath, 'utf-8')

    expect(css).toMatch(/\.fc-event\.client-kinoa\s*\{[^}]*--event-bg:/)
    expect(css).toMatch(/\.fc-event\.client-kinoa\s*\{[^}]*background-color:\s*var\(--event-bg\)\s*!important/)
    expect(css).toMatch(/\.fc-event\.client-in-game\s*\{[^}]*--event-bg:/)
    expect(css).toMatch(/\.fc-event\.client-in-game\s*\{[^}]*background-color:\s*var\(--event-bg\)\s*!important/)
    expect(css).toMatch(/\.fc-event\.event-iap\s*\{[^}]*border-left-width:\s*4px/)
    expect(css).toMatch(/\.fc-event\.event-iap\s*\{[^}]*border-color:\s*var\(--event-border\)\s*!important/)
  })

  it('stacks event title and subtitle without overlap', () => {
    const cssPath = path.join(process.cwd(), 'app/globals.css')
    const css = readFileSync(cssPath, 'utf-8')

    expect(css).toMatch(/\.fc-event-main-frame\s*\{[^}]*flex-direction:\s*column/)
    expect(css).toMatch(/\.fc-event-main\s*\{[^}]*padding:\s*3px 6px/)
  })

  it('safelists FullCalendar structural classes for Tailwind', () => {
    const config = requireConfig('../../../../tailwind.config.js') as {
      safelist?: Array<string | RegExp>
    }
    const safelist = config.safelist ?? []
    const includes = (value: string) =>
      safelist.some((entry) => (typeof entry === 'string' ? entry === value : entry.test(value)))

    expect(includes('fc-event')).toBe(true)
    expect(includes('fc-event-main')).toBe(true)
    expect(includes('fc-event-main-frame')).toBe(true)
    expect(includes('fc-h-event')).toBe(true)
    expect(includes('fc-v-event')).toBe(true)
    expect(includes('fc-daygrid-event')).toBe(true)
    expect(includes('fc-timegrid-event')).toBe(true)
    expect(includes('fc-list-event')).toBe(true)
  })
})

