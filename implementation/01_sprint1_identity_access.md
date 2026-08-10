# Sprint 1 — Identity & Access (`auth`, `users`, `admin`)

## Implementation Plan — Phase 1 per `docs/15_master_project_plan.md` §3.1

**Date:** 2026-08-08
**Basis:** `docs/00`–`18` (locked architecture baseline), read in full for the sections cited below, plus the verified Sprint 0 foundation (`implementation/00_foundation_setup.md`).
**Governing rule:** `docs/18_CLAUDE_CONSTITUTION.md` — this document is implementation **planning**, not implementation. It contains no code, no schema-code, no route handlers. Per the user's explicit instruction, nothing in this Sprint is implemented as part of producing this document.

---

## Revision History

| Version | Date | Change |
|---|---|---|
| v1.0 | 2026-08-08 | Initial version |
| v1.2 | 2026-08-10 | **Prerequisite remediation executed** — see `implementation/01_sprint1_prerequisite_remediation.md` for the full report. Section 4's three blocking `core/` gaps are now CLOSED (`core/security`, `core/exceptions`, `core/di` built and tested); Section 4.2's `/health` deviation is CLOSED (split into `/health`+`/ready`, behaviorally proven under real dependency failure); Section 3's database foundation is CLOSED (2 migrations applied and verified live, idempotency proven). Open Item 6 (STAFF registration) escalated to **ADR-0002, Proposed** — still blocks `RegisterUser`. Section 4.3 (Shared Development) confirmed **NOT PROVISIONED**, with a newly-found second blocker: no IaC tool is named in any locked document (**ADR-0003**). `schema_migrations` tracking deferred to **ADR-0001**. Sprint 1 gate verdict: **NOT READY** pending three ADR approvals. |
| v1.1 | 2026-08-08 | Review pass against `docs/01`–`18` and the actual (not assumed) Sprint 0 code state. Corrected: `core/` subsystem count (nine → ten); `12` §3 `admin` row wrongly claimed absent; `09` §12.1 citation over-broadened to its full 14-item list instead of the 3 Phase-1-relevant items. Added: Section 4.2 (`GET /health` doesn't match `10` §10.4's locked liveness/readiness split), Section 4.3 (Shared Development environment not provisioned — DoD blocker), Open Item 6 (ambiguity in who may register as `STAFF`), Open Item 7 (Shared Dev ownership), Section 11 (13-row objectively-testable acceptance test table). No locked document modified; no code written. |

---

## 0. Relationship to Locked Documents

This document does not decide anything — every requirement below is a direct citation of an already-locked decision in `docs/02`, `03`, `06`, `07`, `08`, `09`, `11`, `12`, or `15`. Where this Sprint's design leaves a genuine gap those documents don't close (e.g., which specific TOTP npm package), Section 10 names it explicitly as an **Open Item** rather than deciding it here — consistent with `docs/18_CLAUDE_CONSTITUTION.md` §7 Rule 3 ("never invent architecture; surface the gap").

Current repository state this plan starts from (verified 2026-08-08): Sprint 0 is closed (`implementation/00_foundation_setup.md` §6) — tooling, CI, Docker, and the `GET /health` liveness probe are live and verified against real MongoDB/Redis containers. `apps/api/src/modules/{auth,users,admin}/` exist only as the empty 4-layer scaffold (`domain/`, `application/`, `infrastructure/`, `presentation/{controllers,routes,validators,dto}`, each a `.gitkeep`) plus a `README.md` pointing back to this same set of governing documents. No business logic exists anywhere in the repository yet.

---

## 1. Scope & Objective

Confirms `docs/15_master_project_plan.md` §3.1's **Phase 1 — Identity & Access** row exactly:

> Build `auth`, `users`, `admin` (RBAC/permissions) — every other module's hard dependency. Unblocks all business-facing work; indirectly serves every `01_business_research.md` priority equally.

**Deliverables (per that row):** the `auth`, `users`, `admin` modules per `docs/06_project_structure.md` §4.3's 4-layer template; JWT/MFA/RBAC per `docs/09_security_architecture.md` §2.

**Milestone this Sprint closes — M1 "Identity Platform Live"** (`15` §4): *"Auth/RBAC usable by every subsequent module."* Approval required from Principal Security Architect + Principal Software Architect. Completion criteria = Phase 1's exit criteria (below).

**Phase 1 Entry Criteria** (`15` §3.1): `core/` infrastructure operational — **not yet fully true**; see Section 4's prerequisite gap.

**Phase 1 Exit Criteria** (`15` §3.1, verbatim): `docs/12_testing_strategy.md` §3's `auth`/`users`/`admin` row test scope passes; `docs/09_security_architecture.md` §12.1 pre-launch MFA/RBAC items pass. `09` §12.1 is a 14-item checklist spanning every module (CAPTCHA, Razorpay webhook, PCI-DSS SAQ); only two items are Phase-1-relevant given no other module exists yet: *"MFA enforced for all `STAFF`/`ADMIN` accounts, verified in a live environment"* and *"Refresh-token reuse detection tested against a simulated replay."* A third, *"Password breach-list check active on registration and password-change,"* is also in scope since it's part of `auth`'s own password policy (Section 6.5). The remaining 11 items (CAPTCHA, webhook signature, admin network hardening/VPN, PCI-DSS, dependency scanning, etc.) are out of scope — their owning modules/environments don't exist yet at Phase 1.

**Phase 1 Acceptance Criteria** (`15` §3.1, verbatim): *"A `STAFF` account can register, MFA-enroll, log in, and be permission-checked against a protected route."* This single sentence is Sprint 1's concrete Definition of Done at the milestone level — every other requirement in this document exists to make that sentence true, verifiably.

