# Sprint 1 — Identity & Access — Implementation & Closure Report

**Date:** 2026-08-11
**Scope:** Phase 1 per `docs/15_master_project_plan.md` §3.1 — the `auth`, `users`, and `admin` modules.
**Preceded by:** `implementation/02_sprint1_final_readiness_gate.md` (verdict: NOT READY) and the governance decisions in §3–§5 below, which cleared that verdict.

**Final status: `TECHNICALLY COMPLETE — GOVERNANCE BLOCKED`.** Every engineering objective is met and verified by execution. Sprint 1 cannot be marked *Done* under `docs/11_engineering_workflow.md` §7.2 because three of its seven criteria require actions unavailable in this environment. Details in §16.

---

## 1. Executive Summary

Three modules were built to `docs/06_project_structure.md` §4.3's four-layer template, wired through the manual composition root, and exercised end-to-end against the live containerised stack.

| Check | Result |
|---|---|
| Workspace suite (lint / typecheck / test / build), `--force` | **PASS — 23/23 turbo tasks** |
| Automated tests | **PASS — 58/58**, 10 files |
| Acceptance + security regression (live stack) | **PASS — 88/88** |
| Browser verification (real cross-origin, real `HttpOnly`) | **PASS — 10/10** |
| **Total acceptance checks** | **PASS — 98/98** |
| Module-boundary violations | **0** (17 found and fixed architecturally) |
| Locked `docs/00`–`18` changed outside the ADR process | **0** |
| Secrets in the commit scope | **0** |

**Five real defects were found by running the system rather than reading it.** Every one passed lint, typecheck, and the full unit suite. Three were found during implementation; **two more were found during this closure pass**, including one that made the migration suite non-re-runnable. All are detailed in §14.

---

## 2. Implemented Scope

35 TypeScript files across three modules, each following `domain/` → `application/` → `infrastructure/` → `presentation/`.

