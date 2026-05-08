# Batch Import UX Design Spec

**Status:** Approved  
**Date:** 2026-05-08  
**Layout:** C (staged, single primary surface with explicit step progression)  
**Approach:** A (client-side pipeline with a mandatory review gate before store mutation)

---

## 1. Overview

This document specifies the user experience and front-end architecture for importing Live Ops events from CSV files, with emphasis on **large files** processed through the batch (Web Worker) path. **Layout C** presents import as a linear, four-phase flow inside one cohesive surface (modal, drawer, or dedicated panel—implementation detail) so operators always know where they are. **Approach A** decouples **parsing/validation** from **committing** to the event store: parsed events and diagnostics are held in import-local state until the user explicitly confirms **Append** or **Replace**, reducing accidental data loss and matching operational expectations for bulk edits.

The spec aligns with existing hooks and components (`CsvDropzone`, `useCsvProcessor`, `useBatchImport`, `useEventStore`) while defining the target UX and integration contracts those modules should satisfy after implementation.

---

## 2. Goals

- Guide operators through **Upload → Validate → Review → Commit** with clear labels and recovery paths.
- Surface **row-level and file-level errors** before any store write; allow download or copy of error summaries where useful.
- Support **large CSVs** via the worker-backed batch path without blocking the UI thread.
- Provide an explicit **append vs replace** decision when the calendar already contains events.
- Reuse **single-file small imports** (`useCsvProcessor`) and **batch imports** (`useBatchImport`) behind one coherent UI, with size/strategy routing invisible or explained in copy.
- Preserve **cancel** semantics during long-running batch work; never leave the store in a half-updated state from a cancelled import.

### Non-goals

- Server-side ingestion, multi-file ZIP imports, or scheduled imports.
- Automated conflict resolution per event ID beyond what validation rules already define.
- Changing core CSV column schema or worker parsing algorithms (unless a follow-up spec requires it).
- Persisting draft imports across browser sessions (refresh discards in-flight import state unless explicitly added later).

---

## 3. User Flow

### Phase 1 — Upload

- User selects or drags a `.csv` file (`CsvDropzone`).
- System shows file name, size, and optional template hint (download sample).
- Routing: under the batch threshold, queue for synchronous parse path; at or over threshold, hand off to batch worker initialization. UX shows “Preparing import…” while initializing.

### Phase 2 — Validate

- Parsing runs (main thread for small files; worker for batch).
- Outcomes:
  - **All rows valid:** advance automatically or via primary “Continue to review.”
  - **Partial success:** list error count, sample messages, row references; user may still proceed to review **successful rows only** or abort to fix the file.
  - **Total failure:** remain on validate; offer re-upload; no store changes.
- Cancel: abort worker / clear local import state; dropzone returns to idle.

### Phase 3 — Review

- Display **summary**: total rows, valid events count, skipped/failed rows, inferred date range, cohort/event type distribution (compact, optional secondary panel).
- Show **preview table** (paginated or virtualized) of events that **would** be committed.
- If the store is non-empty, show **Append vs Replace** affordance (see §8). Default: **Append** with clear copy about impact of **Replace**.
- Secondary actions: “Back” to upload (discards parsed payload), “Cancel” (same as abort).

### Phase 4 — Commit

- On confirm, call the appropriate store mutation:
  - **Append:** merge new events (existing `addMultipleEvents` / `importFromCSV`-style merge semantics).
  - **Replace:** `clearAllEvents` (or targeted clear per product decision) followed by add of imported events—**only** after explicit confirmation with destructive styling.
- Success: toast + summary; close import surface; optional scroll/focus to first imported event.
- Failure (rare, e.g., storage error): show error state; store unchanged; offer retry.

---

## 4. Architecture

- **Presentation:** Layout C uses a **step model** (current step index + completed steps) driving headers, progress indicator, and enabled actions. All steps share one import session object in memory.
- **Orchestration:** A thin **import controller** (could live in `CsvDropzone` or a dedicated `useBatchImportFlow` hook) coordinates:
  - which parser path is active;
  - transition between Upload / Validate / Review / Commit;
  - holding `BatchImportResult` / `CsvProcessingResult` until Commit.
- **Execution:**
  - Small files: `useCsvProcessor.processFile` produces `CsvProcessingResult`; **Approach A** requires **not** calling `importFromCSV` until the user confirms Commit (spec change from current eager import—see integration).
  - Large files: `useBatchImport.importFile` runs the worker; **Approach A** requires **deferring** `addMultipleEvents` until Commit, or splitting worker completion into “parsed payload available” vs “committed” (implementation detail; see §10).
- **State:** Zustand `useEventStore` remains the source of truth for live events; import preview data lives in React state (or a small zustand slice scoped to import) until Commit.

---

## 5. Components

