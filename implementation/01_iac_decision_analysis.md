# IaC Tooling — Decision Analysis (supports ADR-0003)

**Date:** 2026-08-11
**Status:** **ANALYSIS ONLY — no tool selected, no dependency added, no infrastructure provisioned.**
**Governing rules:** `docs/18_CLAUDE_CONSTITUTION.md` §2.4 (no technology without an ADR), §6.2 (ADR must carry `docs/07`-grade alternatives rigor), §7 Rule 3.

> This document supplies the comparative analysis `docs/18` §6.2 requires so the approving roles can decide. It **does not decide**. ADR-0003 remains **PROPOSED**.

---

## 1. Problem

`docs/10_devops_architecture.md` §3.2 defines Shared Development as real cloud infrastructure, auto-deployed on merge to the default branch. `docs/13_deployment_strategy.md` §2.2 makes Local → Shared Development the first mandatory promotion step, and `docs/11_engineering_workflow.md` §7.2 puts "Deployed to Shared Development" in every Story's Definition of Done.

**No locked document names an Infrastructure-as-Code tool.** Verified this session: `docs/07_technology_decision_record.md` has no IaC category across its 19 categories; `docs/10` §9 (Infrastructure) and §19 (Open Items) name none.

Consequently Shared Development cannot be built: authoring IaC introduces an unnamed technology (`docs/18` §2.4), and console click-ops violates `docs/10` §2.2's "configuration is data — no direct environment edit outside version control".

---

## 2. Constraints (from locked documents only)

| # | Constraint | Source |
|---|---|---|
| C1 | Must manage **AWS ECS Fargate** | `docs/10` §9.2 |
| C2 | Must manage **MongoDB Atlas** | `docs/10` §9.4 |
| C3 | Must manage **Redis** | `docs/10` §9.5 |
| C4 | Must accommodate **Vercel** (storefront/admin deploy target) | `docs/07` §19.1, `docs/10` §8.2 |
| C5 | Must accommodate **Cloudinary** | `docs/10` §9.3 |
| C6 | All configuration version-controlled; no console edits | `docs/10` §2.2 |
| C7 | Secrets never in source; orchestrator secret store | `docs/09` §5.1, `docs/10` §2.4 |
| C8 | Must support 7 environments with isolation | `docs/10` §3, §2.5 |
| C9 | Team is **TypeScript-centric** | `docs/07` §4.3, §3 |
| C10 | "Match the tool to the team's stage" — prefer simpler over more powerful | `docs/07` §1 |
| C11 | Must integrate with GitHub Actions CI/CD | `docs/10` §6.1 |
| C12 | Admin network hardening (VPN/IP-allowlist) must be declarable | `docs/09` §1.12 |

**C2 + C4 + C5 are the decisive constraints.** This platform is deliberately multi-provider — AWS is one of five. An AWS-only tool leaves Atlas, Vercel and Cloudinary outside version control, partially defeating C6.

---

## 3. Options

### A. Terraform (HashiCorp, BUSL-1.1 since v1.6)
General-purpose, provider-model IaC. Official providers for AWS, MongoDB Atlas, Vercel, Cloudinary.

### B. OpenTofu (Linux Foundation, MPL-2.0)
Fork of Terraform 1.5.x, created after the BUSL relicensing. Same HCL, same provider ecosystem, same state model. Drop-in for the current feature set.

### C. AWS CDK (Apache-2.0)
Imperative TypeScript synthesising to CloudFormation. AWS-native. Non-AWS providers require CDK constructs wrapping third-party CFN resource types, or `cdktf` (which is Terraform underneath anyway).

### D. CloudFormation (AWS-native, no license cost)
Declarative YAML/JSON, AWS-managed state. Third-party support only via registered resource types.

---

## 4. Weighted Comparison

Weights reflect constraint criticality: multi-provider coverage is weighted highest because C2/C4/C5 are locked architecture, not preference.

| Criterion | Weight | Terraform | OpenTofu | AWS CDK | CloudFormation |
|---|---|---|---|---|---|
| AWS ECS Fargate (C1) | 3 | 5 | 5 | 5 | 5 |
| **MongoDB Atlas (C2)** | **5** | **5** official provider | **5** same provider | 2 CFN resource types / third-party | 2 CFN resource types |
| Redis (C3) | 3 | 5 | 5 | 4 | 4 |
| **Vercel (C4)** | **4** | **4** provider available | **4** same | 1 not supported | 1 not supported |
| Cloudinary (C5) | 2 | 3 provider available | 3 | 1 | 1 |
| Version-control fit (C6) | 5 | 5 | 5 | 5 | 5 |
| Secrets handling (C7) | 5 | 4 state must be encrypted | 4 same | 5 no separate state | 5 no separate state |
| Multi-environment (C8) | 4 | 5 workspaces/dirs | 5 | 4 | 3 |
| **TypeScript alignment (C9)** | **3** | 2 HCL | 2 HCL | **5** | 1 YAML |
| Simplicity for team stage (C10) | 4 | 4 | 4 | 3 abstraction leakage | 2 verbose |
| GitHub Actions (C11) | 3 | 5 | 5 | 5 | 5 |
| Network hardening (C12) | 3 | 5 | 5 | 5 | 5 |
| Vendor lock-in | 3 | 4 BUSL concern | **5** OSS | 2 AWS-only | 1 AWS-only |
| Drift detection | 3 | 5 `plan` | 5 `plan` | 3 via CFN drift | 3 |
| Ecosystem maturity | 2 | 5 | 3 younger | 4 | 5 |
| **Weighted total** | **52** | **222** | **223** | **169** | **151** |

