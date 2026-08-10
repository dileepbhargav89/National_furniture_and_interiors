# ADR-0002 — How `STAFF` / `ADMIN` Accounts Are Provisioned

| Field | Value |
|---|---|
| **Status** | **PROPOSED — NOT YET APPROVED. Blocks implementation of `RegisterUser`.** |
| **Date drafted** | 2026-08-10 |
| **Author** | Sprint 1 prerequisite remediation (AI-assisted session) |
| **Requires approval from** | Principal Security Architect (primary — `docs/17_architecture_index.md` §8 assigns the Security domain) + Principal Software Architect, via Architecture Review (`docs/11_engineering_workflow.md` §8.3) |
| **Amends** | Nothing yet — this ADR *fills a gap*, it does not change an existing decision. If approved it would add a clarifying row to `docs/08_api_architecture.md` §8's `auth` contract row. |
| **Cited by** | `implementation/01_sprint1_identity_access.md` §10 Open Item 6, §11 |

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

## Proposed Decision

Adopt **Option 1**.

Concretely, if approved:
1. `POST /auth/register` is `CUSTOMER`-only. `userType` and `roleId` are not accepted as input fields at all.
2. `POST /admin/users` (authenticated, `users.write`, `STAFF`/`ADMIN` `userType` only) is the sole runtime path that creates a privileged account.
3. The initial `SUPER_ADMIN` is bootstrapped via a migration, following `docs/13` §5.4's reference-data pattern (the same mechanism migration `0002` already uses for `roles`/`permissions`).
4. `docs/08_api_architecture.md` §8's `auth` row gains a clarifying note recording rule 1, with a Revision History entry citing this ADR (`docs/18` §5.1's remediation pattern).

## Consequences

**If approved:** `RegisterUser` becomes implementable, and `implementation/01_sprint1_identity_access.md` §11's acceptance-test table (which already assumes this reading, flagged as provisional) becomes confirmed rather than assumed.

**Until approved (current state):**
- **`RegisterUser` MUST NOT be implemented.** This is the single hard blocker on Sprint 1's `auth` module.
- Every other `auth` use case (`LoginUser`, `RefreshToken`, `LogoutUser`, `SetupMfa`, `VerifyMfa`, password reset) is **unaffected** and may proceed once this remediation's foundation lands — none of them depends on how an account was created.
- Migration `0002` already establishes the 7 roles fail-closed (only `SUPER_ADMIN` holds grants), so nothing in the current database state pre-commits either option.

## Source Documents

`docs/02_enterprise_architecture.md` §14; `docs/03_database_design.md` §9.1.1; `docs/08_api_architecture.md` §3.12, §8; `docs/09_security_architecture.md` §1.12, §2.2, §2.3, §2.8, §3.10, §10, §11 rule 7; `docs/13_deployment_strategy.md` §5.4; `docs/15_master_project_plan.md` §3.1; `docs/18_CLAUDE_CONSTITUTION.md` §7 Rule 3, §8.

## Approval

- [ ] Circulated to Principal Security Architect and Principal Software Architect
- [ ] Architecture Review discussion held (`docs/11_engineering_workflow.md` §8.3)
- [ ] Outcome recorded: Approved / Rejected / Deferred
- [ ] If Approved: `docs/08_api_architecture.md` §8 `auth` row updated with a Revision History entry citing this ADR

**`RegisterUser` may not be implemented until the boxes above are checked** (`docs/18_CLAUDE_CONSTITUTION.md` §6.4).