| Responsibility | Notes |
|----------------|--------|
| **CsvDropzone** | Entry point: dropzone, template download, routes to small vs batch path, mounts step UI (Layout C). |
| **Batch import progress** (`BatchImportProgress` or successor) | Validate phase for batch: progress, ETA, cancel; may compress into a row under the stepper during processing. |
| **Import stepper / header** | Shows Upload → Validate → Review → Commit; indicates current and completed steps. |
| **Validate summary** | Counts, errors list, link to export errors as CSV/text. |
| **Review preview** | Table of pending `LiveOpsEvent` objects; pagination/virtualization for large sets. |
| **Append / Replace dialog** | Modal or inline destructive confirmation for Replace; persists choice for the session only. |
| **Commit footer** | Primary “Import N events” / disabled states with reasons. |

---

## 6. Data Flow

1. **File in** → `File` object + metadata in local import state.
2. **Parse** → `CsvProcessingResult` or worker `CompletePayload` mapped to:
   - `events: LiveOpsEvent[]` (or `EventInput[]`) for preview;
   - `errors: CsvProcessingError[]`;
   - `totalRows`, `successfulRows`.
3. **Review** → user inspects derived preview; no store writes.
4. **Commit** → **Append:** `addMultipleEvents` / `importFromCSV(result)`; **Replace:** clear then add (atomic from the user’s perspective—implement with a single transactional helper if needed).
5. **Telemetry (optional):** durations and row counts logged for ops visibility (non-blocking).

---

## 7. Error Handling

| Stage | Behavior |
|-------|-----------|
| **Rejected file type** | Dropzone rejection message; no phase advance. |
| **Worker unavailable** | Blocking error on batch path; suggest smaller file or different browser; remain on Upload. |
| **Parse / validation errors** | Aggregate by code/message; cap visible list with “show all”; invalid rows never enter preview unless explicitly supported by product (default: exclude). |
| **Partial batch failure** | Progress reflects failed rows; Review shows only valid rows; copy explains discrepancy. |
| **User cancel** | Abort signal / worker terminate; reset import session; toast optional. |
| **Commit failure** | Surface storage or invariant errors; retain preview payload for retry; do not partially apply Replace unless the clear and add are wrapped so rollback is implicit. |

---

## 8. Append / Replace Prompt Behavior

- **When:** Display at Review when `useEventStore` reports `events.length > 0`.
- **Append (default):** Add imported events alongside existing rows; duplicates by ID resolved per existing store rules (document behavior in implementation if deduplication exists).
- **Replace:** Requires **two-step confirmation**: choice in Review + confirm dialog summarizing destructive action (“This will remove all N existing events”).
- **Empty store:** Omit prompt; Commit maps to Append semantics only.
- **Session scope:** Choice does not persist as a user preference unless product adds settings later.

---

## 9. Testing Strategy

- **Unit:** Step reducer / state machine (if extracted); mapping from worker payload to preview model; append vs replace commit helpers.
- **Hook tests:** `useCsvProcessor` and `useBatchImport` updated for deferred commit—assert no store mutation until Commit; assert cancel clears pending data.
- **Component:** `CsvDropzone` integration tests for step transitions, disabled Commit until valid preview, Replace confirmation flow.
- **Worker / E2E (optional):** Large fixture CSV for progress messages; playwright/cypress smoke for happy path and cancel.
- **Accessibility:** Keyboard order through steps, dialog focus trap, live regions for validation summary counts.

---

## 10. Integration Points

### `CsvDropzone`

- Owns or composes Layout C shell; invokes `useCsvProcessor` and `useBatchImport`; passes shared import session props to child panels.
- Today: thresholds batch vs sync and shows `BatchImportProgress`. Target: unify under the four-phase stepper and deferred commit.

### `useCsvProcessor`

- Parses via `processCsvFile`; exposes `processFile`, `result`, `error`, `isProcessing`.
- Target (Approach A): **remove eager `importFromCSV(result)` from success paths**—return `CsvProcessingResult` to the orchestrator for Review; Commit step calls `importFromCSV(result)` once.

### `useBatchImport`

- Manages worker lifecycle, `BatchImportStatus`, progress, `importFile`, `cancelImport`, `resetState`.
- On `COMPLETE`, today calls `addMultipleEvents` immediately. Target: either emit **parsed result** into import session and commit later, or add `previewImportFile` vs `commitImport` APIs while keeping worker logic unchanged.

### `useEventStore`

- **`importFromCSV(result)`** — bulk merge from `CsvProcessingResult` (small-file commit).
- **`addMultipleEvents`** — used for batch commit after review.
- **`clearAllEvents`** — used for Replace path before re-adding imported events.
- **Read `events.length`** — drives append/replace prompt visibility.

---

## Document history

| Version | Date | Note |
|---------|------|------|
| 1.0 | 2026-05-08 | Initial approved spec (Layout C, Approach A). |
