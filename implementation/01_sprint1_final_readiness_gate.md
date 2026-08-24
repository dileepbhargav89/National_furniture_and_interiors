# Sprint 1 Final Readiness Gate

**Date:** 2026-08-11
**Scope:** Governance gate only. No business module implemented, no infrastructure provisioned, no dependency added, no ADR self-approved, no locked document modified.
**Governing rules:** `docs/18_CLAUDE_CONSTITUTION.md` — §2 (compliance), §6 (ADR process), §7 (AI Operating Rules), §8 (prohibited actions).

---

## 0. Phase 0 Audit — Current State vs. Previous Findings

The previous review (`implementation/01_sprint1_architecture_decision_review.md`) was **not** assumed correct. Every claim was re-verified against the live repository.

| # | Check | Previous finding | Current finding (verified 2026-08-11) | Difference |
|---|---|---|---|---|
| 1 | Git working tree | Clean | **Clean** — `git status` empty | None |
| 2 | Commits | 4 | **5** (`08b16e6` added the review doc) | Expected |
| 3 | `docs/01`–`18` modified? | Never | **Never** — `git log --name-status` shows status `A` (added) in the initial commit only; zero modifications in any later commit | None ✅ |
| 4 | ADR statuses | All PROPOSED | **All PROPOSED** at audit time | None |
| 5 | Business logic in `apps/api/src/modules/` | 0 `.ts` files | **0 `.ts` files** | None ✅ |
| 6 | `core/` implementations | Built | **22 `.ts` files** across 10 subsystems | None |
| 7 | Migrations | 2 + runner + types | **4 files** — `0001`, `0002`, `run.ts`, `types.ts` | None |
| 8 | `turbo.json` / per-package overrides | Root only; candidate fix reverted | **Root only** — no `apps/*/turbo.json` exists | None ✅ (revert held) |
| 9 | Unauthorized dependencies | `express-rate-limit`, `rate-limit-redis` (flagged for confirmation) | **Same two**, no others added | None |
| 10 | Sprint 0 foundation | Complete/verified | **Complete** — `implementation/00_foundation_setup.md` §6 closed | None |
| 11 | Turbo race | Reproducible | **Still reproducible — 3/3 failures** this session, now affecting **both** apps | Confirmed, slightly worse than reported |
| 12 | Shared Development | Not provisioned | **Not provisioned** — no IaC, no cloud CLI, no credentials, placeholder deploy workflows | None |
| 13 | Approval mechanism available? | Not previously assessed | **NO** — CODEOWNERS carries placeholder `@nfi-org/*` handles (self-documented as such), no GitHub organisation exists, nothing pushed to remote | **New finding** |

**Material difference from the previous review:** finding 13. The absence of any authorized approval mechanism is what determines every ADR's status below — it is the reason nothing can be marked Approved in this session regardless of how strong the evidence is.

---

## 1. Executive Summary

The engineering foundation is complete and independently verified. **Every remaining blocker is a governance decision requiring a human approver, and no approval mechanism exists in this repository.**

Three ADRs and one RBAC matrix await decisions from named roles that cannot act here. One CI defect has a validated fix held unmerged pending its owner's approval. Sprint 1 cannot open, and no amount of further engineering work in this repository can change that.

**Verdict: NOT READY** (§17).

---

## 2. Foundation Status

**READY.**

| Component | State | Evidence |
|---|---|---|
| `core/config` | ✅ | Fail-fast Zod validation; unit-tested incl. missing-var and short-secret rejection |
| `core/database` | ✅ | Connection factory + `withTransaction()` helper (`docs/06` §4.2) |
| `core/cache` | ✅ | Redis client factory |
| `core/logger` | ✅ | Pino + `requestIdMiddleware` (`docs/08` §3.1) |
| `core/security` | ✅ | Strict CORS allow-list, Helmet, generic Redis rate-limiter factory inventing no limit values |
| `core/exceptions` | ✅ | 4 base classes (`docs/02` §16), envelope builder, centralized error middleware |
| `core/di` | ✅ | Manual composition root (`docs/02` §7.3), wiring only |
| `core/events` | ⏸️ Deferred | Documented — no Phase-1 event exists; first exercised Phase 3 |
| `core/utils`, `core/constants` | ⏸️ Deferred | Documented — no current consumer |

All ten subsystems accounted for; the three deferrals each carry an in-folder README stating the reason.

---

## 3. ADR-0001 Status — `schema_migrations`

