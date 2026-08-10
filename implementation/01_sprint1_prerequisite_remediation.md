# Sprint 1 Prerequisite Remediation

**Date:** 2026-08-10
**Scope:** Foundation/prerequisite infrastructure only. No `auth`/`users`/`admin` business logic was implemented — verified: `apps/api/src/modules/` contains **0 `.ts` files** at the end of this work.
**Governing rule:** `docs/18_CLAUDE_CONSTITUTION.md`. No locked document (`docs/01`–`18`) was modified.

---

## 1. Executive Summary

The Sprint 1 audit identified prerequisites that did not exist. This remediation verified the live repository (not prior session output), built the missing cross-cutting foundation, corrected one deviation Sprint 0 introduced, established the database foundation, and routed three genuine ambiguities to the ADR process rather than deciding them.

**Resolved:** `core/exceptions`, `core/security`, `core/di`, `core/database`'s transaction helper, the `/health`÷`/ready` split, and the identity database foundation (indexes + reference data) — all executed and verified against live infrastructure, not asserted.

**Not resolved, and not resolvable inside this repository:** privileged-account provisioning (ADR-0002, blocks `RegisterUser` only) and Shared Development provisioning (ADR-0003 + absent cloud accounts).

**Verdict: NOT READY** — see §14. One architectural security decision remains open, which is a disqualifying condition under the gate's own definition.

---

## 2. Initial Findings

Carried in from `implementation/01_sprint1_identity_access.md` v1.1's review, each **re-verified against the live repository** before any edit:

| # | Finding | Verified? |
|---|---|---|
| 1 | 6 of 10 `core/` subsystems were `.gitkeep`-only placeholders | Confirmed — `config`, `database`, `cache`, `logger` had real code; `security`, `events`, `exceptions`, `utils`, `constants`, `di` did not |
| 2 | `GET /health` conflated liveness and readiness, contradicting `docs/10` §10.4 | Confirmed — single endpoint returning `mongoConnected`/`redisConnected` |
| 3 | `core/database` lacked the session/transaction helper `docs/06` §4.2 specifies | Confirmed |
| 4 | No migrations existed; `run.ts` was a `console.log` stub | Confirmed |
| 5 | Ambiguity: who may register as `STAFF` | Confirmed — no locked document resolves it |
| 6 | Shared Development not provisioned | Confirmed — no IaC files, no cloud CLI, 4-line placeholder deploy workflows |
| 7 | **New:** CORS was wide-open `cors()`, contradicting `docs/08` §4.8's strict allow-list | Found during this pass |
| 8 | **New:** No IaC tool is named anywhere in `docs/07` or `docs/10` | Found during this pass — blocks §6 independently of cloud access |

---

## 3. Repository Audit

| Area | Expected | Actual (pre-remediation) | Status | Action taken |
|---|---|---|---|---|
| Root structure | `docs/06` §9 tree | All 10 top-level folders present | ✅ | None |
| `apps/api/src/core/` | 10 subsystems (`docs/06` §4.2) | 4 real, 6 placeholders | 🔴 | Built 3, documented 3 deferrals |
| 15 feature modules | 4-layer scaffold, no code | Scaffold intact, 0 `.ts` files | ✅ | Untouched (by design) |
| Workspace packages | 7 + 3 apps (`docs/06` §5) | 10 resolve via `workspace:*` | ✅ | None |
| pnpm / Turborepo | `docs/05` §4–5 | pnpm 9.15.9, turbo 2.10.9 | ✅ | None |
| tsconfig | `docs/07` §20.1 strict | Strict, shared base | ✅ | None |
| ESLint boundary rule | `docs/06` §4.3 enforcement | Live | ✅ | Re-smoke-tested (§10) |
| Prettier / Husky / Commitlint | `docs/07` §20.3, `docs/11` §3.3 | All live | ✅ | None |
| Env config | Fail-fast Zod (`docs/09` §5.2) | Live, but no CORS variable | 🟡 | Added `CORS_ALLOWED_ORIGINS` |
| Docker | `docs/10` §4.1 deps→build→runtime | 4 Dockerfiles, compose stack healthy | ✅ | Added `HEALTHCHECK` |
| GitHub Actions | `docs/10` §6.1 | `pr-checks.yml` real; deploys are stubs | 🟡 | Left as stubs (blocked, §8) |
| Health endpoints | `docs/10` §10.4 two endpoints | One conflated endpoint | 🔴 | Split (§5) |
| DB / Redis connections | `docs/06` §4.2 | Connection factories present | 🟡 | Added transaction helper |
| Migrations / seeds | `docs/13` §5 | `console.log` stubs | 🔴 | Built runner + 2 migrations (§6) |
| Git | — | 3 commits, clean tree, nothing pushed | ✅ | None |

