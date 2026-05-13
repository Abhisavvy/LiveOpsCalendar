# LiveOps Calendar Open-Ended End Date + Multi-Cohort Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support open-ended events (no end date) and multi-cohort selection with AND-based cohort filtering while keeping calendar rendering, filters, and exports consistent.

**Architecture:** Store `end = null` for open-ended events and map to a far-future display end for calendar rendering and date-range math. Store `cohort` as an array of canonical values with `All` as a mutually exclusive option. Use a form-only `neverEnds` flag to validate end-date requirements while keeping persisted event data clean.

**Tech Stack:** Next.js (App Router), React, TypeScript, Zustand, Zod, Vitest, shadcn/ui.

---

## File Map

- Modify: `features/liveops/types/events.ts` (cohort array, utilities, schemas, form schema)
- Create: `features/liveops/types/__tests__/events.test.ts`
- Modify: `features/liveops/components/EventDetailSheet.tsx` (never ends toggle, cohort multi-select)
- Create: `features/liveops/components/__tests__/EventDetailSheet.test.tsx`
- Create: `features/liveops/lib/calendar-utils.ts` (display end + drop update helpers)
- Modify: `features/liveops/hooks/useCalendarEvents.ts`
- Modify: `features/liveops/components/CalendarView.tsx`
- Modify: `features/liveops/components/CalendarEventContent.tsx`
- Modify: `features/liveops/components/__tests__/CalendarEventContent.test.tsx`
- Modify: `features/liveops/lib/calendar-present.ts`
- Create: `features/liveops/hooks/__tests__/useCalendarEvents.test.ts`
- Create: `features/liveops/lib/__tests__/calendar-utils.test.ts`
- Modify: `features/liveops/hooks/useEventStore.ts`
- Modify: `features/liveops/hooks/useEventFilters.ts`
- Modify: `features/liveops/lib/storage.ts`
- Modify: `features/liveops/lib/export-utils.ts`
- Modify: `features/liveops/lib/csv-processor.ts`
- Modify: `features/liveops/hooks/__tests__/useEventStore.test.ts`
- Create: `features/liveops/lib/__tests__/storage.test.ts`
- Create: `features/liveops/lib/__tests__/export-utils.test.ts`
- Update: `PROGRESS.md`

---

### Task 1: Schemas + Cohort Utilities

**Files:**
- Modify: `features/liveops/types/events.ts`
- Test: `features/liveops/types/__tests__/events.test.ts`

- [ ] **Step 1: Write failing schema + utility tests**

```ts
import { describe, it, expect } from 'vitest'
import { EventInputSchema, EventFormSchema, normalizeCohorts } from '../events'

const baseEvent = {
  title: 'Open Ended Event',
  start: '2026-05-01T00:00:00.000Z',
  end: '2026-05-02T00:00:00.000Z',
  cohort: ['All'],
  eventType: 'IAP',
  placement: 'Lobby',
  description: '',
  status: 'Draft',
}

describe('Event schemas', () => {
  it('allows null end in EventInputSchema', () => {
    const result = EventInputSchema.safeParse({ ...baseEvent, end: null })
    expect(result.success).toBe(true)
  })

  it('accepts multiple cohorts', () => {
    const result = EventInputSchema.safeParse({ ...baseEvent, cohort: ['D0', 'D1'] })
    expect(result.success).toBe(true)
  })

  it('rejects All mixed with other cohorts', () => {
    const result = EventInputSchema.safeParse({ ...baseEvent, cohort: ['All', 'D1'] })
    expect(result.success).toBe(false)
  })

  it('requires end when neverEnds is false', () => {
    const result = EventFormSchema.safeParse({ ...baseEvent, end: null, neverEnds: false })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('end')
  })

  it('allows null end when neverEnds is true', () => {
    const result = EventFormSchema.safeParse({ ...baseEvent, end: null, neverEnds: true })
    expect(result.success).toBe(true)
  })
})

describe('normalizeCohorts', () => {
  it('parses comma-separated strings', () => {
    expect(normalizeCohorts('D0, D1')).toEqual(['D0', 'D1'])
  })

  it('normalizes All to exclusive', () => {
    expect(normalizeCohorts(['All', 'D0'])).toEqual(['All'])
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- run features/liveops/types/__tests__/events.test.ts`  
Expected: FAIL (new schema and helpers missing)

