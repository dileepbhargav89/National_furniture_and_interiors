# packages/

Seven reusable workspace packages — not the eleven a naive reading of the brief might suggest (docs/06_project_structure.md §5 explains why `types`, `shared-validation`, `shared-constants`, `shared-components`, and `shared-hooks` are folded into `@nfi/shared`/`@nfi/ui` instead of fragmented out).

| Package         | Purpose                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------- |
| `ui`            | Shadcn-sourced component library, shared by `storefront` and `admin`                     |
| `api-client`    | The only place either frontend app calls the API                                         |
| `config`        | Shared runtime frontend configuration (Tailwind theme, Next.js config fragments)         |
| `shared`        | Cross-stack contract — types, enums, Zod validation, constants. Depends on nothing else. |
| `eslint-config` | Shared lint config, including the module-boundary enforcement rule                       |
| `tsconfig`      | Base TypeScript compiler configs                                                         |
| `database`      | Offline migration/seed/index/backup tooling — never imported by the running app          |

Dependency graph: docs/06_project_structure.md §6, §13.
