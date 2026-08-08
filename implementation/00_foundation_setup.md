# Sprint 0 — Foundation Setup

## Scaffold Compliance Verification & Implementation Plan

**Date:** 2026-08-08
**Basis:** `docs/00`–`18` (locked architecture baseline) + the current repository scaffold committed to this workspace.
**Governing rule:** `docs/18_CLAUDE_CONSTITUTION.md` — this document is implementation planning, not architecture. No locked document was modified to produce it. No business logic is implemented in it.

---

## Revision History

| Version | Date | Change |
|---|---|---|
| v1.0 | 2026-08-08 | Initial version |

---

## 0. A Note on This Document's Location

This is the first document saved under `implementation/` rather than `docs/`. That folder does not appear in `06_project_structure.md` §9's locked repository tree, and `18_CLAUDE_CONSTITUTION.md` §2.3/§8 would normally treat introducing an undocumented top-level folder as something requiring an ADR. Flagging this rather than silently proceeding, per the constitution's own AI Operating Rules (§7, Rule 4): `implementation/` is being used here as instructed, for planning/runbook documents (Sprint plans, setup guides) that are distinct in kind from the architecture series — the constitution itself (§5.4) already anticipated a category of "implementation documentation" that sits below the locked baseline and cites it rather than restates it, which is exactly what this folder now holds. It does not redefine repository *code* structure (`apps/`, `packages/`, etc. are unaffected). Recommendation: formalize `implementation/` in `06_project_structure.md` via a lightweight ADR the next time that document is revisited, so `06` §9's tree stays the single source of truth for the full repository layout. Proceeding on the current instruction in the meantime, since this is a documentation-organization choice, not an architecture change.

---

## 1. Verification Methodology

Every one of `docs/01`–`18` was re-read in full for this pass (not sampled), and the live repository scaffold was inspected directly — every directory listed, every `package.json` parsed, every root config file read in full — rather than verified from memory of having built it. One genuine deviation was found and corrected during this pass (Section 2.3); it is reported here rather than silently fixed and hidden, consistent with the self-critical discipline `docs/00_architecture_review.md` through `docs/16_architecture_final_review.md` established for the architecture series itself.

---

## 2. Verification Findings

### 2.1 Repository Structure

Checked against `06_project_structure.md` §9's complete folder tree.

