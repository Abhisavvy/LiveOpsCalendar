# Batch Import UX (Layout C, Approach A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a linear **Upload → Validate → Review → Commit** import surface on top of existing `CsvDropzone`/`useCsvProcessor`/`useBatchImport`, deferring **all** store mutations until the user confirms Commit, with append/replace (two-step destructive confirm), error review/export, cancellation safety, Vitest RTL coverage, and accessibility hardening aligned with [`docs/superpowers/specs/2026-05-08-batch-import-ui-design.md`](../specs/2026-05-08-batch-import-ui-design.md).

**Architecture:** A client-side wizard holds `pendingPreview: { source: 'sync'|'batch'; result: CsvProcessingResult | BatchImportDeferredResult }` in React state (or `useReducer`) until Commit. Parsing stays in existing hooks/worker; **`useCsvProcessor`** stops calling **`importFromCSV`** on parse success (Approach A). **`useBatchImport`** stops calling **`addMultipleEvents`** inside the worker `COMPLETE` handler; instead it resolves a payload mapped to **`LiveOpsEvent[]`** identical to today’s validated shape without persisting. **Commit** invokes **`addMultipleEvents`** for append, or **`replaceCalendarWithImported` (new transactional store helper)** for replace (`clearAllEvents` + bulk add inside a single `set`/`immer` turn so persisted state never settles as empty mid-replace).

**Tech Stack:** Next.js App Router (`'use client'`), React 18, Vitest + Testing Library + `vitest-axe`, Radix primitives already in `@/components/ui` (reuse `dialog`, `button`, etc.), existing Zustand **`useEventStore`**, PapaParse + batch worker untouched at algorithm layer.

---

## File map

| Path | Responsibility |
|------|----------------|
| **`features/liveops/hooks/useEventStore.ts`** | Add **`replaceCalendarWithImported(events: EventInput[])`** — one immer `set` clearing `events`, `filteredEvents`, `selectedEvent`, then merging new rows (mirror field handling from `addMultipleEvents`), then **`applyFilters` + `saveToStorage`** once. Document **`importFromCSV`** as legacy “replace-all from small CSV result” semantics (still assigns `events = result.events`); wizard commit should prefer **`addMultipleEvents`** / transactional replace helper for Approach A parity. |
| **`features/liveops/lib/import-commit.ts`** (new) | Pure helpers **`liveOpsEventsToEventInputs`**, **`commitImportAppend`**, **`commitImportReplace`** (thin wrappers delegating to store actions) — easy to unit test without mocking React. |
| **`features/liveops/hooks/useCsvProcessor.ts`** | Remove eager **`importFromCSV`** calls and success/import toasts tied to commits; optionally emit neutral parse-complete behavior (or defer toasting to wizard Commit). Preserve **`result` / `errors` / `successfulRows`** for Validate/Review wiring. |
| **`features/liveops/hooks/useBatchImport.ts`** | On **`COMPLETE`**: do **not** call **`addMultipleEvents`**; build **`BatchImportResult`** whose **`events`** are **`completeData.events`** (already **`LiveOpsEvent[]`**); still surface errors/progress UX. Adjust toast timing: success toast on Commit phase (or suppressed until Commit—match spec wording). Ensure **`cancelImport` / termination** clears any orchestrator-held pending preview (consumer responsibility documented in hooks). |
| **`features/liveops/hooks/useImportWizard.ts`** (new) | `useReducer` or `useState`: `step ∈ {upload, validate, review, commit}` (string union), `completedSteps`, `pending` payload, **`appendVsReplace`** session choice (`'append' | 'replace'`), `showReplaceConfirm` flag. Actions: **`startFile`**, **`parsingStarted`**, **`parsingFinishedSync`**, **`parsingFinishedBatch`**, **`userAbort`**, **`goBackDiscard`**, **`goReview`**, **`openReplaceConfirm`**, **`confirmReplace`**, **`executeCommit`** (calls store helpers), **`resetWizard`**. |
| **`features/liveops/components/ImportWizardShell.tsx`** (new) | Layout C container: step header + progress, renders current phase panel, coordinates footers. |
| **`features/liveops/components/ImportStepHeader.tsx`** (new) | Visual stepper: Upload → Validate → Review → Commit; `aria-current="step"` on active. |
| **`features/liveops/components/ImportValidatePanel.tsx`** (new) | Counts, capped error list + “Show all” expand, **Download errors** (reuse `downloadErrorReport` pattern from `CsvDropzone`), **Continue to review** (disabled if `successfulRows === 0` on total failure), **Cancel** / **Back** per spec. |
| **`features/liveops/components/ImportReviewPanel.tsx`** (new) | Summary strip (totals, date range, optional compact cohort/type counts), **paginated** preview table (50 rows/page YAGNI default), append/replace radio group when `storeEvents.length > 0`, **Commit** primary disabled with reason string. |
| **`features/liveops/components/ReplaceConfirmDialog.tsx`** (new) | Radix AlertDialog: destructive confirm summarizing **“remove all N existing events”**; focus trap + return focus. |
| **`features/liveops/components/CsvDropzone.tsx`** | Owns dropzone + routes small vs batch threshold (`BATCH_PROCESSING_THRESHOLD`); mounts wizard shell; passes hook outputs + store selectors; implements **“Preparing import…”** messaging for batch initialize. Keeps **`TemplateSelector`** / sample download reachable from Upload step. Moves **`downloadErrorReport`** next to **`ImportValidatePanel`** or shared **`features/liveops/lib/csv-errors-export.ts`** to avoid duplication. |
| **`features/liveops/components/BatchImportProgress.tsx`** | Integrate into Validate step row (instead of standalone overlay blocking entire card) once wizard exists; preserve cancel semantics. |

