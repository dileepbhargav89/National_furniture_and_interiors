# Sprint 1 Entry Gate

**Date:** 2026-08-11
**Purpose:** The authoritative go/no-go checklist for opening Sprint 1 — Identity & Access.
**Re-run this document after the Architecture Review** (`implementation/02_architecture_review_pack.md`) and update the verdict.

---

## Gate Checklist

| # | Criterion | Status | Evidence / Blocker |
|---|---|---|---|
| 1 | ADR-0001 approved or explicitly dispositioned | ❌ **HUMAN APPROVAL REQUIRED** | `RECOMMENDED`; no approval mechanism exists (placeholder CODEOWNERS, no org) |
| 2 | ADR-0002 approved | ❌ **HUMAN APPROVAL REQUIRED** | `PROPOSED`. **Security-critical** |
| 3 | `RegisterUser` security behavior resolved | ❌ **BLOCKED** | Depends on #2 |
| 4 | Role-permission matrix sufficiently resolved for acceptance testing | ❌ **OPEN** | 36 of 42 cells unresolved |
| 5 | `users.read_self` semantics resolved | ❌ **OPEN** | Q1 — explicit grant vs. inherent. Highest-leverage question |
| 6 | `CUSTOMER` authorization model resolved | ❌ **OPEN** | Absent from `docs/02` §14's table entirely; follows #5 |
| 7 | `admin.*` permissions resolved | ⚠️ **PARTIAL** | `admin.manage_roles` explicit (`docs/08` §8); `admin.view_audit_log` needs confirmation |
| 8 | Rate-limit dependencies dispositioned | ❌ **CONFIRMATION REQUIRED** | `RECOMMENDED` retain; precedent evidence supplied |
| 9 | Turbo race fix approved/merged | ❌ **APPROVAL REQUIRED** | Validated 2/2, reverted. `ls apps/*/turbo.json` = 0 |
| 10 | ADR-0003 resolved **or** formally declared not required for Sprint 1 scope | ❌ **OPEN** | `PROPOSED`; no tool selected. Scope question unanswered |
| 11 | Shared Development path explicitly decided | ❌ **OPEN** | Option A or B — neither chosen |
| 12 | DoD exception explicitly approved if Shared Dev unavailable | ❌ **DOES NOT EXIST** | No exception approved, requested, or applied |
| 13 | No unresolved security ambiguity blocks Sprint 1 acceptance tests | ❌ **FAILS** | #2 and #4 both do |
| 14 | No unauthorized dependency changes | ⚠️ **PENDING #8** | Only `express-rate-limit`/`rate-limit-redis`, disclosed and analysed |
| 15 | No locked-document violations | ✅ **VERIFIED** | `git diff` across all 18 returns empty; history shows status `A` only |
| 16 | Git working tree auditable | ✅ **VERIFIED** | Clean but for the intended governance docs; every change traceable |
| 17 | Tests green | ✅ **VERIFIED** | **20/20 passed**, 6 files |
| 18 | Lint green | ✅ **VERIFIED** | 8/8 packages |
| 19 | Typecheck green | ✅ **VERIFIED** | 7/7 packages |
| 20 | Build green | ✅ **VERIFIED** | 23/23 turbo tasks from clean state |
| 21 | Docker stack healthy | ✅ **VERIFIED** | 6 services up; `mongodb`/`redis`/`api` report `(healthy)`; `/health` 200, `/ready` 200 both connected |

**Score: 7 verified · 2 partial/pending · 12 blocked or open.**

---

## Assessment Against the Three Statuses

### Why not **READY**

Requires every criterion satisfied. Twelve are not — including two **security** criteria (#2, #4) and the explicit disqualifier at #13.

### Why not **READY WITH EXTERNAL DEPENDENCY**

This status requires that **only** an external dependency remains, with *"no application implementation blocked by an unresolved security/architecture decision."*

Two application-blocking security decisions remain **internal**:
- **ADR-0002** blocks `RegisterUser` (#2, #3)
- **The RBAC matrix** blocks acceptance testing beyond `SUPER_ADMIN` (#4, #5, #6)

Neither is external. Both are governance decisions available to roles that simply have not acted.

> **This status becomes correct the moment items #1–#9 are approved and only Shared Development (#10–#12) remains outstanding.** That is the realistic next milestone.

### Why **NOT READY** is correct

Security ambiguity remains (#13), required approvals do not exist (#1, #2), RBAC is insufficiently resolved for acceptance (#4), Shared Dev is undecided (#11, #12), and CI is not yet trustworthy (#9).

---

## VERDICT

# NOT READY

**Technical readiness is achieved. Governance readiness is not.** These are not interchangeable, and the foundation working is not evidence that Sprint 1 may open.

Criteria #15–#21 — the entire engineering surface — are green: locked documents untouched, tree auditable, 20/20 tests, 23/23 tasks, Docker stack healthy with correct liveness/readiness semantics. **0 `.ts` files exist in `apps/api/src/modules/`.**

Every one of the twelve unmet criteria is a decision awaiting a named human role. **No further engineering work in this repository can change this verdict.**

---

## Path to READY

| Step | Unlocks | Authority |
|---|---|---|
| Approve ADR-0002 (Item 1) | #2, #3 | Principal Security Architect |
| Resolve RBAC matrix Q1–Q10 (Item 2) | #4, #5, #6, #7 | Principal Security Architect |
| Approve ADR-0001 (Item 3) | #1 | Principal Database Architect |
| Disposition rate-limit packages (Item 4) | #8, #14 | Principal Software Architect |
| Merge turbo fix (Item 7) | #9 | Principal DevOps Architect |
| → **Status becomes READY WITH EXTERNAL DEPENDENCY** | #13 clears | |
| Decide Shared Dev path A or B (Item 6) | #11, #12 | Engineering Director |
| Resolve ADR-0003 (Item 5) | #10 | CTO |
| → **Status becomes READY** | | |

---

*Re-run this gate after the Architecture Review. Do not begin Sprint 1 implementation while this verdict reads NOT READY.*
