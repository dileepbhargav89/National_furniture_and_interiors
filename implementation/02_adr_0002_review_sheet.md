# Architecture Review Decision Sheet — ADR-0002 (Privileged-Account Provisioning)

**For:** Architecture Review (`docs/11` §8.3)
**ADR:** `docs/adr/0002-privileged-account-provisioning.md`
**Current status:** **PROPOSED — NOT APPROVED. `RegisterUser` BLOCKED.**
**Severity:** **HIGHEST in the pack.** This is a security decision, not a design preference.

---

## 1. Problem

`docs/15_master_project_plan.md` §3.1's Phase 1 acceptance criterion states a `STAFF` account "**can register**". `docs/08_api_architecture.md` §8's `auth` row specifies `POST /auth/register` as **unauthenticated** ("session-bootstrapping by definition"). **No locked document constrains which `userType` an anonymous caller may request.**

Read literally together, an anonymous internet caller could submit `userType: "STAFF"` and receive a privileged account.

## 2. Security Threat Model

| STRIDE | Threat if privileged self-registration were permitted |
|---|---|
| **Elevation of Privilege** | Anonymous → `STAFF`/`ADMIN` in one unauthenticated request. Complete bypass of the permission-key RBAC model (`docs/02` §14, `docs/09` §2.3) |
| **Spoofing** | Attacker enrols **their own** MFA on the self-created account, so MFA (`docs/09` §2.8) *authenticates the attacker* rather than protecting the platform |
| **Information Disclosure** | Any granted `users.read` exposes every staff/admin identity record (`docs/03` §9.1.1) |
| **Tampering** | Depending on grants, catalog/pricing/order mutation (`docs/09` §10) |
| **Repudiation** | `audit_logs` faithfully records a legitimately-created account — the audit trail confirms rather than detects the attack |

**Blast radius:** `docs/09` §1.12 identifies Admin as "the highest-value target on the platform by privilege level". `docs/09` §10's `admin` row states a compromised `SUPER_ADMIN` session is "the platform's ceiling risk". Privileged self-registration would make that ceiling reachable by anyone with an internet connection, and would simultaneously nullify **three** locked controls — MFA, permission-key RBAC, and admin network hardening.

## 3. Current Evidence

Searched `docs/02`, `docs/03`, `docs/08`, `docs/09`, `docs/11`, `docs/15`, `docs/16`, `docs/18` — **no explicit resolution exists.** The four controls that bear on it all point the same direction:

| Source | Statement |
|---|---|
| `docs/09` §2.2 | **Fail-closed principle** — "any ambiguity… must resolve to `403`, never to allowing access by default" |
| `docs/09` §1.12 | Admin is "the highest-value target on the platform by privilege level" |
| `docs/09` §2.8 | Lost-MFA recovery requires "identity re-verification by a `SUPER_ADMIN`… **not** a self-service reset, since self-service MFA reset is a well-known bypass vector" |
| `docs/02` §14 | User & Role Management is a `SuperAdmin` capability |
| `docs/08` §8 `users` row | `/admin/users` already exists as an authenticated admin surface with `users.write` for "admin, any user" |
| `docs/18` §8 | "Do not bypass RBAC" |
| `docs/03` §9.1.1 | Defines the `userType` enum but says nothing about who may set it |

**§2.8 is the decisive precedent:** the architecture has already ruled, in an adjacent case, that privileged identity operations are `SUPER_ADMIN`-mediated and never self-service. Extending that same logic to account *creation* is consistent; contradicting it would be arbitrary.

## 4. Option A — Public register creates `CUSTOMER` only *(recommended)*

