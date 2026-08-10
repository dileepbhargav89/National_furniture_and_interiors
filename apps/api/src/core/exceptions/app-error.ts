// Base error abstraction — docs/06_project_structure.md §4.2 ("Base/shared error classes"),
// docs/02_enterprise_architecture.md §16 ("custom error classes... mapped to consistent HTTP
// status + response envelope"). Every module throws a subclass of this, never a raw Error.
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
  readonly details?: unknown;

  protected constructor(message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.details = details;
    Error.captureStackTrace(this, new.target);
  }
}
