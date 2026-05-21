## Progress (canonical scratchpad)

### State
- **2026-05-20 — Status dropdown restriction:** Edit/Create only show Draft/Active; Scheduled/Ended normalize to Active in edit form; tests: `vitest run features/liveops/components/__tests__/EventDetailSheet.test.tsx` and `vitest run features/liveops/types/__tests__/events.test.ts`.
- **2026-05-14 — GitHub push success:** cleaned history and pushed `main` to `origin` (Abhisavvy/LiveOpsCalendar). Branch now tracks `origin/main`.
- **2026-05-14 — Git history cleanup:** rewrote history to drop tracked `node_modules`, `.next`, and `out` artifacts to satisfy GitHub size limits.
- **2026-05-14 — GitHub auth complete:** finished `gh auth login --web` for `github.com` (logged in as Abhisavvy).
- **2026-05-14 — GitHub auth pending:** started `gh auth login --web` for `github.com` (device flow). Awaiting browser completion before retrying push.
- **2026-05-14 — GitHub push blocked:** added `origin` for `Abhisavvy/LiveOpsCalendar` and attempted `git push -u origin main`, but push failed twice with **HTTP 408** (remote timeout). Needs retry or alternate auth/transport.
- **2026-05-14 — GitHub CLI setup:** installed a local `gh` binary under `.tools/` (Homebrew install lacked permissions). `gh auth status` shows **not logged in**; requires `gh auth login` or a PAT to proceed.
- **2026-05-14 — Default CSV filters:** added Player Type + OS columns to default export mapping; test: `vitest run features/liveops/lib/__tests__/export-utils.test.ts`.
- **2026-05-14 — Dev server restart:** restarted `next dev -H 127.0.0.1` with Watchpack polling on **http://127.0.0.1:3000** for latest CSV/player filter changes.
- **2026-05-14 — Player filter + CSV export:** normalized playerType filtering and added recurrence fields to default export; tests: `vitest run features/liveops/hooks/__tests__/useEventStore.test.ts features/liveops/lib/__tests__/export-utils.test.ts`.
- **2026-05-13 — Recurrence repro (post-restart):** Ticketmania (weekly Tue/Wed/Fri/Sat) and Game Master (daily count=3) both render multiple occurrences in month + list views after dev server restart.
- **2026-05-13 — Recurrence utils verification:** `vitest run features/liveops/lib/__tests__/recurrence-utils.test.ts features/liveops/hooks/__tests__/useCalendarEvents.test.ts` passes after recurrence expansion implementation.
- **2026-05-13 — Recurrence TDD:** added recurrence expansion tests; `vitest run features/liveops/lib/__tests__/recurrence-utils.test.ts features/liveops/hooks/__tests__/useCalendarEvents.test.ts` fails (recurrence utils missing + no expansion in calendar).
- **2026-05-13 — Dev server restart:** restarted `next dev -H 127.0.0.1` with Watchpack polling on **http://127.0.0.1:3000**.
- **2026-05-13 — Placement multi-select verification:** `vitest run` for placement-related suites (events, EventDetailSheet, store/filters, CSV/export, a11y) passes under Node v22.22.2.
- **2026-05-13 — Placement UI TDD:** added EventDetailSheet placement tests; `vitest run features/liveops/components/__tests__/EventDetailSheet.test.tsx` fails (placement still rendered as text input).
- **2026-05-13 — Placement multi-select TDD:** updated placement tests in `events.test.ts`; `vitest run features/liveops/types/__tests__/events.test.ts` fails as expected (schema still string-based + normalizePlacements missing).
- **2026-05-13 — Dev server restart (main):** restarted with `WATCHPACK_POLLING=true` after clearing orphaned Next.js listeners; `next dev -H 127.0.0.1` now returns **200** on `/` at **http://127.0.0.1:3000**.
- **2026-05-13 — Calendar client tiles:** applied explicit client background + event border overrides (`--fc-event-*` + `!important`) so Kinoa stays translucent and event-type left accents render; test: `npm test -- run features/liveops/components/__tests__/CalendarEventContent.test.tsx`.
- **2026-05-13 — Tailwind safelist (FullCalendar):** added `fc-*` structural classes to `tailwind.config.js` so `.fc-event` and related rules are not purged; restarted dev server; test: `npm test -- run features/liveops/components/__tests__/CalendarEventContent.test.tsx`.
- **2026-05-13 — DateTimePicker layout:** added `flex-wrap` + min widths so time + meridiem controls wrap instead of overlapping; test: `node node_modules/vitest/dist/cli.js run --dir components/ui/__tests__ --exclude "**/.worktrees/**"`.
- **2026-05-13 — EventDetailSheet date range:** stacked date range on small widths (`grid-cols-1` with `sm:grid-cols-2`) and added `min-w-0` to prevent overlap; test: `node node_modules/vitest/dist/cli.js run --dir features/liveops/components/__tests__ --exclude "**/.worktrees/**"`.
- **2026-05-13 — DateTimePicker controls:** split date row and time/meridiem row to eliminate overlap and ensure AM/PM visibility; test: `node node_modules/vitest/dist/cli.js run --dir components/ui/__tests__ --exclude "**/.worktrees/**"`.
- **2026-05-13 — Dev server restart (layout update):** restarted `next dev -H 127.0.0.1` to pick up DateTimePicker row layout changes; running on **http://127.0.0.1:3000**.
- **2026-05-13 — Dev server cleanup:** stopped the older recovery dev server on **3001** to avoid stale UI while validating layout changes.
- **2026-05-13 — Dev server (recovery worktree):** **RUNNING** ✓ `npm run dev` on **http://localhost:3001** (Node v22.22.2). Warning noted: Turbopack detected multiple lockfiles.
- **2026-05-13 — Dev server restart (main):** `next dev -H 127.0.0.1` now **RUNNING** on **http://127.0.0.1:3000** (Node v22.22.2).
- **2026-05-13 — Worktree setup (liveops-12h-time-inputs):** `npm install` failed with **ERESOLVE** (eslint 9 vs @eslint/js 10 peer). Using existing checked-out `node_modules` for now; will validate with tests.
- **2026-05-13 — Worktree baseline tests:** `npm test -- run` failed (missing vitest chunk in `node_modules` after install failure). Need dependency reinstall before baseline passes.
- **2026-05-13 — Worktree dependency install (legacy peer deps):** `npm install --legacy-peer-deps` succeeded; warning for Node engine mismatch (repo expects Node 22, current Node 25.9.0).
- **2026-05-13 — Toolchain alignment:** switched worktree shell to **Node v22.22.2 / npm v10.9.7** via `nvm use 22` for test compatibility.
- **2026-05-13 — Test runner status:** `npm test -- run` still errors with **ERR_MODULE_NOT_FOUND** on `vitest/dist/chunks/cac.DJJmV0dT.js` (file exists; direct `node node_modules/vitest/dist/cli.js --version` works). Direct `vitest run` executes but picks up tests inside `.worktrees/` and fails broadly (27 failed).
- **2026-05-13 — TDD (date-utils):** added 12h parsing + time/meridiem formatting tests; `vitest run features/liveops/lib/__tests__/date-utils.test.ts` fails as expected (missing helpers + AM/PM parsing).
- **2026-05-13 — Date utils implementation:** added 12h time helpers + AM/PM parsing; `vitest run features/liveops/lib/__tests__/date-utils.test.ts` now passes.
- **2026-05-13 — DateTimePicker TDD attempt:** targeted vitest runs are still resolved at repo root, causing `.worktrees/` pollution and missing `@testing-library/user-event` (not in `node_modules`). Need to install user-event and keep tests scoped.
- **2026-05-13 — Worktree cleanup attempt:** `rm -rf node_modules` failed due to `.claude/settings.local.json` permission errors in dependency folders.
- **2026-05-13 — Worktree cleanup:** removed `node_modules` with elevated permissions to allow clean reinstall.
- **2026-05-13 — Worktree reinstall:** `npm install --legacy-peer-deps` completed (691 packages); warnings for deprecated packages and audit vulnerabilities noted.
- **2026-05-13 — Test dependency:** added `@testing-library/user-event` dev dependency for DateTimePicker tests.
- **2026-05-13 — TDD (DateTimePicker):** `vitest run components/ui/__tests__/DateTimePicker.test.tsx` now runs in worktree and fails as expected (missing date/time/meridiem inputs).
- **2026-05-13 — DateTimePicker implementation:** split date/time inputs + AM/PM select; added jsdom pointer-capture + scrollIntoView stubs; `vitest run components/ui/__tests__/DateTimePicker.test.tsx` passes.
- **2026-05-13 — TDD (RecurrenceConfig summary):** added local 12h until summary test; `vitest run features/liveops/components/__tests__/RecurrenceConfig.test.tsx` fails as expected.
- **2026-05-13 — RecurrenceConfig summary:** updated until summary to local 12h format; `vitest run features/liveops/components/__tests__/RecurrenceConfig.test.tsx` passes.
- **2026-05-13 — EventDetailSheet regression:** `vitest run features/liveops/components/__tests__/EventDetailSheet.test.tsx` passes after DateTimePicker changes.
- **2026-05-13 — Calendar styling verification:** confirmed `client-*` class mapping, event-type dot + left border, and legend swatches remain intact; no code changes needed.
- **2026-05-13 — Focused verification:** `vitest run features/liveops/lib/__tests__/date-utils.test.ts components/ui/__tests__/DateTimePicker.test.tsx features/liveops/components/__tests__/EventDetailSheet.test.tsx features/liveops/components/__tests__/RecurrenceConfig.test.tsx` passes.
- **2026-05-13 — Full test run:** `npm test -- run` passes (34 files, 261 tests).
- **2026-05-13 — Worktree status check:** modifications staged for time input changes, test setup stubs, and user-event dependency (see git status).
- **2026-05-13 — Base branch lookup:** merge-base found for `main` (commit `912b5a0a`).
- **2026-05-13 — LiveOps recovery sweep + model updates:** **COMPLETED** ✓ Restored **player type**, **OS type**, **client** fields and **new event types** (Rolling Retention + Engagement), added normalization helpers, and hardened storage load/import validation for nullable `end` + malformed cohorts. Tests: `npm test -- run features/liveops/types/__tests__/events.test.ts features/liveops/lib/__tests__/storage.test.ts`.
- **2026-05-13 — Audience filter semantics:** **COMPLETED** ✓ Cohort filtering now **ANDs** selections and treats **All** as a wildcard (event + filter), player/OS filters treat **All** as a wildcard, UI filters + chips updated, and filter stats honor `All` as inactive. Tests: `npm test -- run features/liveops/hooks/__tests__/useEventStore.test.ts features/liveops/hooks/__tests__/useEventFilters.test.ts`.
- **2026-05-13 — Event detail sheet fields/actions:** **COMPLETED** ✓ Duplicate/delete moved to the top of edit sheet; **Player Type**, **OS Type**, **Client** selects added with defaults. Tests: `npm test -- run features/liveops/components/__tests__/EventDetailSheet.test.tsx`.
- **2026-05-13 — DateTimePicker memory:** **COMPLETED** ✓ DateTimePicker now reopens to the **last clicked month**, and EventDetailSheet/RecurrenceConfig use the custom picker (no `datetime-local`). Tests: `npm test -- run components/ui/__tests__/DateTimePicker.test.tsx features/liveops/components/__tests__/EventDetailSheet.test.tsx features/liveops/components/__tests__/RecurrenceConfig.test.tsx`.
- **2026-05-13 — CSV recurrence + audience columns:** **COMPLETED** ✓ Export/import now includes **explicit recurrence columns** and **Player/OS/Client**; sample CSV updated; worker batch parsing aligned with main path. Tests: `npm test -- run features/liveops/lib/__tests__/export-utils.test.ts features/liveops/lib/__tests__/csv-processor.test.ts features/liveops/lib/__tests__/csv-import-fields.test.ts features/liveops/workers/__tests__/csv-batch-processor.test.ts features/liveops/hooks/__tests__/useBatchImport.test.ts`.
- **2026-05-13 — Client styling + event type legend:** **COMPLETED** ✓ Event type dots updated for new types; **Kinoa** cards are translucent, **In-game** cards are solid; legend updated for types + clients; status styling scoped to badges. Tests: `npm test -- run features/liveops/hooks/__tests__/useCalendarEvents.test.ts features/liveops/lib/__tests__/calendar-present.test.ts features/liveops/components/__tests__/a11y.test.tsx`.
- **2026-05-13 — Final verification:** **COMPLETED** ✓ Full test run: `npm test -- run` (34 files, 256 tests) under **Node v22.22.2** / **npm v10.9.7**.
- **2026-05-13 — Recurrence until datetime:** **COMPLETED** ✓ “Until” now uses the DateTimePicker (date+time), the summary shows the timestamp, and recurrence expansion stops at the exact `until` time. Tests: `npm test -- run features/liveops/components/__tests__/RecurrenceConfig.test.tsx features/liveops/lib/__tests__/recurrence-utils.test.ts`.
- **2026-05-13 — Event type dot indicator:** **COMPLETED** ✓ Replaced the event-type icon with a **colored dot** in `CalendarEventContent` and added `.event-type-dot` styling in `app/globals.css`. Verified: `npm test -- run features/liveops/components/__tests__/CalendarEventContent.test.tsx`.
- **2026-05-13 — Calendar contrast:** **COMPLETED** ✓ Boosted **day number/header** contrast (header background now matches calendar surface), softened **other-month** day opacity, shifted **event titles to neutral foreground** with **type-colored icon accents**, and strengthened subtitle text. Added high-specificity header overrides and `--fc-neutral-bg-color` alignment to prevent white header bleed. Tests updated and passing: `npm test -- run features/liveops/components/__tests__/CalendarEventContent.test.tsx`.
- **2026-05-12 — Calendar open-ended rendering (Task 3):** **Display end** for `end: null` via `OPEN_ENDED_EVENT_END`; **`getEventDropUpdate`** preserves **null end** on drag; **`formatCohorts`** in calendar props + **Never** chip in event pills; **`formatEventA11yLabel`** adds cohort string + **Never ends** when open-ended. Tests: `calendar-utils`, `useCalendarEvents`, `CalendarEventContent`.
- **2026-05-12 — Event detail sheet (Task 2):** **Never ends** toggle (nullable `end` + disabled end datetime) and **cohort multi-select** with **`COHORT_OPTIONS`**, **`All` exclusivity**, and **`normalizeCohorts` on submit/reset**. Tests: `features/liveops/components/__tests__/EventDetailSheet.test.tsx`.
- **2026-05-12 — LiveOps schemas (Task 1):** `LiveOpsEvent` / `EventInput` cohorts are **multi-select arrays** with **`All` exclusive**; **`end` is nullable** for open-ended events; added **`normalizeCohorts`**, **`formatCohorts`**, **`COHORT_OPTIONS`**, **`EventFormSchema`** (`neverEnds` + end validation). Tests: `features/liveops/types/__tests__/events.test.ts`.
- **2026-05-12 — LiveOps calendar feedback:** intake captured for **end date = never** option and **cohort dropdowns**; spec drafted, pending review.
- **2026-05-12 — LiveOps calendar spec:** draft ready at `docs/superpowers/specs/2026-05-12-liveops-calendar-open-ended-end-date-cohorts-design.md`.
- **2026-05-12 — LiveOps calendar plan:** updated for multi-cohort at `docs/superpowers/plans/2026-05-12-liveops-calendar-open-ended-end-date-cohorts.md`.
- **2026-05-12 — Worktree prep:** added `.worktrees` to `.gitignore` (uncommitted) before creating an isolated worktree.
- **2026-05-12 — Template downloads:** **WORKING / validated** ✓ Guided **Select → Preview → Download** path delivers usable **CSV and Excel** files; prior failure track is closed. Remaining active work is **custom recurrence only** (see Current objective).
- **2026-05-12 — Custom recurrence basis:** **COMPLETED** ✓ Added a **custom basis selector** (weekly/monthly), **days-of-week** selection for weekly basis, **monthly pattern** controls, and **combined summary** output while allowing empty optional selections. **Tests/lint/type-check** all pass.
- **2026-05-12 — Prior feedback (scoped forward):** **Custom recurrence** must support **days-of-week** and **monthly basis** patterns with **optional sub-selections** where the model allows empty or partial choices (aligned to decisions below).
- **2026-05-12 — Example templates modal launcher:** **COMPLETED** ✓ Replaced the inline template grid with a **compact “Browse example templates” button** that opens a **guided modal** (Select → Preview → Download). **Template preview** now lives inside the modal (no nested dialogs). **CsvDropzone** shows the launcher instead of the grid. **Tests updated** (TemplateSelector + CsvDropzone), **`npm test -- run`**, **`npm run lint`**, and **`npm run type-check`** all pass.
- **2026-05-11 — Next.js experiments banner removal:** **COMPLETED** ✓ Removed **`experimental.optimizePackageImports`** block from **`next.config.js`**. **Verification successful:** **`npm run dev`** → clean startup (no experiments banner), **`npm run build-clean`** → clean output, **`npm run build`** → clean output, **all tests pass** (22 files, 166 tests), **type-check + lint pass**. **Only remaining warnings:** npm `devdir` (Cursor sandbox) + Node `--localstorage-file` (expected under current toolchain). **Build output now completely clean** of Next.js experiments banners.
- **2026-05-11 — build warning cleanup (implementation):** **Plan approved**; **Node 22 pin + `build-clean` wrapper added** (`.nvmrc`, `.node-version`, `package.json` engines + `@types/node` 22.x, `scripts/build-clean.sh`, `build-clean` script). **Docs updated** (README, PROGRESS). **Prior verification** under Node **25.9.0** surfaced env/runtime warnings (see Recent findings). **Node 22 verification success** (**Node v22.22.2**, **npm v10.9.7**): `npm run build-clean`, `npm run build`, `npm run type-check`, `npm run lint`, and **`npm test -- run`** **all pass**; **`devdir`** and **`--localstorage-file`** warnings **gone**; **only** the **Next.js experiments** banner remains in output.
- **Current focus:** **COMPLETED** — **Custom recurrence** shipped with **basis selector**, **days-of-week**, **monthly pattern**, and **combined summary**; optional selections allowed. **Template downloads** remain working; tests/lint/type-check stay green.
- **Scope decision (historical context):** address **all existing test and lint failures**, with **Excel template suites** as the main concentration. That track reached green verification; residual **build warnings** are the new priority.
- **Governance (build warnings):** plan approved; implementation running in phased steps with verification before completion. **Spec:** `docs/superpowers/specs/2026-05-11-build-warning-cleanup-design.md`. **Plan:** `docs/superpowers/plans/2026-05-11-build-warning-cleanup.md`.
- **Governance (experiments banner removal):** **Spec:** `docs/superpowers/specs/2026-05-11-experiments-banner-removal-design.md`. **Status:** **implemented** (banner removed via `next.config.js` cleanup). **Post-change dev verification:** **`npm run dev`** → http://localhost:3000.
- Batch import UX: **layout C** remains the user-selected direction (implementation / visual companion can align to C).
- **Batch import UI design spec** approved; plan created at `docs/superpowers/plans/2026-05-08-batch-import-ui.md`.
- **Task 1 complete:** added `replaceCalendarWithImported` + passing test (`useEventStore.import-flow.test.ts`).
- **Task 2 complete:** import commit helpers (`import-commit.ts`) + tests passing.
- **Task 3 complete:** `useCsvProcessor` no longer auto-commits; test passing.
- **Task 4 complete:** `useBatchImport` no longer commits on COMPLETE; tests updated.
- **Task 5 complete:** `useImportWizard` reducer + tests passing.
- **Task 6 complete:** wizard UI components + replace dialog test added.
- **Task 7 complete:** integrated wizard into `CsvDropzone` + updated tests.
- **Task 8 complete:** a11y coverage updated for wizard review surface.
- **Task 9 complete:** ran full suite; failures were documented in **Excel template–related** tests and lint. These are now **in scope** for the remediation track (not deferred as “pre-exist only”).
  - **Type-check** passes.
  - **Full tests:** failures concentrated in Excel/template test suites — **priority fixes**.
  - **Lint:** ESLint issues in template-related files — **priority fixes**.