- `POST /auth/register` does not accept `userType` or `roleId` **as input fields at all**. A request containing them is rejected by the strict-mode Zod schema (`docs/08` §3.12 — unknown fields rejected, not stripped), which simultaneously satisfies the mass-assignment control (`docs/09` §3.10, Secure Coding Rule 7).
- The handler hard-assigns `userType: CUSTOMER` and the `CUSTOMER` role.
- `STAFF`/`ADMIN` are created via `POST /admin/users` — authenticated, `users.write`-gated, `STAFF`/`ADMIN`-`userType`-gated (`docs/08` §8).
- The first `SUPER_ADMIN` is bootstrapped by a migration (`docs/13` §5.4's reference-data exception — the same mechanism migration `0002` already uses).
- `docs/15` §3.1's word "register" is read as "an account comes into existence", not "self-registers via the public endpoint".

**Uses only surfaces `docs/08` §8 already specifies. No new endpoint, collection, or workflow.**

## 5. Option B — Controlled `STAFF` invitation flow

`SUPER_ADMIN` issues a time-boxed invitation token; the invitee completes their own credential setup via a dedicated endpoint.

**Merits:** better onboarding UX; no admin ever handles a temporary password.

**Costs — all of which are new architecture:** a new endpoint, a new TTL-indexed token collection, a new email template, and invitation state. **None appears in `docs/03`'s 35 collections or `docs/08` §8's contract table.** Adopting it requires its **own** ADR in addition to this one.

**Assessment:** a legitimate future enhancement, not Phase 1 scope. Recommend recording as **Deferred with a named trigger** (`docs/07`'s trigger-based-deferral pattern) — e.g. "revisit when staff onboarding exceeds N accounts/month".

## 6. Rejected Alternatives

| Alternative | Reason for rejection |
|---|---|
| Register accepts `userType`, privileged ones queue for approval | Invents an approval workflow, state machine, and notification path no locked document describes — strictly more surface than Option B for the same outcome |
| Email-domain allowlist auto-elevation (`@nationalinteriors.*` → `STAFF`) | **Security-rejected.** An email domain is not an authentication factor; trivially spoofable at registration. Contradicts `docs/09` §2.2 |
| Separate "hidden" staff-registration endpoint | **Security-rejected.** Security through obscurity; contradicts `docs/09` §1.12's threat posture |
| Implement `docs/15` §3.1 literally (anonymous `userType: STAFF`) | **Rejected outright** — §2's threat model; direct `docs/18` §8 violation |

## 7. Recommended Decision

**Adopt Option A for Phase 1. Record Option B as Deferred with a named trigger.**

Note that Option A is also the **least implementation work** of any option — it *removes* fields from the register payload and reuses an endpoint `docs/08` §8 already specifies. The secure choice is also the cheapest.

## 8. Exact Endpoint Behavior After Approval

| Endpoint | Auth | Behavior |
|---|---|---|
| `POST /auth/register` | None | Accepts identity/credential fields only. `userType`/`roleId` **not in the schema**; if present → `400 VALIDATION_ERROR` (`docs/08` §3.11). Creates `userType: CUSTOMER` + `CUSTOMER` role. Strict rate-limit tier — 5/min per IP, 10/min per account (`docs/08` §4.4) |
| `POST /admin/users` | Bearer + `users.write` + `STAFF`/`ADMIN` `userType` | Sole runtime path creating `STAFF`/`ADMIN`. Writes `audit_logs` (`docs/08` §4.11) |
| *(bootstrap)* | N/A — migration | First `SUPER_ADMIN` via `docs/13` §5.4 reference-data migration. Runs once, reviewed, never a recurring seed |

## 9. Role Creation Rules

1. `CUSTOMER` — self-service, unauthenticated.
2. `STAFF`/`ADMIN` `userType` — `SUPER_ADMIN` only, authenticated.
3. Role assignment (`roleId`) is never client-supplied on the public path.
4. `roles.isSystemRole: true` documents remain undeletable (`docs/03` §9.1.2).
5. A privileged account is unusable until MFA enrolment completes (§10).

## 10. MFA Implications

`docs/09` §2.8 requires TOTP MFA for **all** `STAFF`/`ADMIN` before first admin-panel access. Under Option A this is coherent: the account is created by an authenticated `SUPER_ADMIN`, then the holder enrols MFA on first login. **Under privileged self-registration it would be incoherent** — the attacker enrols MFA on their own account, and MFA protects the attacker's session rather than the platform. This is the sharpest single argument against any option permitting privileged self-registration.

## 11. RBAC Implications

Option A preserves `roles.permissionIds[] → permissions.key` as the sole enforcement source of truth (`docs/03` §9.1.2–9.1.3) and keeps grant assignment an administrative act. **Note the dependency:** even under Option A, a newly-created `STAFF` account holds **zero** permissions until the role→permission matrix (B2) is resolved — see `implementation/02_phase1_role_permission_decision_sheet.md`. **ADR-0002 alone does not make the Phase 1 acceptance criterion demonstrable.**

## 12. Audit Implications

`POST /admin/users` is a mutating `STAFF`/`ADMIN`-authenticated endpoint, so `docs/08` §4.11 requires an `audit_logs` entry: `actorId`, `action`, `entityType`, `entityId`, redacted `before`/`after`, `X-Request-ID`. `passwordHash` must read `[REDACTED]` (`docs/03` §9.8.2, `docs/09` §11 rule 8). Public `CUSTOMER` self-registration is **not** audit-logged — `audit_logs` is for staff/admin accountability (`docs/08` §4.11).

## 13. Required Human Approvals

- **Principal Security Architect** — primary; owns the Security domain (`docs/17` §8). `docs/09` §12.3 and `docs/11` §4.7 make security review mandatory for auth-touching changes.
- **Principal Software Architect** — `docs/18` §6.3 circulation.

## 14. Acceptance Tests That Become Valid After Approval

From `implementation/01_sprint1_identity_access.md` §11, currently provisional:

| # | Test | Status now | After approval |
|---|---|---|---|
| 1 | `SUPER_ADMIN` provisions a `STAFF` account via `POST /admin/users` → `201`, no `passwordHash` in response | Provisional | **Valid** |
| 1b | *(new)* Anonymous `POST /auth/register` with `userType: "STAFF"` → **`400 VALIDATION_ERROR`** | Cannot be written | **Valid — the key negative test** |
| 1c | *(new)* Anonymous `POST /auth/register` (valid body) → `201`, account is `CUSTOMER` | Cannot be written | **Valid** |
| 2–5 | MFA challenge, enrolment, verification, full login | Provisional | **Valid** |
| 13 | Audit entry for step 1 with `passwordHash` = `[REDACTED]` | Provisional | **Valid** |

**Test 1b is the regression guard** for this entire decision and must exist before `RegisterUser` ships.

## 15. Exact Approval Statement Required

> **ADR-0002 is APPROVED — Option A.** `POST /auth/register` creates `CUSTOMER` accounts only and does not accept `userType` or `roleId`. `STAFF`/`ADMIN` accounts are provisioned exclusively through the authenticated `POST /admin/users` surface. The initial `SUPER_ADMIN` is bootstrapped via a reviewed migration per `docs/13` §5.4. Option B (invitation flow) is **Deferred** with the trigger: ______________________. `docs/08_api_architecture.md` §8's `auth` row is to be updated with a clarifying note and a Revision History entry citing ADR-0002. Implementation of `RegisterUser` is authorized.
>
> Approved by: ______________________ (Principal Security Architect), date __________
> Approved by: ______________________ (Principal Software Architect), date __________

---

*No approval is claimed or implied. `RegisterUser` remains BLOCKED. `docs/adr/0002` remains PROPOSED.*
