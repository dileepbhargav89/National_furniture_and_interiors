# National Furniture & Interiors — Project Memory

Read these two files before doing anything else in this repository:

1. **`docs/17_architecture_index.md`** — master navigation index. Tells you which document owns which decision, in what order to read for the task at hand, and how to trace a business requirement through architecture → database → API → security → testing → deployment → monitoring.
2. **`docs/18_CLAUDE_CONSTITUTION.md`** — binding engineering rules. Covers what requires an ADR, what's prohibited (bypassing validation/RBAC, hardcoding secrets, introducing unapproved technology, redesigning locked architecture), and the operating rules for AI-assisted sessions specifically (§7): read before coding, cite the decision you're implementing, never invent architecture, never contradict a locked decision silently, prefer extending an existing module, ask for an ADR when a request conflicts with the baseline.

This file is intentionally thin and stays that way — it points at the source of truth instead of duplicating it, the same discipline every document in `docs/00`–`18` applies to each other. Do not copy content from `docs/17` or `docs/18` into this file as it grows; add a pointer instead.

## Current State

Sprint 0 (tooling setup) is complete and verified — see `implementation/00_foundation_setup.md` §6 for the closed checklist. Workspace installs cleanly (`pnpm install`), lint/typecheck/format/test/build all pass across every package, ESLint's module-boundary rule is live and smoke-tested, Husky + Commitlint enforce Conventional Commits, and `apps/api` boots with a working `GET /health` liveness probe. Still no business logic — `apps/api/src/core/` (config/database/cache/logger) and the Next.js app-shell boilerplate are infrastructure only, not feature code. Sprint 1 (`auth`/`users`/`admin`, per `docs/15_master_project_plan.md` Phase 1) may now begin.

Known gaps to close in/before Sprint 1: `apps/worker`'s standalone-package-vs-shared-entry-point question is still open (`apps/worker/README.md`); the four Dockerfiles for `storefront`/`admin` are template-correct but unverified since this sandbox has no Docker; `apps/api/.env`'s vendor secrets (Razorpay/Cloudinary/Email/SMS) are placeholders with no consuming code yet.

## Quick Commands

```bash
pnpm install
pnpm dev          # turbo run dev across all apps
pnpm lint         # turbo run lint
pnpm typecheck    # turbo run typecheck
pnpm test         # turbo run test
pnpm build        # turbo run build
```

## Never

- Never edit `docs/00`–`18` directly — they are locked. A change to a decision they contain goes through the ADR process (`docs/11_engineering_workflow.md` §2.6, `docs/18_CLAUDE_CONSTITUTION.md` §6).
- Never introduce a technology not already named in `docs/07_technology_decision_record.md` without an ADR.
- Never bypass Zod/`$jsonSchema` validation, permission-key RBAC, or a module's `domain/`→`application/`→`infrastructure/`→`presentation/` boundary.
- Never place business logic in `apps/api/src/core/` — that folder is cross-cutting infrastructure only.
