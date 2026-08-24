// admin module port interfaces — docs/02 §7.1, docs/06 §4.3.
export interface RoleRecord {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly permissionIds: readonly string[];
  readonly isSystemRole: boolean;
}

export interface PermissionRecord {
  readonly id: string;
  readonly key: string;
  readonly module: string;
  readonly description: string;
}

export interface IRoleRepository {
  findAll(): Promise<RoleRecord[]>;
  findById(id: string): Promise<RoleRecord | null>;
  findByName(name: string): Promise<RoleRecord | null>;
}

export interface IPermissionRepository {
  findAll(): Promise<PermissionRecord[]>;
  findByIds(ids: readonly string[]): Promise<PermissionRecord[]>;
}

export interface AuditLogRecord {
  readonly id: string;
  readonly actorId: string | null;
  readonly actorRole: string | null;
  readonly action: string;
  readonly entityType: string;
  readonly entityId: string | null;
  readonly occurredAt: Date;
}

export interface IAuditLogRepository {
  /** docs/03 §3.1 — append-only. No update or delete method is exposed AT ALL, by design. */
  append(entry: {
    actorId: string | null;
    actorRole: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    ipAddress: string | null;
    userAgent: string | null;
  }): Promise<void>;
  findRecent(limit: number): Promise<AuditLogRecord[]>;
}
