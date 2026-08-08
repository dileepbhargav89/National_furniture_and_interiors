# apps/worker

**Status: open item, not yet resolved** — docs/06_project_structure.md §17 explicitly leaves undecided whether `worker` needs its own `apps/worker/` folder with an independent `package.json`, or remains purely an entry-point file inside `apps/api/src/worker.ts` sharing that package's code.

**Current scaffold default:** the worker process entry point lives at `apps/api/src/worker.ts` (already created) and `apps/api/src/workers/` (BullMQ consumer registration). This folder is kept as a placeholder per docs/06 §9's tree, deliberately without its own `package.json`, so that adopting a standalone `apps/worker/` package later is additive, not a restructure.

Deciding this is implementation-detail scope per docs/06 §17 — not an ADR — but should be settled by the DevOps/Backend leads before the first BullMQ consumer ships, and this file updated to record the choice.