- **Batch failure reset fix (CsvDropzone):** on error, the dropzone `catch` path resets wizard state via `resetWizard` and surfaces failure with a **destructive** toast (so users are not left in a stuck mid-wizard state after a batch failure).
- **CsvDropzone:** unit/component tests for `CsvDropzone` **pass** (verified after the reset/toast change).
- **Remediation Phase 1 (DOM mocks):** fixed `document.createElement` overrides in CSV/Excel template hook tests to only stub anchors (prevents `createRoot` failures).
- **Remediation Phase 1 (constructors):** ExcelJS/ExcelTemplateBuilder mocks made constructible (complete).
- **Targeted tests:** `useCsvTemplates` and `useExcelTemplates` hook suites now pass after mock/path fixes.
- **Test cleanup:** removed `ts-ignore` in `useExcelLibrary` test and tightened CSV test expectations.
- **Phase 2 complete:** cleaned up test lint errors (unused vars and mock signatures).
- **Phase 3 complete:** replaced explicit `any` in Excel hooks/services and worker, plus cleaned non-null assertions and unused imports.
- **Lint:** `npm run lint` now passes after template/UI cleanup.
- **Full verification:** `npm test -- run`, `npm run type-check`, and `npm run lint` all pass.
- **`npm run build`:** **success** (exit code `0`). **Under Node v22.22.2 / npm v10.9.7** (see Recent findings), **`devdir`** / **`--localstorage-file`** warnings do **not** appear; **residual output** is the **Next.js experiments** banner only. Historical Node 25 runs had additional env/runtime warnings—in **scope** only if they recur on the pinned toolchain.
- **Build-warning cleanup — chosen baseline (design-approved):** **Node 22** pin for repo/toolchain; production builds measured via a **`build-clean` wrapper** (clean env / predictable invocation) so warning cleanup is comparable run to run.
- **Build-warning env trace (root cause, latest):** **Node v25.9.0**, **npm v11.12.1**. **`NODE_OPTIONS`** is **not set**. **`npm_config_devdir`** **is** set in the environment (value tied to **Cursor sandbox cache**), which aligns with npm reporting **unknown env config `devdir`**. Inspected **dotfiles** and project **`.npmrc`**: **no** `devdir` and **no** `NODE_OPTIONS`—so those sources were **ruled out** for this symptom set.