| Item | Expected | Observed | Status |
|---|---|---|---|
| Top-level folders | `apps/`, `packages/`, `configs/`, `docs/`, `scripts/`, `docker/`, `.github/`, `assets/`, `public/`, `testing/` | All 10 present | ✅ Compliant |
| `apps/*` | `storefront/`, `admin/` (identical template), `api/` (single deployable, 15 modules), `worker/` (open item) | All present, `storefront`/`admin` structurally identical, `api` has all 15 modules | ✅ Compliant |
| `apps/api/src/modules/*` module count | 15 (`06` §4.3) | 15 present: `auth`, `users`, `leads`, `crm`, `design-projects`, `catalog`, `cart`, `orders`, `payments`, `reviews`, `media`, `notifications`, `cms`, `admin`, `analytics` | ✅ Compliant |
| Per-module 4-layer template | `domain/`, `application/`, `infrastructure/`, `presentation/{controllers,routes,validators,dto}` | Present identically across all 15 modules | ✅ Compliant |
| `packages/*` count | 7 (`06` §5) | 7 present: `ui`, `api-client`, `config`, `shared`, `eslint-config`, `tsconfig`, `database` | ✅ Compliant |
| `packages/shared/src/*` | `types/`, `enums/`, `validation/`, `constants/` | All 4 present | ✅ Compliant |
| `packages/database/*` | `migrations/`, `seeds/`, `indexes/`, `backups/`, `validators/` | All 5 present | ✅ Compliant |
| `docs/` sub-folders | `database/`, `api/`, `development/`, `deployment/`, `security/`, `testing/`, `adr/`, `release-notes/`, `user-guide/`, `developer-guide/` (`06` §8) | All 10 present, existing `docs/00`–`18` untouched | ✅ Compliant |
| Root files | `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `turbo.json`, `.npmrc`, `tsconfig.base.json`, `.env.example`, `.gitignore`, `README.md`, `CODEOWNERS` | All present except `pnpm-lock.yaml` | ⚠️ Not yet generated — expected; created by `pnpm install` (Section 4.1) |

### 2.2 Package Boundaries

Checked against `06_project_structure.md` §2.2's rule table and §5's package-boundary criterion.

| Rule | Expected | Observed | Status |
|---|---|---|---|
| Apps never import each other | No `apps/*` package depends on another `apps/*` package | Confirmed — `storefront`, `admin`, `@nfi/api` manifests have zero cross-app dependencies | ✅ Compliant |
| Packages never import from `apps/*` | No `packages/*` manifest depends on an app | Confirmed across all 7 package manifests | ✅ Compliant |
| Frontend↔backend communication is HTTP-only | `storefront`/`admin` never depend on `@nfi/api` as a package | Confirmed | ✅ Compliant |
| `@nfi/shared` depends on nothing internal | Zero workspace-package dependencies | Confirmed — only external `zod` | ✅ Compliant |
| Package fragmentation avoided | Only `ui`, `api-client`, `config`, `shared`, `eslint-config`, `tsconfig`, `database` should exist as packages, not `types`/`shared-validation`/`shared-constants`/`shared-components`/`shared-hooks` (`06` §5) | Exactly 7 packages exist, none of the 5 rejected names present | ✅ Compliant |
| `apps/api` is one workspace package, not one per module | `06` §4.1, `05` §8.2 | Confirmed — `apps/api/package.json` is a single manifest; the 15 modules are folders, not workspace members | ✅ Compliant |

### 2.3 Workspace Configuration

Checked against `05_repository_strategy.md` §7–§14 and `07_technology_decision_record.md` §20.

| Item | Expected | Observed | Status |
|---|---|---|---|
| `pnpm-workspace.yaml` glob | `apps/*`, `packages/*` (per `06` §0.1's regrouping of `05` §8.1's original glob) | Matches | ✅ Compliant |
| Single lockfile | One `pnpm-lock.yaml` at root (`05` §13) | Not yet generated | ⚠️ Expected — Section 4.1 |
| `turbo.json` — `build` depends on `^build` | `05` §14.1 | Matches | ✅ Compliant |
| `turbo.json` — `lint` depends on nothing | `05` §14.1: "Depends on: Nothing (can run independent of build order)" | **Found: `lint` had `dependsOn: ["^lint"]`** | 🔴 **Deviation — corrected during this pass** (Section 3 below) |
| `turbo.json` — `typecheck` depends on `^build` | `05` §14.1 | Matches | ✅ Compliant |
| `turbo.json` — `test` depends on `build` (same package) | `05` §14.1 | Matches | ✅ Compliant |
| `tsconfig.base.json` strict mode | `07` §20.1: "Strict mode enabled repository-wide" | `"strict": true` present | ✅ Compliant |
| `.npmrc` non-hoisted isolation | `05` §13: strict, non-hoisted `node_modules` | `shamefully-hoist=false` present | ✅ Compliant |
| Root `package.json` — no runtime dependencies at root | `05` §7.1: "no runtime dependencies live at the root" | Root has only `devDependencies` (turbo, typescript, prettier) | ✅ Compliant |
| `packageManager` field pinned | Not explicitly required, but consistent with reproducible installs | `pnpm@9.15.0` pinned | ✅ Compliant (reasonable addition) |

### 2.4 Folder Ownership

Checked against `06_project_structure.md` §1.6/§2.2 and `17_architecture_index.md` §8's Decision Ownership Matrix.

| Item | Expected | Observed | Status |
|---|---|---|---|
| `CODEOWNERS` exists at root | `05` §7.1 | Present | ✅ Compliant |
| Every top-level folder has an owner entry | `06` §2.2's table | All of `apps/`, `packages/`, `configs/`, `docker/`, `.github/`, `scripts/`, `docs/*`, `assets/`, `public/`, `testing/` mapped | ✅ Compliant |
| `apps/api/src/core/` flagged for 2-approval review | `11_engineering_workflow.md` §4.2 | Comment present in `CODEOWNERS` | ✅ Compliant |
| `payments`, `admin` modules flagged for security co-review | `09_security_architecture.md` §12.3 | Both mapped to `@nfi-org/backend` + `@nfi-org/security` | ✅ Compliant |
| Real GitHub team handles | N/A — org doesn't exist yet | Placeholder `@nfi-org/*` handles, explicitly commented as such | ⚠️ Open item — Section 4.2 (Sprint 0 task, not a compliance defect) |

### 2.5 Import Rules

Checked against `02_enterprise_architecture.md` §5–§7 and `06_project_structure.md` §0.2, §4.3's per-layer import table.

| Item | Expected | Observed | Status |
|---|---|---|---|
| Structural placement of `controllers/routes/validators/dto` | Inside each module's `presentation/`, never as global flat top-level folders (`06` §0.2) | Confirmed — no top-level `controllers/`, `services/`, etc. exist; all are nested per-module | ✅ Compliant (structural) |
| `domain/` has zero framework imports | Enforced at code-review/lint time, not by folder structure alone | No code exists yet to violate this — **not yet mechanically enforced** | ⚠️ Expected — no ESLint module-boundary rule installed yet (Section 4.4) |
| `application/` may only import another module's exported interface | Same as above | Same as above | ⚠️ Expected — Section 4.4 |
| pnpm strict `node_modules` isolation | `05` §13: technically enforces "a package can only import what it explicitly declares" | Enforced automatically by `shamefully-hoist=false` once `pnpm install` runs | ✅ Compliant (mechanism present, not yet exercised — Section 4.1) |

**Assessment:** the folder structure correctly *positions* every layer so the import rules are enforceable, but the two mechanical enforcement layers (`pnpm install`'s isolation, and the `@nfi/eslint-config` module-boundary rule) are Sprint 0 deliverables, not yet installed. This is expected at this stage, not a compliance failure — `docs/16_architecture_final_review.md` §4 rated "Project Setup" Ready specifically on this basis.

### 2.6 Dependency Graph

Checked against `06_project_structure.md` §6/§13's package dependency graph.

| Package | Expected dependencies (`06` §6) | Observed (`package.json`) | Status |
|---|---|---|---|
| `@nfi/eslint-config` | Nothing | Only external (`eslint`, `typescript-eslint`) | ✅ Compliant |
| `@nfi/tsconfig` | Nothing | None | ✅ Compliant |
| `@nfi/shared` | Nothing | Only external (`zod`) | ✅ Compliant |
| `@nfi/config` | `@nfi/tsconfig` | `@nfi/tsconfig` (dev) + external `tailwindcss` | ✅ Compliant |
| `@nfi/ui` | `@nfi/shared` (types), `@nfi/config`, `@nfi/tsconfig`, `@nfi/eslint-config` | `@nfi/shared`, `@nfi/config` (deps); `@nfi/eslint-config`, `@nfi/tsconfig` (dev) | ✅ Compliant |
| `@nfi/api-client` | `@nfi/shared`, `@nfi/tsconfig`, `@nfi/eslint-config` | `@nfi/shared` (dep); `@nfi/eslint-config`, `@nfi/tsconfig` (dev) | ✅ Compliant |
| `@nfi/database-tools` | `@nfi/shared`, `@nfi/tsconfig` | `@nfi/shared` (dep); `@nfi/eslint-config`, `@nfi/tsconfig` (dev) | ✅ Compliant |
| `storefront`/`admin` | `@nfi/ui`, `@nfi/api-client`, `@nfi/config` (`06` §11 diagram); `@nfi/shared` also, per `06` §6's table note on enums/constants for display logic | All 4 present | ✅ Compliant |
| `@nfi/api` | `@nfi/shared` only, among workspace packages | `@nfi/shared` only, plus locked external technologies (`express`, `mongoose`, `ioredis`, `bullmq`, `zod`, `jsonwebtoken`, `helmet`, `cors` — all named in `07_technology_decision_record.md` §4–§7) | ✅ Compliant |

No circular dependency exists in the graph. No package depends on anything not already named in `06` §6 or `07`'s locked technology list.

### 2.7 Naming Conventions

Checked against `05_repository_strategy.md` §9 and `06_project_structure.md` §8.3's diagram.

| Item | Expected | Observed | Status |
|---|---|---|---|
| `packages/*` scope prefix | `@nfi/<name>` | All 7 packages correctly prefixed | ✅ Compliant |
| `apps/api` package name | `@nfi/api` specifically (`05` §8.3 diagram) | `"name": "@nfi/api"` | ✅ Compliant |
| `storefront`/`admin` package names | **Not** `@nfi/`-prefixed — `05` §8.3's diagram shows them as plain `storefront`/`admin` (private, deployable apps, not shared packages) | `"name": "storefront"`, `"name": "admin"` | ✅ Compliant |
| All internal packages private | `"private": true` | Present on all 9 manifests inspected | ✅ Compliant |
| Module folder names match `06` §4.3 exactly | kebab-case, matching the 15-module list | Confirmed byte-for-byte | ✅ Compliant |

---

## 3. Deviation Found and Corrected

**Finding:** `turbo.json`'s `lint` task was configured with `"dependsOn": ["^lint"]`. `05_repository_strategy.md` §14.1 specifies lint should have **no** dependency ("can run independent of build order," precisely so lint gives fast, cache-independent feedback on a PR).

**Correction applied during this verification pass:** changed to `"dependsOn": []`. No other file required a change.

**Root cause:** this was introduced when the scaffold was first built (not a defect in any locked document) — a conventional Turborepo pattern was used generically instead of checking `05` §14.1's specific table. Recorded here rather than silently fixed, per this document's own verification discipline (Section 1).

---

## 4. Compliance Verdict

# **COMPLIANT**

Every dimension the request asked to verify — repository structure, package boundaries, workspace configuration, folder ownership, import rules, dependency graph, naming conventions — matches the locked architecture (`docs/01`–`18`) with one small, mechanical deviation, found and corrected in this same pass (Section 3). No structural rework is required. The remaining ⚠️ items in Section 2 (missing lockfile, unconfigured `@nfi/eslint-config` rule, placeholder `CODEOWNERS` handles) are not compliance failures — they are exactly the category of "not yet done because nothing has been installed yet" that `docs/16_architecture_final_review.md` §4 already anticipated when it rated Project Setup **Ready**, not **Needs Improvement**. Sprint 0 (Section 5 below) closes all of them.

---

## 5. Sprint 0 Implementation Plan

Nine tracks, sequenced. Each has an objective, concrete steps, and an acceptance criterion. **No business logic is created in any track below** — every step is tooling, configuration, or infrastructure scaffolding only.

### 5.1 Workspace Verification

**Objective:** prove the scaffold actually installs and the workspace graph resolves the way Section 2.6 says it should, before any other tooling is layered on.

| Step | Command / Action |
|---|---|
| 1 | `pnpm install` at repo root — generates `pnpm-lock.yaml` (closes the one missing root file from Section 2.1) |
| 2 | `pnpm -r list --depth -1` — confirm all 10 workspace packages (`storefront`, `admin`, `@nfi/api`, `@nfi/ui`, `@nfi/api-client`, `@nfi/config`, `@nfi/shared`, `@nfi/eslint-config`, `@nfi/tsconfig`, `@nfi/database-tools`) resolve |
| 3 | `pnpm why @nfi/shared` from inside `apps/storefront` — confirm `workspace:*` linking resolves correctly, not from the registry |
| 4 | `npx turbo run build --dry-run=json` — inspect the computed task graph against Section 2.6's expected dependency graph; confirm no unexpected edges |

**Acceptance criteria:** `pnpm install` completes with zero errors; `pnpm-lock.yaml` is committed; `turbo run build --dry-run` shows exactly the dependency edges Section 2.6 lists, no more, no fewer.

### 5.2 Tool Installation

**Objective:** pin every tool named in `07_technology_decision_record.md` §17–§20 at a specific, reproducible version.

| Tool | Version constraint | Source |
|---|---|---|
| Node.js | 22 LTS (Active LTS at time of writing; upgrade before EOL, never after — `07` §4.1) | `.nvmrc` at root, `engines.node` in root `package.json` (already present) |
| pnpm | ≥9.0.0, pinned via `packageManager` field (already present) | Corepack (`corepack enable && corepack prepare pnpm@9.15.0 --activate`) |
| Turborepo | `^2.3.0` (already in root `devDependencies`) | Installed via `pnpm install` |
| Vitest | `^2.0.0` (`07` §17) | Per-package `devDependencies`, already present in manifests that need it |
| Playwright | Add to `testing/e2e/package.json` (not yet created — Sprint 0 task) | `07` §17's e2e testing tool |

**Steps:**
1. Add `.nvmrc` at root containing `22`.
2. `corepack enable` then `corepack prepare pnpm@9.15.0 --activate`.
3. `pnpm install` (also satisfies Section 5.1).
4. Create `testing/e2e/package.json` with `@playwright/test` as the sole dependency, `private: true`, name `@nfi/e2e`.

**Acceptance criteria:** `node --version` and `pnpm --version` on a fresh clone match the pinned versions without manual intervention (Corepack handles this automatically).

### 5.3 TypeScript Configuration

**Objective:** populate `packages/tsconfig/` (currently empty per Section 2.1) with the base configs every app/package extends, per `06_project_structure.md` §5 and `07_technology_decision_record.md` §20.1.

| File | Purpose | Extends |
|---|---|---|
| `packages/tsconfig/base.json` | Shared compiler options for all `packages/*` | Root `tsconfig.base.json` |
| `packages/tsconfig/nextjs.json` | Next.js-specific additions (`jsx: preserve`, `plugins: [{name: "next"}]`, `moduleResolution: bundler`) | `base.json` |
| `packages/tsconfig/node.json` | Node/Express-specific additions (`module: CommonJS` or `NodeNext` depending on `apps/api`'s module strategy, `types: ["node"]`) | `base.json` |

**Steps:**
1. Author the three files above.
2. Add a `tsconfig.json` to each of `apps/storefront`, `apps/admin` extending `@nfi/tsconfig/nextjs.json`.
3. Add a `tsconfig.json` to `apps/api` extending `@nfi/tsconfig/node.json`.
4. Add a `tsconfig.json` to each `packages/*` extending `@nfi/tsconfig/base.json`.

**Acceptance criteria:** `pnpm typecheck` (via `turbo run typecheck`) runs successfully across every workspace package with zero configuration errors (type errors from actual code are out of scope — there is no code yet).

### 5.4 ESLint

**Objective:** populate `packages/eslint-config/` (currently just a manifest, per Section 2.1) with the shared config **including the module-boundary enforcement rule** — this is the mechanism that closes Section 2.5's "not yet mechanically enforced" gap and is the concrete reason `05_repository_strategy.md` §5 decided against adopting Nx.

**Steps:**
1. Author `packages/eslint-config/index.js` (flat config, ESLint 9) with: base recommended + `typescript-eslint` rules; a `no-restricted-imports` / custom boundary rule enforcing `06_project_structure.md` §4.3's per-layer import table (`domain/` may import nothing from `application/infrastructure/presentation`; `application/` may not import `infrastructure/` directly; cross-module imports blocked except through an `application/`-layer exported interface).
2. Author `packages/eslint-config/next.js` (extends base, adds `eslint-config-next`).
3. Add `eslint.config.js` to each app/package that simply imports and re-exports the shared config (per `06` §5's "one canonical config, extended everywhere" principle).
4. Wire `pnpm lint` (already in root `package.json`) through `turbo run lint`.

**Acceptance criteria:** `pnpm lint` runs clean across the whole workspace; a manual smoke test (temporarily add a file importing across a module boundary incorrectly, confirm the rule fires, then remove the test file) confirms the boundary rule is live before Sprint 1 begins.

### 5.5 Prettier

**Objective:** deterministic formatting, paired with ESLint per `07_technology_decision_record.md` §20.3.

**Steps:**
1. Add `.prettierrc.json` at root (already listed as a `devDependency`, config file itself doesn't yet exist): semi: true, singleQuote: true, trailingComma: "all", printWidth: 100, plugins: `prettier-plugin-tailwindcss` for class-order sorting in `apps/storefront`/`apps/admin`.
2. Add `.prettierignore` (mirrors `.gitignore`'s build-output exclusions, plus `pnpm-lock.yaml`).
3. Confirm `packages/eslint-config` does **not** duplicate any stylistic rule Prettier already owns (avoid the classic ESLint/Prettier rule-conflict trap) — use `eslint-config-prettier` to disable ESLint's own formatting rules.

**Acceptance criteria:** `pnpm format:check` (already scripted at root) passes on the current scaffold; running `pnpm format` twice in a row produces no diff on the second run (idempotency check).

### 5.6 Husky

**Objective:** enforce Sections 5.4–5.5 (and Section 5.7) automatically at commit time, so a violation is caught locally, not only in CI.

**Steps:**
1. `pnpm add -D -w husky` at root.
2. `pnpm exec husky init`.
3. `.husky/pre-commit` → runs `pnpm exec lint-staged`.
4. `.husky/commit-msg` → runs `pnpm exec commitlint --edit "$1"` (Section 5.7).
5. Add `lint-staged` config to root `package.json`: `*.{ts,tsx}` → `eslint --fix` + `prettier --write`; `*.{md,json}` → `prettier --write`.

**Acceptance criteria:** a commit containing a deliberately unformatted `.ts` file is auto-fixed and re-staged before the commit completes; a commit with a non-Conventional-Commits message is rejected at `commit-msg`.

### 5.7 Commitlint

**Objective:** enforce the Conventional Commits format `11_engineering_workflow.md` §3.3 already specifies (the format that also drives `10_devops_architecture.md` §6.10's auto-generated release notes).

**Steps:**
1. `pnpm add -D -w @commitlint/cli @commitlint/config-conventional`.
2. `commitlint.config.js` at root: `module.exports = { extends: ['@commitlint/config-conventional'] }`, with `scope-enum` restricted to the 15 module names plus `core`, `deps`, `ci`, `docs`, `release` (matching `06_project_structure.md`'s module vocabulary exactly, so a commit's scope is always a real, checkable module name).

**Acceptance criteria:** `git commit -m "feat(catalog): placeholder"` succeeds; `git commit -m "did stuff"` is rejected with a clear Conventional-Commits error.

### 5.8 Environment Setup

**Objective:** get every app/service actually bootable locally against `.env.example`'s already-documented variable list (Section 2.1 confirmed this file exists and is complete).

**Steps:**
1. `cp .env.example apps/api/.env` and fill in local-only values: local MongoDB URI (Section 5.9's Compose service), local Redis URI, a locally-generated JWT secret pair, Razorpay/Cloudinary **sandbox/test** credentials only.
2. `cp .env.example apps/storefront/.env.local` and `apps/admin/.env.local`, filling only the `NEXT_PUBLIC_*` subset.
3. Implement `apps/api/src/core/config/`'s boot-time fail-fast validation (a Zod schema over `process.env`, per `06_project_structure.md` §4.2 and `09_security_architecture.md` §5.2) — this is infrastructure/tooling, explicitly allowed under "no business logic," since it validates configuration shape, not a business rule.
4. Confirm `.env`, `.env.local` are gitignored (already true per Section 2.3's `.gitignore` review) and never committed.

**Acceptance criteria:** `apps/api` fails to boot with a clear, specific error message when a required variable is missing (fail-fast, not a silent `undefined` downstream) — the actual server-boot behavior itself is Sprint 1 scope (needs `app.ts`), but the config-validation module and its unit test can be built and verified in isolation now.

### 5.9 Docker Base

**Objective:** replace the four placeholder `docker/apps/Dockerfile.*` stub comments (Section 2.1) with real, working multi-stage base images — infrastructure, not business logic.

**Steps:**
1. `Dockerfile.api` and `Dockerfile.worker`: multi-stage (deps → build → runtime), Node 22-alpine base, pnpm via Corepack, `--frozen-lockfile` install, non-root user, per `10_devops_architecture.md` §4's Container Strategy.
2. `Dockerfile.storefront` and `Dockerfile.admin`: multi-stage Next.js build (deps → build → standalone runtime output), per the same container strategy.
3. `docker/docker-compose.local.yml`: real service definitions for `mongodb` (official image, matching `03_database_design.md`'s version expectations), `redis`, `api`, `worker`, `storefront`, `admin`, wired to `apps/api/.env` — this is the Local environment per `10_devops_architecture.md` §3.
4. Confirm each image build stage produces the artifact directory `turbo.json`'s `outputs` field expects (Section 2.3 already verified this field is correct).

**Acceptance criteria:** `docker compose -f docker/docker-compose.local.yml up` brings up `mongodb` and `redis` successfully (the app services will not yet serve real traffic until Sprint 1's `app.ts`/`server.ts` exist — Section 5.11's health check is the point at which this becomes fully verifiable end-to-end).

### 5.10 GitHub Actions Base

**Objective:** replace the three placeholder `.github/workflows/*.yml` stub comments (Section 2.1) with a real, running `pr-checks.yml` — `deploy-staging.yml`/`deploy-production.yml` stay placeholders until Sprint 1 produces a deployable artifact, since deploying nothing is not a meaningful workflow to build yet.

**Steps:**
1. `pr-checks.yml`: on `pull_request`, run `pnpm install --frozen-lockfile`, then `turbo run lint typecheck test build` scoped to affected packages (`--filter=...[origin/main]`, per `05_repository_strategy.md` §15's affected-package detection).
2. Add a Turborepo remote-cache token as a repository secret (the specific hosting choice — Vercel Remote Cache vs. self-hosted — remains `05_repository_strategy.md` §18's open item; use local-cache-only in CI until that's resolved, which still works correctly, just without cross-run cache reuse).
3. Leave `deploy-staging.yml`/`deploy-production.yml` as placeholders, now updated to state explicitly: "Blocked on Sprint 1 producing a real deployable artifact — see `docs/13_deployment_strategy.md` §2 for the promotion path this will implement."

**Acceptance criteria:** opening a PR against this repository triggers `pr-checks.yml`, and it passes (green) against the current scaffold — lint/typecheck/build all succeed with zero application code, which is the correct baseline state to lock in before Sprint 1 adds real code on top of it.

### 5.11 Health-Check Verification

**Objective:** prove the foundation is actually alive end-to-end — the one step that validates Sections 5.1–5.10 together, not just individually.

**Steps:**
1. Implement a minimal `GET /health` route directly in `apps/api/src/app.ts` (infrastructure, not a feature module — does not belong to any of the 15 business modules, consistent with `10_devops_architecture.md` §11's liveness/readiness probe pattern) returning `{ status: "ok", uptime, mongoConnected, redisConnected }`.
2. Mongo/Redis connectivity checks call `core/database` and `core/cache`'s connection modules (Section 4.2 of `06_project_structure.md` — these are cross-cutting infrastructure, explicitly not business logic).
3. Boot the stack via `docker compose -f docker/docker-compose.local.yml up`.
4. `curl http://localhost:<port>/health` — confirm `200 OK` with `mongoConnected: true`, `redisConnected: true`.
5. Add this same health check as a required step in `pr-checks.yml`'s eventual integration-test stage (deferred to Sprint 1, once `testing/integration/` has a real target to run against).

**Acceptance criteria:** a fresh clone, `pnpm install`, `docker compose up`, and one `curl` call returns a healthy status with both database connections confirmed live — this is Sprint 0's actual Definition of Done, not any individual track above in isolation.

---

## 6. Sprint 0 — Consolidated Checklist

- [ ] `pnpm install` succeeds; `pnpm-lock.yaml` committed (5.1)
- [ ] `turbo run build --dry-run` graph matches Section 2.6 exactly (5.1)
- [ ] Node 22 / pnpm 9 pinned and enforced via Corepack (5.2)
- [ ] `packages/tsconfig/{base,nextjs,node}.json` authored; every app/package extends them (5.3)
- [ ] `packages/eslint-config` populated, including the module-boundary rule; `pnpm lint` clean (5.4)
- [ ] `.prettierrc.json` + `.prettierignore` authored; `pnpm format:check` passes (5.5)
- [ ] Husky pre-commit (lint-staged) and commit-msg (commitlint) hooks installed and verified (5.6)
- [ ] `commitlint.config.js` enforces Conventional Commits with a 15-module scope-enum (5.7)
- [ ] `.env`/`.env.local` populated locally (never committed); boot-time fail-fast config validation implemented (5.8)
- [ ] All 4 Dockerfiles are real multi-stage builds; `docker-compose.local.yml` brings up `mongodb`+`redis` (5.9)
- [ ] `pr-checks.yml` is real and green on an empty-code PR (5.10)
- [ ] `GET /health` returns `200` with confirmed Mongo + Redis connectivity (5.11)
- [ ] The one `turbo.json` deviation (Section 3) remains corrected, no regression
- [ ] `implementation/` folder's traceability gap (Section 0) recorded as a candidate for a lightweight future ADR against `06_project_structure.md`

**Sprint 0 is complete when every box above is checked.** Sprint 1 (per `docs/15_master_project_plan.md` Phase 1) begins only after this checklist is fully closed — building `auth`/`users`/`admin` on top of a foundation that isn't itself verified would repeat the exact category of gap `docs/00_architecture_review.md` was created to catch, one layer down.

---

*This document is an implementation plan. It contains no business logic. It modifies no locked architecture document (the one file edited during this pass, `turbo.json`, is repository tooling configuration created by the scaffold, not one of `docs/00`–`18`).*