---

## 4. Core Infrastructure Remediation

### Built

**`core/exceptions`** — `AppError` base + the four classes `docs/02` §16 / `docs/06` §4.2 name (`NotFoundError` 404, `ValidationError` 400, `ConflictError` 409, `UnauthorizedError` 401), the `{success, data, error, meta}` envelope builder (`docs/08` §3.2–3.3), and the centralized error-mapping middleware. Unhandled `ZodError`s map to `VALIDATION_ERROR` with per-field `details`. Raw errors become a generic 500 that never leaks the underlying message (OWASP API8:2023).

> **Deliberate omission:** no `ForbiddenError`/403 class. `docs/02` §16 and `docs/06` §4.2 name exactly four classes; 403 is produced by `rbacMiddleware`/ownership checks (`docs/08` §4.3), which are `auth`-module business logic and out of scope. Adding one later requires no change to the middleware.

**`core/security`** — `corsPolicy` (strict allow-list from `CORS_ALLOWED_ORIGINS`, credentialed, never wildcard — `docs/08` §4.8), `securityHeaders` (Helmet), and `createRateLimiter`, a **generic Redis-backed factory that invents no rate-limit values**: `docs/08` §4.4's tiers are supplied by the module wiring a route, per `docs/06` §4.2's "generic middleware factories" rule. CSRF posture is documented in `core/security/README.md` as requiring no middleware (`docs/08` §4.9 — `SameSite=Strict` on the one cookie, set by `auth` when it issues it).

**`core/di`** — manual composition root (`docs/02` §7.3, no DI framework). Wires only the infrastructure that exists (logger, cache, mongoose) into one idempotent `AppContext`, with a marked extension point for module wiring. Contains no business logic and makes no domain decisions.

