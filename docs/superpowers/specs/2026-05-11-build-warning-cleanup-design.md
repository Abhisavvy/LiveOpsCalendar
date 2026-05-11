# Build Warning Cleanup — Design Spec

**Status:** Draft (design-only; implementation follows a separately reviewed plan)  
**Date:** 2026-05-11  
**Repository:** `liveops-event-calendar` (Next.js 16.2.x application)

---

## Goal

Establish a **repo-level baseline** so production builds produce **trustworthy, reproducible output**: either **no spurious warnings**, or **explicitly documented** exceptions with owner and rationale.

Concrete outcomes for the implementation phase (post–plan approval):

1. **Pin the supported Node.js major** to **22** (LTS line) so local, CI, and agent runs share one toolchain interpretation and avoid accidental use of newer odd majors (e.g. Node 25) that amplify environment-specific noise.
2. Introduce a **`build-clean` entry point** that runs `next build` under a **controlled environment**, so warnings from **IDE- or sandbox-injected** `npm_config_*` variables (and similar) are not mistaken for product or dependency defects.
3. After the baseline is in place, **enumerate remaining build warnings** under that path and **eliminate or disposition** each (fix, config change, or documented waiver).

This document does **not** implement those changes; it defines what to build and how success is judged.

---

## Context/root cause

### Observed behavior

- **`npm run build`** completes successfully (**exit code 0**) under the current app, but stderr/stdout can still show **warnings** that obscure real regressions.

### Two active warning classes (recorded 2026-05)

| Symptom | Attribution (current understanding) |
|--------|-------------------------------------|
| **`Unknown env config "devdir"`** from npm | **`npm_config_devdir`** is present in the process environment (observed in Cursor/sandbox contexts pointing at a cache directory). Project **`.npmrc`** and user dotfiles were checked: **no** `devdir` directive there—the variable is **injected externally**, not authored in-repo. |
| **`--localstorage-file`** / invalid path messaging from Node | Comes from **runtime / environment flag wiring**, not from application source; tied to how the Node process is launched in certain environments when combined with newer Node majors. |

### Why Node 22 pin

- **Next.js 16** supports current Node LTS lines; **Node 22** is a stable, long-supported target and reduces variance versus **Node 25+** (non-LTS) during warning triage.
- **Developer experience:** `engines` + version files give fast feedback (`npm`, `pnpm`, editors) when someone is on the wrong runtime.

### Why `build-clean`

- Repo configuration alone **cannot remove** sandbox-injected `npm_config_*` keys from every shell; a **wrapper** can **unset named variables** (or subprocess with a scrubbed env) **immediately before** invoking `next build`, making “clean build” a **single documented command**.
- Separates **canonical verification** (“run `npm run build-clean`”) from ad-hoc `npm run build` in polluted environments.

---

## Constraints

- **Governance:** No application or config code changes ship under this design until an **implementation plan** derived from this spec is **reviewed and approved** (per project workflow in `PROGRESS.md`).
- **Compatibility:** The pin must respect **Next.js 16** and **npm** behavior on **macOS and Linux** at minimum; if Windows is a stated maintainer platform, the `build-clean` implementation must either work in **cmd/PowerShell** or document **WSL/Git Bash** as the supported path (implementation plan decides; this spec requires an explicit choice, not silent failure).
- **No silent suppression:** Do not blanket-ignore stderr; goal is fewer **legitimate** warnings or **documented** waivers—not hidden logs.
- **Keep existing quality gates green:** `type-check`, `lint`, and tests must remain passing as implementation lands; new warnings in those commands are out of scope for this spec unless they block the same hygiene goal.

---

## Proposed changes (files and behavior)

### 1. Node 22 pin (declarative)

| File | Change |
|------|--------|
| **`.nvmrc`** | Single line: **`22`** (exact minor can float; major must remain 22 until a deliberate bump). |
| **`.node-version`** (optional but recommended) | Same value as `.nvmrc` for **asdf**, **fnm**, and similar tools that read this file but not `.nvmrc`. |
| **`package.json`** | Add **`"engines": { "node": "^22.0.0" }`** (or equivalent range that **admits 22.x** and **excludes 23+**—implementation pins exact policy). Optionally add **`engineStrict`** / document `npm` behavior so CI fails fast when ignored. |
| **`package.json` `devDependencies`** | Bump **`@types/node`** to a **22.x**-aligned release when implementation lands, so TypeScript’s Node typings match the runtime pin (exact version in the plan). |

