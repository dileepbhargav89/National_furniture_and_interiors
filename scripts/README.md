# scripts/

Cross-cutting automation, invoked by CI or humans — never imported by application runtime code.
Spec: docs/06_project_structure.md §2.2, docs/04_architecture_decision.md §10.6.

- `setup/` — local dev bootstrap (docs/10_devops_architecture.md §14.1)
- `codegen/` — new-module/feature scaffolding generator, matching docs/06_project_structure.md §4.3's template
- `ci/` — CI helper scripts
- `deploy/` — deploy trigger scripts
