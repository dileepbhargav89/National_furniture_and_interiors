# configs/environments/

Per-environment variable schemas and non-secret default profiles (local/staging/production shapes). Consumed as data by `apps/api/src/core/config/` at boot (fail-fast validation) — never imported as code.
Spec: docs/06_project_structure.md §2.3, docs/05_repository_strategy.md §11.
Schema format (JSON Schema vs. TypeScript-typed objects vs. YAML) is an open item — docs/06_project_structure.md §17.
