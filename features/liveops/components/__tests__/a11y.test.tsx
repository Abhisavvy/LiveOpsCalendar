import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { configureAxe } from 'vitest-axe'
import { CsvDropzone } from '../CsvDropzone'
import { CalendarLegend } from '../CalendarLegend'
import { ImportWizardShell } from '../ImportWizardShell'
import { ImportReviewPanel } from '../ImportReviewPanel'
import { ReplaceConfirmDialog } from '../ReplaceConfirmDialog'
import type { LiveOpsEvent } from '../../types/events'

const axe = configureAxe({
  // jsdom doesn't implement canvas; axe uses it for color contrast checks.
  rules: {
    'color-contrast': { enabled: false },
    // Radix Tabs uses generated ids with ':' which axe flags in jsdom.
    'aria-valid-attr-value': { enabled: false },
  },
})

describe('A11y smoke tests', () => {
  it('CsvDropzone has no obvious accessibility violations', async () => {
    const { container } = render(<CsvDropzone />)
    const results = await axe(container)
    expect(results.violations).toHaveLength(0)
  })

  it('CalendarLegend has no obvious accessibility violations', async () => {
    const { container } = render(<CalendarLegend />)
    const results = await axe(container)
    expect(results.violations).toHaveLength(0)
  })

  it('Import wizard review surface has no obvious accessibility violations', async () => {
    const { container } = render(
      <>
        <ImportWizardShell step="review">
          <ImportReviewPanel
            events={[
              {
                id: 'event-1' as LiveOpsEvent['id'],
                title: 'Test Event',
                start: '2026-01-01T10:00:00.000Z',
                end: '2026-01-01T11:00:00.000Z',
                cohort: ['All'],
                eventType: 'IAP',
                placement: ['Home screen'],
                description: '',
                status: 'Draft',
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
            ]}
            appendReplace="append"
            existingCount={1}
            onAppendReplaceChange={() => undefined}
            onBack={() => undefined}
            onCommit={() => undefined}
          />
        </ImportWizardShell>
        <ReplaceConfirmDialog
          open
          existingCount={1}
          onOpenChange={() => undefined}
          onConfirm={() => undefined}
        />
      </>
    )
    const results = await axe(container)
    expect(results.violations).toHaveLength(0)
  })
})