### `auth`
- **domain** — `AuthUser`, `userType`/`status` enums with the `requiresMfa` predicate, password policy (`docs/09` §2.7's 10/128 bounds), brute-force lockout policy.
- **application** — `RegisterUser`, `LoginUser`, `IssueSession`, `SetupMfa`, `VerifyMfa`, `RefreshTokenUseCase`, `LogoutUser`; port interfaces for every dependency.
- **infrastructure** — Mongoose repositories for `users` and `refresh_tokens`; bcrypt hasher; JWT service; TOTP service.
- **presentation** — six routes, strict-mode Zod validators, `authMiddleware`, refresh-cookie helpers.

### `users`
- **domain** — `Address` value object with the ≤10 bound.
- **application** — `GetOwnProfile`, `UpdateOwnProfile`, `AdminListUsers`, `AdminCreateUser`.
- **infrastructure/presentation** — profile repository; `/users/me`, `/admin/users`.

### `admin`
- **domain** — audit redaction rules.
- **application** — `AuditLogger`, `PermissionResolver`, `ListRoles`/`ListPermissions`/`ListAuditLogs`.
- **presentation** — `/admin/roles`, `/admin/permissions`, `/admin/audit-logs`, all triple-gated.

### Database
Five numbered migrations plus an `ensureIndex` helper: identity indexes, reference data, role→permission grants, `SUPER_ADMIN` bootstrap, and the `users.phone` index correction.

---

## 3. Security Decisions

| # | Decision | Status |
|---|---|---|
| 1 | **Public registration is `CUSTOMER`-only** (ADR-0002 Option 1) | **APPROVED**, implemented, regression-guarded |
| 2 | `STAFF`/`ADMIN` created solely via authenticated `POST /admin/users` | **APPROVED**, verified 403 for non-privileged callers |
| 3 | First `SUPER_ADMIN` bootstrapped by migration, never by HTTP | **APPROVED**, no-op without env vars, no default credentials |
| 4 | MFA mandatory for `STAFF`/`ADMIN` (`docs/09` §2.8) | Implemented; enrolment enforced before any session is issued |
| 5 | Refresh token opaque + SHA-256 hashed, rotated, reuse-detected | Implemented; verified end-to-end |
| 6 | CORS rejection is a **403 policy denial**, not a 500 | Fixed this pass (§14.4) |
| 7 | Rate limiter **fails closed** when Redis is unreachable | Verified by executed test this pass (§14 / §6) |

---

## 4. RBAC Decisions

Recorded in **ADR-0004** (APPROVED 2026-08-11) and implemented by migration `0003`:

| Role | Granted keys |
|---|---|
| `SUPER_ADMIN` | `auth.manage_mfa`, `users.read_self`, `users.read`, `users.write`, `admin.manage_roles`, `admin.view_audit_log` |
| `SALES_MANAGER`, `DESIGN_MANAGER`, `DESIGNER`, `CATALOG_MANAGER`, `SUPPORT_AGENT`, `CUSTOMER` | `users.read_self` |

- `users.read_self` is an **explicit grant**, not an implicit bypass — own-profile access resolves through the same `roles.permissionIds[] → permissions.key` path as every other key.
- `users.read`, `users.write`, `auth.manage_mfa`, `admin.manage_roles` are **`SUPER_ADMIN` only** in Phase 1.
- **Every ungranted cell denies.** Fail-closed by construction (`docs/09` §2.2), not by omission.
- Migration `0003` uses `$set`, so a re-run converges grants back onto the approved matrix rather than leaving drift.

---

## 5. ADR Status

| ADR | Subject | Status |
|---|---|---|
| **0001** | `schema_migrations` tracking collection | **OPEN — PENDING OWNER DECISION** |
| **0002** | Privileged-account provisioning | **APPROVED** 2026-08-11 |
| **0003** | IaC tooling for Shared Development | **OPEN — PENDING OWNER DECISION** |
| **0004** | Phase 1 role→permission matrix | **APPROVED** 2026-08-11 |

### ADR-0001 — what remains unresolved

Not approved, **not implemented**, and correctly so. `run.ts` creates no tracking collection and records nothing; the extension point is marked and unused (`docs/18` §6.4 forbids dependent code before approval).

The single unresolved question: **does the project adopt a `schema_migrations` collection, which `docs/13` §5.6 specifies but `docs/03` §4's Collection Inventory omits?** Consequences while open:
- `docs/13` §10.2's release-checklist item ("verify applied migrations") is **unsatisfiable** — there is no record of what ran.
- Migration safety rests entirely on idempotency. **That property was broken and is now fixed and proven** (§14.1) — but it remains the only safeguard, which is precisely the fragility ADR-0001 exists to remove.

### ADR-0002 / ADR-0004 — process substitution, stated plainly

`docs/18` §6.3 vests approval in the Principal Security Architect and Principal Software Architect via a scheduled Architecture Review. **Neither role is staffed here** (`CODEOWNERS` holds placeholder `@nfi-org/*` handles; no GitHub organisation exists). The project owner approved both directly, exercising that authority.

This is recorded as a **process substitution, not a process completion**. The decisions are authoritative and binding on implementation. They have been reviewed by **one party, not two** — there has been no independent security review. Both should be re-ratified if those roles are staffed.

---

## 6. Dependency Governance Status

**Finding: closed under existing project policy. No ADR is required. Evidence below.**

The governing rule (`docs/18` §2.4, CLAUDE.md) is that an ADR is required for *a technology not already named in `docs/07`*. Verified by search: **zero** of the packages below is named anywhere in `docs/01`–`18`.

| Package | Capability | Locked by | Disposition |
|---|---|---|---|
| `express-rate-limit`, `rate-limit-redis` | Redis-backed rate limiting | `docs/02` §16; `docs/07` §4.2, §7.1; `docs/08` §4.4 | **Closed — implementation detail** |
| `bcryptjs` | bcrypt hashing | `docs/07` §6.2 (algorithm LOCKED) | **Closed — implementation detail** |
| `otplib` | TOTP / RFC 6238 | `docs/07` §6.3 (LOCKED v1.1) | **Closed — implementation detail** |
| `cookie-parser` | `httpOnly` refresh cookie | `docs/02` §9.1; `docs/08` §4.2 | **Closed — implementation detail** |

**Why this is applying a documented rule, not inventing approval:**

1. **The project's own pre-existing practice.** `ioredis`, `jsonwebtoken`, `helmet`, and `cors` shipped in the Sprint 0 scaffold (verified against commit `56e24bf`) and **none is named in `docs/07` either**. Requiring an ADR for `express-rate-limit` would retroactively require one for four dependencies the baseline plainly accepted.
2. **`docs/07` §6.1 says so explicitly for JWT**: *"The JWT library itself follows Section 1.1"* — treating the library as a versioning concern, not a locked identity.
3. The locked documents name **capabilities and technologies**; they never name npm packages.

**Residual recommendation (not a blocker):** the *principle* — "a package implementing an already-locked capability is an implementation choice" — is established by precedent and one explicit JWT statement, but has never been written down as a general rule. A one-line addition to `docs/07`'s governance section would stop this recurring per package. That would itself be an ADR-gated locked-doc change; **recommended, not urgent.**

Nothing was added, removed, or upgraded during closure.

---

## 7. Tests

**58/58 passing, 10 files** (`pnpm turbo run … --force`, zero cache).

| Suite | Cases |
|---|---|
| `register-user.test.ts` — ADR-0002 regression guard | 8 |
| `login-user.test.ts` | 7 |
| `rbac.test.ts` | 10 |
| `auth-user.repository.test.ts` — **new this pass** (§14.2) | 9 |
| `rate-limit.test.ts` — **rewritten this pass** (§14.3, §14.5) | 5 |
| `cors.test.ts` — **extended this pass** (§14.4) | 4 |
| `app.test.ts`, `error-handler.test.ts`, `composition-root.test.ts`, health/ready | 15 |

Net: 45 → **58** across the closure pass.

**Coverage is NOT measured** — see §15.

---

## 8. Acceptance Tests

### **98/98 PASS**

| Phase | Checks | Result |
|---|---|---|
| Auth: registration / ADR-0002 | 15 | **15/15** |
| Auth: login & enumeration resistance | 6 | **6/6** |
| Tokens & refresh cookie attributes | 5 | **5/5** |
| RBAC (CUSTOMER denial surface) | 16 | **16/16** |
| CORS | 9 | **9/9** |
| Rate limiting | 4 | **4/4** |
| MFA lifecycle | 15 | **15/15** |
| Privileged RBAC (`SUPER_ADMIN`) | 9 | **9/9** |
| Refresh rotation + reuse detection | 4 | **4/4** |
| Audit redaction & token storage | 6 | **6/6** |
| Browser (real cross-origin) | 10 | **10/10** |

**Note on method:** `docs/08` §4.4's Strict tier (5 req/min per IP) is active and every request originates from one IP, so the suite would exhaust the budget mid-run. Between phases only the `ratelimit:*` counter keys are cleared — test-fixture reset, equivalent to truncating a table between cases. **The limiter's configuration, tiers, and enforcement were never modified**, and the tier is asserted for real in the final phase (6th request → 429).

---

## 9. Live Container Verification

All six services running; `api` rebuilt from the final source.

| Service | Status | Probe |
|---|---|---|
| `mongodb` | healthy | — |
| `redis` | healthy | — |
| `api` | healthy | `/health` **200**, `/ready` **200** |
| `storefront` | up | **200** |
| `admin` | up | **200** |
| `worker` | up | — |

`/ready` → `{"status":"ready","mongoConnected":true,"redisConnected":true}`.

Migrations run twice against the live database: **all 5 applied and verified both times** (§14.1).

---

## 10. Browser Verification

Run from a **real browser at `http://localhost:3000`** issuing cross-origin `fetch` to the API on `:4000` — the only way to exercise the parts of `docs/08` §4.2/§4.8 enforced *by the client*.

| # | Check | Result |
|---|---|---|
| 1 | Cross-origin `/ready` from allow-listed origin | 200, both deps connected ✅ |
| 2 | **`HttpOnly` genuinely hides the refresh token from JS** | `document.cookie` **empty** while the token works ✅ |
| 3 | Access token in response **body**, never a cookie | ✅ |
| 4 | Full CUSTOMER round-trip in-browser | 201 / 200 / 200 ✅ |
| 5 | ADR-0002 guard against browser-issued `userType: ADMIN` | **400 VALIDATION_ERROR** ✅ |
| 6 | CUSTOMER → `/admin/roles` | **403** ✅ |
| 7 | Token carries exactly `["users.read_self"]` | ✅ |
| 8 | Malformed `userId` no longer 500s | **401** ✅ |

Check 2 is **not assertable from any server-side test** — curl will hand a script the cookie it was sent. Only a browser enforces `HttpOnly`, and it does.

---

## 11. Security Verification

| Area | Result |
|---|---|
| `STAFF`/`ADMIN`/`SUPER_ADMIN` self-registration | **400 VALIDATION_ERROR** — all three |
| Arbitrary `roleId` (mass assignment) | **400** — `.strict()` rejects, does not strip |
| Duplicate email / weak password | **409 CONFLICT** / **400** |
| Login: wrong password vs unknown account | **Byte-identical message** — no enumeration |
| Password storage | bcrypt cost 12, `$2` verified by migration |
| MFA: privileged login before enrolment | `MFA_ENROLMENT_REQUIRED`, **no token, no cookie** |
| MFA: secret exposure | Returned **only** inside the `otpauth://` URI, never as a bare field |
| MFA: wrong TOTP | **401**, no token issued |
| MFA: session issued only after second factor | ✅ |
| MFA: enrolled account, password alone | `MFA_REQUIRED`, **no token** |
| Refresh cookie | `HttpOnly`, `SameSite=Strict`, `Path=/api/v1/auth/refresh` |
| Refresh storage | 64-char SHA-256; **no plaintext token field persisted** |
| Refresh rotation → replay | **401**, and the **entire family revoked** |
| Audit | `TOKEN_REUSE_DETECTED` + privileged `CREATE` recorded |
| Audit redaction | **No secret-equivalent field carries a value at any nesting depth** |
| Profile responses | No `passwordHash`, `mfaSecret`, or `passwordHistory` |
| RBAC | CUSTOMER denied all 5 admin surfaces; 403 never names the missing key |
| Rate limiting | Strict 429 on 6th; Standard permits normal traffic; **fails closed** on store outage |

---

## 12. CORS Verification

| Check | Result |
|---|---|
| Allowed origin (`localhost:3000`) | **200**, reflected, `Allow-Credentials: true` |
| Disallowed origin | **403 FORBIDDEN** (was **500** — §14.4) |
| Disallowed **preflight** | **403** |
| Attacker origin reflected? | **No** — zero `Access-Control-Allow-Origin` headers |
| Error message echoes attacker origin? | **No** (`docs/09` §11 rule 11) |
| No-`Origin` (server-to-server) | **200** — unaffected |

---

## 13. Refresh-Token Reuse Verification

| Step | Expected | Result |
|---|---|---|
| Login, snapshot cookie | — | stored ✅ |
| `POST /auth/refresh` | 200, rotates | **200** ✅ |
| **Replay the rotated cookie** | 401 | **401** ✅ |
| The *still-valid* current cookie afterwards | 401 — family revoked | **401** ✅ |
| `audit_logs` entry | `TOKEN_REUSE_DETECTED` | present ✅ |
| Audit entry contains no token/hash | — | verified ✅ |
| `refresh_tokens` rows | all revoked | `total=2 revoked=2 active=0` ✅ |
| Stored `tokenHash` | 64-char SHA-256 | **64** ✅ |

`docs/02` §9.1 and `docs/09` §2.6 satisfied: reuse is not merely rejected — it revokes every session for that user and leaves the required audit trail.

---

## 14. Defects Found by Running the System

### 14.1 Migration suite was not re-runnable — **found during closure, deployment-blocking**

`0005` corrected `0001`'s `uniq_phone_active` index. But `0001` then unconditionally re-created the same index **name** with the **old** spec, so MongoDB rejected it with `IndexKeySpecsConflict` (code 86).

**Consequence: the second `pnpm migrate` against any already-migrated database aborted at `0001`, and `0002`–`0005` never ran.** Every deploy, and every developer running migrations against a shared database, would have hit this.

It matters more here than it normally would: ADR-0001 is unapproved, so `run.ts` records nothing and **re-applies every migration on every run**. Idempotency is not a nicety in that design — it is the entire safety argument, and it was false. Both `docs/13` §5.1 and this package's own `Migration` contract ("Must be safe to run repeatedly") were violated.

**Fixed** with a new `ensureIndex` helper that skips an index whose name already exists, leaving the owning migration's shape intact. On a fresh database the resulting schema is byte-identical; only the "already exists" path changes — so this corrects *how* `0001` applies without rewriting *what* it decided. **Proven by running the full suite twice: all 5 applied and verified on both runs.**

### 14.2 Malformed `userId` returned 500 — **found during closure**

`POST /auth/mfa/setup` and `/auth/mfa/verify` are **unauthenticated** and take a client-supplied `userId`. Anything Mongoose could not cast to an ObjectId raised a `CastError`, which the error handler could only classify as **500 INTERNAL_ERROR**.

Two consequences: any caller could manufacture 500s on demand, inflating the 5xx rate `docs/10` §6.2 alerts on; and a malformed id behaved observably differently from a non-existent one (500 vs 401) — an enumeration signal `docs/09` §10 rules out for the auth surface.

**Fixed** in the repository layer (ObjectId shape is a persistence detail, `docs/02` §7.1): a non-24-hex id returns `null` without querying, so both cases converge on **401 "Invalid session"**. Guarded by 9 new tests including path-traversal and operator-injection shapes.

### 14.3 Rate limiter's fail-open/fail-closed behaviour was unverified

`implementation/02_rate_limit_dependency_decision.md` §6 item 3 flagged this as unknown. A limiter that failed **open** would silently remove brute-force protection from every auth endpoint exactly when infrastructure is degraded — the moment an attacker is most likely probing.

**Verified: it fails CLOSED.** `express-rate-limit` propagates a rejected `store.increment()` to `next(error)`, so the request terminates in the error handler and never reaches the route. Proven by an executed test injecting a throwing store, not by reading the library.

### 14.4 CORS rejection returned 500 instead of 403

`corsPolicy` rejected non-allow-listed origins with a bare `Error`, producing **500 INTERNAL_ERROR** on both the request and the preflight. The code justified this with a comment claiming "no `ForbiddenError`/403 class exists yet" — **which had stopped being true earlier in the same Sprint**, when §14.7 added exactly that class. A stale comment was licensing a defect.

Never a data-exposure gap (the origin is never reflected), but a 500 misreports a working policy as a server fault and hands unauthenticated callers a free 500 generator. **Fixed** to `ForbiddenError` → `docs/08` §3.11's 403, without echoing the attacker-controlled origin.

### 14.5 Spurious `ECONNREFUSED ::1:6379` in test output

Two causes: `vitest.config.ts` used `localhost`, which Node resolves to `::1` first on Windows while local Redis listens on IPv4; and constructing a `RedisStore` issues Redis commands, so a pure *shape* test opened a socket — while `pr-checks.yml` provisions no Redis at all, meaning IPv4 alone would not have fixed CI.

**Fixed at the root**: the store is now injectable (`createRateLimiter(config, store?)`), so construction tests need no socket, and the URL was pinned to `127.0.0.1`. **Redis testing was not disabled and the production path is unchanged** — omitting the argument still builds the Redis-backed store. The change is what made §14.3's fail-closed test possible at all.

### 14.6 Broken partial-unique index — found during implementation

`0001` created `{phone: 1}` unique filtered only on `isDeleted: false`. Since `phone` is optional, MongoDB indexed `null` — the bootstrap `SUPER_ADMIN` consumed the single permitted null, so **the second phone-less registration failed with 500 E11000**. The platform could hold exactly one phone-less account. Fixed forward in `0005`.

### 14.7 Sprint 0 ESLint rule contradicted its own locked spec

The module-boundary rule forbade `core/**` importing modules, but `docs/06` §4.2's `di/` row specifies its dependencies as "Every module's exported constructor". Corrected by exempting `core/di/` with the citation recorded. The 17 resulting boundary violations were fixed **architecturally, not by relaxing rules** — `rbacMiddleware` moved to `core/security`, the response envelope to `core/exceptions`, `ForbiddenError` added there, and domain constants re-exported through `application/`.

---

## 15. Known Issues

| # | Item | Status |
|---|---|---|
| 1 | **Coverage not measured** — `docs/11` §5.7 requires 80% on Domain/Application as a CI gate | **OPEN.** No coverage provider is installed; adding one is a dependency change requiring authorization |
| 2 | Breach-list password check (`docs/09` §2.7) | **OPEN** — no provider named in any locked document |
| 3 | Password-history enforcement | **OPEN** — field populated; "block last 5" not wired, as no change-password endpoint exists in `docs/08` §8's Phase 1 surface |
| 4 | `docs/09` §2.5 session cap | Implemented for `SUPER_ADMIN`/`DESIGN_MANAGER`; **not load-tested** |
| 5 | `docs/09` §12.1 rate-limit load test | **OPEN** — tiers verified functionally, not under load |
| 6 | OpenAPI generation from Zod (`docs/08` §6.1) | **OPEN** — not implemented; not in Phase 1 scope |
| 7 | `pr-checks.yml` provisions no Redis/Mongo service | **OPEN** — integration-tier tests cannot run in CI |
| 8 | Local dev accounts created during verification | Local `nfi_dev` only; no credential is committed |

---

## 16. Governance Blockers

| # | Blocker | Impact |
|---|---|---|
| 1 | **Shared Development NOT PROVISIONED** | `docs/11` §7.2 final criterion unmet — **no Story can be Done** |
| 2 | **ADR-0003 (IaC tooling) unapproved** | Blocks #1: no tool is named to provision with |
| 3 | **ADR-0001 unapproved** | `docs/13` §10.2 unsatisfiable; migration safety rests solely on idempotency |
| 4 | **No second reviewer** | `docs/11` §7.2 code-review criterion unmet; ADR-0002/0004 reviewed by one party |
| 5 | **Coverage gate not instrumented** | `docs/11` §7.2 coverage criterion unverifiable |

---

## 17. Definition of Done Status — `docs/11` §7.2

| # | Criterion | Status |
|---|---|---|
| 1 | Code merged to `main` | **NOT MET** — 87 files uncommitted, held pending authorization |
| 2 | All §4.5 automated quality gates passing | **PASS** — 23/23, 58/58, lint/typecheck/format clean |
| 3 | Code review approved per §4.4 | **BLOCKED** — no PR, no second reviewer available |
| 4 | Tests present and passing, meeting §5.7's coverage floor | **PARTIAL** — tests pass; **coverage not measured** |
| 5 | Documentation updated where §6.1 requires | **PASS** — `docs/08` v1.1/v1.2, ADR-0002/0004, this report |
| 6 | Acceptance criteria verified against a running environment | **PASS** — 98/98 demonstrated, not asserted |
| 7 | Deployed to Shared Development and confirmed functioning | **BLOCKED** — not provisioned |

### Can Shared Development be provisioned from here? **No.**

`docs/10` §3.2 requires a cloud-hosted environment (MongoDB Atlas per §9.4, Vercel per `docs/07` §19.1). Blocking facts:
1. **No cloud accounts exist** and none can be created from this environment.
2. **ADR-0003 is unapproved** — no IaC tool is chosen, so there is nothing to provision *with*.
3. Provisioning cloud infrastructure is **explicitly out of scope** by standing instruction.

**This is not marked Done, and no exception has been approved.** `docs/15` §3.1's Phase 1 acceptance criterion is demonstrated end-to-end against the local containerised stack — which is evidence of correctness, but is **not** the Shared Development deployment §7.2 requires.

---

## 18. Files Changed

**87 files** in the commit scope: 21 modified, 66 new.

### Changed during this closure pass

| File | Change |
|---|---|
| `docs/08_api_architecture.md` | **v1.1** (`auth` row, ADR-0002) and **v1.2** (`users` row, ADR-0004) + Revision History |
| `docs/adr/0002-…` | PROPOSED → **APPROVED**, as-built table, honest approval record |
| `docs/adr/0004-…` | **NEW** — Phase 1 role→permission matrix, APPROVED |
| `docs/adr/0001-…` | Status sharpened; remains **OPEN** |
| `apps/api/src/core/security/cors.ts` | 500 → **403 `ForbiddenError`** (§14.4) |
| `apps/api/src/core/security/rate-limit.ts` | Injectable store; production default unchanged (§14.5) |
| `apps/api/src/modules/auth/infrastructure/auth-user.repository.ts` | ObjectId guard (§14.2) |
| `packages/database/migrations/0001-identity-indexes.ts` | Uses `ensureIndex` (§14.1) |
| `packages/database/migrations/ensure-index.ts` | **NEW** — idempotent index creation |
| `apps/api/vitest.config.ts` | `localhost` → `127.0.0.1` (§14.5) |
| `apps/api/tests/core/security/cors.test.ts` | 403 + preflight assertions |
| `apps/api/tests/core/security/rate-limit.test.ts` | Rewritten: enforcement + **fail-closed** |
| `apps/api/tests/modules/auth/auth-user.repository.test.ts` | **NEW** — 9 cases |

**No locked `docs/00`–`18` content was changed outside the ADR process.** The two `docs/08` edits are the *required outcome* of approving ADR-0002 and ADR-0004, applied exactly as `docs/18` §5.1 prescribes: in place, with a Revision History row, traceable to the authorizing ADR.

---

## 19. Final Recommendation

**Sprint 1 is `TECHNICALLY COMPLETE — GOVERNANCE BLOCKED`. Commit the work; do not mark it Done.**

The engineering is finished and verified by execution rather than assertion: 23/23 tasks, 58/58 tests, 98/98 acceptance checks, five real defects found and fixed — two of them during closure, one deployment-blocking. The security posture is materially stronger than at implementation sign-off: two unauthenticated 500-generators closed, fail-closed rate limiting proven, and migration idempotency restored.

What blocks *Done* is not engineering. It is three unavailable process artifacts: a provisioned Shared Development environment, a second reviewer, and an instrumented coverage gate.

**Owner actions required, in dependency order:**

1. **Decide ADR-0003** (IaC tool) — unblocks #2.
2. **Provision Shared Development** and deploy — closes the only hard `docs/11` §7.2 blocker.
3. **Decide ADR-0001** (`schema_migrations`) — removes sole reliance on idempotency.
4. **Authorize a coverage provider** (e.g. `@vitest/coverage-v8`) and wire the 80% Domain/Application gate into `pr-checks.yml`.
5. **Provide a second reviewer**, and re-ratify ADR-0002/0004 if the architect roles are staffed.
6. *(Optional)* Ratify the "package implementing a locked capability is an implementation choice" principle in `docs/07` (§6).

**Do not begin Sprint 2 before items 1–2.** Every Phase 2 Story would inherit the same unsatisfiable Definition of Done.