### Decisions
- **Custom recurrence (2026-05-12) — clarified and locked:**
  - **Custom basis selector:** The UI exposes an explicit control for choosing the **basis** of the custom rule (e.g. weekly anchored on weekdays vs monthly pattern), rather than implying it only from implicit fields.
  - **Summary combine:** The natural-language **summary** (or subtitle) reflects the **combined** basis + options in one coherent line where applicable (not fragmented hints).
  - **Allow empty:** Where the basis allows incomplete or unset optional parts, the model and UI **permit empty** states without forcing invalid combos; validation only blocks truly inconsistent submissions.
- **Example templates UI (2026-05-12):** **Direction** — surface example templates behind a **hamburger/menu affordance** and drive selection/application through a **guided modal** (not the previous inline/prominent-only pattern). Detailed spec/plan paths TBD when filed under normal governance.
- **Next.js experiments banner (2026-05-11):** **Spec:** `docs/superpowers/specs/2026-05-11-experiments-banner-removal-design.md`. **Status:** **shipped** (removed `experimental.optimizePackageImports` from `next.config.js`). **Smoke:** **`npm run dev`** → **http://localhost:3000**.
- **Batch import UI layout**: **Option C** chosen for batch-import UX.
- **Import behavior**: prompt each time (default append).
- **Quality bar:** retain **green** tests/lint/type-check and **silent / documented-only** build output on the pinned toolchain; **current product focus:** **custom recurrence** (days-of-week + monthly basis; decisions above). **Example templates:** hamburger + guided modal remains shipped; downloads **working**.
- **Build warning cleanup — execution baseline:** **Node 22** pin + **`build-clean`** wrapper for consistent, clean build runs (design-approved).