**Status: RECOMMENDED — HUMAN APPROVAL REQUIRED** *(raised from PROPOSED this session)*

Re-evaluated against `docs/03` §4, `docs/13` §5.6/§10.2/§14, `docs/16` §8.3/§17, `docs/18` §2.6. The evidence continues to support **Option 1** (add as a 36th collection holding deployment metadata). No locked document requires an alternative. `docs/16` §17 explicitly anticipates this ADR "early in implementation".

**Why not Approved:** `docs/18` §6.3 vests approval in a scheduled Architecture Review by named human roles. Audit finding 13 confirms no such mechanism exists here. Marking it Approved would be fabricating governance.

**Implementation permitted?** **No.** `docs/18` §6.4 — "the ADR must be Approved *before* dependent implementation code is written." The migration runner therefore still creates no tracking collection and relies solely on idempotency (proven: repeat runs leave all counts unchanged). One marked extension point awaits approval.

**Blocks Sprint 1?** No. Blocks `docs/13` §10.2's release-checklist item only.

---

## 4. ADR-0002 Status — Privileged-Account Provisioning

**Status: PROPOSED — unchanged. `RegisterUser` remains BLOCKED.**

**Determination requested — may `POST /auth/register` create `CUSTOMER`, `STAFF`, or `ADMIN`?**

**Evidence-based answer: `CUSTOMER` only.** Four independent locked controls converge:

| Source | What it establishes |
|---|---|
| `docs/09` §2.2 | Fail-closed — ambiguity resolves to denial, never default-allow |
| `docs/09` §1.12 | Admin is "the highest-value target on the platform by privilege level" |
| `docs/09` §2.8 | Precedent: privileged identity changes are `SUPER_ADMIN`-mediated and explicitly **not** self-service, because "self-service… is a well-known bypass vector" |
| `docs/02` §14 + `docs/08` §8 | User & Role Management is a `SuperAdmin` capability; `/admin/users` already exists as the authenticated creation surface |

A self-service path to `STAFF` would nullify MFA, permission-key RBAC, and admin network hardening simultaneously — an attacker would enrol their own MFA on a self-created privileged account. `docs/18` §8 ("Do not bypass RBAC") forbids it directly.

**Option A remains the recommendation** — and is also the *least* implementation work, since it removes fields from the register payload and reuses `POST /admin/users`, which `docs/08` §8 already specifies. Options B (invitation flow) and C variants all require collections, endpoints, or workflows that appear in **no** locked document, and would each need their own ADR.

**Why not Approved:** same as §3 — no approval mechanism. `docs/09` §12.3 and `docs/11` §4.7 additionally require security review for any auth-touching change; this is the design-level instance.

**Blocks Sprint 1?** **Yes, partially and precisely.** Blocks `RegisterUser` **only**. Unblocked: `LoginUser`, `RefreshToken`, `LogoutUser`, `SetupMfa`, `VerifyMfa`, password reset, all of `users`, all of `admin`. Also blocks end-to-end demonstration of `docs/15` §3.1's acceptance criterion, since no `STAFF` account can legitimately come into existence.

---

## 5. ADR-0003 Status — IaC Tooling

**Status: PROPOSED — unchanged. No tool selected.**

`implementation/01_iac_decision_analysis.md` supplies the `docs/18` §6.2 comparison across Terraform, OpenTofu, AWS CDK, CloudFormation against twelve locked constraints. It deliberately **selects nothing**, but narrows:

- **AWS CDK / CloudFormation are poor fits for this architecture** — `docs/10` §9.4 (MongoDB Atlas) and `docs/07` §19.1 (Vercel) are locked and neither tool covers them, leaving three of five providers outside version control, in tension with `docs/10` §2.2.
- **Terraform vs OpenTofu is functionally a tie** (222 vs 223 weighted); the real difference is licensing (BUSL-1.1 vs MPL-2.0) — a CTO call.
- **The genuine trade-off:** multi-provider coverage vs. having no state file to secure (a real security advantage of the AWS-native options under `docs/09` §5.1).

**Blocks Sprint 1?** Does not block implementation. **Blocks Definition of Done** (§8).

---

## 6. Role-Permission Matrix Status

**Status: OPEN — HUMAN DECISION REQUIRED.** Full analysis: `implementation/01_phase1_role_permission_matrix.md`.

