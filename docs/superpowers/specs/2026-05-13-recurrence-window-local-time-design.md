## LiveOps Calendar: Recurrence Window (Past Year) + Local-Time Matching

### Goal
Ensure recurring events created in the past still render on their past dates, while expanding the recurrence window to include **the past 12 months** and **the next 24 months**. Recurrence matching must align with the **local calendar** (weekday rules reflect what users select in the UI).

### Non-Goals
- No changes to the recurrence UI or schema structure.
- No new recurrence rule types or dependencies (e.g., no RRULE introduction).
- No changes to non-recurring event rendering.

### Decisions
- **Recurrence window:** expand occurrences from **start of the month 12 months ago** through **end of the month 24 months ahead**.
- **Local-time matching:** weekday and interval checks run in **local time** to align with the user’s selections.
- **Anchoring:** weekly interval rules remain anchored to the **event’s start week**, not the calendar week.
- **Limits preserved:** `until` and `count` still cap occurrences.

### Calendar / Recurrence Behavior
- Weekly recurrences with days (e.g., Mon–Sat) must generate occurrences for past dates (e.g., May 11–12) even if the event start date is before today.
- Alternate-week recurrences (interval = 2) are computed based on the event’s start week in local time.
- Occurrence generation uses the event’s start time to keep consistent daily timing.

### Implementation Notes
- Update `useCalendarEvents` to compute:
  - `rangeStart = now.startOf('month').subtract(12, 'month')`
  - `rangeEnd = now.startOf('month').add(24, 'month').endOf('month')`
- Update recurrence expansion utilities to:
  - Use local `dayjs(...)` (not `dayjs.utc(...)`) for day comparisons and weekday checks.
  - Keep ISO output for occurrences (`toISOString`) so FullCalendar continues to work with `timeZone: 'local'`.
  - Preserve existing duration handling for open-ended events and `end = null`.

### Testing (TDD)
- `useCalendarEvents` generates occurrences for dates **before today** when within the past-year window.
- Weekly interval (`interval = 2`) remains anchored to the event’s start week.
- Days-of-week selection (Mon–Sat) matches local weekday values.

### Risks & Mitigations
- **Timezone skew:** local vs UTC mismatch can shift weekdays. Mitigated by keeping all matching in local time.
- **Performance:** larger window yields more occurrences. Mitigated by fixed, bounded window (36 months total).

### Success Criteria
- Events created in the past show on their historical dates (e.g., May 11–12) with weekly/alternate-week recurrence.
- Recurring events respect local weekday selection and interval.
- No regressions to non-recurring event rendering.