**`core/database`** — added `withTransaction()` (`docs/06` §4.2's session/transaction helper). Generic mechanism only; **no transaction boundary is defined** — `docs/03` §13.1 scopes those narrowly to order+reservation and lead conversion, neither of which exists.

**`core/logger`** — added `requestIdMiddleware` (`docs/06` §4.2's "request-ID middleware", `docs/08` §3.1's `X-Request-ID`), which the error envelope's `meta.requestId`/`error.traceId` depend on.

### Deliberately not built — documented, with a README in each folder

| Subsystem | Reason |
|---|---|
| `core/events` | No Phase-1 event exists in `docs/02` §10/§16's list; the outbox is first exercised in Phase 3 (`leads`). Building a bus with no event to carry would invent an interface against nothing. |
| `core/utils` | Nothing in the foundation or Sprint 1 plan needs a helper. Populating it speculatively invites the dumping-ground anti-pattern. |
| `core/constants` | Sprint-1-relevant values are configuration (`core/config`) or module-owned, not cross-module constants. |

### New dependencies

`express-rate-limit` + `rate-limit-redis`. **Not** a new architectural decision: Redis-backed rate limiting is already locked (`docs/02` §16; `docs/07` §7.1 names "rate-limit counter store" as a Redis responsibility). No locked document names a specific rate-limiting package the way it names bcrypt/jsonwebtoken, so this is an implementation-detail choice within an already-locked capability — the same category as Sprint 0's `eslint-plugin-import`/`FlatCompat` choices. **Flagged for reviewer confirmation** (§11, item 4).

---

## 5. Health / Readiness Remediation

`docs/10` §10.4 requires two endpoints with two different remediation behaviors. Implemented:

| Endpoint | Semantics | Depends on Mongo/Redis? |
|---|---|---|
| `GET /health` | Liveness — "is the process alive?" → failure means restart | **No, by design** |
| `GET /ready` | Readiness — "can this instance serve traffic?" → failure means drain from rotation | Yes; 200 when both connected, 503 otherwise |

`docker/apps/Dockerfile.api` gained a `HEALTHCHECK` probing `/ready` (Compose's `depends_on: service_healthy` gates on readiness, not liveness), and `docker-compose.local.yml`'s `storefront`/`admin` now wait on `condition: service_healthy` rather than mere container start. The Dockerfile comment records the ECS mapping (`docs/10` §8.1): container health check → `/health`, ALB target group → `/ready`.

**Behaviorally proven, not asserted** — see §9.

---

## 6. Database Foundation

A migration runner (`packages/database/migrations/run.ts`) plus a `Migration` contract typed to `docs/13` §5.1's three MongoDB change categories (`index` / `validator` / `backfill`). Every migration is idempotent (§5.1) and carries its own `verify()` step (§5.5 — "a migration is not considered complete until this check passes").

**`0001-identity-indexes`** (`index`) — every index cited, none invented:

| Collection | Index | Source |
|---|---|---|
| `users` | `{email:1}`, `{phone:1}` unique + partial `isDeleted:false` | `docs/03` §10.6, §10.2 |
| `roles` | `{name:1}` unique + partial | §9.1.2 + §3.1's soft-delete rule |
| `permissions` | `{key:1}` unique + partial | §9.1.3 + §3.1 |
| `refresh_tokens` | `{expiresAt:1}` TTL, `{userId:1}` | §10.3, §9.1.4 |
| `otp_verifications` | `{expiresAt:1}` TTL | §10.3 |
| `password_reset_tokens` | `{expiresAt:1}` TTL | §10.3 |
| `audit_logs` | `{entityType:1, entityId:1, occurredAt:-1}` | §10.6 |

Indexes only — no Mongoose schemas, no `$jsonSchema` validators (those belong to a `validator`-category migration authored with the module that owns the writes), no business logic.

**`0002-identity-reference-data`** (`backfill`) — the 7 system roles (`docs/03` §9.1.2, unchanged per `docs/09` §2.3) and the 6 Phase-1 permission keys (`docs/08` §8's three contract rows). Treated as a **migration, not seed data**, per `docs/13` §5.4's explicit carve-out. Idempotent via `$setOnInsert` upsert.

> **Only `SUPER_ADMIN` receives permission grants.** That grant is explicitly specified (`docs/02` §14 "Full access, including User & Role Management"; `docs/08` §8 "`SuperAdmin`-only"). **No locked document specifies what the other six roles hold across these six keys** — `docs/02` §14 describes them in terms of business modules that have no permission keys yet. Assigning those would be inventing an authorization decision. They are therefore empty, which is the fail-closed default `docs/09` §2.2 requires. Tracked as open decision §11 item 1.

> **`schema_migrations` tracking is NOT implemented.** `docs/18` §2.6 requires that gap be closed via ADR "before or during its first use". ADR-0001 is drafted and **Proposed, not approved**, so per `docs/18` §6.4 the runner records nothing and relies solely on idempotency. One marked extension point awaits approval. Consequence: `docs/13` §10.2's "Recorded in the `schema_migrations` tracking collection" release-checklist item is currently **unsatisfiable**.

---

## 7. Registration Security Decision

**Not decided here.** `docs/02`, `docs/03`, `docs/08`, `docs/09`, `docs/11`, `docs/15`, `docs/16`, `docs/18` were searched; **no explicit resolution exists**.

`docs/15` §3.1 says a `STAFF` account "can register"; `docs/08` §8 makes `POST /auth/register` unauthenticated; nothing constrains the `userType` an anonymous caller may request. Taken literally that is privilege escalation, contradicting `docs/09` §2.2 (fail-closed), §1.12 (Admin as highest-value target), and the permission-key model itself.

**ADR-0002** (`docs/adr/0002-privileged-account-provisioning.md`) records the problem, the search performed, three options, and a recommendation (public register → `CUSTOMER` only; privileged accounts via authenticated `POST /admin/users`; first `SUPER_ADMIN` via migration, mirroring `docs/09` §2.8's `SUPER_ADMIN`-mediated-not-self-service precedent). **Status: Proposed. Not self-approved.**

**Consequence: `RegisterUser` MUST NOT be implemented until ADR-0002 is approved.** Every other `auth` use case (login, refresh, logout, MFA setup/verify, password reset) is unaffected — none depends on how an account was created.

---

## 8. Shared Development Environment

### Status: **NOT PROVISIONED**

Verified in the live repository: no `.tf`/`.tfvars`/CloudFormation/CDK files anywhere; `configs/deployment/` and `configs/environments/` contain only `.gitkeep` + README; `deploy-staging.yml` and `deploy-production.yml` are 4-line placeholders; no `aws` CLI; no cloud credentials; nothing pushed to any remote.

**Two independent blockers, one of which is not about credentials:**

1. **No IaC tool is named anywhere** in `docs/07` (all 19 technology categories) or `docs/10` (§9 Infrastructure, §19 Open Items). Authoring Terraform/CDK/CloudFormation would introduce an unapproved technology (`docs/18` §2.4); provisioning by hand in a console would violate `docs/10` §2.2's "configuration is data, no direct environment edit outside version control". **ADR-0003** records this gap and deliberately recommends **no option** — `docs/18` §6.2 requires `docs/07`-grade alternatives analysis, which is the CTO's and Principal DevOps Architect's work, not this remediation's.
2. **No AWS account, MongoDB Atlas cluster, or credentials exist.** External to the repository entirely.

**Nothing was faked.** No IaC was written, no provisioning claimed.

**Knock-on effect:** `docs/11` §7.2's Definition of Done includes "Deployed to Shared Development and confirmed functioning there" — **unsatisfiable for every Sprint 1 Story**. Either Shared Dev is built, or `docs/11` §7.2's DoD is formally amended for the pre-Shared-Dev period; the latter is itself an ADR-worthy change to a locked document and is **not** assumed here.

---

## 9. Testing Results

Every result below was **actually executed** in this session.

### Automated suites

| Check | Command | Result |
|---|---|---|
| Install | `pnpm install` | ✅ Pass |
| Lint | `pnpm lint` | ✅ 8/8 packages |
| Typecheck | `pnpm typecheck` | ✅ 7/7 packages |
| Format | `pnpm format:check` | ✅ Clean (stable — one oscillating file restructured) |
| Unit/integration tests | `pnpm test` | ✅ **20/20 passed**, 6 files |
| Build | `pnpm build` | ✅ All packages + both Next.js apps |
| Docker build | `docker compose build api worker` | ✅ Both images built |
| Docker Compose startup | `docker compose up -d` | ✅ All 6 services; api reached `healthy` |

Test files added this pass: `core/exceptions/error-handler.test.ts` (7), `core/security/cors.test.ts` (3), `core/security/rate-limit.test.ts` (2), `core/di/composition-root.test.ts` (2); `app.test.ts` rewritten for the endpoint split (2).

### Live-infrastructure verification

| Check | Evidence |
|---|---|
| MongoDB connectivity | `/ready` → `mongoConnected: true` |
| Redis connectivity | `/ready` → `redisConnected: true` |
| `/health` liveness contract | `200 {"status":"ok","uptime":…}` — asserted to **not** contain dependency fields |
| `/ready` readiness contract | `200 {"status":"ready","mongoConnected":true,"redisConnected":true}` |
| **Liveness/readiness split proven** | MongoDB stopped → `/health` **stayed 200**, `/ready` returned **503** `mongoConnected:false`; MongoDB restarted → `/ready` recovered to 200 **without a container restart**. This is exactly `docs/10` §10.4's required behavior. |
| Security headers | Live response carries `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options`, `X-Request-ID` |
| Migration execution | Both migrations applied and self-verified against the live Mongo container |
| **Migration idempotency** | Second full run succeeded; counts unchanged (7 roles, 6 permissions, 6 `SUPER_ADMIN` grants, 3 `users` indexes) |
| Index verification | Queried live DB: 3 TTL indexes (`expireAfterSeconds=0`), partial-unique on `users.email`/`users.phone` with `{"isDeleted":false}`, `roles.uniq_role_name_active`, `audit_logs.entity_audit_trail` |
| Config validation | `parseEnv` unit tests incl. missing-var and short-secret rejection |
| DI composition | Idempotency asserted (same instance across calls) |
| Error handling | 6 mappings asserted end-to-end over HTTP + `X-Request-ID` echo |
| CORS behavior | Allowed origin reflected w/ credentials; disallowed origin **not** reflected |

### Not tested, and why

- **Rate-limit runtime behavior** — construction is tested; exercising it requires Redis, and `pr-checks.yml` provisions no service containers. Verified once a real route uses the factory.
- **`pr-checks.yml` on real GitHub Actions** — nothing has been pushed to a remote.
- **Anything in Shared Development** — does not exist (§8).

---

## 10. Architecture Compliance

| Dimension | Source | Result |
|---|---|---|
| Repository structure | `docs/06` §9 | ✅ Unchanged |
| Package boundaries | `docs/05`, `docs/06` §6 | ✅ No new cross-package dependency; no app imports another app |
| `core/` contains no module logic | root `CLAUDE.md`, `docs/06` §4.2 | ✅ Grep confirms zero `core/` → `modules/` imports |
| Module-boundary rule live | `docs/06` §4.3 | ✅ **Re-smoke-tested**: a deliberate cross-module `domain/` import produced the exact cited error; probe files removed (0 `.ts` files remain in `modules/`) |
| Domain ⊥ infrastructure | `docs/02` §5 | ✅ No domain code exists yet; rule mechanically enforced |
| DI has no business logic | `docs/02` §7.3 | ✅ Wiring only |
| Naming | `docs/06`, `docs/09` §2.4 | ✅ `kebab-case.ts`, PascalCase classes, `<module>.<action>` permission keys, `SCREAMING_SNAKE` env vars |
| Security | `docs/09` | ✅ For controls in scope (CORS, headers, error hardening, fail-closed grants); ⚠️ MFA/RBAC/password policy are Sprint 1 module scope, not built |
| API | `docs/08` §3.2–3.3, §3.11 | ✅ Envelope + status mapping implemented; **no business endpoint added** |
| Database | `docs/03` §3.1, §9.1, §10 | ✅ Indexes match cited sections exactly |
| DevOps | `docs/10` §4.1, §10.4 | ✅ Health split corrected; ⚠️ §3.2 Shared Dev absent |
| Deployment | `docs/13` §5.1, §5.4, §5.5 | ✅ Migration workflow followed; ⚠️ §5.6 tracking blocked on ADR-0001 |
| Testing | `docs/12` §4.1 | ✅ Foundation tests added; module coverage floors N/A (no module code) |
| Workflow | `docs/11` §7.2 | ⚠️ DoD's Shared-Dev line unsatisfiable (§8) |
| Governance | `docs/18` | ✅ No locked doc modified; 3 ADRs drafted, **none self-approved** |

---

## 11. Remaining Open Items

| # | Item | Type | Owner |
|---|---|---|---|
| 1 | Role→permission mapping for the 6 non-`SUPER_ADMIN` roles | **Requires human decision** | Principal Security Architect |
| 2 | TOTP npm package (`docs/07` §6.3 locks TOTP, names no library) | Open decision | Principal Backend Architect |
| 3 | Breach-list check provider (`docs/09` §2.7 requires it, names none) | Open decision | Principal Security Architect |
| 4 | Confirm `express-rate-limit`/`rate-limit-redis` as implementation detail, not ADR-worthy | Confirmation | Principal Software Architect |
| 5 | `$jsonSchema` validators (`docs/03` §12) | Deferred | With the module owning the writes |
| 6 | `core/events` outbox | Deferred | Phase 3 (`leads`) |
| 7 | Device-management UI (`docs/09` §2.10) | Deferred | Frontend sprint |
| 8 | Login/register UI scope | Open decision | Product + Frontend |
| 9 | CORS-rejection → 403 refinement (currently generic 500) | Low-priority | With `ForbiddenError` |
| 10 | **Potential CI flake (newly observed):** `turbo run lint typecheck test build` — the exact command `pr-checks.yml` runs — failed once on `admin:typecheck` when a *stale* `apps/admin/.next/types` existed, because `next build` regenerates those types while `tsc --noEmit` reads them. Re-running from a clean `.next` passed 23/23. Pre-existing task-graph characteristic (`turbo.json`: `typecheck` dependsOn `^build`, not same-package `build`), **not introduced by this remediation** — but it will surface intermittently in CI. Fix would be a `turbo.json` change (out of this remediation's scope). | Open item | Principal DevOps Architect |

---

## 12. Blockers

| # | Blocker | Blocks | Resolvable in repo? |
|---|---|---|---|
| **B1** | **ADR-0002 unapproved** — who may create `STAFF`/`ADMIN` | `RegisterUser` only | ❌ Human approval |
| **B2** | **ADR-0003 unapproved + no cloud accounts** — Shared Dev | `docs/11` §7.2 DoD for every Story | ❌ Decision + external |
| **B3** | **ADR-0001 unapproved** — `schema_migrations` | `docs/13` §10.2 checklist item | ❌ Human approval |
| B4 | Role→permission mapping unspecified (§11 item 1) | RBAC acceptance testing beyond `SUPER_ADMIN` | ❌ Human decision |

B1 and B4 are architectural/security decisions. B2 and B3 are governance + external infrastructure.

---

## 13. Recommendations

1. **Convene one Architecture Review covering ADR-0001, -0002, -0003 together.** All three are pre-anticipated by the baseline (`docs/16` §17 explicitly expects ADR-0001 "early in implementation"). One session unblocks B1 and B3.
2. **Decide the role→permission matrix (B4) in the same session** — it is the same reviewer and the same domain as ADR-0002.
3. **Treat Shared Development as a parallel DevOps workstream**, not a Sprint 1 task. Start with ADR-0003's IaC decision; it gates everything downstream.
4. **Decide explicitly how Sprint 1 Stories close their DoD** while Shared Dev is absent — amend via ADR, or accept Stories cannot be fully Done. Do not let it pass silently.
5. **Sprint 1 may begin on everything except `RegisterUser`** once ADRs are approved. The `auth` module's other seven use cases, all of `users`, and all of `admin` are unblocked by this remediation.

---

## 14. Final Readiness Verdict

# NOT READY

Not because the foundation is incomplete — it is complete and verified — but because the gate's own definition disqualifies the alternative:

> **NOT READY** — use if "security ambiguity remains" or "a required decision has been silently assumed".

**ADR-0002 (who may create a privileged account) is an unresolved security decision.** That alone forbids **READY**. It also forbids **READY WITH EXTERNAL DEPENDENCY**, whose definition requires "no application implementation is blocked by an unresolved security/architecture decision" — `RegisterUser` is precisely such a blockage.

**What is genuinely ready** (and would satisfy the gate the moment B1/B3/B4 are approved):

- ✅ All Sprint-1-blocking `core/` subsystems built, tested, running in Docker
- ✅ `/health`÷`/ready` corrected and **behaviorally proven** under real dependency failure
- ✅ Identity database foundation applied and verified live, idempotency proven
- ✅ 20/20 automated tests, lint/typecheck/format/build all green
- ✅ Architecture compliance re-verified, boundary rule re-smoke-tested
- ✅ Zero business logic written — scope held

**Distinguishing repository readiness from environment readiness, as required:**

| Dimension | Status |
|---|---|
| Repository / code foundation | **READY** |
| Governance decisions | **BLOCKED** (ADR-0001, -0002, -0003 + role matrix) |
| Shared Development environment | **NOT PROVISIONED** |
| Overall Sprint 1 gate | **NOT READY** |

The single highest-value action is one Architecture Review session. Nothing further can be built inside this repository to change this verdict.