### Current objective
- **COMPLETED:** Custom recurrence now supports **basis selection**, **optional weekly + monthly configuration**, and a **combined summary**. Validation allows empty optional fields. **Verification:** `npm test -- run`, `npm run lint`, and `npm run type-check` all pass after the change.
- **Context:** Template downloads are confirmed working; no additional remediation required.

### Next actions
1. ✅ Custom recurrence basis + weekly/monthly options shipped.
2. ✅ Tests, lint, and type-check run clean after recurrence update.
3. Optional: manual recurrence UI smoke in the event detail sheet.

### Pending clarifications / open questions
- **None** — **Template download** troubleshooting questions are **obsolete** (downloads confirmed working). **Custom recurrence** choices are captured under **Decisions** (**custom basis selector**, **summary combine**, **allow empty**) plus objective text for **days-of-week**, **monthly basis**, and **optional selections**.

### Recently completed (reference)
- **Build warning cleanup + experiments banner removal** — done; see State bullets and Recent findings for verification notes.

### Optional follow-ups (review / polish)
- **Commit step mismatch:** align wizard “commit” step labeling or behavior with the actual deferred-commit flow if reviewers flagged a mismatch (optional).
- **Partial success UX:** improve clarity when only some rows/events succeed (optional).

### Constraints
- **Primary must not edit files directly**; changes go through the agent / agreed workflow.
- **Example templates UI:** preserve **existing template/import behavior**; match app **design patterns** (layout C batch-import surface); meet **accessibility** expectations for dialogs/menus (focus trap, ESC, labels); keep **tests/lint/type-check green**.
- **Build warning cleanup:** same as other remediation—investigate and **plan first** (per workflow/tooling area), then implement only under an **approved plan** (no ad-hoc env hacks without rationale). *(Historical; baseline maintained.)*
- **Experiments banner removal:** implemented per spec; **`npm run dev`** (**http://localhost:3000**) remains a sensible smoke check after config/UI changes.

### Recent findings
- [x] **2026-05-13 — Dev server verification:** `curl -I http://127.0.0.1:3000/` returns **200 OK** after polling restart.
- [x] **2026-05-12 — Dev server restart:** Cleared listeners on port **3000**; **`npm run dev`** → **http://localhost:3000**; **Ready** log confirmed (Next.js 16.2 / Turbopack).
- **Custom recurrence verification (2026-05-12):** `npm test -- run`, `npm run lint`, `npm run type-check` — **all pass** after adding custom basis + weekly/monthly support.
- **Example templates modal verification (2026-05-12):** `npm test -- run`, `npm run lint`, `npm run type-check` — **all pass** after moving templates into the guided modal launcher.
- **Final verification success (Node v22.22.2, npm v10.9.7):** `npm run build-clean`, `npm run build`, `npm run dev`, `npm run type-check`, `npm run lint`, `npm test -- run` — **all pass**. **Next.js experiments banner eliminated** by removing `experimental.optimizePackageImports` from `next.config.js`. **Remaining warnings documented:** npm `devdir` (Cursor sandbox), Node `--localstorage-file` (runtime env) — both expected and non-blocking. **Build output now completely clean** of unintended warnings.
- **Verification run (Node 25.9.0, historical):** same commands succeeded; **`npm_config_devdir`** and **`--localstorage-file`** appeared—attributed to non-LTS runtime/env injection vs Node 22 baseline.
- **TypeScript scope fix:** `tsconfig.json` excludes `out/` and `.next/` to avoid type-checking exported artifacts.
- **Root-cause drill-down (toolchain / env):** Recorded versions: **Node v25.9.0**, **npm v11.12.1**. **`NODE_OPTIONS`:** **unset** (so it does not explain flags in this session). **`npm_config_devdir`:** **present** in env, scoped to **Cursor sandbox cache**, consistent with npm’s **`devdir`** env-config warning rather than `.npmrc` or shell init. **Dotfiles / `npmrc`:** no **`devdir`** and no **`NODE_OPTIONS`** entries located—narrowing attribution to **sandbox-injected npm env** (`npm_config_*`), not repo config files.
- **CSV import / batch processing**: Large imports use **Web Worker** batching (e.g. 2MB+ files). **Excel** support uses **lazy-loaded** libs + bundle splitting. **Template system** covers Live Ops scenarios with **CSV + Excel** paths, scenario worksheets, and **template selector** in the app.

### Completed (high level)
- Live Ops template system shipped: workers, lazy Excel, modular worksheets, CSV generators, selector UI.
- Phase 1 calendar/empty-state/delete/undo and datetime parsing fixes; baselines and a11y/perf logging in place.

---

## Archive — historical checklist (pre–batch-import UI focus)

### Completed (detailed)
- [x] Created `PROGRESS.md` for tracked execution
- [x] Installed missing `@vitejs/plugin-react` (required by `vitest.config.ts`)
- [x] Installed `@testing-library/dom` (explicit dependency for test typings)
- [x] Baselines: `type-check` passes, `lint` runs (warnings only), `test` passes, `build` passes (Next 16)
- [x] Added app-level error handling (`app/error.tsx`, `app/global-error.tsx`)
- [x] Added a11y automation baseline (Vitest + axe smoke test)
- [x] Added dev-only Web Vitals logging (`app/_components/WebVitals.tsx`)
- [x] Captured lightweight performance baselines (approx): type-check ~1.3s, lint ~1.0s, tests ~0.9s, build ~8s end-to-end
- [x] Dev server smoke check: `npm run dev` starts cleanly (http://localhost:3000)
- [x] Phase 1: Installed `@radix-ui/react-alert-dialog` for delete confirmations
- [x] Phase 1: Calendar always visible + mobile default view + accurate filter counts
- [x] Phase 1: Safe delete (confirm) + undo delete (restore) wiring
- [x] Phase 1 verification: type-check + tests + build all pass (lint: warnings only)
- [x] Removed Parallel CLI dependency/scripts (no account/access)
- [x] Ran dev server: `npm run dev` (http://localhost:3000)
- [x] Added inline empty-state callout component + tests (`CalendarEmptyStateCallout`)
- [x] Replaced calendar empty-state overlay with inline callout (keeps FullCalendar grid visible)
- [x] Verified `npm test` passes after empty-state fix
- [x] Verified `npm run lint` (warnings only; no errors)
- [x] Verified `npm run type-check` passes after empty-state fix
- [x] Fixed `Invalid time value` crash when editing event start/end (`datetime-local` → `inputDateToISO` parsing + safe guards)
- [x] **MAJOR MILESTONE**: Advanced Live Ops Template System completed
  - [x] Implemented Web Worker batch processing for large CSV imports (2MB+ files)
  - [x] Built lazy loading system for Excel libraries with bundle splitting
  - [x] Created Excel expert features with advanced formulas and validation
  - [x] Designed modular Excel worksheets for all Live Ops scenarios
  - [x] Built comprehensive CSV template generators with scenario-specific data
  - [x] Integrated template selector with both CSV and Excel format options

### In progress (historical)
- [x] Phase 0: Analyze current structure and capture baselines (typecheck now passes)
- [x] Phase 0: Make tests runnable (Vitest config + dependencies)
- [x] Phase 0: Fix TypeScript errors so baselines can run
- [x] Updated lint strategy for Next 16 (moved from `next lint` to `eslint .`)
- [x] Migrated ESLint config to flat config (`eslint.config.js`) for ESLint v9+

### Pending (historical)
- [x] Phase 0: Add lightweight performance baselines (typecheck/lint/test/build timings)

### Bugs / blockers
- [!] Some dependency installs may still require `--legacy-peer-deps` (peer dependency resolution needs cleanup)
- [!] `npm install` in liveops-12h-time-inputs worktree hit **ERESOLVE** (eslint/@eslint/js peer mismatch).
- [!] `npm test -- run` still errors with **ERR_MODULE_NOT_FOUND** for a vitest chunk (file exists); direct `vitest run` is polluted by `.worktrees/` tests.
- [!] DateTimePicker tests required `@testing-library/user-event` (now added); still need to re-run after dependency fix.
- [!] Worktree `node_modules` removed with elevated permissions; reinstall required.
