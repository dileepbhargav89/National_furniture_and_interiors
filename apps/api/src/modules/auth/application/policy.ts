// Application-layer re-export of the domain policy constants the presentation layer needs.
//
// docs/06_project_structure.md §4.3: presentation/ "Calls application/ use-cases only; never
// imports infrastructure/ or domain/ directly". Zod validators legitimately need the same
// numeric bounds the domain enforces, so the application layer — which MAY import its own
// domain — republishes them. That keeps application/ the single contract presentation depends
// on, rather than letting presentation reach past it into domain internals.
export { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../domain/password-policy';