**Out of scope for this Sprint** (deferred to later phases per `15` §3.1's phase boundaries): `catalog`, `leads`, `crm`, `design-projects`, `orders`, `payments`, and every other module — none of them are touched, even though several of their READMEs already reference `auth`/`users` collections.

---

## 2. Build & Dependency Order

Confirms `docs/15_master_project_plan.md` §6.2's module dependency diagram exactly (not redrawn — this section only extracts the Phase-1-relevant edges):

```
auth  --> core (config, logger, DI, events, security)
users --> core
admin --> core
users --> auth
```

**Build order: `auth` → `users` → `admin`.**

- `users` depends on `auth` (`15` §6.2's `Users --> Auth` edge) — concretely, per `docs/08_api_architecture.md` §8's `users` row, the `users` module's own dependency list is `auth`. The `auth` row lists `users` back only because both modules share the physical `users` collection (`docs/06_project_structure.md` §4.3's module list: *"`users` — (shared with `auth` on `users`) — Profile/address management, distinct from credential management"*) — this is a **data-ownership relationship** (who owns which fields on one collection), not a circular application-layer dependency. `auth` owns credential/session fields (`passwordHash`, `authProviders`, `lastLoginAt`, `failedLoginAttempts`, `lockedUntil`); `users` owns profile/address fields (`fullName`, `avatarUrl`, `addresses[]`). Both modules' `infrastructure/` layers read/write the same `users` collection through their own repository interfaces — neither imports the other's `infrastructure/`or `domain/` (`06` §4.3's import rule, mechanically enforced by the ESLint module-boundary rule already live from Sprint 0).
- `admin` has no inbound Phase-1 dependency edge in `15` §6.2's diagram, but it operates on the `roles`/`permissions` collections `auth`'s RBAC enforcement reads from (`docs/03_database_design.md` §9.1.2–9.1.3) — `admin` is the **write side** (role/permission CRUD, `docs/02_enterprise_architecture.md` §14's `SuperAdmin`-only role management) of the same data `auth`'s `rbacMiddleware` reads on every authenticated request. Building it last in this Sprint is the pragmatic order (seed roles/permissions exist and are exercised by `auth`/`users` first; `admin`'s CRUD layer is proven against already-live data), not a hard dependency requirement.

---

## 3. Database Schema Scope

Confirms `docs/03_database_design.md` §9.1 and §9.8.2 exactly — six collections, all already fully specified, none requiring a new design decision:

| Collection | Owning module | Type | Key fields (full list: `03` §9.1.x) | Source |
|---|---|---|---|---|
| `users` | `auth` (credentials) + `users` (profile) | Standard, soft-delete | `email`, `phone`, `passwordHash`, `authProviders`, `userType`, `roleId`, `additionalRoleIds`, `status`, `addresses[]` (embedded, ≤10), `lastLoginAt`, `failedLoginAttempts`, `lockedUntil` | `03` §9.1.1 |
| `roles` | `admin` (write) / `auth` (read) | Standard, soft-delete | `name` (unique — the 7 roles below), `permissionIds[]` (embedded refs), `isSystemRole` | `03` §9.1.2 |
| `permissions` | `admin` (write) / `auth` (read) | Standard, minimal audit | `key` (unique, `<module>.<action>`), `module`, `description` | `03` §9.1.3 |
| `refresh_tokens` | `auth` | **Ephemeral — TTL, no soft delete** | `userId`, `tokenHash`, `deviceInfo{userAgent,ip}`, `issuedAt`, `expiresAt` (TTL), `revokedAt`, `replacedByTokenId` (rotation chain) | `03` §9.1.4 |
| `otp_verifications` | `auth` | **Ephemeral — TTL** | `identifier`, `otpHash`, `purpose` (`LOGIN`/`REGISTER`/`RESET_PASSWORD`), `attempts`, `expiresAt` (TTL), `verifiedAt` | `03` §9.1.5 |
| `password_reset_tokens` | `auth` | **Ephemeral — TTL** | `userId`, `tokenHash`, `expiresAt` (TTL), `usedAt` | `03` §9.1.6 |
| `audit_logs` | `admin` (write path used by every module, per `08` §4.11) | **Immutable, append-only** | `actorId`, `actorRole`, `action`, `entityType`, `entityId`, `before`/`after` (redacted snapshots), `ipAddress`, `userAgent`, `occurredAt` | `03` §9.8.2 |

**Initial role/permission data required before any manual/integration testing can exercise RBAC** (`docs/02_enterprise_architecture.md` §14's role table, `docs/09_security_architecture.md` §2.3 confirming it — no new role introduced here):

`SUPER_ADMIN`, `SALES_MANAGER`, `DESIGN_MANAGER`, `DESIGNER`, `CATALOG_MANAGER`, `SUPPORT_AGENT`, `CUSTOMER` — each an `isSystemRole: true` document in `roles`, with `permissionIds[]` populated from a `permissions` seed set following the `<module>.<action>` taxonomy (`docs/09_security_architecture.md` §2.4). Only the Phase-1-relevant permission keys are real seed candidates this Sprint (`auth.manage_mfa`, `users.read_self`, `users.read`, `users.write`, `admin.manage_roles`, `admin.view_audit_log`) — permission keys for not-yet-built modules (`leads.read`, `orders.refund`, etc.) should **not** be pre-seeded speculatively; `09` §11 rule 6 ("every new permission key follows the taxonomy") governs each module's own Sprint, not this one.

**This is a migration, not a disposable seed script** — `docs/13_deployment_strategy.md` §5.4 is explicit: *"the initial `roles`/`permissions` documents... required for the application to function at all... [is] itself a migration (Section 5.1's data-backfill category), reviewed and applied exactly once at initial Production setup, not a recurring seed-data refresh."* This is distinct from the separate, disposable, Factory-generated seed data (`docs/12_testing_strategy.md` §5.3) that `scripts/setup/` populates Local/Shared-Dev/Testing with for day-to-day development — the 7-role/permission set belongs in `packages/database/migrations/` as a reviewed, versioned script (`13` §5.1's three-step workflow: written and reviewed → tested against Staging first → applied to Production as its own deploy step), not in a seed script that could be silently re-run or skipped.

**Indexes (day-one priority, `03` §10.6, `03` §10.2–10.3):**

| Collection | Index | Type |
|---|---|---|
| `users` | `{email: 1}` | unique, partial (`isDeleted: false`) |
| `users` | `{phone: 1}` | unique, partial |
| `refresh_tokens` | `{expiresAt: 1}` | TTL |
| `otp_verifications` | `{expiresAt: 1}` | TTL |
| `password_reset_tokens` | `{expiresAt: 1}` | TTL |
| `audit_logs` | `{entityType: 1, entityId: 1, occurredAt: -1}` | compound |

**`$jsonSchema` defense-in-depth validators** (`03` §12, second line of defense behind Zod — not a substitute for it): `users.email` matches email pattern; `userType` restricted to enum; `passwordHash` required only when `authProviders` contains no provider other than `LOCAL`.

**Migration mechanics:** `packages/database/migrations/` (Sprint 0 scaffolded a placeholder `run.ts` with no real migrations yet, `implementation/00_foundation_setup.md` §5.9). This Sprint's first real migration is these six collections' index creation, following `docs/13_deployment_strategy.md` §5.2's expand/contract backward-compatible pattern — additive only, nothing to contract against yet since no prior schema version exists.

---

## 4. Core Infrastructure Prerequisite Gap

> **STATUS AS OF 2026-08-10 (v1.2):** §4.1 **COMPLETED**, §4.2 **COMPLETED**, §4.3 **STILL BLOCKED**.
> The remediation that closed these is recorded in `implementation/01_sprint1_prerequisite_remediation.md`.
> The original gap analysis is retained verbatim below for traceability — it is the *finding*, not the current state.

**Verdict at time of writing (2026-08-08): Sprint 0's outputs do NOT yet satisfy all Sprint 1 prerequisites.** Three concrete gaps, verified against the repository state and the locked docs, follow.

### 4.1 Missing `core/` Subsystems

Phase 1's own Entry Criteria (`15` §3.1) requires `core/` infrastructure operational. `docs/06_project_structure.md` §4.2 specifies **ten** `core/` subsystems, not nine (`config/`, `database/`, `cache/`, `security/`, `events/`, `exceptions/`, `utils/`, `constants/`, `logger/`, `di/` — corrected count from this document's v1.0, which undercounted). Sprint 0 built exactly four with real code (`config/`, `database/`, `cache/`, `logger/` — verified: each has a real `index.ts`); the other six exist only as empty `.gitkeep` placeholders. Of those six, three block this Sprint and three do not:

| `core/` subsystem | Needed for | Blocks Sprint 1? | Spec |
|---|---|---|---|
| `core/security/` | Rate limiter instance (Strict tier for `/auth/login`, `/auth/register`, OTP — `08` §4.4), Helmet config (currently inline in `app.ts`, not `core/security` — should move here per `06` §4.2's ownership), CORS allow-list (storefront/admin origins only, `08` §4.8), CSRF posture confirmation for the refresh-token cookie (`08` §4.9) | **Yes** | `06` §4.2 |
| `core/exceptions/` | Base error classes (`NotFoundError`, `ValidationError`, `ConflictError`, `UnauthorizedError`) + centralized error-mapping middleware — every module throws these, never a raw `Error` (`02` §16) | **Yes** | `06` §4.2 |
| `core/di/` | The composition root (`02` §7.3) — the **only** place `auth`'s/`users`'s/`admin`'s concrete Infrastructure implementations get wired into their Application-layer use cases | **Yes** | `06` §4.2 |
| `core/events/` | Domain event bus + outbox relay (`03` §9.8.4) — no Phase-1 event is named in `02` §10/§16's event list | No — defer to Phase 3 | `06` §4.2 |
| `core/utils/` | Generic framework-agnostic pure functions | No — build on demand, nothing in Sections 3–8 currently requires a named helper here | `06` §4.2 |
| `core/constants/` | Cross-module backend constants | No — same as `utils/`, on demand | `06` §4.2 |

**Additional, narrower gap inside an already-built subsystem:** `docs/06_project_structure.md` §4.2 specifies `core/database/` should provide a "connection factory, **session/transaction helper** (for the narrow transaction use documented in `03_database_design.md` §13.1)." Sprint 0's `core/database/index.ts` provides only the connection factory (`connectDatabase`/`isDatabaseConnected`/`disconnectDatabase`) — no session/transaction helper. **This does not block Sprint 1** — `03` §13.1's narrow transaction scope is order+reservation and lead conversion, neither of which is Phase 1 — but is recorded here so it isn't mistaken for complete.

**Recommendation:** `core/security/`, `core/exceptions/`, `core/di/` are cross-cutting infrastructure, not `auth`/`users`/`admin` business logic — per root `CLAUDE.md`'s "Never place business logic in `apps/api/src/core/`" rule, they belong in `core/`, built as a **prerequisite track within this Sprint**, not folded into any one module.

### 4.2 Existing `GET /health` Does Not Match the Locked Liveness/Readiness Split

`docs/10_devops_architecture.md` §10.4 (verified against the current doc, not previously checked when this plan was first drafted): *"Every container exposes a `/health` (liveness — 'is the process alive') **and** a `/ready` (readiness — 'can this instance currently serve traffic,' checking its own MongoDB/Redis connectivity) endpoint... A liveness-check failure triggers a container restart... a readiness-check failure removes the instance from the load balancer's rotation without restarting it."*

Sprint 0's actual `GET /health` (`apps/api/src/app.ts`) returns `{status, uptime, mongoConnected, redisConnected}` from a **single** endpoint — conflating liveness and readiness into one probe, contradicting `10` §10.4's explicit two-endpoint, two-remediation-behavior design. This is not a Sprint-1 blocker in the sense of preventing `auth`/`users`/`admin` from being built, but it **is** a pre-existing contradiction with a locked document that Sprint 0 introduced and this review is obligated to surface (`docs/18_CLAUDE_CONSTITUTION.md` §7 Rule 4 — never silently let a contradiction stand). Recommend closing it as a small, `core/`-scoped fix either immediately before or during this Sprint's core-infrastructure track (Section 4.1), since Sprint 1's own Docker-based acceptance testing (Section 11) exercises this same container.

### 4.3 "Shared Development" Environment Is Not Provisioned

`docs/11_engineering_workflow.md` §7.2's Definition of Done — which this plan's Section 9 correctly cites verbatim — requires: *"Deployed to Shared Development (`10_devops_architecture.md` §3.2) and confirmed functioning there."*

`docs/10_devops_architecture.md` §3.2 defines Shared Development as **real, always-on cloud infrastructure**: "Same four-deployable topology as production... smallest ECS Fargate task size, `M0`/free-tier-equivalent MongoDB Atlas cluster... intentionally the cheapest environment that's still 'real infrastructure,' not Compose," deployed automatically on every merge to the default branch. This is explicitly distinct from `10` §3.1 Local Development (Docker Compose, what Sprint 0 actually built and verified) — `docs/13_deployment_strategy.md` §2.2 confirms Local → Shared Development is the very first, mandatory promotion step in the seven-environment path, and no stage may be skipped.

**No AWS account, ECS cluster, MongoDB Atlas cluster, or CD pipeline targeting Shared Development exists in this repository or has been provisioned in any session to date.** This is a real, unresolved gap between `15_master_project_plan.md` §3.1's Phase 0 exit criteria (*"`10_devops_architecture.md` §16.1 DevOps Checklist passes for Local/Shared-Dev/Testing"*) and what Sprint 0 actually delivered (Local only). Consequently: **Section 9's Definition-of-Done checkbox for "deployed to Shared Development" cannot be closed by Sprint 1 alone** — it depends on the DevOps stream (`15` §7.1) provisioning cloud infrastructure that is outside this Sprint's own module-build scope. This is recorded as a blocker in the final verdict, not silently treated as achievable.

---

## 5. API Contract Scope

Confirms `docs/08_api_architecture.md` §8's per-module contract table exactly (three rows, reproduced in full — not summarized, since this table **is** the contract):

| Module | Authentication | Authorization | Resources | Key operations | Validation notes | Caching |
|---|---|---|---|---|---|---|
| `auth` | None on `/auth/register`, `/auth/login`, `/auth/refresh` (session-bootstrapping); Bearer on `/auth/logout`, `/auth/mfa/*` | No permission keys on public auth endpoints; `auth.manage_mfa` for admin-forced MFA reset | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/mfa/verify`, `/auth/mfa/setup` | Register, login, refresh (rotate), logout (revoke), MFA enrollment/verification | Strict email/password/OTP shape; password strength rule enforced here | None — never cached |
| `users` | Bearer, required | `users.read_self` (implicit, own profile), `users.read`/`users.write` (admin, any user) | `/users/me`, `/admin/users` | Get/update own profile; admin list/update any user | Address sub-document validated as bounded array (max 10) | `private, no-store` |
| `admin` | Bearer, required, `STAFF`/`ADMIN` `userType` only | `admin.manage_roles`, `admin.view_audit_log` — entirely permission-key-gated, no public/self-scoped surface | `/admin/roles`, `/admin/permissions`, `/admin/audit-logs` | Role/permission management (`SuperAdmin`-only), audit log read | Role deletion blocked on `isSystemRole: true` | `private, no-store` |

**Every endpoint above must** (confirms `08` §3 and §6.2 exactly, applied to this Sprint's surface):
- Return the `{success, data, error, meta}` envelope (`08` §3.2) on every response, including errors (`08` §3.3) — no bare/empty body, no `204`.
- Map every failure to the locked `error.code` / HTTP status table (`08` §3.11): `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 CONFLICT` (idempotency-key reuse, MFA-state conflicts), `429 RATE_LIMITED`.
- Validate every request body/query/route-param with a **strict-mode** Zod schema (`08` §3.12) — unknown fields rejected, not silently stripped.
- Use ISO-8601 UTC dates (`08` §3.14), `ObjectId`-as-string serialization (`08` §3.13), URI versioning under `/api/v1/` (`08` §3.17).
- `POST /users` account-creation-adjacent flows are **not** in this Sprint's idempotency-required list (`08` §3.10) — that list is `checkout`, `leads`, milestone-payment, `returns`, none of which are Phase 1. No idempotency-key handling is required for `auth`/`users`/`admin` endpoints this Sprint.
- Log an `audit_logs` entry for every mutating (`POST`/`PATCH`/`DELETE`) request from a `STAFF`/`ADMIN`-authenticated caller (`08` §4.11) — this is `admin`-module-owned write path, called from `auth`'s and `users`' own mutation handlers, not duplicated per module.

---

## 6. Security Requirements

Confirms `docs/09_security_architecture.md` §2 and `docs/08_api_architecture.md` §4 exactly — nothing new decided here, only assembled into one Sprint-scoped checklist:

### 6.1 Authentication (`09` §2.1, `08` §4.1)
- Access token: JWT, 10–15 min TTL, returned in response body, held client-side in memory only (never `localStorage`).
- Refresh token: JWT, 7–30 day TTL, `httpOnly` + `Secure` + `SameSite=Strict` cookie, scoped to `Path=/api/v1/auth/refresh` only (`08` §4.2) — never the whole domain.
- Refresh token persisted **hashed** in Redis keyed by user/device, enabling server-side revocation (`09` §2.1).
- `Authorization: Bearer <token>` header only for the access token — never a query parameter or cookie (`08` §4.1, OWASP API2:2023).

### 6.2 Refresh Rotation & Reuse Detection (`09` §2.6)
- Refresh token rotated on **every** use.
- Reuse of an already-rotated token = compromise signal → revoke **all** sessions for that user, write `audit_logs` entry (`actorId` = affected user, `action` = `TOKEN_REUSE_DETECTED`), surface as a Section 7.3 incident-detection signal.

### 6.3 RBAC Enforcement Order (`08` §4.3, exact three-step sequence)
1. `authMiddleware` — JWT signature/expiry check → `401` if invalid.
2. `rbacMiddleware` — resolved permission-key claim check → `403` if missing.
3. **Ownership check** — inside the Application-layer use case (e.g., `users.read_self`'s implicit "is this my own profile" check), never in generic middleware.
- A `403` from step 2 and a `403` from step 3 return the **identical** error shape — never reveal which check failed (`09` §11 rule 11, OWASP API1:2023).
- **Fail-closed principle** (`09` §2.2): any ambiguity in either check resolves to `403`, never to default-allow.

### 6.4 MFA (`09` §2.8, confirms `02` §9.1 v1.1)
- **Mandatory** TOTP (RFC 6238) for every `STAFF`/`ADMIN` `userType` before first admin-panel access.
- **Not required** for `CUSTOMER` accounts.
- Lost-device recovery: **`SUPER_ADMIN`-mediated re-verification only** — explicitly not self-service (self-service MFA reset is a known bypass vector). Re-verification event is itself audit-logged.

### 6.5 Password Policy (`09` §2.7 — specified here for the first time in the doc series, applies as-is)
- Minimum 10 characters, maximum 128.
- No mandatory composition rule (no forced special-character mix).
- Breach-list check (k-anonymity-style API pattern) at registration and password-change.
- Last 5 password hashes retained to block immediate reuse on forced reset.
- No calendar-based mandatory rotation for staff/admin.

### 6.6 Session Strategy (`09` §2.5)
- Multiple concurrent refresh tokens allowed (one per device).
- `SUPER_ADMIN` and `DESIGN_MANAGER` roles capped at **3 concurrent sessions** — oldest force-revoked on a 4th login. (`DESIGN_MANAGER` is Phase-4-relevant only in practice this Sprint, but the cap is a property of the `auth` module's session-issuance logic, so it must exist now, not retrofitted later.)

### 6.7 Account Recovery (`09` §2.9)
- `CUSTOMER`: `password_reset_tokens` flow, 30-min TTL, single-use, Strict rate-limit tier. Successful reset **revokes every existing refresh token** for that user.
- `STAFF`/`ADMIN`: same, plus the MFA re-verification procedure (6.4) if MFA is also being reset — independent recovery paths, one compromise doesn't grant the other.

### 6.8 Rate Limiting (`08` §4.4, Redis-backed)
| Tier | Limit | Applies to |
|---|---|---|
| Strict | 5 req/min/IP, 10 req/min/account | `POST /auth/login`, `/auth/register`, OTP endpoints |
| Standard authenticated | 120 req/min/account | `/users/me`, `/admin/*` |

### 6.9 Input Validation & Injection (`08` §4.5, `09` §3.6, §3.9, §11 rules 2–3)
- Strict primitive-typed Zod schemas at every boundary (blocks NoSQL operator injection, e.g. `{"$gt": ""}` smuggled into a string field).
- Every Mongoose query via parameterized builder methods — never a raw/dynamically-built query object.
- No `Object.assign`/spread of raw request input into a mutable object without passing through a strict-mode Zod schema first (prototype-pollution safety).
- `users` module's `PATCH /users/me` schema must be **role-parameterized** (`09` §3.10, §11 rule 7) — a `CUSTOMER` caller's writable-field set excludes `roleId`/`status`/`userType`; a single permissive schema plus a runtime strip-check is explicitly disallowed.

### 6.10 CORS & CSRF (`08` §4.8–4.9)
- Strict origin allow-list: `storefront` + `admin` origins only, per environment. Credentialed CORS enabled only for those exact origins, never a wildcard.
- No separate CSRF token — `SameSite=Strict` on the one cookie-based endpoint (`/auth/refresh`) plus header-based Bearer auth everywhere else already closes the relevant surface (`08` §4.9).

### 6.11 Audit Logging (`08` §4.11, `03` §9.8.2)
- Every mutating `STAFF`/`ADMIN`-authenticated request writes an `audit_logs` entry: `actorId`, `action`, `entityType`, `entityId`, redacted `before`/`after`, `X-Request-ID`.
- **Redaction is mandatory, not optional**: `passwordHash` and every token-hash field are replaced with the literal string `[REDACTED]` in any snapshot — never omitted, never captured in full (`03` §9.8.2's redaction rule, `09` §11 rule 8).
- Customer self-service profile edits are **not** written to `audit_logs` (that collection is staff/admin accountability only, `08` §4.11).

---

## 7. Module-by-Module Layer Breakdown

Confirms `docs/06_project_structure.md` §4.3's 4-layer template and per-layer import rules exactly (already mechanically enforced by the Sprint-0-built ESLint module-boundary rule) — this section maps Sections 3–6's requirements onto each layer, planning-level only (no class names/file names prescribed beyond what's needed to show the mapping is complete).

### 7.1 `auth`
- **`domain/`** — `User` entity (credential-relevant slice: email, phone, passwordHash, authProviders, status, lockout state), value objects for password strength / TOTP secret, zero framework imports.
- **`application/`** — use cases: `RegisterUser`, `LoginUser`, `RefreshToken`, `LogoutUser`, `SetupMfa`, `VerifyMfa`, `RequestPasswordReset`, `ResetPassword`; port interfaces (`IUserRepository`, `IRefreshTokenRepository`, `IOtpRepository`, `IPasswordResetTokenRepository`, `ITokenService`, `IMfaService`). May import `users`' `application/` exported interface only, if profile data is ever needed (unlikely in Phase 1's own scope).
- **`infrastructure/`** — Mongoose repositories/schemas for `users` (credential fields), `refresh_tokens`, `otp_verifications`, `password_reset_tokens`; bcrypt adapter; TOTP adapter (library TBD, Section 10); JWT signing/verification adapter. Implements `core/database`'s connection, `core/cache` for Redis-backed refresh-token storage and rate-limit counters.
- **`presentation/`** — `POST /auth/register`, `/login`, `/refresh`, `/logout`, `/mfa/setup`, `/mfa/verify` routes/controllers; Zod validators (strict-mode, per Section 6.9); `authMiddleware` (Section 6.3 step 1) lives here as the module's own presentation-layer middleware, exported for other modules' `presentation/` layers to compose (per `06` §4.2's `core/security` note — the *generic* middleware factory is `core/`, the *auth-specific* JWT verification logic is this module's, per the same section's distinction).

### 7.2 `users`
- **`domain/`** — `UserProfile` entity (profile-relevant slice: fullName, avatarUrl, addresses[]), `Address` value object (bounded array invariant, max 10).
- **`application/`** — use cases: `GetOwnProfile`, `UpdateOwnProfile`, `AdminListUsers`, `AdminUpdateUser`; port interface `IUserRepository` (may be the *same* Mongo collection as `auth`'s, accessed through this module's own repository implementation — no cross-module `infrastructure/` import, per `06` §4.3's rule).
- **`infrastructure/`** — Mongoose repository for the `users` collection's profile-owned fields.
- **`presentation/`** — `GET/PATCH /users/me`, `GET/PATCH /admin/users` routes; role-parameterized Zod validators (Section 6.9); `rbacMiddleware` composition (imports `auth`'s exported `authMiddleware` — an `application/`-layer exported interface, per `06` §4.3).

### 7.3 `admin`
- **`domain/`** — `Role`, `Permission` entities; `AuditLogEntry` entity (immutable, append-only invariant enforced here).
- **`application/`** — use cases: `ListRoles`, `CreateRole`, `UpdateRolePermissions`, `DeleteRole` (blocked on `isSystemRole: true`), `ListPermissions`, `WriteAuditLog` (the exported interface every other module's `application/` layer calls — this is `admin`'s one cross-module-consumed export, per `08` §8's "every module" dependency note), `ListAuditLogs`.
- **`infrastructure/`** — Mongoose repositories for `roles`, `permissions`, `audit_logs` (append-only — no update/delete repository method exposed at all, not just policy-restricted).
- **`presentation/`** — `GET/POST/PATCH/DELETE /admin/roles`, `/admin/permissions`, `GET /admin/audit-logs` routes; `SuperAdmin`-only permission-key gate.

---

## 8. Testing Scope

Confirms `docs/12_testing_strategy.md` §3's per-module test-scope table exactly — **`admin` does have its own named row** in that table (this document's v1.0 incorrectly claimed otherwise; corrected here). All three modules' rows, reproduced with the source table's actual six columns (Test Scope, Critical Scenarios, Negative Scenarios, Boundary Cases, Performance Risks, Security Risks — the v1.0 table collapsed several of these, obscuring real content; corrected below):

| Module | Test scope | Critical scenarios | Negative scenarios | Boundary cases | Security-specific tests |
|---|---|---|---|---|---|
| `auth` | Registration, login, MFA, token refresh/rotation, logout, password reset | Successful login issues correctly-scoped access token; MFA challenge required for `STAFF`/`ADMIN`; refresh-token rotation on use | Invalid credentials rejected without user-enumeration hint; expired/reused refresh token triggers session revocation | Password at exactly the 10/128-char boundary; OTP `attempts` at rate-limit threshold | Credential-stuffing simulation; token-reuse-detection verification |
| `users` | Own-profile read/update, admin any-user read/update | Ownership check prevents cross-account profile access | Role-parameterized schema rejects a `CUSTOMER` smuggling `roleId`/`status` | Address array at the 10-item bound | Mass-assignment probe against `PATCH /users/me` |
| `admin` | Role/permission management, audit-log read | Role deletion blocked when `isSystemRole: true` | Non-`SUPER_ADMIN` blocked from `admin.manage_roles` | Permission-key set at a large-but-realistic count (JWT claim-size awareness, `09` §2.1) | Full audit-trail forensic-reconstruction test for a simulated `SUPER_ADMIN` compromise |

(Performance-risk column omitted above as not safety-relevant to this Sprint's review; `auth`'s is bcrypt cost factor under login-storm load, `users`'/`admin`'s are both noted low-volume/index-bound in `12` §3.)

**Coverage floors (`12` §6.2, CI-enforced, confirms `docs/11_engineering_workflow.md` §5.7):**
- Domain + Application layers: **80% line coverage minimum**.
- Infrastructure layer: no hard minimum — reviewer judgment.
- Presentation layer: **100% of the locked endpoints in Section 5's table** get at least one Contract Test (`12` §4.3) + one happy-path + one representative-failure API Test (`12` §4.4).

**The concurrent-checkout inventory test (`12` §4.2) is out of scope for this Sprint** — it's `orders`/`catalog`'s Phase-5 test, not Phase 1's.

**Test data:** this Sprint is the first to need real fixtures/factories (`12` §5.1–5.2) — a `UserFactory` (varying `userType`/`roleId`) is the first factory this repository will contain, since Sprint 0 had no domain data to factory-produce.

---

## 9. Definition of Ready / Definition of Done

Confirms `docs/11_engineering_workflow.md` §7.1/§7.2 exactly, applied as the per-Story gate for every Sprint 1 Story (register, login, refresh, MFA setup/verify, logout, password reset, profile get/update, admin user list/update, role/permission CRUD, audit log read):

**Definition of Ready** — before any Sprint-1 Story enters sprint planning:
- [ ] Acceptance criteria written, unambiguous.
- [ ] Story cites the specific row/section this document (or the locked docs it cites) already specifies — no Story invents its own contract.
- [ ] Cross-story dependencies identified (e.g., "login" Story blocked on "register" Story existing).
- [ ] Sized/estimated.
- [ ] Security Review involvement flagged in advance — **every Sprint 1 Story touches Tier 1/2 data or an auth flow** (`09` §1.4), so this box is checked for all of them by default, per `11` §7.1's own rule.

**Definition of Done** — before any Sprint-1 Story is marked complete:
- [ ] Code merged to `main`.
- [ ] All automated quality gates passing (lint, typecheck, test, build — the exact gates Sprint 0 already wired into `pr-checks.yml`).
- [ ] Code review approved at the correct approval count — **`apps/api/src/core/` changes and this Sprint's shared-package-adjacent work require two approvals** (`11` §4.2, root `CLAUDE.md`).
- [ ] Tests present and passing, meeting Section 8's coverage floor.
- [ ] Documentation updated where `11` §6.1 requires it (any API-contract or module-boundary change).
- [ ] Acceptance criteria verified against a running environment — demonstrated against the live Sprint-0-verified Docker stack (`mongodb`, `redis`, `api`), not just "the code looks right."
- [ ] Deployed to Shared Development and confirmed functioning there. **⚠ Currently unachievable by Sprint 1 alone — see Section 4.3.** The Local Docker stack is a legitimate substitute for demonstrating the Phase 1 acceptance criterion (Section 1) but is not a substitute for this specific DoD line item once Shared Development exists; track as a dependency on the DevOps stream (`15` §7.1), not as a Sprint-1 deliverable.

---

## 10. Open Items — Decisions Not Yet Made

Per `docs/18_CLAUDE_CONSTITUTION.md` §7 Rule 3, surfaced rather than silently decided:

1. **TOTP npm package.** `docs/07_technology_decision_record.md` §6.3 locks TOTP (RFC 6238) as the MFA mechanism but names no specific library (unlike bcrypt/JWT, which are named packages). A package choice (e.g., a maintained, standards-compliant TOTP implementation) is needed before `SetupMfa`/`VerifyMfa` can be built. This is an implementation-detail choice within an already-locked decision, not an ADR — but should be recorded in this module's own README once picked, per this document's own Section 0 discipline.
2. **Breach-list check mechanism (`09` §2.7).** The password policy requires a k-anonymity-style breached-password check "at registration and password-change time" but names no specific provider/API. Needs a concrete choice (and, if it's a third-party HTTP dependency, confirmation it doesn't conflict with `07`'s locked technology list, or else an ADR).
3. **`core/security`, `core/exceptions`, `core/di` build ownership.** Section 4 identifies these as a prerequisite; this document does not assign them to a specific Story/owner — that's a sprint-planning decision for whoever runs Sprint 1, not an architecture question.
4. **Device-management UI (`09` §2.10).** Explicitly named in `09` as "not yet built" — Section 2.10 describes the mechanism (`refresh_tokens.deviceInfo` surfaced as a manage-sessions view) but this is admin-panel/customer-account-page **frontend** scope. Confirm whether Sprint 1 includes the frontend surface or backend-only (the `auth`/`admin` API + data model can exist without the UI; the UI itself doesn't block Phase 1's Section 1 acceptance criterion, which is API-level: "log in, and be permission-checked against a protected route").
5. **`apps/storefront`/`apps/admin` login UI scope.** This document (and `15` §3.1's Phase 1 row) scopes Phase 1 to the `auth`/`users`/`admin` **backend modules**. `15` §7.1's Frontend stream note says frontend "trails each backend module by one integration cycle" — meaning a Sprint-1-adjacent frontend Sprint, not necessarily this same Sprint, builds the login/register pages. Confirm which Sprint owns that before planning frontend work.
6. **How does a `STAFF` account come to exist, for the Phase 1 acceptance test itself?** `15` §3.1's literal acceptance sentence is *"a `STAFF` account can register... and log in"* — but `08` §8's `auth` row states `POST /auth/register` requires **no authentication** ("session-bootstrapping by definition"), and no locked document restricts what `userType` a public, anonymous caller may request at registration. Allowing an unauthenticated caller to self-register directly as `STAFF` (which per `06` §4.3/`09` §2.3 carries elevated permission-key grants and admin-panel access) would be a privilege-escalation hole squarely contradicting `09` §2.2's fail-closed principle and the entire point of the permission-key RBAC model — no locked document endorses this, and this plan does not either. **Not resolved here — surfaced as a genuine ambiguity, not decided.** The two plausible readings: (a) `POST /auth/register` always creates a `CUSTOMER`-type account regardless of requested `userType`, and a `STAFF` account is created only via `admin`'s `POST /admin/users` (`08` §8's `users` row, admin-authenticated) or the Section 3 migration/seed step — i.e., "register" in `15` §3.1's sentence is being used loosely to mean "an account exists," not literally "self-registers via the public endpoint"; or (b) a `STAFF`-type registration requires some additional gate not yet specified anywhere. Reading (a) is far more consistent with the rest of the locked security posture and is this document's working assumption for Section 11's acceptance tests below, but it should be explicitly confirmed (Principal Security Architect, per Section 1's M1 approval chain) before `RegisterUser`'s use case is implemented, not discovered mid-implementation.
7. **Shared Development infrastructure ownership and timeline.** Section 4.3 identifies that Shared Development (AWS ECS Fargate + MongoDB Atlas) has not been provisioned. This document does not assign that provisioning to Sprint 1 — per `15` §7.1, it is the DevOps stream's Phase 0 deliverable — but Sprint 1 cannot fully close its own Definition of Done (Section 9) until it exists. Needs an explicit decision: either provision Shared Development before/alongside Sprint 1, or amend Sprint 1's own Done-criteria to substitute the verified Local Docker stack, with Shared Development deployment tracked as a separate, later-closing item. This document does not make that substitution unilaterally (it would be silently weakening a locked DoD), so it's named here instead.

---

## 11. Acceptance Tests — Making Section 1's Sentence Objectively Testable

`15` §3.1's Phase 1 acceptance criterion is one sentence: *"A `STAFF` account can register, MFA-enroll, log in, and be permission-checked against a protected route."* On its own that sentence is a milestone-level summary, not something a reviewer can mechanically pass/fail — this section decomposes it into concrete HTTP-level steps against the endpoints in Section 5, each with an objectively checkable outcome. This is the M1 sign-off script (Section 1), run against the Shared-Dev-or-Local environment (Section 4.3's caveat applies).

Adopts Open Item 6's reading (a) — `STAFF`/`ADMIN` accounts are provisioned via `admin`, not public self-registration — since that is the only reading consistent with Section 6's security requirements; **flagged for Security Architect confirmation before implementation, per Open Item 6.**

| # | Step | Call | Expected result | Verifies |
|---|---|---|---|---|
| 1 | Seed/admin-provision a `STAFF` account | `POST /admin/users` (as a pre-existing `SUPER_ADMIN`, or the Section 3 migration's initial account) `{email, phone, tempPassword, userType: "STAFF", roleId: <SALES_MANAGER or similar>}` | `201`, envelope `data.user` present, `passwordHash` never in the response body | `users` admin-write path, `08` §8 `users` row |
| 2 | Attempt login before MFA enrollment | `POST /auth/login {email, password}` | `200` with an intermediate MFA-challenge state (not a full access token) — or per Section 6.4, access blocked until MFA is enrolled | `09` §2.8's "MFA required before first admin-panel access" |
| 3 | Enroll MFA | `POST /auth/mfa/setup` (authenticated with the intermediate credential from step 2) | `200`, returns a TOTP secret/QR-encodable value; **`audit_logs` entry NOT required** (self-service MFA setup, not an admin action on another user) | `auth` row, Section 6.4 |
| 4 | Verify MFA | `POST /auth/mfa/verify {otp}` | `200`, full access token + refresh-token cookie issued, claims include the account's resolved permission keys (Section 6.1) | `08` §4.1, `09` §2.1 |
| 5 | Full login (post-enrollment) | `POST /auth/login {email, password}` → MFA challenge → `POST /auth/mfa/verify {otp}` | `200`, access token issued; access token TTL is 10–15 min (Section 6.1) | `08` §4.1 |
| 6 | Access a protected route with the token | `GET /users/me` with `Authorization: Bearer <accessToken>` | `200`, own profile returned | `authMiddleware` (Section 6.3 step 1) |
| 7 | Access an under-permissioned route | `GET /admin/roles` with the same `SALES_MANAGER`-scoped token (no `admin.manage_roles` key) | `403 FORBIDDEN`, generic error shape (Section 6.3 — must be indistinguishable from an ownership-check failure) | `rbacMiddleware` (Section 6.3 step 2), `09` §11 rule 11 |
| 8 | Access with no token | `GET /users/me` with no `Authorization` header | `401 UNAUTHENTICATED` | `authMiddleware` |
| 9 | Refresh rotation | `POST /auth/refresh` (valid refresh cookie) → repeat with the **same, now-rotated-out** cookie | First call: `200`, new access token, refresh cookie rotated. Second call (reused token): triggers Section 6.2's reuse-detection — all sessions for that user revoked, `audit_logs` entry with `action: TOKEN_REUSE_DETECTED` written | `09` §2.6 |
| 10 | Logout | `POST /auth/logout` (authenticated) → `POST /auth/refresh` with the now-logged-out cookie | Logout: `200`. Subsequent refresh: `401` (token revoked) | `auth` row's logout operation |
| 11 | Cross-account profile access | `STAFF` account A's token used against `GET /admin/users` without `users.read` — vs. a `SUPER_ADMIN` token against the same route | Without permission: `403`. With `users.read`: `200`, list returned | `users` row's ownership + admin-scope split |
| 12 | Role deletion guard | `DELETE /admin/roles/:id` where `:id` is a seeded `isSystemRole: true` role | `409 CONFLICT` (or `403`, per whichever the implementation settles on Section 5's status-code table) — **never** a silent `200` | `admin` row, `03` §9.1.2 |
| 13 | Audit trail | After steps 1, 9's reuse event, and 12, query `GET /admin/audit-logs` | Each mutating/security-relevant event above has a corresponding entry; `passwordHash`/token-hash fields in any `before`/`after` snapshot read literally `[REDACTED]`, never the real value | `08` §4.11, `03` §9.8.2 |

**This table is the concrete artifact Section 1's M1 sign-off (Principal Security Architect + Principal Software Architect) checks against** — Sprint 1 is not "acceptance-criteria-met" until every row above is a passing, repeatable test (automated per Section 8, not a one-time manual click-through).

---

## 12. Sprint 1 — Consolidated Checklist

*(Unchecked — this document is planning only; Sprint 1 execution closes these.)*

**Prerequisite track (Section 4 — blocks module work below):**
- [x] **COMPLETED** — `core/security`, `core/exceptions`, `core/di` built (Section 4.1); `core/database` transaction helper added; `core/events`/`utils`/`constants` deferrals documented in-folder
- [x] **COMPLETED** — `GET /health` split into liveness-only `/health` + readiness-checking `/ready`, per `docs/10_devops_architecture.md` §10.4 (Section 4.2). Proven under real dependency failure: Mongo stopped → `/health` 200, `/ready` 503, recovery without restart
- [ ] **BLOCKED** — Shared Development environment (Section 4.3, Open Item 7). Confirmed NOT PROVISIONED; additionally blocked by **ADR-0003** (no IaC tool named in any locked document) and by the absence of cloud accounts/credentials

**Module build:**
- [x] **COMPLETED** — `packages/database` migration `0001-identity-indexes` for the Section 3 collections' indexes, applied and verified against live MongoDB
- [x] **COMPLETED** — `0002-identity-reference-data`: 7 system roles + 6 Phase-1 permission keys, per `docs/13_deployment_strategy.md` §5.4's migration (not seed) treatment. Idempotency proven by a second run. **Note:** only `SUPER_ADMIN` holds grants — the other six roles' mappings are unspecified by any locked document and are fail-closed pending a decision (remediation report §11 item 1)
- [ ] **PARTIALLY BLOCKED** — `auth` module: all 4 layers per Section 7.1. Six of seven use cases are unblocked; **`RegisterUser` is blocked by ADR-0002** (privileged-account provisioning) and must not be implemented until it is approved
- [ ] `users` module: all 4 layers built per Section 7.2; all endpoints in Section 5's `users` row live
- [ ] `admin` module: all 4 layers built per Section 7.3; all endpoints in Section 5's `admin` row live
- [ ] Every Section 6 security control implemented and verified (JWT, MFA, RBAC 3-step order, password policy, rate limiting, CORS/CSRF, audit logging with redaction)

**Verification:**
- [ ] Section 8's coverage floors met; every locked endpoint has a Contract Test + happy-path + failure-path API Test
- [ ] The three Phase-1-relevant `docs/09_security_architecture.md` §12.1 items pass (Section 1's precise list — MFA enforcement, refresh-reuse detection, breach-list check)
- [ ] Section 10's open items resolved (or explicitly deferred with a named trigger, per this series' own deferral discipline) — **Open Item 6 is now formalized as ADR-0002 and must be approved before `RegisterUser` is implemented, not after**
- [ ] **All 13 rows of Section 11's Acceptance Test table pass**, automated and repeatable. Step 1 (provision a `STAFF` account) presumes ADR-0002's recommended option; it stays provisional until that ADR is approved
- [ ] Deployed to Shared Development and confirmed functioning there (`11` §7.2) — **or** the DoD substitution from Open Item 7 is formally agreed and recorded. **Currently impossible: ADR-0003 + no cloud accounts**
- [ ] M1 milestone sign-off obtained (Principal Security Architect + Principal Software Architect, `15` §4)

**Sprint 1 is complete when every box above is checked.** Phase 2 (`catalog`, `cart`, `media`, per `15` §3.1) begins only after M1 closes — every subsequent module's `08` §8 contract row assumes `auth`'s Bearer-token scheme and `admin`'s permission-key model already exist and work.

---

## 13. Sprint 1 Readiness Verdict (v1.2, post-remediation)

# NOT READY

Per the readiness gate's own definition: **NOT READY** applies when "security ambiguity remains". **ADR-0002 (who may create a privileged `STAFF`/`ADMIN` account) is unresolved**, which also rules out *READY WITH EXTERNAL DEPENDENCY* — that status requires "no application implementation is blocked by an unresolved security/architecture decision", and `RegisterUser` is exactly that.

| Dimension | Status |
|---|---|
| Repository / code foundation | **READY** — all blocking `core/` subsystems built, 20/20 tests green, running in Docker |
| Governance decisions | **BLOCKED** — ADR-0001, ADR-0002, ADR-0003, plus the role→permission matrix |
| Shared Development environment | **NOT PROVISIONED** |
| **Overall Sprint 1 gate** | **NOT READY** |

**Updated implementation sequence** (once ADRs are approved):

1. Approve ADR-0001 / -0002 / -0003 and the role→permission matrix in one Architecture Review.
2. `auth` module — the six use cases unaffected by ADR-0002 (`LoginUser`, `RefreshToken`, `LogoutUser`, `SetupMfa`, `VerifyMfa`, password reset).
3. `RegisterUser` — **only after ADR-0002 is Approved**.
4. `users` module (Section 7.2), then `admin` module (Section 7.3).
5. Section 11's 13-row acceptance table, automated.
6. Shared Development deployment — parallel DevOps workstream, gated on ADR-0003.

Full detail: `implementation/01_sprint1_prerequisite_remediation.md`.

---

*This document is an implementation plan. It contains no business logic. It modifies no locked architecture document. The foundation work recorded in v1.2 is cross-cutting infrastructure only — `apps/api/src/modules/` still contains zero `.ts` files.*