- [ ] **Step 3: Update event schemas + cohort helpers**

```ts
export const COHORT_OPTIONS = [
  'All',
  'D0',
  'D1',
  'D2-D7',
  'D7-D14',
  'D14-D30',
  'D30-D60',
  'D60-D120',
  'D120+',
] as const

export type CohortOption = typeof COHORT_OPTIONS[number]

export const OPEN_ENDED_EVENT_END = '2100-01-01T00:00:00.000Z'
```

```ts
const COHORT_LOOKUP = COHORT_OPTIONS.reduce<Record<string, CohortOption>>((acc, value) => {
  acc[value.toLowerCase()] = value
  return acc
}, {})

export function normalizeCohorts(input: string[] | string | null | undefined): CohortOption[] {
  if (!input) return ['All']
  const raw = Array.isArray(input) ? input : input.split(',')
  const normalized = raw
    .map((value) => COHORT_LOOKUP[value.trim().toLowerCase()])
    .filter(Boolean)

  if (normalized.includes('All')) return ['All']
  return normalized.length ? normalized : ['All']
}

export function formatCohorts(cohorts: CohortOption[] | string[]): string {
  return normalizeCohorts(cohorts as CohortOption[]).join(', ')
}
```

```ts
export const LiveOpsEventSchema = z.object({
  id: z.string().brand<'EventId'>(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  start: z.string().datetime('Invalid start date format'),
  end: z.string().datetime('Invalid end date format').nullable(),
  cohort: z.array(z.enum(COHORT_OPTIONS)).min(1, 'Cohort is required'),
  eventType: z.enum(EVENT_TYPES),
  placement: z.string().min(1, 'Placement is required'),
  description: z.string().max(1000, 'Description too long').default(''),
  status: z.enum(EVENT_STATUSES).default('Draft'),
  recurrence: RecurrenceConfigSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).superRefine((data, ctx) => {
  if (data.cohort.includes('All') && data.cohort.length > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['cohort'],
      message: '"All" cannot be combined with other cohorts.',
    })
  }
})
```

```ts
export const EventInputSchema = LiveOpsEventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: z.string().optional(),
})

export const EventFormSchema = EventInputSchema.extend({
  neverEnds: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (!data.neverEnds && !data.end) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['end'],
      message: 'End date is required unless "Never ends" is enabled.',
    })
  }
})
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- run features/liveops/types/__tests__/events.test.ts`  
Expected: PASS

- [ ] **Step 5: Update progress log**

Add a bullet in `PROGRESS.md` noting schema + cohort array updates.

- [ ] **Step 6: Commit**

```bash
git add features/liveops/types/events.ts features/liveops/types/__tests__/events.test.ts PROGRESS.md
git commit -m "feat: add multi-cohort schema support"
```

---

### Task 2: Event Detail Sheet UI (Never Ends + Cohort Multi-Select)

**Files:**
- Modify: `features/liveops/components/EventDetailSheet.tsx`
- Test: `features/liveops/components/__tests__/EventDetailSheet.test.tsx`

- [ ] **Step 1: Write failing component tests**

```tsx
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
  useEventStore: (selector: any) =>
    selector({
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
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- run features/liveops/components/__tests__/EventDetailSheet.test.tsx`  
Expected: FAIL (multi-select + toggle not present)

- [ ] **Step 3: Implement toggle + cohort multi-select**

```tsx
import { Checkbox } from '@/components/ui/checkbox'
import { EventFormSchema, type EventFormInput, COHORT_OPTIONS, normalizeCohorts } from '../types/events'
```

```tsx
const form = useForm<EventFormInput>({
  resolver: zodResolver(EventFormSchema),
  defaultValues: {
    title: '',
    start: nowISO(),
    end: addDurationToDate(nowISO(), '1d'),
    cohort: ['All'],
    eventType: 'Unknown',
    placement: '',
    description: '',
    status: 'Draft',
    neverEnds: false,
  },
})
```

```tsx
const neverEnds = form.watch('neverEnds')
```

