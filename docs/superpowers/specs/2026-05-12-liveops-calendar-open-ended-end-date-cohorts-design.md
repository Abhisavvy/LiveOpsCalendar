## LiveOps Calendar: Open-Ended End Date + Cohort Dropdowns

### Goal
Add support for **open-ended events** (no end date) and replace the **cohort input** with a fixed multi-select list. Open-ended events must render on the calendar while preserving true `null` storage for end dates.

### Non-Goals
- No changes to recurrence rules beyond what already exists.
- No schema expansion beyond `end` being nullable (no `neverEnds` flag).
- No new import formats in this pass (CSV import remains start + duration).

### Decisions
- **End date = `null`** represents “Never ends.”
- **Calendar rendering** uses a far-future **display end** for FullCalendar while keeping persisted `end = null`.
- **Cohort values** are restricted to:
  - `All`
  - `D0`
  - `D1`
  - `D2-D7`
  - `D7-D14`
  - `D14-D30`
  - `D30-D60`
  - `D60-D120`
  - `D120+`
- **Multi-cohort:** events can include multiple cohorts; **All** is mutually exclusive.
- **Filtering semantics:** cohort filters use **AND** matching (event must include all selected cohorts). Events with `All` match any cohort filter.

### Data Model & Validation
- **`LiveOpsEvent.end`** becomes nullable: `string | null`.
- **`EventInputSchema`** accepts `end: null` only when “Never ends” is enabled in the form.
- **`LiveOpsEvent.cohort`** becomes `string[]`, validated against the canonical list.
- **All exclusivity:** when `cohort` includes `All`, it must be `['All']` only.
- **Storage load** must allow `end: null` without filtering out events and migrate legacy string cohort values to arrays.

### UX / UI Changes
- **Event detail sheet**
  - Add a **“Never ends”** toggle next to End Date & Time.
  - When enabled: disable the end input and set `end = null`.
  - When disabled: restore a default end (`start + 1d`).
- **Cohort input**
  - Replace freeform text input with **multi-select checkboxes** using the canonical list.
  - Selecting **All** clears any other cohorts; selecting others clears **All**.
- **Calendar event rendering**
  - Show a **“Never”** indicator in the subtitle when `end = null`.
  - Show cohorts as a **comma-separated list**.
  - A11y labels include “Never ends” for open-ended events.

### Calendar / Filtering Behavior
- **Display end**: map `end = null` to a far-future date (e.g. `2100-01-01T00:00:00Z`) for FullCalendar.
- **Drag behavior**: open-ended events update **start only**, preserving `end = null`.
- **Date range filters**: treat `end = null` as far-future for overlap checks so open-ended events remain visible.
- **Cohort filters**: AND semantics; events with `['All']` match any filter.

### CSV Export / Import
- **Export**: `Ending Date` / `End Date` / `End Date Time` outputs `Never` when `end = null`.
- **Duration calculation**: skip for open-ended events.
- **Export (cohort)**: comma-separated list for multiple cohorts; `All` when exclusive.
- **Import**: parse comma-separated cohorts to arrays; normalize `All` to `['All']`.

### Testing (TDD)
- `EventInputSchema` accepts `end = null` when “Never ends” toggle is on.
- `EventDetailSheet` toggling behavior sets `end = null` and disables input.
- `useCalendarEvents` maps `end = null` to display end, keeps `liveOpsData.end = null`.
- `useEventStore.applyFilters` handles `end = null` in date-range overlap.
- Export utils output `Never` when `end = null`.
- Schema enforces cohort array + All exclusivity.
- Form enforces multi-select + All exclusivity.
- Cohort filter uses AND semantics + All matches any.
- Export/import normalize cohort arrays.

### Risks & Mitigations
- **Calendar range expansion** could create long events: mitigated by display-only sentinel end.
- **Export/summary calculations** may break on nulls: explicit handling in export + stats.

### Success Criteria
- Users can create and edit events with **no end date**.
- Open-ended events appear correctly on the calendar and in filters.
- Cohort selection is restricted to the defined dropdown options.
