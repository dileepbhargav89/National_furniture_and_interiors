# `core/utils`

**Deliberately empty — not built in this remediation.**

docs/06_project_structure.md §4.2: generic, framework-agnostic pure functions shared across modules (date formatting, ID generation helpers). Nothing in the current foundation (`core/security`, `core/exceptions`, `core/di`, `core/database`) or the Sprint 1 plan (`implementation/01_sprint1_identity_access.md`) currently needs a named helper here. Populating this folder speculatively would invite the "dumping ground" anti-pattern docs/06_project_structure.md §5 already warns against for a different (package-level) case — the same discipline applies here. Add a function here only when a real module needs one.