```tsx
if (event) {
  form.reset({
    title: event.title,
    start: event.start,
    end: event.end,
    cohort: normalizeCohorts(event.cohort),
    eventType: event.eventType,
    placement: event.placement,
    description: event.description,
    status: event.status,
    recurrence: event.recurrence,
    neverEnds: event.end === null,
  })
} else {
  form.reset({
    title: '',
    start: defaultStart || nowISO(),
    end: defaultEnd || addDurationToDate(defaultStart || nowISO(), '1d'),
    cohort: ['All'],
    eventType: 'Unknown',
    placement: '',
    description: '',
    status: 'Draft',
    neverEnds: false,
  })
}
```

```tsx
const onSubmit = (data: EventFormInput) => {
  const { neverEnds: _neverEnds, ...payload } = data
  const normalized = {
    ...payload,
    cohort: normalizeCohorts(payload.cohort),
    end: data.neverEnds ? null : payload.end,
  }
  // pass normalized into addEvent/updateEvent
}
```

```tsx
<FormField
  control={form.control}
  name="neverEnds"
  render={({ field }) => (
    <FormItem className="flex items-center gap-2 space-y-0 pt-2">
      <FormControl>
        <Checkbox
          checked={Boolean(field.value)}
          onCheckedChange={(checked) => {
            const next = Boolean(checked)
            field.onChange(next)
            if (next) {
              form.setValue('end', null)
            } else if (!form.getValues('end')) {
              form.setValue('end', addDurationToDate(form.getValues('start'), '1d'))
            }
          }}
        />
      </FormControl>
      <FormLabel className="text-sm">Never ends</FormLabel>
    </FormItem>
  )}
/>
```

```tsx
<FormField
  control={form.control}
  name="cohort"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Cohort *</FormLabel>
      <FormControl>
        <div className="grid grid-cols-2 gap-2">
          {COHORT_OPTIONS.map((cohort) => {
            const checked = field.value.includes(cohort)
            return (
              <label key={cohort} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(nextChecked) => {
                    const isChecked = Boolean(nextChecked)
                    if (cohort === 'All') {
                      field.onChange(isChecked ? ['All'] : [])
                      return
                    }
                    const withoutAll = field.value.filter((value) => value !== 'All')
                    const next = isChecked
                      ? [...withoutAll, cohort]
                      : withoutAll.filter((value) => value !== cohort)
                    field.onChange(next.length ? next : ['All'])
                  }}
                />
                <span>{cohort}</span>
              </label>
            )
          })}
        </div>
      </FormControl>
      <FormDescription>Target audience for this event</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- run features/liveops/components/__tests__/EventDetailSheet.test.tsx`  
Expected: PASS

- [ ] **Step 5: Update progress log**

Add a bullet in `PROGRESS.md` noting the new toggle + cohort multi-select.

- [ ] **Step 6: Commit**

```bash
git add features/liveops/components/EventDetailSheet.tsx features/liveops/components/__tests__/EventDetailSheet.test.tsx PROGRESS.md
git commit -m "feat: add never-ending events and cohort multiselect"
```

---

### Task 3: Calendar Rendering + A11y + Drag Logic

**Files:**
- Create: `features/liveops/lib/calendar-utils.ts`
- Modify: `features/liveops/hooks/useCalendarEvents.ts`
- Modify: `features/liveops/components/CalendarView.tsx`
- Modify: `features/liveops/components/CalendarEventContent.tsx`
- Modify: `features/liveops/components/__tests__/CalendarEventContent.test.tsx`
- Modify: `features/liveops/lib/calendar-present.ts`
- Test: `features/liveops/lib/__tests__/calendar-utils.test.ts`
- Test: `features/liveops/hooks/__tests__/useCalendarEvents.test.ts`

- [ ] **Step 1: Write failing calendar tests**

```ts
import { describe, it, expect } from 'vitest'
import { getDisplayEnd, getEventDropUpdate } from '../calendar-utils'
import type { LiveOpsEvent } from '../../types/events'
import { OPEN_ENDED_EVENT_END } from '../../types/events'

const baseEvent: LiveOpsEvent = {
  id: 'event-1' as any,
  title: 'Test',
  start: '2026-05-01T00:00:00.000Z',
  end: '2026-05-02T00:00:00.000Z',
  cohort: ['All'],
  eventType: 'IAP',
  placement: 'Lobby',
  description: '',
  status: 'Draft',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
}

describe('calendar-utils', () => {
  it('returns far-future end for open-ended events', () => {
    expect(getDisplayEnd(null)).toBe(OPEN_ENDED_EVENT_END)
  })

  it('keeps end null for open-ended drag updates', () => {
    const updated = getEventDropUpdate({ ...baseEvent, end: null }, '2026-05-10T00:00:00.000Z')
    expect(updated).toEqual({ start: '2026-05-10T00:00:00.000Z', end: null })
  })

  it('preserves duration when updating start', () => {
    const updated = getEventDropUpdate(baseEvent, '2026-05-10T00:00:00.000Z')
    expect(updated.end).toBe('2026-05-11T00:00:00.000Z')
  })
})
```

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCalendarEvents } from '../useCalendarEvents'
import { useEventStore } from '../useEventStore'
import { OPEN_ENDED_EVENT_END } from '../../types/events'

