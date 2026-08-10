# ADR-0003 — Infrastructure-as-Code Tooling (Blocks Shared Development Provisioning)

| Field | Value |
|---|---|
| **Status** | **PROPOSED — NOT YET APPROVED. No option recommended; this ADR states the gap, it does not pick a winner.** |
| **Date drafted** | 2026-08-10 |
| **Author** | Sprint 1 prerequisite remediation (AI-assisted session) |
| **Requires approval from** | CTO (owns the Technology domain — `docs/17_architecture_index.md` §8) + Principal DevOps Architect (owns DevOps/Deployment) |
| **Amends** | `docs/07_technology_decision_record.md` — would add a new technology category |

---

## Problem

`docs/10_devops_architecture.md` §3.2 defines Shared Development as real cloud infrastructure (ECS Fargate at smallest task size, `M0`-equivalent MongoDB Atlas cluster, Redis), auto-deployed on every merge to the default branch. `docs/13_deployment_strategy.md` §2.2 makes Local → Shared Development the first mandatory promotion step, and `docs/11_engineering_workflow.md` §7.2 makes "Deployed to Shared Development and confirmed functioning there" part of every Story's Definition of Done.

**`docs/07_technology_decision_record.md` names no Infrastructure-as-Code tool.** Searched: `docs/07` (all 19 technology categories) and `docs/10` (including §9 Infrastructure and §19 Open Items). No Terraform, CloudFormation, CDK, Pulumi, or "click-ops is acceptable" statement appears anywhere.

`docs/10` §2.2 does state the governing principle — "configuration is data", no direct environment edit outside version control (`docs/18_CLAUDE_CONSTITUTION.md` §3's deployment gate repeats it) — which rules out manual console provisioning as the *long-term* answer, but does not name the tool that replaces it.

Consequently: **provisioning Shared Development cannot begin**, because doing so would require either (a) introducing an unnamed technology, which `docs/18` §2.4 forbids without an ADR, or (b) manual console click-ops, which `docs/10` §2.2's principle forbids.

## Context

This is a genuine gap in the locked baseline, not an oversight of this remediation. `docs/16_architecture_final_review.md` §4 rated DevOps "Ready" on the strength of `docs/10`'s *design*, which is complete and unambiguous about **what** the infrastructure is — it simply never specifies **how** it is declared.

This is a second, independent blocker layered under the already-known one: even with an IaC tool chosen, provisioning additionally requires an AWS account, a MongoDB Atlas account, and credentials — none of which exist in this repository or this environment (verified: no `aws` CLI, no IaC files, no cloud credentials, `deploy-staging.yml` is a 4-line placeholder).

## Options Considered

Deliberately **not** narrowed here. `docs/07`'s own methodology applies every technology choice through a documented comparison (purpose, responsibilities, enterprise benefits, performance, scalability, security, trade-offs, rejected alternatives, migration strategy, version policy, operational risks) — `docs/18` §6.2 requires "the same alternatives-comparison rigor `07` applied to every locked choice". Producing that comparison is the approving roles' work, not this remediation's.

Candidate categories that would need that treatment: general-purpose IaC (Terraform / OpenTofu), AWS-native (CloudFormation / CDK), or a deliberate, documented decision that Shared Development is provisioned once by hand and thereafter treated as immutable — which would itself need to reconcile against `docs/10` §2.2.

## Proposed Decision

**None.** This ADR exists to make the gap explicit and route it to the roles that own it, per `docs/18_CLAUDE_CONSTITUTION.md` §7 Rule 3 ("surface the gap explicitly rather than silently deciding on the team's behalf") and Rule 6.

## Consequences

**Until resolved:**
- Shared Development is **NOT PROVISIONED** and cannot be provisioned from within this repository.
- `docs/11_engineering_workflow.md` §7.2's Definition-of-Done line item "Deployed to Shared Development" is **unsatisfiable for every Story**, Sprint 1 included. Either this ADR resolves and the environment is built, or `docs/11` §7.2's DoD is formally amended for the pre-Shared-Dev period — the latter is itself an ADR-worthy change to a locked document and must not be assumed.
- `.github/workflows/deploy-staging.yml` remains a placeholder.
- Repository readiness and cloud-environment readiness must be reported separately, never conflated.

## Source Documents

`docs/07_technology_decision_record.md` (absence of an IaC category); `docs/10_devops_architecture.md` §2.2, §3.2, §9, §19; `docs/11_engineering_workflow.md` §7.2; `docs/13_deployment_strategy.md` §2.2, §2.3; `docs/18_CLAUDE_CONSTITUTION.md` §2.4, §3, §6.2, §7.

## Approval

- [ ] Circulated to CTO and Principal DevOps Architect
- [ ] Alternatives comparison authored to `docs/07`'s standard
- [ ] Architecture Review discussion held
- [ ] Outcome recorded: Approved / Rejected / Deferred