| Metric | Value |
|---|---|
| Phase-1 keys defined | 6 of 6 ✅ |
| Keys extracted platform-wide | 29, all explicit, **none invented** |
| Roles seeded | 7 of 7 ✅ |
| **Role→permission cells resolved** | **6 of 42 (14%)** — `SUPER_ADMIN` only |
| Cells OPEN | 36 |
| Guessed grants | **0** ✅ |

**Root cause of the gap:** `docs/02` §14's role table is organised around *business modules*, while Phase 1's keys are `auth`/`users`/`admin` — an axis that table never addresses. This is a genuine gap in the locked baseline, not a defect in migration `0002`.

**Two inferences explicitly rejected** (both would have been wrong):
- `SUPPORT_AGENT` → `users.read` from "Customers (read)" — `customers` is a **`crm`** collection (`docs/03` §9.7.1), and `docs/08` §8 already provides `crm.read` for it. Granting `users.read` would expose every staff and admin identity record.
- `CUSTOMER` → `users.read_self` from "(implicit for own profile)" — genuinely ambiguous between "must be granted" and "inherent to any authenticated principal". Marked OPEN; cheapest item to resolve, largest functional consequence.

**Blocks Sprint 1?** Does not block building. **Blocks RBAC acceptance testing beyond `SUPER_ADMIN`.** Under one reading, no customer could read their own profile.

---

## 7. CI Task-Graph Status

**Status: CONFIRMED defect. Fix validated and reverted, awaiting approval.** Full analysis: `implementation/01_turbo_race_fix.md`.

| Precondition | Attempts | Result |
|---|---|---|
| `.next/` absent | 1 | ✅ 23/23 pass |
| `.next/` present (stale) | **3** | ❌ **3/3 FAIL** |
| `.next/` present **+ candidate fix** | 2 | ✅ **2/2 pass, 23/23** |

**Root cause:** `tsconfig.json` includes `.next/types/**`; root `turbo.json` gives `typecheck` only `^build` (upstream), so `typecheck` and `build` race within the same package while `next build` regenerates those types.

