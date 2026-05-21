import { describe, it, expect } from 'vitest'
import { getEventTypeMeta, getStatusMeta, formatEventA11yLabel } from '../calendar-present'

describe('calendar-present', () => {
  it('returns meta for known event types', () => {
    expect(getEventTypeMeta('IAP').label).toBe('IAP')
    expect(getEventTypeMeta('Rolling Retention').label).toBe('Rolling Retention')
    expect(getEventTypeMeta('Engagement').label).toBe('Engagement')
  })

  it('falls back for unknown event types', () => {
    expect(getEventTypeMeta('NotAType').label).toBe('Unknown')
  })

  it('returns meta for known statuses and falls back', () => {
    expect(getStatusMeta('Active').label).toBe('Active')
    expect(getStatusMeta('NotAStatus').label).toBe('Draft')
  })

  it('formats an accessibility label with key fields', () => {
    const label = formatEventA11yLabel({
      id: 'id' as any,
      title: 'Title',
      start: '2024-01-01T00:00:00.000Z',
      end: '2024-01-02T00:00:00.000Z',
      cohort: ['All'],
      eventType: 'IAP',
      placement: ['Home screen'],
      description: '',
      status: 'Draft',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    })

    expect(label).toContain('Title')
    expect(label).toContain('Type: IAP')
    expect(label).toContain('Status: Draft')
    expect(label).toContain('Cohort: All')
  })

  it('uses status override when provided', () => {
    const label = formatEventA11yLabel(
      {
        id: 'id' as any,
        title: 'Title',
        start: '2024-01-01T00:00:00.000Z',
        end: '2024-01-02T00:00:00.000Z',
        cohort: ['All'],
        eventType: 'IAP',
        placement: ['Home screen'],
        description: '',
        status: 'Scheduled',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      'Ended'
    )

    expect(label).toContain('Status: Ended')
  })
})

