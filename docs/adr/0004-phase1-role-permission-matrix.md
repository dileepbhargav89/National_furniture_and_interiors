# ADR-0004 — Phase 1 Role → Permission Grant Matrix, and `users.read_self` Grant Semantics

| Field | Value |
|---|---|
| **Status** | **APPROVED — adopted 2026-08-11.** |
| **Date drafted** | 2026-08-11 |
| **Date approved** | 2026-08-11 |
| **Approved by** | **Project owner**, deciding directly. Same process substitution recorded in ADR-0002's "Approval" section applies here — see below. |
| **Author** | Sprint 1 closure (AI-assisted session) |
| **Amends** | `docs/08_api_architecture.md` §8's `users` contract row — the parenthetical "(implicit for own profile)" is superseded (v1.2). |
| **Cited by** | `packages/database/migrations/0003-role-permission-grants.ts`; `implementation/01_phase1_role_permission_matrix.md`; `implementation/02_phase1_role_permission_decision_sheet.md`; `implementation/03_sprint1_implementation_report.md` §4 |

---

## Problem

Two gaps blocked realistic RBAC acceptance testing in Sprint 1.

**1. No locked document states which permission keys each of the seven roles holds.** `docs/02_enterprise_architecture.md` §14 names the roles and `docs/09_security_architecture.md` §163 fixes the key *taxonomy*, but no document fills in the grant cells. Migration `0002` seeded all seven roles with **zero** grants (fail-closed), leaving six of seven roles unable to perform any action at all.

**2. `docs/08` §8's `users` row describes `users.read_self` as "(implicit for own profile)".** "Implicit" is ambiguous against `docs/02` §14's RBAC model, in which `roles.permissionIds[] → permissions.key` is the single enforcement source of truth. Read literally, "implicit" means a caller may read their own profile *without* holding the key — which requires a second, parallel authorization path that no document specifies and that would sit outside the audited grant model.

## Options Considered

**Option A — `users.read_self` is an explicit grant, seeded to all seven roles (adopted).**
Every role's `permissionIds[]` contains `users.read_self`. `requirePermissions('users.read_self')` therefore resolves through the same path as every other key, with no special case.

**Option B — `users.read_self` stays implicit; the route skips the permission check for self-scoped access.**
Rejected. It creates a second authorization mechanism whose grants appear nowhere in `roles`, so an auditor reading the role documents cannot see who may read profiles. It also fails open by construction: if the ownership comparison is ever wrong, nothing behind it denies the request. `docs/09` §2.2 requires fail-closed.

## Decision (APPROVED 2026-08-11)

**Option A.** `users.read_self` is an ordinary explicit grant with no special-casing anywhere in the enforcement path.

### The approved Phase 1 matrix

As implemented in `packages/database/migrations/0003-role-permission-grants.ts`:

| Role | Granted keys |
|---|---|
| `SUPER_ADMIN` | `auth.manage_mfa`, `users.read_self`, `users.read`, `users.write`, `admin.manage_roles`, `admin.view_audit_log` |
| `SALES_MANAGER` | `users.read_self` |
| `DESIGN_MANAGER` | `users.read_self` |
| `DESIGNER` | `users.read_self` |
| `CATALOG_MANAGER` | `users.read_self` |
| `SUPPORT_AGENT` | `users.read_self` |
| `CUSTOMER` | `users.read_self` |

Binding rules:

1. `users.read`, `users.write`, `auth.manage_mfa`, and `admin.manage_roles` are **`SUPER_ADMIN` only** in Phase 1.
2. **Every cell not granted above is denied.** This is a fail-closed default (`docs/09` §2.2), not an oversight or a to-do — a role gains a key only by a later approved decision, never by inference from its name.
3. The matrix covers **Phase 1 only**. Modules arriving in later phases (`catalog`, `cart`, `orders`, …) bring their own keys and require their own grant decision; this ADR does not pre-authorize them.
4. Migration `0003` uses `$set`, not `$setOnInsert`, so a re-run **converges stored grants back onto this matrix** rather than leaving drift in place. This ADR is therefore the executable authority, not merely a description.

## Consequences

- Six of seven roles become functional for self-service, so RBAC acceptance testing against real roles is possible.
- `SUPPORT_AGENT` explicitly does **not** hold `users.read`. Migration `0003`'s `verify()` asserts this directly, because a regression would silently widen support-agent access to every staff and admin identity record.
- `docs/08` §8's `users` row is corrected at v1.2 — "(implicit for own profile)" is replaced, since the adopted mechanism is an explicit grant.
- No parallel authorization path exists. Any future proposal to bypass `requirePermissions` for self-scoped access reopens this ADR.

## Verification (executed, not asserted)

| Check | Result |
|---|---|
| `CUSTOMER` token carries exactly `["users.read_self"]` | verified in-browser against the live stack |
| `CUSTOMER` → `GET /admin/roles` | **403 `FORBIDDEN`** |
| `SALES_MANAGER` → `/admin/roles`, `/admin/users` | **403** both |
| `SUPER_ADMIN` token carries all six keys | verified |
| `SUPPORT_AGENT` lacks `users.read` | asserted by migration `0003`'s `verify()` |
| 403 body never names the missing key | verified (`docs/09` §11 rule 11) |

## Approval

- [x] Decision taken by the project owner on 2026-08-11, selecting Option A ("explicit grant, seed to all seven roles") and `SUPER_ADMIN`-only for `users.read` / `users.write`.
- [x] Outcome recorded: **APPROVED**.
- [x] `docs/08_api_architecture.md` §8 `users` row updated with a v1.2 Revision History entry citing this ADR (`docs/18` §5.1).

### How this maps onto `docs/18` §6.3

As with ADR-0002: `docs/18` §6.3 vests approval in named architect roles via a scheduled Architecture Review, **neither of which is staffed in this repository**. The project owner approved directly, exercising that authority. This is a process substitution, not a process completion — the decision is authoritative and binding, but it has been reviewed by one party rather than two, and should be re-ratified if those roles are later staffed.

## Source Documents

`docs/02_enterprise_architecture.md` §14; `docs/08_api_architecture.md` §8; `docs/09_security_architecture.md` §2.2, §163 (permission-key taxonomy), §11 rule 11; `docs/18_CLAUDE_CONSTITUTION.md` §5.1, §6.3.

## Status History

| Date | Status | Note |
|---|---|---|
| 2026-08-11 | **APPROVED** | Records the grant matrix decided by the project owner during Sprint 1 and already implemented in migration `0003`. Drafted at Sprint 1 closure to give the decision a governed home, per `docs/18` §5.1 — the decision preceded the implementation; this document records it. |
