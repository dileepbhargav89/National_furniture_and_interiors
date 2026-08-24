# Shared Development — Human Decision Sheet

**For:** **Engineering Director** (owns `docs/11`) + **Principal DevOps Architect** + **CTO** (IaC dependency)
**Status:** **NOT PROVISIONED. NO TEMPORARY EXCEPTION EXISTS.**

> ### The single most important statement in this document
> **No temporary Definition-of-Done exception has been approved, requested, or applied.** `docs/11` §7.2 remains in force verbatim. **Therefore no Sprint 1 Story can currently be marked Done.**
> Option C below (mark Stories Done anyway) is **PROHIBITED** — and is the realistic default outcome if this decision is not made explicitly.

---

## 1. The Decision

`docs/11` §7.2 requires, for **every** Story:

> "Deployed to Shared Development (`10_devops_architecture.md` §3.2) and confirmed functioning there"

`docs/13` §2.2 reinforces it: Local → Shared Development is the first mandatory promotion step, and **"Code cannot skip a stage in this path."**

Shared Development does not exist. Two legitimate paths, one prohibited:

| Option | Summary | Legitimacy |
|---|---|---|
| **A** | Provision Shared Development | ✅ Clean |
| **B** | Formally approve a time-boxed DoD exception | ✅ Legitimate — explicit, recorded, reversible |
| **C** | Mark Stories Done anyway | ❌ **PROHIBITED** (`docs/18` §7 Rule 4 — silently contradicting a locked document) |

---

## 2. OPTION A — Provision Shared Development

### Requirements

| # | Requirement | Source | Status |
|---|---|---|---|
| A1 | IaC tool selected | ADR-0003 | ❌ **OPEN** |
| A2 | AWS account + billing authority | `docs/10` §9.2 | ❌ External |
| A3 | ECS Fargate cluster, smallest task size | `docs/10` §3.2 | ❌ |
| A4 | MongoDB Atlas org/project/cluster (`M0`-equivalent) | `docs/10` §3.2, §9.4 | ❌ External |
| A5 | Managed Redis | `docs/10` §9.5 | ❌ |
| A6 | Vercel project(s) for `storefront`/`admin` | `docs/07` §19.1, `docs/10` §8.2 | ❌ External |
| A7 | Networking, VPC, security groups | `docs/10` §3.2 | ❌ |
| A8 | Credentials in an orchestrator secret store | `docs/09` §5.1, `docs/10` §2.4 | ❌ |
| A9 | `deploy-staging.yml` implemented | `docs/10` §3.2 (auto-deploy on merge) | ❌ 4-line placeholder |
| A10 | Seed data via `scripts/setup/` | `docs/13` §5.4 | ⚠️ Local-only today |

### Owners

| Item | Owner |
|---|---|
| A1 | **CTO** + Principal DevOps Architect |
| A2, A4, A6 | **Account owner with billing authority** — outside engineering governance |
| A3, A5, A7, A8, A9, A10 | Principal DevOps Architect |

### External Credentials Required — none obtainable from this repository

AWS account credentials; MongoDB Atlas API keys; Vercel token; Redis provider credentials. Verified absent: no `aws` CLI installed, no credential files, nothing pushed to remote.

### Security Requirements (`docs/10` §2.5, §3.2; `docs/09` §5.1, §1.12)

- Separate credentials and data per environment — no sharing with Local or future Production
- Access restricted to the engineering network/VPN; **not public**
- Sandbox-mode Razorpay/Cloudinary only
- Secrets injected via secret store, never committed
- **`docs/09` §1.12's admin network hardening (VPN/IP-allowlist)** — currently has **no environment in which it can be configured or tested at all**. This is a Phase 6 pre-launch blocker (`docs/09` §12.1) being seeded now

### CI/CD Requirements

`docs/10` §3.2 requires automatic deploy on every merge to the default branch. Current chain:
```
merge to main → [MISSING: deploy-staging.yml] → [MISSING: infrastructure] → Shared Development
```
`pr-checks.yml` (pre-merge) is real and functional. The post-merge deploy path does not exist and cannot be written before A1 and A2–A8 resolve.

### IaC Dependency

**Option A is fully blocked on ADR-0003.** No permitted route exists to provision without it (§1 of `implementation/02_adr_0003_human_decision_sheet.md`).

---

## 3. OPTION B — Time-Boxed DoD Exception

### Exact DoD amendment proposed

Amend `docs/11_engineering_workflow.md` §7.2 by adding a scoped, expiring proviso. **Suggested wording, for the Engineering Director to accept, edit, or reject:**

