# Sprint 1 — Final Readiness Report

**Date:** 2026-08-11
**Supersedes:** the closure matrix in `implementation/03_sprint1_implementation_report.md` §17 (that report's engineering detail remains current).
**Method:** every claim below was re-verified against the repository in this session. No status was carried forward on the strength of an earlier report.

---

## 1. Executive Status

**`TECHNICALLY COMPLETE — GOVERNANCE BLOCKED`.** Unchanged from closure, and correctly so.

Three blockers were examined for whether they could legitimately be resolved from this environment. **None can**, and none was forced:

- **ADR-0003 (IaC tooling)** — no owner decision exists anywhere in the repository. Verified by search, not assumed.
- **Shared Development** — blocked by ADR-0003 *and* by the absence of any cloud account or credential.
- **Coverage gate** — no coverage provider is installed, and adding one is a dependency change that existing project instructions do not explicitly authorize.
- **Second reviewer** — `CODEOWNERS` references `@nfi-org/*` team handles; the configured remote is a **personal** account with **no pushed branches**, so those handles cannot resolve to anyone.

What *did* improve: **27 new unit tests** (58 → **85**) covering security-critical Domain/Application logic that previously had no unit-level test — including refresh-token reuse detection, the lockout policy, the password policy, and the MFA-requirement predicate. This required no new dependency and no architectural change.

---

## 2. What Is Technically Complete

| Area | Evidence |
|---|---|
| `auth`, `users`, `admin` modules, 4-layer | 35 `.ts` files; 0 module-boundary violations |
| Public registration is `CUSTOMER`-only | ADR-0002 implemented + regression-guarded |
| Phase 1 RBAC matrix | ADR-0004 implemented in migration `0003`, `$set`-converging |
| MFA mandatory for privileged accounts | Full lifecycle verified live |
| Refresh rotation + reuse detection | Verified live **and** now unit-tested |
| Audit logging + redaction | No secret-equivalent field carries a value at any depth |
| Migration safety | Fresh install + 2 re-runs verified this session |
| Rate limiting | Tiers enforced; **fails closed** on store outage |

---

## 3. What Changed During This Session

Deliberately minimal. No architecture was changed, no ADR was approved, no dependency added.

| Change | File | Why |
|---|---|---|
| **+17 domain policy tests** | `tests/modules/auth/domain-policies.test.ts` (new) | Password bounds, lockout thresholds, MFA predicate had no unit test — only indirect integration coverage |
| **+10 refresh-token tests** | `tests/modules/auth/refresh-token.test.ts` (new) | Pins reuse detection's *two* effects (revoke-all **and** audit write); an integration test only observes the 401, so a refactor dropping the audit half would have passed |
| **ADR-0001: "What Approving Would Change"** | `docs/adr/0001-…md` | Records exact blast radius for the approver; status **unchanged (still OPEN)** |
| **ADR-0001: factual correction** | same | Earlier text said "nothing pushed to a remote"; a remote **is** configured but is empty and personal. Conclusion unchanged, detail now accurate |

**ADR-0003 was not edited** — its `PROPOSED — no option recommended` status is already accurate.

---

## 4. Verification Results

All re-run this session from a forced-clean state.

| Check | Result |
|---|---|
| `pnpm format:check` | **PASS** |
| `pnpm turbo run lint typecheck test build --force` | **PASS — 23/23 tasks**, zero cache |
| Automated tests | **PASS — 85/85**, 12 files (was 58/58) |
| Migration: fresh DB, run 1 | **PASS — 5/5 applied and verified** |
| Migration: run 2 (idempotency) | **PASS — 5/5** |
| Migration: run 3 (duplicate execution) | **PASS — 5/5** |
| Security regression (live) | **PASS — 54/54** |
| MFA / tokens / audit (live) | **PASS — 34/34** |
| Browser (real cross-origin) | **PASS — 10/10** |
| **Total acceptance** | **PASS — 98/98** |
| Live stack | **PASS — 6/6 services healthy**, `/ready` both deps connected |

One browser check initially returned **429** rather than 401. Diagnosed rather than assumed: `/auth/mfa/setup` sits on the Strict tier and the two preceding live suites had consumed the per-IP budget. **This was the rate limiter working correctly, not a regression.** Re-verified after clearing counters: 401 on all three malformed-id shapes, including operator-injection.

---

## 5. Security Verification

Every control required for this session re-verified against the running stack.

| Control | Result |
|---|---|
| Public registration cannot create `STAFF`/`ADMIN`/`SUPER_ADMIN` | **PASS** — 400 `VALIDATION_ERROR`, all three |
| `userType`/`roleId` cannot be mass-assigned | **PASS** — `.strict()` rejects rather than strips |
| Privileged accounts require the approved admin path | **PASS** — `CUSTOMER` → 403 on `POST /admin/users` |
| `SUPER_ADMIN` bootstrap has no hardcoded credentials | **PASS** — env-sourced; no-op without them, verified on fresh DB (0 users created) |
| Passwords bcrypt-hashed | **PASS** — cost 12, `$2` asserted by migration `verify()` |
| MFA enforced for privileged login | **PASS** — no token/cookie before second factor |
| Malformed MFA identifiers do not 500 | **PASS** — 401 on all shapes |
| Rate limiting fails closed when Redis unavailable | **PASS** — injected failing store; request never reaches route |
| RBAC fail-closed | **PASS** — 5 admin surfaces denied; 403 never names the key |
| `users.read_self` is an explicit permission | **PASS** — token carries exactly `["users.read_self"]` |
| Non-approved roles cannot obtain privileged keys | **PASS** — migration `0003.verify()` asserts `SUPPORT_AGENT` lacks `users.read` |
| Audit logging/redaction intact | **PASS** — no secret-equivalent field holds a value at any nesting depth |
| Refresh rotation/reuse detection intact | **PASS** — replay 401s, whole family revoked, `TOKEN_REUSE_DETECTED` written |
| Migration reruns safe | **PASS** — 3 consecutive runs |

**No security control was weakened to make anything pass.**

---

## 6. ADR Status

| ADR | Status | Blocking? |
|---|---|---|
| **0001** — `schema_migrations` | **OPEN — PENDING OWNER DECISION** | Not a DoD blocker; a resilience gap |
| **0002** — Privileged provisioning | **APPROVED**, implemented, doc-aligned | No |
| **0003** — IaC tooling | **OPEN — OWNER DECISION REQUIRED** | **Yes — blocks Shared Development** |
| **0004** — Phase 1 RBAC matrix | **APPROVED**, implemented, doc-aligned | No |

### ADR-0003 — the precise decision required

**The question:** which Infrastructure-as-Code tool declares this project's cloud infrastructure — or, alternatively, an explicit documented decision that Shared Development is provisioned once by hand and thereafter immutable (which must itself reconcile against `docs/10` §2.2's "configuration is data, no direct environment edit outside version control").