**Fix:** per-package `turbo.json` for the two Next.js apps adding same-package `build` to `typecheck`. Verified compatible with `docs/05` §14.1 (whose requirement is conditional and package-scoped by its own wording; root config unchanged; `lint`'s no-dependency fast-feedback preserved) and `docs/07` (native Turborepo 2.x feature, no new technology).

**Not merged.** `turbo.json` is `@nfi-org/devops`-owned per CODEOWNERS.

**Blocks Sprint 1?** No — but it degrades CI trustworthiness and will surface as apparently-random failures once PR volume rises.

---

## 8. Shared Development Status

**Status: NOT PROVISIONED.** Full analysis: `implementation/01_shared_development_readiness.md`.

Two independent blockers:
1. **No IaC tool decision** (ADR-0003). Authoring IaC = unnamed technology (`docs/18` §2.4); console provisioning = violates `docs/10` §2.2. Both paths closed.
2. **No cloud accounts or credentials** — AWS, MongoDB Atlas, Vercel, Redis. Entirely external to this repository.

**Definition-of-Done impact — the most consequential item in this gate.** `docs/11` §7.2 requires "Deployed to Shared Development… and confirmed functioning there" for **every** Story; `docs/13` §2.2 confirms no stage may be skipped. **Therefore no Sprint 1 Story can be legitimately marked Done.**

Three responses; only two are legitimate:
1. Provision Shared Development (needs both blockers resolved).
2. Formally amend `docs/11` §7.2 for the pre-Shared-Dev period via ADR, with a named restoration trigger.
3. ~~Mark Stories Done anyway~~ — **prohibited** (`docs/18` §7 Rule 4). **This is the realistic default failure mode if no decision is made.**

**No temporary policy has been approved.** Option 2 is described, not adopted.

---

## 9. Security Readiness

| Control | Status | Note |
|---|---|---|
| CORS strict allow-list | ✅ Implemented | `docs/08` §4.8; replaced Sprint 0's wide-open `cors()` |
| Security headers | ✅ Verified live | HSTS, `nosniff`, `X-Frame-Options` on real responses |
| Error hardening | ✅ Implemented | Generic 500; internals logged, never returned (OWASP API8) |
| Rate-limit infrastructure | ✅ Factory built | Generic; tiers supplied by calling module per `docs/08` §4.4 |
| Fail-closed RBAC default | ✅ Correct | 36 unspecified grants absent, not guessed |
| CSRF posture | ✅ Documented | `docs/08` §4.9 — no middleware needed; cookie attribute set by `auth` |
| **Privileged-account provisioning** | ❌ **OPEN** | ADR-0002 — highest-severity item |
| **RBAC design completeness** | ❌ **OPEN** | 36 of 42 cells |
| MFA / password policy / JWT | ⏸️ Not built | Sprint 1 module scope, correctly out of scope here |
| Admin network hardening | ⏸️ Blocked | `docs/09` §1.12 — no environment exists to configure it in |

**Fail-closed is a safe holding position, not a completed RBAC design.** These must not be conflated.

---

## 10. Repository Readiness

**READY.**

- Structure matches `docs/06` §9; no new top-level folder
- Package boundaries intact (`docs/05`, `docs/06` §6); no app imports another app
- `core/` contains no module business logic — grep-verified zero `core/`→`modules/` imports
- Module-boundary ESLint rule re-smoke-tested: a deliberate cross-module `domain/` import produced the exact cited error
- Naming conventions verified: `kebab-case.ts`, PascalCase classes, `<module>.<action>` keys, `SCREAMING_SNAKE` env vars
- **0 `.ts` files in `apps/api/src/modules/`** — scope held

---

## 11. Testing Readiness

| Check | Result |
|---|---|
| Unit/integration | ✅ **20/20 passed**, 6 files |
| Lint | ✅ 8/8 packages |
| Typecheck | ✅ 7/7 packages |
| Format | ✅ Clean |
| Build | ✅ All packages + both Next.js apps |
| Full turbo suite (clean state) | ✅ 23/23 |
| Docker build + stack | ✅ 6 services healthy |
| Migrations applied + verified | ✅ Live MongoDB |
| Migration idempotency | ✅ Proven — repeat run, counts unchanged |
| **Liveness/readiness split** | ✅ **Proven under real failure** — Mongo stopped: `/health` stayed 200, `/ready` 503; recovered without restart |
| **CI determinism** | ❌ **Race present** (§7) |
| Module coverage floors (`docs/12` §6.2) | N/A — no module code exists |

---

## 12. Deployment Readiness

| Environment | Status |
|---|---|
| Local (`docs/10` §3.1) | ✅ **Verified working** — 6-service Compose stack, healthchecks gating `depends_on` |
| Shared Development (§3.2) | ❌ **NOT PROVISIONED** |
| Testing (§3.3) | ⚠️ CI runs tests, but no service containers provisioned for Redis/Mongo-dependent tests |
| Staging / Production / DR | ❌ Not provisioned — correctly out of scope pre-Phase 6 |
| `pr-checks.yml` | ⚠️ Real and functional; **never executed on GitHub Actions** (nothing pushed) |
| `deploy-staging.yml` / `deploy-production.yml` | ❌ 4-line placeholders |

---

## 13. Governance Compliance

Checked against `docs/18` §8's prohibited-actions list:

| Requirement | Result |
|---|---|
| No invented architecture | ✅ Every decision cited; gaps surfaced as ADRs |
| No silent ADR approval | ✅ **Zero ADRs Approved.** ADR-0001 raised to RECOMMENDED with the reason recorded; 0002/0003 unchanged |
| No unauthorized dependency | ⚠️ `express-rate-limit` + `rate-limit-redis` added under an already-locked capability (`docs/07` §7.1's "rate-limit counter store"); **flagged for reviewer confirmation**, not asserted as settled |
| No modification of locked documents | ✅ **Verified by git history** — `docs/01`–`18` status `A` in the initial commit, never modified since |
| No guessed RBAC permissions | ✅ 0 guessed grants; two plausible inferences explicitly rejected with reasons |
| No business logic before approval | ✅ 0 `.ts` files in `modules/` |
| No cloud infrastructure without approved IaC | ✅ Nothing provisioned; no IaC authored |
| No bypassing security controls | ✅ Fail-closed preserved throughout |
| No undocumented architectural changes | ✅ Every change traceable to a cited section or an open ADR |

**No violation found.** One item (the rate-limit packages) is flagged as requiring confirmation rather than presented as resolved.

---

## 14. Remaining Blockers

| # | Blocker | Type | Blocks | Resolvable here? |
|---|---|---|---|---|
| **B1** | ADR-0002 — privileged-account provisioning | **Security decision** | `RegisterUser`; end-to-end acceptance criterion | ❌ Human approval |
| **B2** | Role→permission matrix — 36 of 42 cells | **Security decision** | RBAC acceptance testing beyond `SUPER_ADMIN` | ❌ Human decision |
| **B3** | ADR-0003 + no cloud accounts | Governance + external | `docs/11` §7.2 DoD for every Story | ❌ Decision + external |
| **B4** | ADR-0001 — `schema_migrations` | Governance | `docs/13` §10.2 release-checklist item | ❌ Human approval |
| B5 | Turbo race fix unmerged | CI quality | Nothing; degrades signal | ❌ DevOps approval |
| B6 | Rate-limit package confirmation | Governance hygiene | Nothing | ❌ Reviewer confirmation |

---

## 15. Required Human Approvals

| # | Decision | Authority | Can be batched? |
|---|---|---|---|
| 1 | ADR-0002 — Option A | **Principal Security Architect** + Principal Software Architect | ✅ Session 1 |
| 2 | Role→permission matrix (36 cells) | **Principal Security Architect** (Product Director consulted) | ✅ Session 1 — same approver, same domain |
| 3 | ADR-0001 — Option 1 | Principal Database Architect + Principal Software Architect | ✅ Session 1 |
| 4 | ADR-0003 — IaC tool | **CTO** + Principal DevOps Architect | ⚠️ Separate — different authority, needs `docs/07`-format authoring |
| 5 | DoD treatment while Shared Dev absent | **Engineering Director** (owns `docs/11`) | ⚠️ Separate |
| 6 | Turbo fix merge | Principal DevOps Architect | Independent PR |
| 7 | Rate-limit packages confirmation | Principal Software Architect | ✅ Session 1 |

**One Architecture Review clears items 1, 2, 3 and 7 — the entire security-critical set.**

---

## 16. Sprint 1 Entry Criteria

| # | Criterion | Met? |
|---|---|---|
| 1 | `core/` prerequisites built and tested | ✅ |
| 2 | Health/readiness semantics correct | ✅ |
| 3 | Database foundation applied and verified | ✅ |
| 4 | Foundation test suite green | ✅ |
| 5 | Architecture compliance verified | ✅ |
| 6 | **Privileged-account provisioning resolved** | ❌ **B1** |
| 7 | **RBAC resolved enough for acceptance testing** | ❌ **B2** |
| 8 | **Governance approvals exist** | ❌ **B1–B4** |
| 9 | **Shared Dev resolved or formally exempted** | ❌ **B3** |
| 10 | **CI trustworthy** | ❌ **B5** |
| 11 | **No architectural ambiguity blocks the acceptance criteria** | ❌ B1 + B2 |

**5 of 11 met.** The six unmet are governance items; none is an engineering task.

---

## 17. Final Verdict

# NOT READY

Selected against the gate's own criteria. `READY` requires resolved security decisions, sufficient RBAC resolution, existing governance approvals, Shared Dev resolved or exempted, and trustworthy CI — **none of the five is satisfied.**

`READY WITH EXTERNAL DEPENDENCY` was explicitly considered and **rejected**: its definition requires that "no application implementation is blocked by an unresolved security/architecture decision." `RegisterUser` is blocked by ADR-0002, and RBAC acceptance testing is blocked by the matrix. Both are security decisions, not external dependencies. Were B1 and B2 approved and only Shared Development outstanding, that status would become correct.

`BLOCKED` was considered and rejected as overstated — work is not halted. Six of seven `auth` use cases, all of `users`, and all of `admin` are unblocked the moment governance clears; the foundation is complete and verified.

**What is genuinely ready:** the entire engineering foundation — `core/` complete, health/readiness proven under real dependency failure, database foundation applied with idempotency demonstrated, 20/20 tests and 23/23 tasks green, compliance re-verified, zero business logic written, zero locked documents modified, zero ADRs self-approved.

**Critical distinction:** technical readiness is achieved; **governance readiness is not**. These are not interchangeable, and the foundation working is not evidence that Sprint 1 may open.

**Single highest-value next action:** convene one Architecture Review covering ADR-0001, ADR-0002, the role→permission matrix, and the rate-limit package confirmation. That clears the entire security-critical set. ADR-0003 and the DoD question need a second, separate session with different authority.

**Nothing further can be built in this repository to change this verdict.**

---

*This gate implements no business logic, provisions no infrastructure, adds no dependency, approves no ADR, and modifies no locked document. `apps/api/src/modules/` contains 0 `.ts` files.*
