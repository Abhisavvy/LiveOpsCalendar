## Progress (canonical scratchpad)

### State
- **2026-05-11 — Next.js experiments banner removal:** **Spec logged:** `docs/superpowers/specs/2026-05-11-experiments-banner-removal-design.md` — remove the build-time **experiments** banner via **`next.config.js`** (**`optimizePackageImports`** and related Next config per spec). **Implementation awaits plan approval** (same governance as other remediation: no config edits until plan is reviewed and approved). **After** approved implementation: **`npm run dev`** → **http://localhost:3000** (dev-server smoke: clean startup / banner expectation per spec); also re-check **`npm run build-clean`** / **`npm run build`** on Node **22**.
- **2026-05-11 — build warning cleanup (implementation):** **Plan approved**; **Node 22 pin + `build-clean` wrapper added** (`.nvmrc`, `.node-version`, `package.json` engines + `@types/node` 22.x, `scripts/build-clean.sh`, `build-clean` script). **Docs updated** (README, PROGRESS). **Prior verification** under Node **25.9.0** surfaced env/runtime warnings (see Recent findings). **Node 22 verification success** (**Node v22.22.2**, **npm v10.9.7**): `npm run build-clean`, `npm run build`, `npm run type-check`, `npm run lint`, and **`npm test -- run`** **all pass**; **`devdir`** and **`--localstorage-file`** warnings **gone**; **only** the **Next.js experiments** banner remains in output.
- **Current focus:** **Node 22** build-output baseline **verified green** (`build-clean`): **`devdir`** / **`--localstorage-file`** cleared; **active follow-up:** **experiments** banner removal — **spec** at `docs/superpowers/specs/2026-05-11-experiments-banner-removal-design.md`; **implementation blocked** until **plan approval**; post-change dev check **`npm run dev`** (http://localhost:3000). Prior test/lint remediation remains green (see below).
- **Scope decision (historical context):** address **all existing test and lint failures**, with **Excel template suites** as the main concentration. That track reached green verification; residual **build warnings** are the new priority.
- **Governance (build warnings):** plan approved; implementation running in phased steps with verification before completion. **Spec:** `docs/superpowers/specs/2026-05-11-build-warning-cleanup-design.md`. **Plan:** `docs/superpowers/plans/2026-05-11-build-warning-cleanup.md`.
- **Governance (experiments banner removal):** **Spec:** `docs/superpowers/specs/2026-05-11-experiments-banner-removal-design.md`. **Plan:** **awaiting approval** (path to be recorded under `docs/superpowers/plans/` when filed). **Implementation** only after plan approval. **Post-change dev verification:** **`npm run dev`** → http://localhost:3000.
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
- **Next.js experiments banner (2026-05-11):** **Spec logged:** `docs/superpowers/specs/2026-05-11-experiments-banner-removal-design.md`. **Implementation awaits plan approval.** **Design intent:** remove the banner via Next config (**`optimizePackageImports`** / related **`next.config.js`**). **Post-change verification:** **`npm run dev`** → **http://localhost:3000**.
- **Batch import UI layout**: **Option C** chosen for batch-import UX.
- **Import behavior**: prompt each time (default append).
- **Fix scope (current):** **Build warning hygiene** first; retain **green** tests/lint/type-check. Historical Excel-template test/lint prioritization succeeded; new work treats **silent builds** as the quality bar alongside functional green checks.
- **Build warning cleanup — execution baseline:** **Node 22** pin + **`build-clean`** wrapper for consistent, clean build runs (design-approved).

### Current objective
- **Primary (banner):** **Spec** `docs/superpowers/specs/2026-05-11-experiments-banner-removal-design.md` is **logged**; **implementation awaits plan approval**. After approval: implement per plan, then **`npm run dev`** at **http://localhost:3000** plus **`build-clean` / `npm run build`** on Node **22**.
- **Primary (baseline):** residual build output under **Node 22** + **`build-clean`** was documented as **experiments banner** only; banner removal is now the **active** mitigation path vs. documenting noise only.
- **Execution target:** **Eliminate or legitimately suppress build-time warnings** with **Node 22** + **`build-clean`** as the standard measurement path—output clean, trustworthy, or explicitly documented with owners and rationale.
- **Secondary:** keep tests, lint, and type-check **green**; avoid new warnings while fixing build noise.
- **Where we are now:** **Node 22 verification complete** (**v22.22.2**, **npm v10.9.7**): `build-clean`, `build`, `type-check`, `lint`, **`npm test -- run`** all **pass**; **`devdir`** / **`--localstorage-file`** warnings **clear**; **only** Next.js **experiments** banner remains on build-style output.

### Next actions
1. **Done (Node 22):** `./scripts/build-clean.sh` / `npm run build-clean`, `npm run build`, `npm run type-check`, `npm run lint`, `npm test -- run` — all **pass**; **`devdir`** / **`--localstorage-file`** absent; **Next.js experiments** banner only.
2. **Banner track (blocked on plan):** **spec** — `docs/superpowers/specs/2026-05-11-experiments-banner-removal-design.md`. **Await plan approval**, then implement **`next.config.js`** per approved plan (**`optimizePackageImports`** / related). **After** the change: **`npm run dev`** → **http://localhost:3000**; **`npm run build-clean`** / **`npm run build`** on Node **22**.
3. Keep **type-check/lint/tests** green on Node 22; document any **new** warnings with owners/rationale if they appear on the pinned toolchain.

### Pending clarifications
- **Experiments banner follow-up:** **approved plan** doc path — **record here** once created and reviewed (**spec:** `docs/superpowers/specs/2026-05-11-experiments-banner-removal-design.md`). Post-implementation verification: **`npm run dev`** → **http://localhost:3000** (plus **`build-clean` / build**).

### Optional follow-ups (review / polish)
- **Commit step mismatch:** align wizard “commit” step labeling or behavior with the actual deferred-commit flow if reviewers flagged a mismatch (optional).
- **Partial success UX:** improve clarity when only some rows/events succeed (optional).

### Constraints
- **Primary must not edit files directly**; changes go through the agent / agreed workflow.
- **Build warning cleanup:** same as other remediation—investigate and **plan first** (per workflow/tooling area), then implement only under an **approved plan** (no ad-hoc env hacks without rationale).
- **Experiments banner removal:** **spec** `docs/superpowers/specs/2026-05-11-experiments-banner-removal-design.md` **logged**; **implementation blocked** until **plan approval**; after change **`npm run dev`** (**http://localhost:3000**).

### Recent findings
- **Verification success (Node v22.22.2, npm v10.9.7):** `npm run build-clean`, `npm run build`, `npm run type-check`, `npm run lint`, `npm test -- run` — **all pass**. **Warnings gone:** npm unknown env config **`devdir`**; Node **`--localstorage-file`** invalid path. **Still visible:** **Next.js experiments** banner only (no other build warnings reported for this run).
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