> **Interim provision (expires on the trigger below).** Where the Shared Development environment (`10_devops_architecture.md` §3.2) has not yet been provisioned, the Definition-of-Done item *"Deployed to Shared Development and confirmed functioning there"* is satisfied instead by: **"Acceptance criteria demonstrated against the verified Local environment (`10` §3.1) via `docker compose -f docker/docker-compose.local.yml up`, with the demonstration recorded in the Story."**
>
> This provision expires automatically when Shared Development is provisioned, at which point every Story closed under it is **re-verified** against Shared Development before the milestone it belongs to is signed off.

### Scope

- **Applies to:** Sprint 1 Stories (`auth`, `users`, `admin`) only
- **Does not apply to:** any Staging or Production promotion gate (`docs/13` §2.4's approval gates are untouched); milestone sign-off (`docs/15` §4's M1) still requires the re-verification above
- **Does not weaken:** any other DoD item — code review, tests, coverage floor, documentation all unchanged

### Expiration / Restore Trigger

**Automatic expiry** on the earlier of:
1. Shared Development provisioned and reachable by CI, **or**
2. A date the Engineering Director sets: ______________

On expiry, `docs/11` §7.2 reverts to its unamended text with no further action required.

### Approval Authority

**Engineering Director** — owns `docs/11` (`docs/17` §8).
**Consulted:** Principal DevOps Architect (feasibility of the trigger), Principal QA Architect (adequacy of Local as evidence).
**Mechanism:** ADR amending `docs/11` §7.2, per `docs/18` §5.1's remediation pattern (Revision History entry citing the ADR). **This is a change to a locked document and cannot be made without it.**

### Risk

| Risk | Severity | Mitigation |
|---|---|---|
| Local passes, Shared Dev would have failed (env-specific defects: secret injection, networking, replica-set behavior) | **Medium** | Mandatory re-verification before milestone sign-off |
| Exception becomes permanent by neglect | **Medium-High** | Hard expiry trigger; named owner |
| Precedent for future DoD waivers | Medium | Explicitly scoped to Sprint 1 and to this one line item |
| `docs/09` §1.12 admin network hardening remains untestable | **Medium** | Not mitigated by Option B — carries forward to Phase 6 regardless |

### Acceptance Conditions

Option B is only sound if **all** hold:
1. Written approval recorded as an ADR — not a verbal or implied decision
2. A concrete expiry trigger is set
3. Re-verification before M1 sign-off is committed to
4. The exception is scoped to Sprint 1, not open-ended
5. `implementation/01_sprint1_identity_access.md` §9's DoD checklist is updated to reference the exception

---

## 4. OPTION C — Mark Stories Done Anyway

# PROHIBITED

Silently contradicts a locked document. Violates `docs/18` §7 Rule 4 ("never contradict approved decisions… does not quietly comply") and `docs/18` §2.11.

**This is called out explicitly because it is the realistic default failure mode.** If neither A nor B is decided, Sprint 1 will produce merged, tested, locally-verified code, and someone under delivery pressure will mark those Stories Done. That is not a hypothetical — it is what happens when a gate is left undecided rather than decided.

---

## 5. Recommendation on Sequencing

**Options A and B are not mutually exclusive and should not be treated as a binary.**

The pragmatic sequence, for the Engineering Director's consideration:
1. **Approve Option B now** — time-boxed, so Sprint 1 can proceed with an honest, recorded DoD.
2. **Pursue Option A in parallel** on the DevOps track, starting with ADR-0003.
3. **Option B expires automatically** when A completes.

This is **a recommendation on sequencing only.** No exception has been applied, and Option B cannot take effect without the Engineering Director's ADR.

---

## 6. Exact Approval Statement Required

**If Option B is chosen:**

> **A time-boxed Definition-of-Done exception is APPROVED for Sprint 1.** `docs/11_engineering_workflow.md` §7.2's Shared Development requirement is satisfied for Sprint 1 Stories by demonstration against the verified Local environment, recorded per Story. This provision expires on ______________________ or when Shared Development is provisioned, whichever is earlier. Stories closed under it are re-verified against Shared Development before M1 sign-off. `docs/11` §7.2 is to be amended with a Revision History entry citing this ADR.
>
> Approved by: ______________________ (Engineering Director), date __________
> Consulted: ______________________ (Principal DevOps Architect), date __________

**If Option A is chosen:** no DoD amendment is needed; Sprint 1 entry waits on provisioning. Record the expected availability date so the dependency is visible.

## 7. Status

| Dimension | Status |
|---|---|
| Shared Development | **NOT PROVISIONED** |
| IaC decision (A1) | **OPEN** — ADR-0003 |
| Cloud accounts/credentials | **EXTERNAL** — not obtainable here |
| **Temporary DoD exception** | **DOES NOT EXIST — none approved, requested, or applied** |
| Repository-side readiness | ✅ Application containerised, builds, runs, probes correct |
| **Sprint 1 Stories closable under current rules** | ❌ **No** |

---

*This document provisions no infrastructure, adopts no exception, and modifies no locked document.*
