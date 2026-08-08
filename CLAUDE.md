# National Furniture & Interiors — Project Memory

Read these two files before doing anything else in this repository:

1. **`docs/17_architecture_index.md`** — master navigation index. Tells you which document owns which decision, in what order to read for the task at hand, and how to trace a business requirement through architecture → database → API → security → testing → deployment → monitoring.
2. **`docs/18_CLAUDE_CONSTITUTION.md`** — binding engineering rules. Covers what requires an ADR, what's prohibited (bypassing validation/RBAC, hardcoding secrets, introducing unapproved technology, redesigning locked architecture), and the operating rules for AI-assisted sessions specifically (§7): read before coding, cite the decision you're implementing, never invent architecture, never contradict a locked decision silently, prefer extending an existing module, ask for an ADR when a request conflicts with the baseline.

This file is intentionally thin and stays that way — it points at the source of truth instead of duplicating it, the same discipline every document in `docs/00`–`18` applies to each other. Do not copy content from `docs/17` or `docs/18` into this file as it grows; add a pointer instead.

## Current State

Structural scaffold only — no business logic exists yet. Folder tree, workspace config, and package manifests are in place per `docs/06_project_structure.md`. Sprint 0 (tooling setup: ESLint, Prettier, Husky, Commitlint, Docker, CI, health check) is planned but not yet executed — see `implementation/00_foundation_setup.md` for the full checklist and current status. Do not start Sprint 1 (`auth`/`users`/`admin`, per `docs/15_master_project_plan.md` Phase 1) until that checklist is closed.

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