*(Scores 1–5. Totals = Σ weight × score.)*

**Terraform and OpenTofu are statistically tied**; both clear the AWS-native options by a wide margin, driven almost entirely by C2/C4/C5.

---

## 5. Security

| Aspect | Terraform / OpenTofu | AWS CDK / CloudFormation |
|---|---|---|
| State file contains secrets | **Yes** — state must be encrypted at rest, access-controlled, and never committed. A real, ongoing obligation under `docs/09` §5.1 | No separate state; AWS-managed |
| Secret injection (C7) | Provider-native references to AWS Secrets Manager; secrets must not be literals | Native |
| Reviewability | `plan` output makes every change diffable pre-apply — strong fit for `docs/11` §4's review discipline | CFN change sets; comparable |
| Blast radius | A misapplied root module can affect multiple providers at once | Constrained to AWS |
| C12 (admin VPN/IP-allowlist) | Declarable | Declarable |

**Net:** the AWS-native options have a genuine, non-trivial security advantage — **no state file to protect**. Terraform/OpenTofu's state handling is the single largest new operational-security obligation either would introduce. This must not be glossed over by the multi-provider advantage.

---

## 6. Operations

| Aspect | Terraform | OpenTofu | CDK | CloudFormation |
|---|---|---|---|---|
| State backend to run | S3 + DynamoDB lock (or managed) | Same | None | None |
| Drift detection | Mature (`plan`) | Mature | Weaker | Weaker |
| Rollback (`docs/13` §6.3) | Re-apply prior revision | Same | CFN auto-rollback | CFN auto-rollback |
| Onboarding a new environment (C8) | Well-trodden | Same | Moderate | Manual-ish |
| Failure mode | State/reality divergence — recoverable but requires expertise | Same | Stack in `UPDATE_ROLLBACK_FAILED` — genuinely painful | Same |

---

## 7. Developer Experience

CDK wins outright on C9: same TypeScript, same tooling, same review reflexes, no new language. For a small team this is a real, recurring benefit — `docs/07` §1's "match the tool to the team's stage" argues for it.

Terraform/OpenTofu require learning HCL — a modest but non-zero cost, offset by HCL being simpler than the general-purpose language it replaces, and by `plan` output being far easier to review than synthesised CloudFormation.

---

## 8. Cost / Complexity

No licensing cost in any option at this scale. Real costs are operational:

- **Terraform/OpenTofu:** state backend to provision, secure, and back up. Terraform additionally carries BUSL license review for commercial use — a legal question, not a technical one, and one the approver should confirm rather than assume.
- **CDK/CloudFormation:** no state cost, but Atlas/Vercel/Cloudinary fall outside IaC, meaning a second, manual process for three of five providers — which is itself a recurring cost and a C6 gap.

---

## 9. Migration Considerations

- Terraform → OpenTofu is currently a near-drop-in migration (shared lineage). OpenTofu → Terraform is likewise feasible today. **This divergence widens over time** and should be re-evaluated, not assumed permanent.
- Terraform/OpenTofu → CDK, or the reverse, is a full rewrite.
- Any option can adopt existing manually-created resources via import, so choosing later does not strand work already done — **but nothing has been provisioned, so there is nothing to strand.** The decision is unusually cheap to make right now and gets more expensive with every manual resource created.

---

## 10. Recommendation

**No tool is selected in this document.**

The analysis supports a **narrowing**, which is the substantive contribution here:

1. **AWS CDK and CloudFormation are poor fits for this specific architecture** — not on their merits, but because `docs/10` §9.4 (MongoDB Atlas) and `docs/07` §19.1 (Vercel) are locked, and neither tool covers them. Adopting either means accepting that three of five providers stay outside version control, in tension with `docs/10` §2.2.
2. **Terraform and OpenTofu are functionally equivalent for this platform today.** Choosing between them is primarily a **licensing/governance** question (BUSL vs MPL-2.0), not a technical one — and that is a CTO decision, not an engineering one.
3. **The one genuine trade-off the approver must weigh:** multi-provider coverage (favours Terraform/OpenTofu) against no-state-file-to-secure (favours the AWS-native options). This document cannot settle that; it is a risk-appetite judgement.

**Recommended next step:** CTO + Principal DevOps Architect resolve items 2 and 3, then author the `docs/07`-format entry (purpose, responsibilities, enterprise benefits, performance, scalability, security, advantages, trade-offs, known limitations, rejected alternatives, migration strategy, version policy, maintenance, operational risks) as ADR-0003's decision section.

---

## 11. Approval Authority

**CTO** — owns the Technology domain and `docs/07` (`docs/17` §8). Sole authority to add a technology category.
**Principal DevOps Architect** — owns DevOps/Deployment (`docs/10`, `docs/13`).
**Process:** Architecture Review (`docs/11` §8.3), outcome recorded in ADR-0003 and, if approved, `docs/07` updated with a Revision History entry per `docs/18` §5.1.

---

## 12. Implementation Consequences

**If a tool is approved:** ADR-0003 records it; `docs/07` gains a category; IaC is authored for Shared Development; `deploy-staging.yml` is implemented; `docs/11` §7.2's DoD becomes satisfiable. **Cloud accounts and credentials are still required and remain external to this repository.**

**If unresolved:** Shared Development cannot be built; every Sprint 1 Story ships unable to satisfy its own Definition of Done (see `implementation/01_shared_development_readiness.md`).

---

*This document adds no dependency, selects no tool, provisions nothing, and modifies no locked document. ADR-0003 remains PROPOSED.*
