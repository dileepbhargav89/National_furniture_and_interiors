# `core/events`

**Deliberately deferred — not built in this remediation.**

docs/06_project_structure.md §4.2: domain event bus + the outbox relay process (docs/03_database_design.md §9.8.4). No Phase 1 event is named in docs/02_enterprise_architecture.md §10/§16's event list — the outbox pattern is first actually exercised in Phase 3 (`leads`, docs/15_master_project_plan.md §3.1). Building a generic event bus now, with no real event type to carry and no consumer to prove it against, would mean inventing an interface shape against nothing — exactly what docs/18_CLAUDE_CONSTITUTION.md §7 Rule 3 says not to do.

Revisit at the start of the `leads` module's work (Phase 3).
