// AuditLogger — the `admin` module's exported audit-write interface (docs/08 §4.11, docs/08 §8's
// `admin` row). Every module's mutating STAFF/ADMIN endpoints call THIS, so redaction is applied
// in exactly one place rather than re-implemented per module (docs/18 §4.3's DRY rule).
import { redactSnapshot } from '../domain/audit-redaction';
import type { IAuditLogRepository } from './ports';

export interface RecordAuditInput {
  actorId: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export class AuditLogger {
  constructor(private readonly repository: IAuditLogRepository) {}

  async record(input: RecordAuditInput): Promise<void> {
    await this.repository.append({
      actorId: input.actorId,
      actorRole: input.actorRole,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      // docs/03 §9.8.2 — redaction is applied here, unconditionally, so no call site can forget it.
      before: redactSnapshot(input.before),
      after: redactSnapshot(input.after),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  }
}

export class ListAuditLogs {
  constructor(private readonly repository: IAuditLogRepository) {}

  async execute(limit = 50): Promise<unknown[]> {
    // docs/08 §3.4 — max limit is server-enforced regardless of what the client requests.
    return this.repository.findRecent(Math.min(limit, 100));
  }
}

export class ListRoles {
  constructor(private readonly roles: import('./ports').IRoleRepository) {}
  async execute(): Promise<unknown[]> {
    return this.roles.findAll();
  }
}

export class ListPermissions {
  constructor(private readonly permissions: import('./ports').IPermissionRepository) {}
  async execute(): Promise<unknown[]> {
    return this.permissions.findAll();
  }
}
