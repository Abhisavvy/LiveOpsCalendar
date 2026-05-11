# Build Warning Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pin the repo to **Node.js 22**, add a **`build-clean`** entry point that scrubs toolchain-injected env (for example **`npm_config_devdir`**) before **`next build`**, and document prerequisites so local, CI, and agent runs share one baseline—aligned with [`docs/superpowers/specs/2026-05-11-build-warning-cleanup-design.md`](../specs/2026-05-11-build-warning-cleanup-design.md).

**Architecture:** Declarative toolchain alignment via **`.nvmrc`**, **`.node-version`**, and **`package.json` `engines`** plus a **`@types/node`** bump so TypeScript matches the runtime. A **Unix-first** shell wrapper in **`scripts/build-clean.sh`** unsets the minimum proven noisy variables, sets **`NODE_ENV=production`**, and **`exec`**s **`next build`** so exit codes propagate. **Windows:** document **WSL** or **Git Bash** as the supported path for **`npm run build-clean`** (native **cmd/PowerShell** is out of scope for the shell script unless a follow-up adds a Node-based wrapper).

**Tech Stack:** Next.js 16 (`next build`), npm, Node 22 LTS, TypeScript (`@types/node` 22.x), bash.

---

## File map

| Path | Responsibility |
|------|----------------|
| **`.nvmrc`** | Single line **`22`** so **nvm** / compatible tools select Node 22.x. |
| **`.node-version`** | Same **`22`** for **asdf**, **fnm**, and other tools that ignore `.nvmrc`. |
| **`package.json`** | Add **`engines.node`** admitting 22.x and excluding 23+; bump **`@types/node`** to 22.x; add **`scripts.build-clean`**. |
| **`package-lock.json`** | Regenerated/updated after dependency bump (`npm install`). |
| **`scripts/build-clean.sh`** | Unset **`npm_config_devdir`** (extend if new false-positive **`npm_config_*`** keys are proven), export **`NODE_ENV=production`**, run **`next build`**. |
| **`README.md`** | **Prerequisites:** Node **22**; **Build:** **`npm run build-clean`** as canonical pre-release check; **Windows:** WSL / Git Bash note. |
| **`PROGRESS.md`** | Scratchpad entry after implementation: plan executed, toolchain pin + wrapper landed, verification recorded. |

---

### Task 1: Add Node version files (`.nvmrc`, `.node-version`)

**Files:**
- Create: `.nvmrc`
- Create: `.node-version`

- [ ] **Step 1: Create `.nvmrc`**

```text
22
```

- [ ] **Step 2: Create `.node-version`**

```text
22
```

- [ ] **Step 3: Verify version managers see Node 22 (after installing 22 locally)**

Run (from repo root, with **nvm** or **fnm** available):

```bash
cd "/path/to/Live Ops view"
nvm install 2>/dev/null || true
nvm use 2>/dev/null || fnm use 2>/dev/null || true
node -v
```

Expected: **`v22.x.x`** (any **22** minor/patch).

- [ ] **Step 4: Commit**

```bash
git add .nvmrc .node-version
git commit -m "chore(toolchain): add Node 22 version files"
```

---

### Task 2: Pin `engines`, bump `@types/node`, refresh lockfile

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json` (via install)

- [ ] **Step 1: Add `engines` and bump `@types/node`**

At the **top level** of **`package.json`** (alongside **`name`**, **`version`**, etc.), add:

```json
"engines": {
  "node": ">=22.0.0 <23.0.0"
}
```

In **`devDependencies`**, replace the existing **`@types/node`** entry with a **22.x** line (example; run **`npm view @types/node version`** at implementation time if you need the latest patch):

```json
"@types/node": "^22.13.0"
```

- [ ] **Step 2: Install to update the lockfile**

Run:

```bash
cd "/path/to/Live Ops view"
node -v
```

Expected: **`v22.x.x`**.

```bash
npm install
```

Expected: **exit code `0`**; **`package-lock.json`** updates to resolve **`@types/node`** to a **22.x** release; no **EBADENGINE** if the active Node satisfies **`engines`**.

- [ ] **Step 3: (Optional) Enforce engines in CI**

If the team wants **`npm install` / `npm ci` to fail** on wrong Node: add an **`.npmrc`** at repo root with **`engine-strict=true`** in a **separate** follow-up commit only if governance requests it (the design spec marks this optional). Without it, **`engines`** is advisory unless CI uses **`npm config set engine-strict true`**.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(toolchain): pin Node 22 engines and align @types/node"
```

---

### Task 3: Add `scripts/build-clean.sh`

**Files:**
- Create: `scripts/build-clean.sh`

- [ ] **Step 1: Create the script**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Drop sandbox/toolchain-injected npm config that triggers false "unknown env config" warnings.
unset npm_config_devdir 2>/dev/null || true

export NODE_ENV=production

exec npx next build "$@"
```

- [ ] **Step 2: Make it executable**

Run:

```bash
chmod +x scripts/build-clean.sh
```

Expected: no output; **`ls -l scripts/build-clean.sh`** shows execute bit (e.g. **`-rwxr-xr-x`**).

- [ ] **Step 3: Dry-run sanity (script parses)**

Run:

```bash
bash -n scripts/build-clean.sh
```

Expected: exit code **`0`**, no output.

- [ ] **Step 4: Commit**

```bash
git add scripts/build-clean.sh
git commit -m "build: add build-clean wrapper script"
```

---

### Task 4: Wire `build-clean` npm script

**Files:**
- Modify: `package.json` (`scripts` section)

- [ ] **Step 1: Add the script next to existing build**

After the existing **`build`** script, add:

```json
"build-clean": "bash scripts/build-clean.sh"
```

Illustrative **`scripts`** excerpt:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "build-clean": "bash scripts/build-clean.sh",
  "start": "next start",
  "...": "..."
}
```

