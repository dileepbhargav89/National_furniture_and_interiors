# ADR-0002 — How `STAFF` / `ADMIN` Accounts Are Provisioned

| Field | Value |
|---|---|
| **Status** | **APPROVED — Option 1 adopted 2026-08-11.** |
| **Date drafted** | 2026-08-10 |
| **Date approved** | 2026-08-11 |
| **Approved by** | **Project owner**, deciding directly. See "Approval" below for how this maps onto `docs/18` §6.3's named roles and what that substitution does and does not cover. |
| **Author** | Sprint 1 prerequisite remediation (AI-assisted session) |
| **Requires approval from** | Principal Security Architect (primary — `docs/17_architecture_index.md` §8 assigns the Security domain) + Principal Software Architect, via Architecture Review (`docs/11_engineering_workflow.md` §8.3) |
| **Amends** | `docs/08_api_architecture.md` §8's `auth` contract row — clarifying note added at v1.1 recording that `POST /auth/register` is `CUSTOMER`-only. |
| **Cited by** | `implementation/01_sprint1_identity_access.md` §10 Open Item 6, §11; `implementation/03_sprint1_implementation_report.md` §2, §5 |

---

## Problem

`docs/15_master_project_plan.md` §3.1's Phase 1 acceptance criterion reads, verbatim:

> "A `STAFF` account **can register**, MFA-enroll, log in, and be permission-checked against a protected route."

But `docs/08_api_architecture.md` §8's `auth` contract row specifies `POST /auth/register` as having **no authentication** ("session-bootstrapping by definition"), and **no locked document anywhere states what `userType` an anonymous caller may request at registration.**

Read literally together, those two statements describe an endpoint where an unauthenticated caller submits `userType: "STAFF"` and receives a privileged account. That would be a **privilege-escalation vulnerability** that contradicts:

- `docs/09_security_architecture.md` §2.2 — the fail-closed principle;
- `docs/09` §1.12 — Admin as "the highest-value target on the platform by privilege level", protected by mandatory MFA and network hardening;
- `docs/09` §2.3 / `docs/02_enterprise_architecture.md` §14 — the entire permission-key RBAC model, whose value collapses if anyone can self-assign a privileged role;
- `docs/09` §10's `auth` row — which lists "MFA bypass attempts" as a modeled threat.

## Context — Search Performed

Every document named in the remediation brief was searched for an existing resolution: `docs/02`, `docs/08`, `docs/09`, `docs/11`, `docs/15`, `docs/16`, `docs/18`, plus `docs/03`'s `users` collection (§9.1.1, which defines the `userType` enum `CUSTOMER` / `STAFF` / `ADMIN` but says nothing about who may set it).

**Result: no explicit decision exists.** The nearest relevant statements are:
- `docs/08` §8's `users` row: `/admin/users` exists as an admin-authenticated surface with `users.write` for "admin, any user" — an account-creation path *does* exist behind authentication.
- `docs/09` §2.8: a lost-MFA-device reset requires "identity re-verification by a `SUPER_ADMIN`" — establishing the precedent that privileged identity changes are `SUPER_ADMIN`-mediated and explicitly **not** self-service, because "self-service MFA reset is a well-known bypass vector".
- `docs/02` §14: `SuperAdmin` is the role holding "User & Role Management".

These make the intent strongly inferable but do not state it. Per `docs/18_CLAUDE_CONSTITUTION.md` §7 Rule 3, inference is not a substitute for a decision.

## Options Considered

**Option 1 — `POST /auth/register` always creates a `CUSTOMER`; privileged accounts are created only via the authenticated admin surface (recommended).**