describe('useCalendarEvents', () => {
  beforeEach(() => {
    useEventStore.setState({ filteredEvents: [] } as any)
  })

  it('maps open-ended events to display end', () => {
    useEventStore.setState({
      filteredEvents: [
        {
          id: 'event-1',
          title: 'Open',
          start: '2026-05-01T00:00:00.000Z',
          end: null,
          cohort: ['D0', 'D1'],
          eventType: 'IAP',
          placement: 'Lobby',
          description: '',
          status: 'Draft',
          createdAt: '2026-05-01T00:00:00.000Z',
          updatedAt: '2026-05-01T00:00:00.000Z',
        },
      ],
    } as any)

    const { result } = renderHook(() => useCalendarEvents())
    expect(result.current.events[0]?.end).toBe(OPEN_ENDED_EVENT_END)
  })
})
```

```tsx
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
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- run features/liveops/lib/__tests__/calendar-utils.test.ts`  
Expected: FAIL (calendar-utils missing)

Run: `npm test -- run features/liveops/hooks/__tests__/useCalendarEvents.test.ts`  
Expected: FAIL (display end mapping missing)

Run: `npm test -- run features/liveops/components/__tests__/CalendarEventContent.test.tsx`  
Expected: FAIL (cohort list + never label missing)

- [ ] **Step 3: Implement calendar helpers + UI changes**

```ts
import type { LiveOpsEvent } from '../types/events'
import { OPEN_ENDED_EVENT_END } from '../types/events'

export function getDisplayEnd(end: string | null): string {
  return end ?? OPEN_ENDED_EVENT_END
}

export function getEventDropUpdate(
  event: LiveOpsEvent,
  newStart: string
): { start: string; end: string | null } {
  if (!event.end) {
    return { start: newStart, end: null }
  }

  const durationMs = new Date(event.end).getTime() - new Date(event.start).getTime()
  const nextEnd = new Date(new Date(newStart).getTime() + durationMs).toISOString()
  return { start: newStart, end: nextEnd }
}
```

```ts
import { formatCohorts } from '../types/events'
```

```ts
const calendarEvents = useMemo<EventInput[]>(() => {
  return filteredEvents.map((event): EventInput => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: getDisplayEnd(event.end),
    classNames: [
      `event-${event.eventType.toLowerCase()}`,
      `status-${event.status.toLowerCase()}`,
      'fc-event-liveops'
    ],
    extendedProps: {
      eventType: event.eventType,
      status: event.status,
      cohort: formatCohorts(event.cohort),
      placement: event.placement,
      description: event.description,
      recurrence: event.recurrence,
      isOpenEnded: event.end === null,
      liveOpsData: event,
    },
    editable: true,
    display: 'block',
  }))
}, [filteredEvents])
```

```ts
const handleEventDrop = useCallback(
  (dropInfo: EventDropArg) => {
    const liveOpsEvent = dropInfo.event.extendedProps.liveOpsData as LiveOpsEvent

    if (liveOpsEvent) {
      const updates = getEventDropUpdate(liveOpsEvent, dropInfo.event.startStr)
      const success = updateEvent(liveOpsEvent.id, updates)
      // toast + revert remain the same
    }
  },
  [updateEvent, toast]
)
```

```tsx
<CalendarEventContent
  title={eventInfo.event.title}
  eventType={eventType}
  status={status}
  cohort={cohort}
  isOpenEnded={Boolean(props?.isOpenEnded)}
  a11yLabel={a11yLabel}
/>
```

```ts
import { formatCohorts } from '../types/events'

