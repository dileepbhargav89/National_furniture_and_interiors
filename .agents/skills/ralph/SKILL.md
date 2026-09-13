---
name: ralph
description: Autonomous test-and-repair feedback loop. Runs typecheck, tests, and linter across monorepo packages, captures error diagnostics and stacktraces, applies surgical self-healing fixes, and re-verifies until 100% green.
---

# Ralph — Autonomous Iteration & Self-Healing Loop

Ralph is an autonomous feedback loop designed to relentlessly test, analyze diagnostics, isolate root causes, and apply surgical code repairs until every package in the monorepo passes with zero errors and zero regressions.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        THE RALPH ITERATION LOOP                         │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                       ┌───────────────────────┐
                       │ 1. Run Verification  │
                       │     (pnpm ralph)      │
                       └───────────────────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
               [ 0 Errors ]                [ Errors Found ]
                     │                           │
                     ▼                           ▼
           ┌───────────────────┐       ┌───────────────────┐
           │   SUCCESS (Done)  │       │ 2. Extract Stack  │
           │ Ready for Signoff │       │    & Diagnostics  │
           └───────────────────┘       └───────────────────┘
                                                 │
                                                 ▼
                                       ┌───────────────────┐
                                       │ 3. Locate Root    │
                                       │    Cause in Code  │
                                       └───────────────────┘
                                                 │
                                                 ▼
                                       ┌───────────────────┐
                                       │ 4. Apply Surgical │
                                       │    Fix / Patch    │
                                       └───────────────────┘
                                                 │
                                                 └───────────┐
                                                             │
                                                             ▼
                                                    (Re-run Step 1)
```

---

## Commands & Usage

Ralph is integrated directly into the workspace root:

```bash
# Standard typecheck across all monorepo packages
pnpm ralph

# Run unit and integration test suites
pnpm ralph --test

# Run ESLint validation
pnpm ralph --lint

# Run complete verification (typecheck + lint + test)
pnpm ralph --all

# Auto-fix formatting and mechanical lint errors
pnpm ralph --fix

# Target a single workspace package
pnpm ralph --package=@nfi/api
pnpm ralph --package=@nfi/shared
pnpm ralph --package=storefront
pnpm ralph --package=admin
```

---

## The 4-Phase Ralph Protocol

### Phase 1: Verification Execution
1. Run `pnpm ralph` (or targeted package check).
2. Do not poll or guess — capture the complete stdout and stderr.
3. Determine if the exit code is `0` (Success) or `1` (Failure).

### Phase 2: Diagnostic Extraction & Root Cause Isolation
1. Parse every error into structured data:
   - **Target File**: Exact relative or absolute path.
   - **Line & Column**: Precise code coordinate.
   - **Diagnostic Code**: e.g., TypeScript `TS2322` (type assignment), `TS2339` (missing property), `TS2304` (cannot find name).
   - **Message**: Exact description of what failed.
2. Group related errors (e.g. an updated schema in `@nfi/shared` might cause 3 downstream errors in `apps/api` and `apps/storefront`).

### Phase 3: Surgical Healing
1. Read the target file around the error line using `view_file`.
2. Understand the architectural intention before touching code.
3. Apply the fix using `replace_file_content` with minimal blast radius.
4. **Golden Rules of Healing**:
   - **NEVER** use `@ts-ignore`, `@ts-expect-error`, or `any` to silence a diagnostic.
   - **NEVER** delete or comment out failing assertions in tests to fake a pass.
   - Fix the underlying type signature, schema mapping, or missing export.
   - Preserve existing documentation, comments, and architecture boundaries.

### Phase 4: Recursive Re-verification
1. Re-run `pnpm ralph` immediately after applying the fix.
2. If remaining errors exist, repeat Phase 2 and 3 for the remaining failures.
3. If new errors appear (cascade effect), trace the contract and resolve the upstream dependency.
4. Only complete when `pnpm ralph` reports:
   `✓ ALL RALPH VERIFICATIONS PASSED — Zero type errors, zero regressions.`