- `POST /auth/register` ignores any client-supplied `userType`/`roleId` and hard-assigns `userType: CUSTOMER` + the `CUSTOMER` role. A request attempting to set them is rejected by the strict-mode Zod schema (`docs/08` §3.12 — unknown/unpermitted fields are rejected, not stripped), which also satisfies the mass-assignment control in `docs/09` §3.10 and Secure Coding Rule 7.
- `STAFF` / `ADMIN` accounts are created by a `SUPER_ADMIN` through `POST /admin/users` (the `users` module's admin surface, `docs/08` §8), gated by `users.write` + `admin`'s `STAFF`/`ADMIN`-only rule.
- The very first `SUPER_ADMIN` is bootstrapped by a migration (`docs/13_deployment_strategy.md` §5.4's reference-data exception), not by any HTTP endpoint.
- `docs/15` §3.1's word "register" is then read as "an account comes into existence", not "self-registers via the public endpoint".

*Consequence:* the Phase 1 acceptance criterion is still fully demonstrable (a `STAFF` account exists, MFA-enrolls, logs in, is permission-checked) — the account simply originates from an admin action rather than an anonymous one.

**Option 2 — `POST /auth/register` accepts `userType` but privileged registrations require an out-of-band approval step.**
Rejected as scope-inflating: it invents an approval workflow, state machine, and notification path that no locked document describes, to serve a use case no locked document requests.

**Option 3 — Implement `POST /auth/register` literally, honouring a client-supplied `userType`.**
Rejected outright. This is the privilege-escalation hole described under Problem. It cannot be adopted without contradicting `docs/09` §2.2, and would be a direct violation of `docs/18` §8's "Do not bypass RBAC".

## Decision (APPROVED 2026-08-11)

Adopt **Option 1**. Option 3 — honouring a client-supplied `userType` — is **rejected permanently**, not deferred; it is the privilege-escalation hole described under Problem and re-proposing it requires a new ADR that overturns this one.

Concretely:
1. `POST /auth/register` is `CUSTOMER`-only. `userType` and `roleId` are not accepted as input fields at all.
2. `POST /admin/users` (authenticated, `users.write`, `STAFF`/`ADMIN` `userType` only) is the sole runtime path that creates a privileged account.
3. The initial `SUPER_ADMIN` is bootstrapped via a migration, following `docs/13` §5.4's reference-data pattern (the same mechanism migration `0002` already uses for `roles`/`permissions`).
4. `docs/08_api_architecture.md` §8's `auth` row gains a clarifying note recording rule 1, with a Revision History entry citing this ADR (`docs/18` §5.1's remediation pattern).

## Consequences

**Now that it is approved:** `RegisterUser` is implementable and has been implemented. `implementation/01_sprint1_identity_access.md` §11's acceptance-test table, previously flagged provisional, is confirmed.

This decision **closes the privilege-escalation ambiguity** identified under Problem. The literal reading of `docs/15` §3.1 + `docs/08` §8 — under which an anonymous caller could submit `userType: "STAFF"` and receive a privileged account — is no longer available to any future implementer: the ambiguity is resolved in favour of the fail-closed reading, in this ADR, in `docs/08` §8's v1.1 note, and in code.

### As-built (verified 2026-08-11, not merely intended)

| Rule | Where enforced | Evidence |
|---|---|---|
| `POST /auth/register` accepts no `userType`/`roleId` | `apps/api/src/modules/auth/presentation/validators.ts` — `registerSchema` is `.strict()`, so an unknown field is **rejected**, not stripped (`docs/08` §3.12, `docs/09` §3.10 mass-assignment) | `userType: "STAFF"` → **400 `VALIDATION_ERROR`** |
| `CUSTOMER` is hard-assigned, never derived from input | `register-user.use-case.ts` — literal `userType: 'CUSTOMER'`; `RegisterUserInput` has no such field to derive from | 201 with `userType: CUSTOMER` |
| Privileged accounts only via authenticated admin path | `POST /admin/users` behind `authMiddleware` → `requireStaffOrAdmin()` → `requirePermissions('users.write')` | `CUSTOMER` → **403 `FORBIDDEN`** |
| First `SUPER_ADMIN` via migration, not HTTP | `packages/database/migrations/0004-bootstrap-super-admin.ts`; no-op unless env vars set, no default credentials | migration verified |
| Regression guard | `apps/api/tests/modules/auth/register-user.test.ts` (8 cases) | prevents silent reintroduction |

**Note on scope:** this ADR governs *who may create a privileged account*. It does not govern `users.read_self` grant semantics — see the OPEN item recorded in `implementation/03_sprint1_implementation_report.md` §5.

## Source Documents

`docs/02_enterprise_architecture.md` §14; `docs/03_database_design.md` §9.1.1; `docs/08_api_architecture.md` §3.12, §8; `docs/09_security_architecture.md` §1.12, §2.2, §2.3, §2.8, §3.10, §10, §11 rule 7; `docs/13_deployment_strategy.md` §5.4; `docs/15_master_project_plan.md` §3.1; `docs/18_CLAUDE_CONSTITUTION.md` §7 Rule 3, §8.

## Approval

- [x] **Decision taken by the project owner on 2026-08-11**, choosing Option 1 ("CUSTOMER only") from the options presented in this ADR.
- [x] Outcome recorded: **APPROVED**.
- [x] `docs/08_api_architecture.md` §8 `auth` row updated with a clarifying note and a v1.1 Revision History entry citing this ADR (`docs/18` §5.1).
- [x] Implementation followed approval, not the reverse (`docs/18` §6.4) — `RegisterUser` was written after the decision was given.

### How this maps onto `docs/18` §6.3 — stated plainly

`docs/18` §6.3 vests approval in the Principal Security Architect and Principal Software Architect via a scheduled Architecture Review (`docs/11` §8.3). **Neither role is staffed and no such review body exists in this repository** — `CODEOWNERS` carries placeholder `@nfi-org/*` handles and no GitHub organisation backs them. The project owner is the sole decision-making authority present and approved this ADR directly, exercising the authority those roles would otherwise hold.

This is recorded rather than glossed because it is a **process substitution, not a process completion**. What it covers: the decision itself is authoritative and binding on implementation. What it does not cover: independent security review by a second qualified party. If those roles are later staffed, this ADR should be re-ratified — the decision is sound on the evidence above, but it has been reviewed by one party, not two.

## Status History

| Date | Status | Note |
|---|---|---|
| 2026-08-10 | PROPOSED | Drafted during Sprint 1 prerequisite remediation; blocked `RegisterUser` |
| 2026-08-11 | **APPROVED** | Option 1 adopted by the project owner. `docs/08` §8 updated to v1.1. Implemented and verified — see the As-built table above. |