**Why it blocks Shared Development:** provisioning requires either (a) an IaC tool, and `docs/07` names none across all 19 technology categories — introducing one without an ADR violates `docs/18` §2.4; or (b) manual console click-ops, which `docs/10` §2.2 forbids. **Both doors are closed until this ADR resolves.**

**Files that depend on it:** `.github/workflows/deploy-staging.yml` (still a placeholder); any future `infra/` tree; `docs/07` (would gain a technology category, ADR-gated); `docs/10` §19.

**Supporting analysis already exists and selects nothing:** `implementation/01_iac_decision_analysis.md` weighs Terraform, OpenTofu, AWS CDK and CloudFormation against twelve extracted constraints. Its narrowing — that CDK/CloudFormation cover neither MongoDB Atlas (`docs/10` §9.4) nor Vercel (`docs/07` §19.1), leaving three of five providers outside version control — is offered to the approver, **not applied**.

**Next human action:** CTO + Principal DevOps Architect record a decision in ADR-0003 §Approval.

### ADR-0001 — what remains unresolved

Whether to adopt a `schema_migrations` tracking collection, which `docs/13` §5.6 specifies but `docs/03` §4's Collection Inventory omits. **Not implemented, correctly** — `docs/18` §6.4 forbids dependent code before approval, and the runner creates nothing.

Consequence while open: **idempotency is the sole safety mechanism**, since the runner records nothing and re-applies all five migrations every run. That property was broken at closure, is fixed, and was **independently re-verified this session** (fresh install + two re-runs). It remains a single point of failure: correctness depends on every future migration author preserving idempotency by hand, with nothing in CI to catch a regression.

---

## 7. Coverage Status — **BLOCKED**

`docs/11` §5.7 requires **80% line coverage on the Domain and Application layers, enforced as a CI gate**. `docs/07` §17.1 flags the threshold as needing configuration once Vitest was adopted.

**Verified: no coverage provider is installed** — absent from the pnpm store and unresolvable from both the workspace root and `apps/api`.

**Why this is not being silently fixed:** measuring coverage requires adding `@vitest/coverage-v8`. The owner has not authorized dependency changes, and no project instruction *explicitly* authorizes one — the locked documents mandate the *capability*, not a package. The most recent dependency question put to the owner (rate-limit packages) was **not** approved; those were closed under existing policy precedent, which is a different argument from authorization.

**No coverage figure is claimed. The gate is unmeasured, not passing.**