**Behavior:** Contributors and CI are expected to use Node 22; local mismatch surfaces at install or script start per chosen strictness.

### 2. `build-clean` wrapper

| Location | Change |
|----------|--------|
| **`package.json` `scripts`** | Add **`build-clean`** that runs the production build through a **scrub step** (see below), then **`next build`** (same as current `build`). |

**Required scrub behavior (design minimum):**

- Before invoking `next build`, **unset** at least: **`npm_config_devdir`** (and any other `npm_config_*` keys the implementation plan proves trigger false npm “unknown env config” warnings in this repo’s contexts).
- Preserve variables required for **`next build`** to function: **`PATH`**, **`HOME`** (if needed), **`NODE_ENV=production`** for production build semantics, and any **explicit** CI secrets already required today (none expected for static build unless the plan finds otherwise).

**Implementation shape (plan chooses one):**

- **Unix-first:** small **shell** script in `scripts/build-clean.sh` invoked from `package.json`, **or**
- **Node one-liner:** `node -e` / `scripts/build-clean.mjs` that `spawn`s `next build` with `env` cloned minus dropped keys.

**Documentation touch (in plan, not necessarily this spec file):** `README.md` should state that **`npm run build-clean`** is the **canonical** pre-release / CI build command after implementation.

---

## Error handling

- If **Node major ≠ 22** and strict engine checks are enabled: **`npm install` or `npm run build`** fails with a **clear engines message**—treat as **user fix** (switch Node), not an app bug.
- If **`build-clean`** cannot unset variables (e.g. platform limitation): the script **exits non-zero** with a **short message** naming the OS and the manual workaround (e.g. run in WSL)—no partial build pretending success.
- If **`next build`** fails: **propagate exit code** unchanged; `build-clean` must not swallow Next.js errors.

---

## Testing / verification

After implementation (checklist for the plan / PR):

1. **Toolchain:** `node -v` reports **v22.x** on the verification host.
2. **Clean path:** `npm run build-clean` completes **exit 0**; capture full log and **diff against** a single run of `npm run build` under the same fresh shell to confirm **expected warning reduction** (exact list recorded in the plan).
3. **Regression:** `npm run type-check`, `npm run lint`, and `npm test -- run` (or project-standard test command) **all pass** with no new failures.
4. **CI parity:** If CI exists, it uses **Node 22** and invokes **`build-clean`** (or equivalent scrub) for the production build job.

---

## Rollback

- **Revert** the commit(s) that add `.nvmrc`, `.node-version`, `engines`, `@types/node` bump, and `build-clean` script wiring.
- **Restore** prior `package.json` scripts so **`npm run build`** remains the previous one-line `next build`.
- **Communicate** in the reverting PR that **warning noise may return** in non-pinned or sandbox-heavy environments until a follow-up approach is adopted.

---

## Risks / out of scope

**Risks**

- **`engines`** may annoy contributors on other Node majors until they switch; mitigated by documenting **nvm/fnm/asdf** one-liners in README during implementation.
- **Windows** quoting / env semantics differ from Unix; a naive shell-only wrapper can fail—must be validated or scoped in the plan.
- Pinning Node 22 **does not guarantee** removal of **`--localstorage-file`** warnings if they originate outside npm config; further triage may require **tracing process argv** or **Next/Node upgrades**—tracked as follow-up findings, not assumptions in this spec.

**Out of scope**

- Fixing **ESLint**, **Vitest**, or **TypeScript** warnings unrelated to the **production build** invocation path.
- **`npm install`** warning cleanup (unless the same env scrub is reused later—optional future spec).
- **Changing Next.js or React versions** solely for warning cosmetics (only if a CVE or incompatibility mandates—separate decision).
- **Removing** `.next/` from git tracking or broader **monorepo** policies.

---

## Spec self-review (2026-05-11)

- **Removed ambiguity:** “build-clean” is defined as scrub-then-`next build`; pin is **major 22** with explicit file list; `devdir` warning tied to **`npm_config_devdir`** injection, not hypothetical `.npmrc`.
- **No placeholders:** All tables use concrete artifact names; Windows caveat requires an **explicit plan decision** rather than “TBD”.
- **Testable acceptance:** Verification section ties success to **exit codes**, **commands**, and **log comparison**, not subjective “looks clean”.
- **Scope boundary:** Out-of-scope list prevents creep into unrelated lint/test tracks.