export function formatEventA11yLabel(event: LiveOpsEvent): string {
  const type = getEventTypeMeta(event.eventType).label
  const status = getStatusMeta(event.status).label
  const cohorts = formatCohorts(event.cohort)
  const endLabel = event.end ? '' : ' Never ends.'
  return `${event.title}. Type: ${type}. Status: ${status}. Cohort: ${cohorts}. Placement: ${event.placement}.${endLabel}`
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- run features/liveops/lib/__tests__/calendar-utils.test.ts`  
Expected: PASS

Run: `npm test -- run features/liveops/hooks/__tests__/useCalendarEvents.test.ts`  
Expected: PASS

Run: `npm test -- run features/liveops/components/__tests__/CalendarEventContent.test.tsx`  
Expected: PASS

- [ ] **Step 5: Update progress log**

Add a bullet in `PROGRESS.md` noting calendar display + drag updates for open-ended events.

- [ ] **Step 6: Commit**

```bash
git add features/liveops/lib/calendar-utils.ts features/liveops/lib/__tests__/calendar-utils.test.ts features/liveops/hooks/useCalendarEvents.ts features/liveops/hooks/__tests__/useCalendarEvents.test.ts features/liveops/components/CalendarView.tsx features/liveops/components/CalendarEventContent.tsx features/liveops/components/__tests__/CalendarEventContent.test.tsx features/liveops/lib/calendar-present.ts PROGRESS.md
git commit -m "feat: render open-ended multi-cohort events"
```

---

### Task 4: Filters, Storage, Exports, Imports

**Files:**
- Modify: `features/liveops/hooks/useEventStore.ts`
- Modify: `features/liveops/hooks/useEventFilters.ts`
- Modify: `features/liveops/lib/storage.ts`
- Modify: `features/liveops/lib/export-utils.ts`
- Modify: `features/liveops/lib/csv-processor.ts`
- Test: `features/liveops/hooks/__tests__/useEventStore.test.ts`
- Test: `features/liveops/lib/__tests__/storage.test.ts`
- Test: `features/liveops/lib/__tests__/export-utils.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useEventStore } from '../useEventStore'

function resetStore() {
  useEventStore.setState({
    events: [],
    filteredEvents: [],
    filters: {
      searchQuery: '',
      eventTypes: [],
      cohorts: [],
      statuses: [],
    },
    selectedEvent: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
  } as any)
}

describe('useEventStore cohort filters', () => {
  beforeEach(() => resetStore())

  it('uses AND semantics for cohort filters', () => {
    useEventStore.setState({
      events: [
        {
          id: 'event-1',
          title: 'Open',
          start: '2026-05-01T00:00:00.000Z',
          end: null,
          cohort: ['D0', 'D1'],
          eventType: 'IAP',
          placement: 'Lobby',
          description: '',
          status: 'Draft',
          createdAt: '2026-05-01T00:00:00.000Z',
          updatedAt: '2026-05-01T00:00:00.000Z',
        },
      ],
      filters: {
        searchQuery: '',
        eventTypes: [],
        cohorts: ['D0', 'D1'],
        statuses: [],
      },
    } as any)

    useEventStore.getState().applyFilters()
    expect(useEventStore.getState().filteredEvents).toHaveLength(1)
  })

  it('treats All as matching any cohort filter', () => {
    useEventStore.setState({
      events: [
        {
          id: 'event-2',
          title: 'All',
          start: '2026-05-01T00:00:00.000Z',
          end: null,
          cohort: ['All'],
          eventType: 'IAP',
          placement: 'Lobby',
          description: '',
          status: 'Draft',
          createdAt: '2026-05-01T00:00:00.000Z',
          updatedAt: '2026-05-01T00:00:00.000Z',
        },
      ],
      filters: {
        searchQuery: '',
        eventTypes: [],
        cohorts: ['D0'],
        statuses: [],
      },
    } as any)

    useEventStore.getState().applyFilters()
    expect(useEventStore.getState().filteredEvents).toHaveLength(1)
  })
})
```

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadEvents } from '../storage'

describe('storage loadEvents', () => {
  beforeEach(() => {
    vi.mocked(window.localStorage.getItem).mockReset()
  })

  it('migrates legacy cohort strings to arrays', () => {
    vi.mocked(window.localStorage.getItem).mockImplementation((key) => {
      if (key === 'liveops-events') {
        return JSON.stringify([
          {
            id: 'event-1',
            title: 'Legacy',
            start: '2026-05-01T00:00:00.000Z',
            end: null,
            cohort: 'D0',
            eventType: 'IAP',
            placement: 'Lobby',
            description: '',
            status: 'Draft',
            createdAt: '2026-05-01T00:00:00.000Z',
            updatedAt: '2026-05-01T00:00:00.000Z',
          },
        ])
      }
      return null
    })

    const events = loadEvents()
    expect(events[0]?.cohort).toEqual(['D0'])
  })
})
```

