# Experiments Banner Removal — Design Spec

**Status:** Draft (design-only; implementation is a separate change)  
**Date:** 2026-05-11  
**Repository:** Live Ops view (Next.js app, static export)

---

## Goal

Remove the **Next.js development UI banner** that indicates **experimental configuration** is active, by **eliminating** the `experimental.optimizePackageImports` setting from `next.config.js`.

Success for the **implementation** phase (not this document): dev server starts **without** that experiments banner, and the app remains **functionally correct** (pages render, calendar and icons behave as today).

---

## Context

### Current configuration

`next.config.js` defines:

```javascript
experimental: {
  optimizePackageImports: ['@fullcalendar/react', 'lucide-react'],
},
```

alongside `output: 'export'`, `reactStrictMode: true`, image and TypeScript settings, and `trailingSlash: true`.

### Why the banner appears

Next.js surfaces a visible **experiments** notice in development when the config uses **`experimental.*` options**. `optimizePackageImports` is one such option; it tells the compiler to narrow imports from those packages for smaller bundles.

### Product decision implied by this spec

Trading **silent dev-banner removal** for **default import resolution** behavior for `@fullcalendar/react` and `lucide-react` (no automatic package import optimization via this flag). Any follow-up optimization belongs in **separate** work if bundle size regressions appear.

---

## Constraints

- **Scope of this doc:** Describes **what** to change and **how to verify**; it does **not** modify `next.config.js` or application code.
- **Single lever:** The approved implementation removes **`experimental.optimizePackageImports` only**. Do not add replacement experimental flags solely to silence the banner unless a follow-up spec justifies them.
- **Static export:** The app uses **`output: 'export'`**; verification must not assume server features that static export does not provide.
- **No drive-by edits:** Implementation PR should touch **only** `next.config.js` for this goal (unless review finds a hard dependency requiring a companion change—then expand scope explicitly in the PR description).

---

## Proposed change (file, behavior)

| File | Change |
|------|--------|
| **`next.config.js`** | Delete the entire **`experimental`** object (currently only containing `optimizePackageImports`). If other `experimental` keys are added later, this spec **does not** apply; re-evaluate banner impact per-key. |

**Behavior after change:**

- **Dev:** Next.js should **not** treat the project as using `experimental.optimizePackageImports`; the **experiments banner** tied to that setting should **not** appear.
- **Build:** Import graph and tree-shaking for `@fullcalendar/react` and `lucide-react` follow **default** Next/webpack or bundler behavior without that optimization hint. **Bundle size** may increase slightly; **runtime behavior** should be unchanged assuming existing import patterns are already valid.

---

## Verification (dev server)

1. **Install** (if needed): from repo root, `npm install` with the same Node version the team uses for this project (align with `package.json` / team docs if specified).
2. **Start dev:** `npm run dev` (or the documented dev script for this repo).
3. **Observe:** Open the app in the browser (default dev URL, typically `http://localhost:3000`). Confirm the **Next.js experimental banner** is **absent** after the shell connected to the running dev server.
4. **Smoke test:** Load primary routes that use **FullCalendar** and **lucide-react** icons; confirm no console errors or broken rendering attributable to import resolution.
5. **Optional (implementation PR):** Run `npm run build` and confirm **exit code 0** with no new failures compared to baseline for this branch.

---

## Rollback

Restore the previous block in **`next.config.js`**:

```javascript
experimental: {
  optimizePackageImports: ['@fullcalendar/react', 'lucide-react'],
},
```

Commit or revert as a single rollback change. Expect the experiments banner to return if experimental config is restored.

---

## Risks / out of scope

| Risk | Mitigation |
|------|-------------|
| **Larger JS bundles** for FullCalendar / Lucide | Compare build output size before/after in the implementation PR; if significant, consider manual import paths or a **non-experimental** optimization approach in a later task. |
| **Subtle tree-shaking differences** | Smoke test listed routes; add visual or E2E checks only if the team already maintains them. |

**Out of scope for this spec:**

- Changing **Next.js version** or migrating to different optimization APIs.
- Refactoring **how** FullCalendar or Lucide is imported across the codebase.
- Removing other warnings (build, npm env, Node flags)—see separate hygiene specs if applicable.
- **Production hosting** URL, CDN, or export path changes.

---

## Spec self-review (clarity pass)

| Check | Resolution |
|-------|------------|
| Ambiguous “remove experimental” | Spec names the **exact** key (`optimizePackageImports`) and the **exact** packages in the array today. |
| Empty `experimental` object | Prefer **deleting** the `experimental` key entirely when it has no siblings, to avoid leaving a hollow object. |
| “Banner” wording | Banner means the **Next.js dev overlay / notice** for experimental features, not generic browser or third-party UI. |
| Verification host/port | Uses **typical** localhost:3000 with explicit note to follow the repo’s dev script output if different. |
| Placeholders | None; paths and package names match **current** `next.config.js` as of 2026-05-11. |
