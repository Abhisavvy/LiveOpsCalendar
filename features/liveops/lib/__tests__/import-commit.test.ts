import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  liveOpsEventsToEventInputs,
  commitImportAppend,
  commitImportReplace,
} from '../import-commit'
import type { LiveOpsEvent } from '../../types/events'

const mockAddMultipleEvents = vi.fn()
const mockReplaceCalendarWithImported = vi.fn()

const sampleEvent: LiveOpsEvent = {
  id: 'event-1' as LiveOpsEvent['id'],
  title: 'Sample',
  start: '2026-01-01T10:00:00.000Z',
  end: '2026-01-01T11:00:00.000Z',
  cohort: ['All'],
  eventType: 'IAP',
  placement: ['Home screen'],
  description: '',
  status: 'Draft',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('liveOpsEventsToEventInputs', () => {
  it('maps LiveOpsEvent to EventInput without timestamps', () => {
    const inputs = liveOpsEventsToEventInputs([sampleEvent])
    expect(inputs[0]).toEqual({
      id: 'event-1',
      title: 'Sample',
      start: sampleEvent.start,
      end: sampleEvent.end,
      cohort: ['All'],
      eventType: 'IAP',
      placement: ['Home screen'],
      description: '',
      status: 'Draft',
      recurrence: undefined,
    })
  })
})

describe('commit helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('commitImportAppend delegates to addMultipleEvents', () => {
    commitImportAppend([sampleEvent], { addMultipleEvents: mockAddMultipleEvents })
    expect(mockAddMultipleEvents).toHaveBeenCalledTimes(1)
  })

  it('commitImportReplace delegates to replaceCalendarWithImported', () => {
    commitImportReplace([sampleEvent], { replaceCalendarWithImported: mockReplaceCalendarWithImported })
    expect(mockReplaceCalendarWithImported).toHaveBeenCalledTimes(1)
  })
})