**Tests / a11y**

| Path | Responsibility |
|------|----------------|
| **`features/liveops/hooks/__tests__/useCsvProcessor.test.ts`** (new) | Assert **`importFromCSV` mock never called** after **`processFile`** resolves successfully. |
| **`features/liveops/hooks/__tests__/useBatchImport.test.ts`** | Extend with simulated **`COMPLETE` message**: assert **`addMultipleEvents` mock never called** before external commit helper (update store mock selector pattern to expose both **`addMultipleEvents`** + **`clearAllEvents`** as needed). |
| **`features/liveops/lib/__tests__/import-commit.test.ts`** (new) | Maps **`LiveOpsEvent[]` → `EventInput[]`**; append/replace **integration with mocked store**. |
| **`features/liveops/hooks/__tests__/useEventStore.replace.test.ts`** (optional split) OR extend existing store tests | Single-transaction replace behavior. *(If project has no `useEventStore` test module yet, place under `features/liveops/hooks/__tests__/useEventStore.import-flow.test.ts`.)* |
| **`features/liveops/hooks/__tests__/useImportWizard.test.ts`** (new) | Reducer/state machine transitions, especially **discard on Back from Review** clears pending preview. |
| **`features/liveops/components/__tests__/CsvDropzone.test.tsx`** | Update mocks for new wizard; cover step transitions & Replace confirm gating. |
| **`features/liveops/components/__tests__/a11y.test.tsx`** | Render wizard at Review step with dialog open fixture; axe rules remain with `color-contrast` disabled for jsdom. |

---

### Task 1: Transactional replace on the event store (TDD)

**Files:**
- Modify: `features/liveops/hooks/useEventStore.ts` (interface + impl)
- Test: `features/liveops/hooks/__tests__/useEventStore.import-flow.test.ts` (create if missing)

- [ ] **Step 1: Write the failing test — replace is atomic**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useEventStore } from '../useEventStore'