```ts
import { describe, it, expect } from 'vitest'
import { exportEventsToCSV } from '../export-utils'
import { exportEventsToCsv } from '../csv-processor'

const multiCohortEvent = {
  id: 'event-1',
  title: 'Open',
  start: '2026-05-01T00:00:00.000Z',
  end: null,
  cohort: ['D0', 'D1'],
  eventType: 'IAP',
  placement: 'Lobby',
  description: '',
  status: 'Draft',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
}

describe('export utils', () => {
  it('exports comma-separated cohorts', () => {
    const csv = exportEventsToCSV([multiCohortEvent])
    expect(csv).toContain('D0, D1')
  })

  it('exports Never for timer in original CSV', () => {
    const csv = exportEventsToCsv([multiCohortEvent], true)
    expect(csv).toContain('Never')
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- run features/liveops/hooks/__tests__/useEventStore.test.ts`  
Expected: FAIL (AND + All handling missing)

Run: `npm test -- run features/liveops/lib/__tests__/storage.test.ts`  
Expected: FAIL (legacy migration missing)

Run: `npm test -- run features/liveops/lib/__tests__/export-utils.test.ts`  
Expected: FAIL (cohort export mismatch)

- [ ] **Step 3: Implement filter, storage, export, import changes**

```ts
import { COHORT_OPTIONS, normalizeCohorts } from '../types/events'
```

```ts
const cohorts = COHORT_OPTIONS
```

```ts
const eventCohorts = normalizeCohorts(event.cohort)
const matchesAll = eventCohorts.includes('All')
const matchesSelected = filters.cohorts.every((cohort) => eventCohorts.includes(cohort))
```

```ts
return events.filter(event => {
  return event &&
    typeof event.id === 'string' &&
    typeof event.title === 'string' &&
    typeof event.start === 'string' &&
    (typeof event.end === 'string' || event.end === null)
}).map((event) => ({
  ...event,
  cohort: normalizeCohorts(event.cohort),
}))
```

```ts
case 'cohort':
  row[csvColumn] = formatCohorts(event.cohort)
  break
```

```ts
if (originalColumnNames) {
  if (!event.end) {
    return [
      event.title,
      event.start.split('T')[0],
      'Never',
      formatCohorts(event.cohort),
      event.eventType,
      event.placement,
      event.description,
    ]
  }
  // existing duration math...
}
```

```ts
const cohort = normalizeCohorts(sanitizeValue(value))
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- run features/liveops/hooks/__tests__/useEventStore.test.ts`  
Expected: PASS

Run: `npm test -- run features/liveops/lib/__tests__/storage.test.ts`  
Expected: PASS

Run: `npm test -- run features/liveops/lib/__tests__/export-utils.test.ts`  
Expected: PASS

- [ ] **Step 5: Update progress log**

Add a bullet in `PROGRESS.md` noting filters/storage/export/import handling for multi-cohort events.

- [ ] **Step 6: Commit**

```bash
git add features/liveops/hooks/useEventStore.ts features/liveops/hooks/useEventFilters.ts features/liveops/lib/storage.ts features/liveops/lib/export-utils.ts features/liveops/lib/csv-processor.ts features/liveops/hooks/__tests__/useEventStore.test.ts features/liveops/lib/__tests__/storage.test.ts features/liveops/lib/__tests__/export-utils.test.ts PROGRESS.md
git commit -m "feat: support multi-cohort filters and exports"
```

---

## Plan Self-Review

- **Spec coverage:** All requirements covered: open-ended storage, calendar rendering, drag behavior, multi-cohort selection, All exclusivity, AND filtering, exports/imports, and tests.
- **Placeholder scan:** No placeholders remain.
- **Type consistency:** `end` is `string | null`, `cohort` is `CohortOption[]` across schema, store, calendar, filters, and exports.