### Exact specification, ready to apply on authorization

| Item | Value |
|---|---|
| Package | `@vitest/coverage-v8` (Vitest's first-party provider; must match the installed `vitest@2.1.9`) |
| Install | `pnpm --filter=@nfi/api add -D @vitest/coverage-v8` |
| Config | `apps/api/vitest.config.ts` → `test.coverage`: `provider: 'v8'`, `include: ['src/modules/**/domain/**', 'src/modules/**/application/**']`, `thresholds: { lines: 80 }` |
| Scope | **19 files** — 6 domain, 13 application |
| CI | New step in `.github/workflows/pr-checks.yml` running `vitest run --coverage` |

**Honest expectation:** the gate would likely **fail on first run**. A name-match audit (a heuristic, *not* a measurement) found ~9 of the 19 in-scope files with no direct test reference. This session closed the highest-risk ones — refresh-token reuse, lockout, password policy, MFA predicate — but `mfa.use-cases.ts`, `issue-session.use-case.ts`, `audit-logger.ts`, `permission-resolver.ts` and `user.use-cases.ts` remain without unit tests. Expect real work after enabling, not a rubber stamp.

---

## 8. Shared Development Status — **BLOCKED / NOT PROVISIONED**

`docs/10` §3.2 defines it as real cloud infrastructure (ECS Fargate, `M0`-equivalent MongoDB Atlas, Redis), auto-deployed on merge. `docs/13` §2.2 makes Local → Shared Development the first mandatory promotion step.

**Two independent blockers, either alone sufficient:**

1. **ADR-0003 unresolved** — no tool may be used to declare the infrastructure.
2. **No accounts or credentials exist** — no AWS/GCP/Azure, Vercel, MongoDB Atlas, or Redis-cloud account; no DNS; no CI secrets; no GitHub organisation. `deploy-staging.yml` remains a placeholder.

**Nothing was fabricated.** No infrastructure files were authored, no URLs invented, no credentials created.

### Owner checklist to unblock

1. Decide ADR-0003 (CTO + Principal DevOps Architect).
2. Create the cloud accounts `docs/10` §9 requires (AWS, MongoDB Atlas, Redis, Vercel).
3. Create the GitHub organisation and the `@nfi-org/*` teams `CODEOWNERS` already references.
4. Provision CI credentials as repository/organisation secrets — never committed.
5. Author the IaC per the approved decision; replace the `deploy-staging.yml` placeholder.
6. Deploy, then verify health, migrations, API, and security controls **in that environment**.

---

## 9. Independent Review Status — **BLOCKED**

Verified in the repository:

| Artifact | Finding |
|---|---|
| `CODEOWNERS` | Exists and is complete, but every handle is a placeholder `@nfi-org/*` team |
| Git remote | Configured, but `git ls-remote --heads origin` returns **nothing** — no branch pushed |
| Remote account type | **Personal** (`dileepbhargav89`), not an organisation — team handles cannot resolve |
| Commit authors | **One** distinct author |
| Review artifacts | `02_adr_0001_review_sheet.md`, `02_adr_0002_review_sheet.md`, `02_architecture_review_pack.md` — these are **preparation packs authored for a reviewer**, not records of a review that occurred |

**ADR-0002 and ADR-0004 were owner-approved and lack independent second-party review.** `docs/18` §6.3 vests approval in the Principal Security Architect and Principal Software Architect via a scheduled Architecture Review; neither role is staffed, and no such review took place.

**Automated verification is not independent human review.** The 98/98 acceptance checks demonstrate the implementation does what the ADRs say; they cannot tell you the ADRs decided the right thing. That judgement is exactly what a second reviewer supplies, and it is missing.

---

## 10. Remaining Owner Actions

| # | Action | Unblocks |
|---|---|---|
| 1 | **Decide ADR-0003** (IaC tooling) | Shared Development |
| 2 | **Create cloud accounts + GitHub organisation/teams** | Shared Development, second review |
| 3 | **Provision + deploy Shared Development**, verify there | DoD criterion 7 — the only hard blocker |
| 4 | **Authorize `@vitest/coverage-v8`** | Coverage gate (§7 spec ready) |
| 5 | **Decide ADR-0001** (`schema_migrations`) | Migration resilience; `docs/13` §10.2 |
| 6 | **Provide a second reviewer**; re-ratify ADR-0002/0004 | DoD criterion 3 |
| 7 | *(Optional)* Ratify the "package implementing a locked capability is an implementation choice" principle in `docs/07` | Stops per-package re-litigation |

---

## 11. Exact Blockers

1. **Shared Development not provisioned** — needs ADR-0003 **and** cloud accounts. Neither obtainable here.
2. **No second reviewer** — needs a GitHub organisation with real teams, and a second human.
3. **Coverage unmeasured** — needs dependency authorization.

All three are **external to the repository**. No amount of further engineering closes them.

---

## 12. Sprint 1 Gate Matrix

| Gate | Status | Evidence | Remaining action |
|------|--------|----------|------------------|
| Repository integrity | **PASS** | 89 files in scope; `git diff --check` clean; no secrets, no `.env`/key files, no temp artifacts, no debug logging; lockfile unchanged this session | None |
| Architecture/ADR compliance | **PASS** | 0 module-boundary violations; locked `docs/00`–`18` changed only via approved ADRs (docs/08 v1.1/v1.2, 4 lines) | None |
| Auth | **PASS** | 15/15 registration + 6/6 login + 15/15 MFA checks | None |
| RBAC | **PASS** | 16/16 denial + 9/9 privileged checks; token carries exactly `["users.read_self"]` | None |
| Security | **PASS** | 88/88 live regression; all §5 controls verified | None |
| Tests | **PASS** | 85/85, 12 files, forced clean | None |
| Coverage | **BLOCKED** | No provider installed; unresolvable from root and `apps/api` | Owner authorizes `@vitest/coverage-v8` (§7) |
| Build/typecheck/lint | **PASS** | 23/23 turbo tasks `--force`; `format:check` clean | None |
| Migration safety | **PASS** | Fresh install + run 2 + run 3, all 5 applied and verified; `0005` spec survives; `schema_migrations` absent | None |
| Shared Development | **BLOCKED** | Not provisioned; ADR-0003 open; no cloud accounts | Owner checklist §8 |
| Second review | **BLOCKED** | Placeholder `CODEOWNERS`; empty personal remote; 1 commit author | Owner provides reviewer §9 |
| Documentation | **PASS** | ADR-0002/0004 approved and doc-aligned; ADR-0001/0003 honestly open; docs/08 Revision History cites both ADRs | None |
| Definition of Done | **BLOCKED** | 3 of 7 `docs/11` §7.2 criteria unmet | Items 3, 4, 6 in §10 |

---

## 13. Definition of Done — `docs/11` §7.2

| # | Criterion | Status |
|---|---|---|
| 1 | Code merged to `main` | **BLOCKED** — 89 files uncommitted; held pending instruction |
| 2 | All §4.5 automated quality gates passing | **PASS** |
| 3 | Code review approved per §4.4 | **BLOCKED** — no second reviewer |
| 4 | Tests passing, meeting §5.7's coverage floor | **BLOCKED** — tests PASS; coverage unmeasured |
| 5 | Documentation updated where §6.1 requires | **PASS** |
| 6 | Acceptance criteria verified against a running environment | **PASS** — 98/98 |
| 7 | Deployed to Shared Development and confirmed functioning | **BLOCKED** — not provisioned |

**4 PASS / 3 BLOCKED / 0 FAIL.** No criterion is failing on engineering grounds.

> **Noted for the approver, not acted on:** `docs/11` §5.7 calls coverage "a CI gate (Section 4.5)", but §4.5's enumerated gate set is *lint, format, type-check, dependency scan, license scan, image scan* — coverage is not among them. This is a genuine inconsistency between two locked sections. It does not change the outcome (§5.7 is unambiguous that 80% is a hard floor), and resolving it would be an ADR-gated change. Flagged rather than interpreted.

---

## 14. Sprint 2 Authorization

# SPRINT 2 IMPLEMENTATION NOT AUTHORIZED — SPRINT 1 CLOSURE GATES REMAIN BLOCKED.

Three of seven Definition-of-Done criteria are unmet. Beginning Phase 2 (`catalog`, `cart`, `media`) would not merely defer the problem — **every Sprint 2 Story would inherit the identical unsatisfiable DoD**, because criteria 3, 4 and 7 are environmental, not per-Sprint. The backlog of un-Done work would compound with nothing gained.

---

## 15. Recommended Next Action

**Single highest-leverage step: decide ADR-0003.**

It is the root of the dependency chain — it blocks Shared Development (DoD criterion 7, the only *hard* blocker), which in turn blocks every future Story. It costs one decision from the CTO and Principal DevOps Architect, and the comparative analysis they need is already written and waiting in `implementation/01_iac_decision_analysis.md`.

In parallel, two cheap unblocks: **authorize the coverage provider** (§7 is ready to apply) and **create the GitHub organisation** (unblocks both `CODEOWNERS` and the second-reviewer gate).

Committing the 89 files is safe and recommended — the worktree is clean, verified, and secret-free — but remains held pending explicit instruction.
