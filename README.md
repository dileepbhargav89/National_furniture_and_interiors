# National Furniture & Interiors

Furniture eCommerce, Interior Design Services, Lead Generation, CRM, Admin Dashboard, and Analytics — a single modular-monolith platform in a pnpm + Turborepo monorepo.

## Start Here

This repository's architecture is fully designed and locked before any implementation code was written. **Read [`docs/17_architecture_index.md`](docs/17_architecture_index.md) first** — it is the master navigation guide to every architectural decision, who owns it, and what order to read things in for your role.

Every engineer and every AI-assisted session must also read **[`docs/18_CLAUDE_CONSTITUTION.md`](docs/18_CLAUDE_CONSTITUTION.md)** — the binding engineering rules for how this codebase is built, reviewed, and changed.

## Repository Status

This is currently a **structural scaffold** — the folder tree, workspace configuration, and package manifests specified in [`docs/06_project_structure.md`](docs/06_project_structure.md), with no business logic implemented yet. Directories are placeholders (`.gitkeep`) until their first real file lands.

## Architecture Baseline (Locked, Immutable)

| Doc   | Title                                                                |
| ----- | -------------------------------------------------------------------- |
| `00`  | Architecture Review (pre-development gate)                           |
| `00b` | Remediation Summary                                                  |
| `01`  | Business Research & Competitive Analysis                             |
| `02`  | Enterprise Architecture                                              |
| `03`  | Database Design                                                      |
| `04`  | Architecture Decision Record                                         |
| `05`  | Repository Strategy                                                  |
| `06`  | Project Structure                                                    |
| `07`  | Technology Decision Record                                           |
| `08`  | API Architecture                                                     |
| `09`  | Security Architecture                                                |
| `10`  | DevOps Architecture                                                  |
| `11`  | Engineering Workflow                                                 |
| `12`  | Testing Strategy                                                     |
| `13`  | Deployment Strategy                                                  |
| `14`  | Monitoring & Observability                                           |
| `15`  | Master Project Plan                                                  |
| `16`  | Architecture Final Review — **APPROVED WITH RECOMMENDATIONS**        |
| `17`  | Architecture Index (start here)                                      |
| `18`  | Engineering Constitution (binding rules for all implementation work) |

See `docs/` for the full set. **Never edit `docs/00`–`18` directly** — changes to a locked decision go through the ADR process (`docs/11_engineering_workflow.md` §2.6, `docs/18_CLAUDE_CONSTITUTION.md` §6).

## Repository Layout

```
apps/          deployable applications: storefront, admin, api, worker
packages/      reusable workspace packages: ui, api-client, config, shared, eslint-config, tsconfig, database
configs/       non-code shared configuration (environments, feature-flags, deployment targets)
docs/          the architecture baseline (above) + living documentation
scripts/       setup, codegen, CI helpers, deploy triggers
docker/        container and orchestration definitions
.github/       CI/CD workflows, PR/issue templates
assets/        raw/source creative assets
public/        global static assets shared across apps
testing/       cross-cutting test infrastructure (e2e, load, fixtures, integration)
```

Full specification: `docs/06_project_structure.md` §2–§9.

## Getting Started

```bash
pnpm install
cp .env.example apps/api/.env            # fill in local values, never commit
cp .env.example apps/storefront/.env.local
cp .env.example apps/admin/.env.local
pnpm dev
```

Requires Node.js ≥22 and pnpm ≥9 (`engines` in `package.json`).

## Module List (`apps/api/src/modules/`)

`auth` · `users` · `leads` · `crm` · `design-projects` · `catalog` · `cart` · `orders` · `payments` · `reviews` · `media` · `notifications` · `cms` · `admin` · `analytics`

Each module follows the identical 4-layer template (`domain/`, `application/`, `infrastructure/`, `presentation/`) — see `docs/06_project_structure.md` §4.3 and each module's own `README.md`.

## Contributing

Read `docs/18_CLAUDE_CONSTITUTION.md` before your first PR. In short: read the owning architecture document before writing code, cite the decision you're implementing, never introduce a technology outside `docs/07_technology_decision_record.md` without an ADR, and never bypass validation, RBAC, or the module boundary rules.
