# `core/constants`

**Deliberately empty — not built in this remediation.**

docs/06_project_structure.md §4.2: cross-module backend constants not part of the cross-stack `@nfi/shared` contract (internal timeouts, retry counts). Nothing in the current foundation or the Sprint 1 plan currently needs one — the JWT TTLs, rate-limit windows, and similar Sprint-1-relevant values are configuration (`core/config`'s `env` object) or module-owned (once `auth`'s route wiring picks its own rate-limit tier values), not cross-module constants. Add one here only when a real, genuinely cross-module value needs a home.