- [ ] **Step 2: Smoke-test invocation**

Run:

```bash
npm run build-clean
```

Expected: **Next.js production build** runs (same substantive work as **`npm run build`**); **exit code `0`** on success; compare stderr to **`npm run build`** in the same environment—expect reduction or elimination of **`Unknown env config "devdir"`** when **`npm_config_devdir`** was present in the parent shell.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "build: expose build-clean npm script"
```

---

### Task 5: Update `README.md` (Node 22 + `build-clean` + Windows)

**Files:**
- Modify: `README.md` (Prerequisites + Build sections)

- [ ] **Step 1: Replace prerequisites to require Node 22**

Find the **Prerequisites** bullet that currently allows **Node.js 18+** and replace with language equivalent to:

```markdown
### Prerequisites

- **Node.js 22** (LTS). Use the repo’s `.nvmrc` / `.node-version` with **nvm**, **fnm**, or **asdf** so everyone runs the same major.
- npm (bundled with Node) or a compatible package manager
- Modern web browser with ES2017+ support
```

- [ ] **Step 2: Document canonical production build and Windows**

In **Build for Production** (or adjacent), add a subsection such as:

````markdown
### Canonical production build (`build-clean`)

For release checks and warning triage, prefer:

```bash
npm run build-clean
```

This runs `next build` after clearing known sandbox-injected npm environment variables (for example `npm_config_devdir`) so logs are comparable across machines.

**Windows:** run this from **WSL** or **Git Bash** so `bash scripts/build-clean.sh` is available. Native cmd/PowerShell is not supported by this wrapper unless the project adds a separate Node-based script later.
````

Keep the existing **`npm run build`** mention for quick local builds if desired, but state that **`build-clean`** is the **canonical** pre-release path (per design spec).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document Node 22 and build-clean usage"
```

---

### Task 6: Update `PROGRESS.md` after changes land

**Files:**
- Modify: `PROGRESS.md` (State / Recent findings)

- [ ] **Step 1: Insert a dated state line**

Under **`### State`**, add a new top bullet (after implementation), for example:

```markdown
- **2026-05-11 — build warning cleanup (toolchain):** Landed **Node 22** pin (`.nvmrc`, `.node-version`, `package.json` engines), **`@types/node` 22.x**, **`scripts/build-clean.sh`** + **`npm run build-clean`**, and **README** prerequisites. **Verification:** `node -v` (22.x), `npm run build-clean`, `npm run build`, `npm run type-check`, `npm run lint`, `npm test -- run` all recorded green on the implementation host. Next: enumerate any **remaining** build warnings under this baseline and disposition per spec.
```

Adjust the date if the merge day differs.

- [ ] **Step 2: Align “Next actions” if still listing “draft plan”**

If **Next actions** still say the implementation plan is pending, update that row to **plan approved / implementation complete** per actual project state (keep **PROGRESS.md** truthful).

- [ ] **Step 3: Commit**

```bash
git add PROGRESS.md
git commit -m "docs: record build-clean and Node 22 baseline in progress log"
```

---

### Task 7: Full verification suite

**Files:**
- None (commands only)

- [ ] **Step 1: Confirm Node 22**

Run:

```bash
node -v
```

Expected: **`v22.x.x`**.

- [ ] **Step 2: Clean production build path**

Run:

```bash
npm run build-clean
```

Expected: **exit code `0`**; Next.js reports successful production build; capture full log for the warning inventory (follow-up work per spec §Testing).

- [ ] **Step 3: Standard build (regression parity)**

Run:

```bash
npm run build
```

Expected: **exit code `0`**.

- [ ] **Step 4: Type-check**

Run:

```bash
npm run type-check
```

Expected: **exit code `0`**; no TypeScript errors.

- [ ] **Step 5: Lint**

Run:

```bash
npm run lint
```

Expected: **exit code `0`**.

- [ ] **Step 6: Tests (non-watch)**

Run:

```bash
npm test -- run
```

Expected: **exit code `0`**; all tests pass.

- [ ] **Step 7: Optional log comparison**

Run **`npm run build`** and **`npm run build-clean`** from a shell where **`npm_config_devdir`** is set (if reproducible) and diff stderr; expect **`build-clean`** to drop the **`Unknown env config "devdir"`** warning when unset works.

---

## Self-review (spec coverage)

1. **Spec coverage:** Node 22 pin (files + engines + `@types/node` + lockfile) → Tasks 1–2. **`build-clean` wrapper** → Tasks 3–4. **README** prerequisite + canonical command + Windows → Task 5. **PROGRESS** update → Task 6. **Verification** (toolchain, build-clean, build, type-check, lint, tests) → Task 7. **Follow-up** (enumerate remaining warnings, CI parity) remains **post–plan execution** per spec §Testing / §Constraints—not part of this minimal landing slice.
2. **Placeholder scan:** No TBD/TODO steps; concrete file paths and commands throughout.
3. **Type consistency:** **`engines`** range **`>=22 <23`** matches `.nvmrc` major **22**; **`@types/node`** **22.x** matches runtime pin.

---

## Execution handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-11-build-warning-cleanup.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in one session using **superpowers:executing-plans**, batch execution with checkpoints.

**Which approach?**
