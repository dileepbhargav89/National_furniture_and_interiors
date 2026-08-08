# Module: `crm`

**Primary collections:** `customers`, `lead_status_history`, `lead_activities`
**Note:** References `auth`'s `users` by ID only, never duplicates identity data (docs/03 §9.7.1).

## Layers (docs/06_project_structure.md §4.3 — identical template across all 15 modules)

- `domain/` — entities, value objects, domain events. Zero imports from application/, infrastructure/, presentation/, or any other module.
- `application/` — use-case classes, port interfaces. May import this module's own domain/ and @nfi/shared; may import another module's application/ exported interface only, never its infrastructure/ or domain/.
- `infrastructure/` — Mongoose repositories/schemas, external adapters. Implements application/'s port interfaces.
- `presentation/` — controllers, routes, validators (Zod), DTOs, module-specific middleware. Calls application/ use-cases only.

Full rules: docs/06_project_structure.md §4.3, docs/02_enterprise_architecture.md §5. Security profile: docs/09_security_architecture.md §10. API contract: docs/08_api_architecture.md §8. Test scope: docs/12_testing_strategy.md §3.

**Do not add code here without reading the sections above first — docs/18_CLAUDE_CONSTITUTION.md §3.**
