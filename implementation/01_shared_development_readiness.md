# Shared Development — Readiness Assessment

**Date:** 2026-08-11
**Status:** **NOT PROVISIONED.** No infrastructure was created by this assessment.
**Governing rules:** `docs/10_devops_architecture.md` §3.2; `docs/11_engineering_workflow.md` §7.2; `docs/13_deployment_strategy.md` §2.2–2.3; `docs/18_CLAUDE_CONSTITUTION.md` §2.4.

---

## 1. Current State

Verified against the live repository this session:

| Check | Result |
|---|---|
| IaC files (`*.tf`, `*.tfvars`, CloudFormation, CDK) | **None** |
| `configs/deployment/`, `configs/environments/` | `.gitkeep` + README only |
| `.github/workflows/deploy-staging.yml` | **4-line placeholder** |
| `.github/workflows/deploy-production.yml` | **4-line placeholder** |
| AWS CLI available | **No** |
| Cloud credentials present | **No** |
| Pushed to remote | **No** — `origin` configured, nothing pushed |
| ECS cluster / MongoDB Atlas cluster | **Do not exist** |

What **does** exist and works: the **Local** environment (`docs/10` §3.1) — Docker Compose running all six services, verified healthy this session. Local is **not** a substitute for Shared Development; `docs/10` §3.1 vs §3.2 define them as distinct environments with different infrastructure.

---

## 2. Required Infrastructure (`docs/10` §3.2)

| Component | Specification | Present? |
|---|---|---|
| Compute | AWS ECS Fargate, smallest task size, single replica per service | ❌ |
| Database | MongoDB Atlas, `M0`/free-tier-equivalent | ❌ |
| Cache/queue | Redis | ❌ |
| `api` + `worker` services | Same 4-deployable topology as production | ❌ |
| `storefront` + `admin` | Vercel (`docs/07` §19.1, `docs/10` §8.2) | ❌ |
| Networking / isolation | Separate credentials; engineering-network/VPN restricted, not public (`docs/10` §3.2, §2.5) | ❌ |
| CD trigger | Automatic deploy on every merge to default branch (`docs/10` §3.2) | ❌ |
| Seed data | Same seed data as Local, via `scripts/setup/` (`docs/13` §5.4) | ❌ |

---

## 3. Missing IaC Decision

**Primary blocker, and the one most likely to be overlooked** — it is not about credentials.

No locked document names an IaC tool (`docs/07` has no IaC category; `docs/10` §9/§19 name none). Therefore:

- Authoring IaC introduces an unnamed technology → prohibited by `docs/18` §2.4 without an ADR.
- Provisioning by console → prohibited by `docs/10` §2.2 ("configuration is data… no direct environment edit outside version control").

Both paths are closed until ADR-0003 is decided. Analysis supplied in `implementation/01_iac_decision_analysis.md`; **ADR-0003 remains PROPOSED**.

---

## 4. Missing Cloud Resources

Independent of §3, and external to this repository entirely:

- AWS account, IAM roles/policies, ECS cluster, VPC/networking
- MongoDB Atlas organisation, project, cluster
- Vercel project(s) for `storefront` / `admin`
- Managed Redis instance
- Credentials for all of the above, injected per `docs/09` §5.1 / `docs/10` §2.4 (never committed)

**No amount of repository work can satisfy these.** They require an account owner with billing authority.

---

## 5. CI/CD Dependency

`docs/10` §3.2 requires automatic deployment on merge to the default branch. Current chain:

```
merge to main → [MISSING: deploy-staging.yml] → [MISSING: infrastructure] → Shared Development
```

`deploy-staging.yml` cannot be implemented before §3 (what does it invoke?) and §4 (what does it target?) are resolved. `pr-checks.yml` is real and functional — the pre-merge gate works; the post-merge deploy does not exist.

---

## 6. Security Requirements Blocked

| Control | Source | Consequence of absence |
|---|---|---|
| Environment isolation — separate credentials/data per environment | `docs/10` §2.5, §3.2 | Cannot be demonstrated |
| Admin network hardening (VPN/IP-allowlist) | `docs/09` §1.12 — "non-optional in production" | No environment exists to configure or test it in |
| Secrets via orchestrator secret store | `docs/09` §5.1 | Only `.env` files (Local) exercised so far |
| Sandbox third-party credentials | `docs/10` §3.2 | Not provisioned |

**Note:** `docs/09` §12.1's pre-launch checklist item "Admin network hardening active and non-bypassable in production" has **no environment in which it can ever be verified** until this is resolved. That is a Phase 6 blocker being seeded now.

---

## 7. Definition-of-Done Impact

**This is the most consequential finding in this document.**

`docs/11` §7.2 lists, as a DoD item for **every** Story:

> "Deployed to Shared Development (`10_devops_architecture.md` §3.2) and confirmed functioning there"

`docs/13` §2.2 reinforces it: Local → Shared Development is the first mandatory promotion step and **"Code cannot skip a stage in this path."**

**Therefore: no Sprint 1 Story can be legitimately marked Done.** Code can be written, reviewed, tested, merged, and verified locally — every other DoD item is satisfiable — but this one is not.

Three responses exist. Only the first two are legitimate:

| # | Response | Assessment |
|---|---|---|
| 1 | Provision Shared Development before Sprint 1 completes | **Clean.** Requires §3 + §4 |
| 2 | Formally amend `docs/11` §7.2 for the pre-Shared-Dev period via ADR, substituting the verified Local Docker stack, with a named trigger to restore the requirement | **Legitimate** — an explicit, recorded, time-boxed exception |
| 3 | Mark Stories Done anyway | **Prohibited.** Silently contradicts a locked document (`docs/18` §7 Rule 4). This is the default failure mode if nothing is decided |

**No temporary policy is currently approved.** Option 2 has **not** been adopted — it is described here as an available path, not applied.

---

## 8. Approval Authority

| Decision | Authority |
|---|---|
| IaC tool selection (ADR-0003) | **CTO** + **Principal DevOps Architect** |
| Cloud account provisioning / billing | Account owner (external to engineering governance) |
| Shared Dev architecture (already locked, `docs/10` §3.2) | No approval needed — specified |
| **DoD amendment (§7 option 2)** | **Engineering Director** — owns `docs/11` (`docs/17` §8) — via ADR |

---

## 9. Status

# NOT PROVISIONED

| Dimension | Status |
|---|---|
| Repository-side readiness | ✅ Ready — application containerised, builds, runs, health/readiness probes correct |
| IaC decision | ❌ **OPEN — HUMAN DECISION REQUIRED** (ADR-0003) |
| Cloud resources | ❌ **EXTERNAL — not obtainable from this repository** |
| CD pipeline | ❌ Blocked on both above |
| **DoD satisfiable for Sprint 1 Stories** | ❌ **No — and no exception has been approved** |

**Recommended immediate action:** decide §7 explicitly, in writing, *before* Sprint 1 implementation begins. Whether Shared Dev gets built or the DoD gets a recorded exception matters less than the decision being made rather than drifting. Option 3 happening by default is the realistic risk.

---

*This document provisions no infrastructure, adds no IaC dependency, adopts no temporary policy, and modifies no locked document.*
