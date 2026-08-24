# ADR-0003 — IaC Tooling — Human Decision Sheet

**For:** **CTO** (decision authority) + **Principal DevOps Architect** (consultation required)
**ADR:** `docs/adr/0003-iac-tooling-for-shared-development.md` — **PROPOSED**
**Supporting analysis:** `implementation/01_iac_decision_analysis.md`

> ### Explicit statements of non-action
> - **No tool has been selected by AI.** This sheet narrows and frames; it does not choose.
> - **No IaC dependency has been added.** No `.tf`, `.tofu`, CDK, or CloudFormation file exists.
> - **No infrastructure has been provisioned.** No cloud account, cluster, or credential exists.
> - **`docs/07` has not been modified.** Adding an IaC category requires CTO approval via ADR.

---

## 1. Decision Required

**Which Infrastructure-as-Code technology does this platform adopt?**

`docs/07_technology_decision_record.md` contains 21 technology categories (§3–§21) and **no IaC category** — verified this session. `docs/10` §9 and §19 name none either. Yet `docs/10` §3.2 requires Shared Development as real cloud infrastructure and `docs/10` §2.2 forbids configuration outside version control.

Until this is decided, **Shared Development cannot be built by any permitted route**: authoring IaC would introduce an unnamed technology (`docs/18` §2.4); console provisioning would violate `docs/10` §2.2.

## 2. Options Narrowed — for the CTO to accept or reject

The analysis produced a narrowing, not a choice:

### Eliminated on architectural fit (not merit)

**AWS CDK** and **CloudFormation** score poorly **for this specific platform** because two locked providers fall outside their reach:

- `docs/10` §9.4 — **MongoDB Atlas** (partial support only, via third-party CFN resource types)
- `docs/07` §19.1 / `docs/10` §8.2 — **Vercel** (no support)
- `docs/10` §9.3 — Cloudinary (no support)

Adopting either means **three of five providers stay outside version control**, in direct tension with `docs/10` §2.2. Weighted totals: CDK **169**, CloudFormation **151**.

### Remaining candidates — statistically tied

| | Terraform | OpenTofu |
|---|---|---|
| Weighted total | **222** | **223** |
| License | **BUSL-1.1** (source-available) | **MPL-2.0** (open source) |
| Governance | HashiCorp / IBM | Linux Foundation |
| HCL, providers, state model | Identical today | Identical today |
| Atlas / Vercel / Cloudinary providers | ✅ | ✅ |
| Ecosystem maturity | Larger | Younger fork |

**A 1-point difference is not technically decisive.** The analysis explicitly declines to treat it as one.

## 3. The Two Genuine Judgements — Neither Is Technical

### Judgement 1 — Licensing (CTO only)

**BUSL-1.1 vs MPL-2.0.** Terraform's Business Source License is source-available with usage restrictions; OpenTofu's MPL-2.0 is unambiguously open source. Whether BUSL is acceptable for National Furniture & Interiors' commercial use is a **legal/commercial** question, not an engineering one. It should be confirmed with legal counsel rather than assumed either way.

### Judgement 2 — Risk appetite (CTO + Principal DevOps Architect)

**Multi-provider coverage vs. state-file security burden.**

| | Favours |
|---|---|
| Covers all five locked providers in one tool, satisfying `docs/10` §2.2 fully | **Terraform / OpenTofu** |
| **No state file to secure.** Terraform/OpenTofu state contains secrets and must be encrypted at rest, access-controlled, and backed up — a real, ongoing obligation under `docs/09` §5.1 | **CDK / CloudFormation** |

This is the **only** dimension on which the eliminated options remain genuinely attractive, and it is a real security trade-off, not a formality. If the CTO weights state-file risk highly enough to overturn the narrowing in §2, that is a legitimate outcome — it would mean accepting manual management of Atlas/Vercel/Cloudinary and formally reconciling that against `docs/10` §2.2.

## 4. What the Decision Unblocks

```
ADR-0003 approved
   └─> docs/07 gains an IaC category (Revision History entry, docs/18 §5.1)
        └─> IaC authored for Shared Development
             └─> [STILL REQUIRES: cloud accounts + credentials — external]
                  └─> Shared Development provisioned
                       └─> deploy-staging.yml implemented
                            └─> docs/11 §7.2 DoD becomes satisfiable
```

**Approving ADR-0003 alone does not produce Shared Development.** Cloud accounts, billing authority, and credentials remain external to this repository — see `implementation/02_shared_dev_human_decision_sheet.md`.

## 5. Scope Question the CTO Should Also Settle

**Is an IaC decision required for Sprint 1 *scope*, or only for Sprint 1 *Definition of Done*?**

Sprint 1 builds `auth`/`users`/`admin` — no module code depends on Shared Development existing. The dependency is entirely through `docs/11` §7.2's DoD line.

Two coherent positions:
- **(i)** ADR-0003 is a **Sprint 1 blocker** — no Story can be Done without Shared Dev, so decide now.
- **(ii)** ADR-0003 is **not required for Sprint 1 scope** — decide it on the DevOps track in parallel, and handle the DoD gap via the separate decision in `implementation/02_shared_dev_human_decision_sheet.md`.

**Position (ii) is the more accurate reading of the dependency**, but choosing it *requires* the DoD question to be answered — otherwise Stories accumulate that cannot be closed. **The two decisions must not both be deferred.**

## 6. Required Authorities

| Role | Responsibility |
|---|---|
| **CTO** | **Decision authority.** Owns Technology and `docs/07` (`docs/17` §8). Sole authority to add a technology category. Also owns Judgement 1 (licensing) |
| **Principal DevOps Architect** | **Consultation required.** Owns DevOps/Deployment (`docs/10`, `docs/13`). Co-owns Judgement 2. Authors the `docs/07`-format entry post-decision |
| Legal counsel | Advisory on BUSL-1.1 acceptability |

## 7. What Must Accompany Approval

Per `docs/18` §6.2, an approved ADR must carry "the same alternatives-comparison rigor `07` applied to every locked choice". `implementation/01_iac_decision_analysis.md` supplies the comparison; the **decision section** in `docs/07`'s own format still needs authoring by the Principal DevOps Architect, covering: purpose, responsibilities, enterprise benefits, performance, scalability, security, advantages, trade-offs, known limitations, rejected alternatives, migration strategy, version policy, maintenance, operational risks.

## 8. Exact Approval Statement Required

> **ADR-0003 is APPROVED.** The Infrastructure-as-Code technology for this platform is ______________________. It is to be added to `docs/07_technology_decision_record.md` as a new technology category with a full decision record in that document's established format, plus a Revision History entry citing ADR-0003. Authoring IaC for the Shared Development environment is authorized. Cloud account provisioning and credential supply remain separate prerequisites.
>
> Sprint 1 scope impact: ADR-0003 **is / is not** *(circle one)* a blocker for Sprint 1 entry — see §5.
>
> Approved by: ______________________ (CTO), date __________
> Consulted: ______________________ (Principal DevOps Architect), date __________

**Alternative dispositions:** *Deferred* with a named trigger — permissible **only** if the DoD question is resolved separately and explicitly (§5). *Rejected* — would require reconciling `docs/10` §2.2 against manual provisioning, itself an ADR.

## 9. Status

**PROPOSED — CTO DECISION REQUIRED. No tool selected. No dependency added. No infrastructure provisioned.**

---

*This sheet selects no tool and modifies no locked document. ADR-0003's status is unchanged.*