describe('useEventStore import flow helpers', () => {
  beforeEach(() => {
    useEventStore.setState({
      events: [],
      filteredEvents: [],
      selectedEvent: null,
    })
  })

  it('replaceCalendarWithImported clears then adds in one update (no empty intermediate state visible to subscribers)', () => {
    const seenLengths: number[] = []
    const unsub = useEventStore.subscribe((s) => {
      seenLengths.push(s.events.length)
    })

    useEventStore.getState().addEvent({
      title: 'Existing',
      start: '2026-01-01T10:00:00.000Z',
      end: '2026-01-01T11:00:00.000Z',
      cohort: 'A',
      eventType: 'IAP',
      placement: 'Lobby',
      description: '',
    })

    useEventStore.getState().replaceCalendarWithImported([
      {
        id: 'new-1',
        title: 'Imported',
        start: '2026-02-01T10:00:00.000Z',
        end: '2026-02-01T11:00:00.000Z',
        cohort: 'B',
        eventType: 'Retention',
        placement: 'Shop',
        description: '',
        status: 'Draft',
      },
    ])

    unsub()
    expect(useEventStore.getState().events).toHaveLength(1)
    expect(useEventStore.getState().events[0]?.title).toBe('Imported')
    // Should not observe a transient "0 events" snapshot after having events, except initial
    const afterReplaceSnapshots = seenLengths.slice(seenLengths.indexOf(1))
    expect(afterReplaceSnapshots).not.toContain(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- run features/liveops/hooks/__tests__/useEventStore.import-flow.test.ts`  
Expected: FAIL with `replaceCalendarWithImported is not a function` (or TypeScript compile error if strict).

- [ ] **Step 3: Minimal implementation on the store**

Add to **`EventStore`** interface:

```typescript
replaceCalendarWithImported: (inputs: EventInput[]) => LiveOpsEvent[]
```

Implementation body: single `set((state) => { ... })` that (1) clears `events` / `filteredEvents` / `selectedEvent` like **`clearAllEvents`**, (2) maps **`inputs` → `LiveOpsEvent[]`** using the same field logic as **`addMultipleEvents`**, (3) pushes all new events, (4) sets **`lastUpdated`**. After `set`, call **`get().applyFilters()`** and **`get().saveToStorage()`** once (same pattern as **`addMultipleEvents`**).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- run features/liveops/hooks/__tests__/useEventStore.import-flow.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add features/liveops/hooks/useEventStore.ts features/liveops/hooks/__tests__/useEventStore.import-flow.test.ts
git commit -m "feat(store): add atomic replaceCalendarWithImported for batch import commit"
```

---

### Task 2: Import commit helpers (append vs replace)

**Files:**
- Create: `features/liveops/lib/import-commit.ts`
- Test: `features/liveops/lib/__tests__/import-commit.test.ts`

- [ ] **Step 1: Write failing tests for mappers + append/replace delegation**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  liveOpsEventsToEventInputs,
  commitImportAppend,
  commitImportReplace,
} from '../import-commit'
import type { LiveOpsEvent } from '../../types/events'

const mockAddMultiple = vi.fn()
const mockReplace = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('liveOpsEventsToEventInputs', () => {
  it('strips timestamps and keeps optional id', () => {
    const ev: LiveOpsEvent = {
      id: 'e1' as LiveOpsEvent['id'],
      title: 'T',
      start: '2026-01-01T10:00:00.000Z',
      end: '2026-01-01T11:00:00.000Z',
      cohort: 'C',
      eventType: 'IAP',
      placement: 'P',
      description: '',
      status: 'Draft',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    const inputs = liveOpsEventsToEventInputs([ev])
    expect(inputs[0]).toEqual({
      id: 'e1',
      title: 'T',
      start: ev.start,
      end: ev.end,
      cohort: 'C',
      eventType: 'IAP',
      placement: 'P',
      description: '',
      status: 'Draft',
    })
  })
})

describe('commit helpers', () => {
  it('commitImportAppend delegates to addMultipleEvents', () => {
    const events: LiveOpsEvent[] = []
    commitImportAppend(events, { addMultipleEvents: mockAddMultiple })
    expect(mockAddMultiple).toHaveBeenCalledTimes(1)
  })

  it('commitImportReplace delegates to replaceCalendarWithImported', () => {
    const events: LiveOpsEvent[] = []
    commitImportReplace(events, { replaceCalendarWithImported: mockReplace })
    expect(mockReplace).toHaveBeenCalledTimes(1)
  })
})
```

Fill **`events`** arrays with one minimal **`LiveOpsEvent`** so expectations are meaningful once implementation maps them.

- [ ] **Step 2: Run and expect failure**

Run: `npm test -- run features/liveops/lib/__tests__/import-commit.test.ts`  
Expected: module not found / function undefined.

- [ ] **Step 3: Implement `import-commit.ts`**

```typescript
import type { EventInput, LiveOpsEvent } from '../types/events'

export function liveOpsEventsToEventInputs(events: LiveOpsEvent[]): EventInput[] {
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    cohort: e.cohort,
    eventType: e.eventType,
    placement: e.placement,
    description: e.description,
    status: e.status,
    recurrence: e.recurrence,
  }))
}

interface AppendDeps {
  addMultipleEvents: (inputs: EventInput[]) => LiveOpsEvent[]
}

interface ReplaceDeps {
  replaceCalendarWithImported: (inputs: EventInput[]) => LiveOpsEvent[]
}

export function commitImportAppend(events: LiveOpsEvent[], deps: AppendDeps): void {
  deps.addMultipleEvents(liveOpsEventsToEventInputs(events))
}

export function commitImportReplace(events: LiveOpsEvent[], deps: ReplaceDeps): void {
  deps.replaceCalendarWithImported(liveOpsEventsToEventInputs(events))
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- run features/liveops/lib/__tests__/import-commit.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add features/liveops/lib/import-commit.ts features/liveops/lib/__tests__/import-commit.test.ts
git commit -m "feat(import): add commit helpers for deferred append replace"
```

---

### Task 3: `useCsvProcessor` deferred store mutation (TDD)

**Files:**
- Modify: `features/liveops/hooks/useCsvProcessor.ts`
- Create: `features/liveops/hooks/__tests__/useCsvProcessor.test.ts`

- [ ] **Step 1: Failing hook test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCsvProcessor } from '../useCsvProcessor'

const importFromCSV = vi.fn()
vi.mock('../useEventStore', () => ({
  useEventStore: (selector: (s: { importFromCSV: typeof importFromCSV }) => unknown) =>
    selector({ importFromCSV }),
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock('../lib/csv-processor', () => ({
  processCsvFile: vi.fn().mockResolvedValue({
    events: [],
    errors: [],
    totalRows: 1,
    successfulRows: 1,
  }),
  generateSampleCsv: vi.fn(),
}))

describe('useCsvProcessor (Approach A)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not call importFromCSV after successful parse', async () => {
    const file = new File(['a'], 't.csv', { type: 'text/csv' })
    const { result } = renderHook(() => useCsvProcessor())
    await act(async () => {
      await result.current.processFile(file)
    })
    expect(importFromCSV).not.toHaveBeenCalled()
  })
})
```

Adjust **`vi.mock`** path segments to match resolver (`@/hooks/...`) exactly as sibling tests do.

- [ ] **Step 2: Run — expect FAIL** (`importFromCSV` still called).

Run: `npm test -- run features/liveops/hooks/__tests__/useCsvProcessor.test.ts`

- [ ] **Step 3: Remove eager import + commit-oriented toasts from `processFile`**

Inside **`useCsvProcessor` `processFile`**, delete lines invoking **`importFromCSV(result)`** for success/partial-success branches. Replace import success toast copy with Validate-phase neutral messaging only if UX still shows something here; preferable: **only** Wizard Validate panel communicates row counts once Layout C owns the surface (coordinate with Task 6 to avoid duplicate toasts).

- [ ] **Step 4: Run — expect PASS**

Run: `npm test -- run features/liveops/hooks/__tests__/useCsvProcessor.test.ts`

- [ ] **Step 5: Commit**

```bash
git add features/liveops/hooks/useCsvProcessor.ts features/liveops/hooks/__tests__/useCsvProcessor.test.ts
git commit -m "feat(csv): defer useCsvProcessor store commit to wizard"
```

---

### Task 4: `useBatchImport` deferred `addMultipleEvents` (TDD)

**Files:**
- Modify: `features/liveops/hooks/useBatchImport.ts`
- Modify: `features/liveops/hooks/__tests__/useBatchImport.test.ts`

- [ ] **Step 1: Extend batch import test mock to observe store**

Replace `useEventStore` mock with:

```typescript
const mockAddMultipleEvents = vi.fn()
vi.mock('../useEventStore', () => ({
  useEventStore: (selector: (s: { addMultipleEvents: typeof mockAddMultipleEvents }) => unknown) =>
    selector({ addMultipleEvents: mockAddMultipleEvents }),
}))
```

Add new test **`COMPLETE` without store writes**:

```typescript
it('resolves COMPLETE without calling addMultipleEvents', async () => {
  MockWorker.mockClear()
  const { result } = renderHook(() => useBatchImport())
  // Simulate attach + importFile resolves when worker finishes — follow existing mock pattern:
  await act(async () => {
    const p = result.current.importFile(new File(['x'], 'f.csv'))
    const msgListener = mockWorker.addEventListener.mock.calls.find(
      ([evt]) => evt === 'message',
    )
    expect(msgListener).toBeDefined()
    const handler = msgListener![1]
    handler({
      data: {
        type: 'COMPLETE',
        payload: {
          events: [],
          errors: [],
          totalRows: 0,
          successfulRows: 0,
          performance: {
            totalTime: 1,
            averageEventsPerSecond: 0,
          },
        },
      },
    })
    await p.catch(() => undefined)
  })
  expect(mockAddMultipleEvents).not.toHaveBeenCalled()
})
```

*Note:* Align payload shape precisely with **`CompletePayload`**; if **`importFile` promise resolve path differs after refactor** (e.g. resolves before listener attached), refactor test harness to enqueue messages after subscription exactly once—preserve flakiness-free ordering.

- [ ] **Step 2: Run — expect FAIL** (calls today add multiple).

Run: `npm test -- run features/liveops/hooks/__tests__/useBatchImport.test.ts`

- [ ] **Step 3: Update `COMPLETE` branch**

Remove **`addMultipleEvents(...)`**. Build **`BatchImportResult`** with **`events: completeData.events`**, **`errors: completeData.errors`**, **`totalRows`**, **`successfulRows`**, **`success: true`**; resolve promise. Delay success toast until wizard Commit (caller passes toast) — remove inline success toast here or gate via option `deferCommitNotifications: true`; YAGNI: delete success toast here, show from wizard footer on Commit.

Ensure thrown storage errors still reject promise with **`updateState({ status: 'error' })`** paths only if validation fails before mapping—post-parse storage errors migrate to **`commitImportAppend`**/`Replace` try/catch in wizard.

- [ ] **Step 4: Expect PASS**

Run: `npm test -- run features/liveops/hooks/__tests__/useBatchImport.test.ts`

- [ ] **Step 5: Commit**

```bash
git add features/liveops/hooks/useBatchImport.ts features/liveops/hooks/__tests__/useBatchImport.test.ts
git commit -m "feat(batch-import): defer addMultipleEvents until manual commit"
```

---

### Task 5: Wizard state hook (`useImportWizard`)

**Files:**
- Create: `features/liveops/hooks/useImportWizard.ts`
- Create: `features/liveops/hooks/__tests__/useImportWizard.test.ts`

- [ ] **Step 1: Reducer tests (starter file)**

```typescript
import { describe, it, expect } from 'vitest'
import { importWizardReducer, initialImportWizardState } from '../useImportWizard'

describe('importWizardReducer', () => {
  it('starts on upload step with no pending payload', () => {
    expect(initialImportWizardState.step).toBe('upload')
    expect(initialImportWizardState.pending).toBeNull()
  })
})
```

Extend with cases: **`finishValidateWithSuccess`** → **`review`** when **`successfulRows > 0`**; **`total failure`** stays on **`validate`**; **`goBackFromReview`** clears **`pending`**; replace flow toggles **`replaceConfirmOpen`**.

Export **`initialImportWizardState`** and **`importWizardReducer(state, action)`** from `useImportWizard.ts` for deterministic testing.

- [ ] **Step 2: Implement hook + exported reducer**

State fields (minimum):

```typescript
export type ImportStep = 'upload' | 'validate' | 'review' | 'commit'

export interface ImportWizardState {
  step: ImportStep
  pending: PendingImport | null
  appendReplace: 'append' | 'replace'
  replaceConfirmOpen: boolean
}

export type PendingImport =
  | { kind: 'sync'; result: import('../types/events').CsvProcessingResult }
  | {
      kind: 'batch'
      result: import('../hooks/useBatchImport').BatchImportResult
    }
```

Expose **`dispatch`**, **`canAdvanceToReview`**, **`previewEvents` selector** (maps batch/sync to **`LiveOpsEvent[]`**).

- [ ] **Step 3: Tests pass**

Run: `npm test -- run features/liveops/hooks/__tests__/useImportWizard.test.ts`

- [ ] **Step 4: Commit**

```bash
git add features/liveops/hooks/useImportWizard.ts features/liveops/hooks/__tests__/useImportWizard.test.ts
git commit -m "feat(import): add wizard state reducer for Layout C steps"
```

---

### Task 6: Presentation components (step chrome, validation, review, replace dialog)

**Files:**
- Create: `features/liveops/components/ImportWizardShell.tsx`
- Create: `features/liveops/components/ImportStepHeader.tsx`
- Create: `features/liveops/components/ImportValidatePanel.tsx`
- Create: `features/liveops/components/ImportReviewPanel.tsx`
- Create: `features/liveops/components/ReplaceConfirmDialog.tsx`

- [ ] **Step 1: RTL tests — `ReplaceConfirmDialog` focus + destructive label**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReplaceConfirmDialog } from '../ReplaceConfirmDialog'

describe('ReplaceConfirmDialog', () => {
  it('calls onConfirm once when destructive action is activated', () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <ReplaceConfirmDialog
        open
        existingCount={3}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /replace all events/i }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run — expect FAIL** (missing component).

- [ ] **Step 3: Implement primitives**

Requirements pulled from spec:
- **`ImportValidatePanel`** — `role="region"` + `aria-labelledby` for summary counts; **`aria-live="polite"`** on aggregated counts.
- **`ImportReviewPanel`** — paginated `<table>` with `<caption>` summarizing imported rows.
- **`ReplaceConfirmDialog`** — uses `@/components/ui/alert-dialog` if available OR `@/components/ui/dialog` with **`variant="destructive"`** buttons; summarize existing count **`useEventStore.getState().events.length`** passed as prop.

- [ ] **Step 4: Run targeted tests**

Run: `npm test -- run features/liveops/components/__tests__/ReplaceConfirmDialog.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add features/liveops/components/Import*.tsx features/liveops/components/ReplaceConfirmDialog.tsx \
  features/liveops/components/__tests__/*.test.tsx
git commit -m "feat(import): add wizard panels and destructive replace dialog"
```

---

### Task 7: Integrate `CsvDropzone` + `BatchImportProgress` inside Layout C

**Files:**
- Modify: `features/liveops/components/CsvDropzone.tsx`
- Modify: `features/liveops/components/BatchImportProgress.tsx`

- [ ] **Step 1: Component test scaffolding — wizard visible after mock `processFile`**

Extend **`CsvDropzone.test.tsx`** mocks to include **`useImportWizard`** *or* test integrated surface by driving hooks props through updated **`CsvDropzone`** public callbacks—minimum snapshot assertion: **`Continue to review`** button appears after feeding **`mockUseCsvProcessor.result`**.

Example assertion fragment:

```typescript
mockUseCsvProcessor.result = { /* minimal success */ successfulRows: 1, errors: [], totalRows: 1, events: [] }
// After integration, simulate user advancing step — either export test helper toggle or fireEvent on new button
expect(screen.getByRole('button', { name: /continue to review/i })).toBeInTheDocument()
```

- [ ] **Step 2: Integration implementation highlights**

Wire loop:

1. **Upload**: `onDrop` → wizard `dispatch(parseStarted)`; threshold chooses **`processFile`** vs **`batchImport.importFile`**.
2. **Validate**: synchronous spinner text “Processing…” / **`BatchImportProgress`** embedded with cancel → **`batchImport.cancelImport()` + wizard reset (**spec:** never partial store update).
3. **Review**: Build **`previewEvents`** from **`pending`**; show append/replace if **`useEventStore(s => s.events.length) > 0`**.
4. **Commit footer**: **`try {`** `commitImportAppend` **or** `commitImportReplace` **} catch** toast destructive + remain on **`review`** with payload retained (**spec §7 Commit failure**).
5. Success: toast **`Import Completed`** (`N events`), call **`wizard.dispatch(reset)`**, close surface if dialog shell used.

- [ ] **Step 3: Run tests**

Run: `npm test -- run features/liveops/components/__tests__/CsvDropzone.test.tsx`

- [ ] **Step 4: Commit**

```bash
git add features/liveops/components/CsvDropzone.tsx features/liveops/components/BatchImportProgress.tsx \
  features/liveops/components/__tests__/CsvDropzone.test.tsx
git commit -m "feat(import): integrate Layout C wizard into CsvDropzone"
```

---

### Task 8: Accessibility verification

**Files:**
- Modify: `features/liveops/components/__tests__/a11y.test.tsx`

- [ ] **Step 1: Add wizard Review render helper**

```typescript
import { ImportWizardShell } from '../ImportWizardShell'

it('Import wizard review surface has no obvious axe violations', async () => {
  const { container } = render(
    <ImportWizardShell
      /* provide minimal props with one preview row and closed replace dialog */
    />,
  )
  const results = await axe(container)
  expect(results.violations).toHaveLength(0)
})
```

Fill props with in-memory fixtures (no real store persistence required if components accept injected data).

- [ ] **Step 2: Run**

Run: `npm test -- run features/liveops/components/__tests__/a11y.test.tsx`  
Expected: PASS

- [ ] **Step 3: Manual keyboard pass checklist (document in PR body, not code)**

- Tab order: Upload input → template download → batch cancel → validate continue → review table → append/replace radios → commit → (if replace) dialog confirm.
- Focus trap in dialog verified in Task 6.

- [ ] **Step 4: Commit**

```bash
git add features/liveops/components/__tests__/a11y.test.tsx
git commit -m "test(a11y): cover import wizard review surface with axe"
```

---

### Task 9: Quality gate (typecheck + full vitest)

- [ ] **Step 1: Typecheck**

Run: `npm run type-check`  
Expected: exit code 0

- [ ] **Step 2: Full test suite**

Run: `npm test -- run`  
Expected: all tests green

- [ ] **Step 3: Lint**

Run: `npm run lint`  
Expected: no new errors in touched files

- [ ] **Step 4: Commit** (if fixes only)

```bash
git add -p
git commit -m "chore: fix lint after batch import wizard"
```

---

## Self-review (spec coverage)

| Spec section | Task coverage |
|--------------|---------------|
| §3 Phases Upload–Commit | Tasks 5–7 |
| §4 Deferred commit / orchestration | Tasks 3–5, 7 |
| §5 Components table | Tasks 5–6, 7 (`BatchImportProgress`) |
| §6 Data flow | Tasks 2–4, 7 |
| §7 Error handling / cancel / commit failure | Tasks 4, 6, 7 |
| §8 Append / Replace | Tasks 1–2, 5–7 |
| §9 Testing + a11y | Tasks 1–4, 7–9 |
| §10 Integration points | Tasks 1–4, 7 |

**Placeholder scan:** No TBD/TODO strings above; each task names concrete files and commands.

**Type consistency:** `PendingImport` reuses `CsvProcessingResult` and `BatchImportResult`; `replaceCalendarWithImported` consumes `EventInput[]` via shared mapper.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-08-batch-import-ui.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks. Use **superpowers:subagent-driven-development**.

**2. Inline Execution** — run tasks in one session with checkpoints. Use **superpowers:executing-plans**.

---

## Orchestrator summary (for CreatePlan)

Implement Layout C batch import with **deferred Zustand writes**: add **`replaceCalendarWithImported`** (atomic clear+add), **`import-commit` helpers**, strip **`importFromCSV`** from **`useCsvProcessor` success path**, strip **`addMultipleEvents`** from **`useBatchImport` COMPLETE**, introduce **`useImportWizard` reducer**, build **Import*** UI panels + **ReplaceConfirmDialog**, integrate into **`CsvDropzone`** with embedded **`BatchImportProgress`**, expand Vitest for hooks/components, extend **`a11y.test.tsx`**. Verify with **`npm test -- run`** + **`npm run type-check`**.

## Files to touch (authoritative list)

- `features/liveops/hooks/useEventStore.ts`
- `features/liveops/lib/import-commit.ts` (new)
- `features/liveops/hooks/useCsvProcessor.ts`
- `features/liveops/hooks/__tests__/useCsvProcessor.test.ts` (new)
- `features/liveops/hooks/useBatchImport.ts`
- `features/liveops/hooks/__tests__/useBatchImport.test.ts`
- `features/liveops/hooks/useImportWizard.ts` (new)
- `features/liveops/hooks/__tests__/useImportWizard.test.ts` (new)
- `features/liveops/hooks/__tests__/useEventStore.import-flow.test.ts` (new)
- `features/liveops/lib/__tests__/import-commit.test.ts` (new)
- `features/liveops/components/ImportWizardShell.tsx` (new)
- `features/liveops/components/ImportStepHeader.tsx` (new)
- `features/liveops/components/ImportValidatePanel.tsx` (new)
- `features/liveops/components/ImportReviewPanel.tsx` (new)
- `features/liveops/components/ReplaceConfirmDialog.tsx` (new)
- `features/liveops/components/__tests__/ReplaceConfirmDialog.test.tsx` (new)
- `features/liveops/components/CsvDropzone.tsx`
- `features/liveops/components/BatchImportProgress.tsx`
- `features/liveops/components/__tests__/CsvDropzone.test.tsx`
- `features/liveops/components/__tests__/a11y.test.tsx`
- Optional: `features/liveops/lib/csv-errors-export.ts` (new) if deduplicating `downloadErrorReport`

## Open questions

1. **Shell modality:** Spec allows modal, drawer, or panel—product must pick one for `LiveOpsDashboard` embedding (default plan: keep inline card expansion first; wrap in Radix `Dialog` only if designers require modal).
2. **`importFromCSV` long-term:** Current implementation **replaces** `events` with `result.events` (not append). Confirm whether any other caller still needs that behavior; if yes, keep exported but unused by wizard, or rename to `replaceFromCsvResult` in a follow-up PR.
3. **Batch worker success metrics toast:** Moving toast to Commit loses immediate “worker finished” feedback—decide if Validate step shows non-toast inline **“Ready for review”** banner (recommended) vs lightweight neutral toast.
4. **Concurrent imports:** Out of scope per spec; confirm dashboard disallows second file drop while wizard active (disable dropzone when `step !== 'upload'` or `isAnyProcessing`).
