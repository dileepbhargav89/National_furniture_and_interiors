// Mongoose implementations for roles / permissions / audit_logs — docs/03 §9.1.2, §9.1.3, §9.8.2.
import mongoose, { Schema } from 'mongoose';
import type {
  AuditLogRecord,
  IAuditLogRepository,
  IPermissionRepository,
  IRoleRepository,
  PermissionRecord,
  RoleRecord,
} from '../application/ports';

const roleSchema = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    permissionIds: { type: [Schema.Types.ObjectId], default: [] },
    isSystemRole: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    version: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'roles' },
);
roleSchema.set('autoIndex', false);

const permissionSchema = new Schema(
  {
    key: { type: String, required: true },
    module: String,
    description: String,
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'permissions' },
);
permissionSchema.set('autoIndex', false);

// docs/03 §9.8.2 / §3.1 — immutable, append-only. No soft-delete fields, and the repository below
// exposes no update or delete method at all.
const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, default: null },
    actorRole: { type: String, default: null },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, default: null },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    occurredAt: { type: Date, default: Date.now },
  },
  { collection: 'audit_logs' },
);
auditLogSchema.set('autoIndex', false);

type AnyModel = mongoose.Model<Record<string, unknown>>;

const RoleModel = (mongoose.models.Role ??
  mongoose.model('Role', roleSchema)) as unknown as AnyModel;
const PermissionModel = (mongoose.models.Permission ??
  mongoose.model('Permission', permissionSchema)) as unknown as AnyModel;
const AuditLogModel = (mongoose.models.AuditLog ??
  mongoose.model('AuditLog', auditLogSchema)) as unknown as AnyModel;

interface RoleDoc {
  _id: { toString(): string };
  name: string;
  description?: string;
  permissionIds: { toString(): string }[];
  isSystemRole: boolean;
}
interface PermissionDoc {
  _id: { toString(): string };
  key: string;
  module?: string;
  description?: string;
}

const toRole = (d: RoleDoc): RoleRecord => ({
  id: d._id.toString(),
  name: d.name,
  description: d.description ?? '',
  permissionIds: d.permissionIds.map((p) => p.toString()),
  isSystemRole: d.isSystemRole,
});

const toPermission = (d: PermissionDoc): PermissionRecord => ({
  id: d._id.toString(),
  key: d.key,
  module: d.module ?? '',
  description: d.description ?? '',
});

export class MongoRoleRepository implements IRoleRepository {
  async findAll(): Promise<RoleRecord[]> {
    return (await RoleModel.find({ isDeleted: false }).lean<RoleDoc[]>()).map(toRole);
  }
  async findById(id: string): Promise<RoleRecord | null> {
    const doc = await RoleModel.findOne({ _id: id, isDeleted: false }).lean<RoleDoc | null>();
    return doc ? toRole(doc) : null;
  }
  async findByName(name: string): Promise<RoleRecord | null> {
    const doc = await RoleModel.findOne({ name, isDeleted: false }).lean<RoleDoc | null>();
    return doc ? toRole(doc) : null;
  }
}

export class MongoPermissionRepository implements IPermissionRepository {
  async findAll(): Promise<PermissionRecord[]> {
    return (await PermissionModel.find({ isDeleted: false }).lean<PermissionDoc[]>()).map(
      toPermission,
    );
  }
  async findByIds(ids: readonly string[]): Promise<PermissionRecord[]> {
    if (ids.length === 0) {
      return [];
    }
    return (
      await PermissionModel.find({ _id: { $in: ids }, isDeleted: false }).lean<PermissionDoc[]>()
    ).map(toPermission);
  }
}

export class MongoAuditLogRepository implements IAuditLogRepository {
  async append(entry: {
    actorId: string | null;
    actorRole: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    ipAddress: string | null;
    userAgent: string | null;
  }): Promise<void> {
    await AuditLogModel.create({ ...entry, occurredAt: new Date() });
  }

  async findRecent(limit: number): Promise<AuditLogRecord[]> {
    const docs = await AuditLogModel.find({}).sort({ occurredAt: -1 }).limit(limit).lean<
      {
        _id: { toString(): string };
        actorId: { toString(): string } | null;
        actorRole: string | null;
        action: string;
        entityType: string;
        entityId: { toString(): string } | null;
        occurredAt: Date;
      }[]
    >();
    return docs.map((d) => ({
      id: d._id.toString(),
      actorId: d.actorId ? d.actorId.toString() : null,
      actorRole: d.actorRole,
      action: d.action,
      entityType: d.entityType,
      entityId: d.entityId ? d.entityId.toString() : null,
      occurredAt: d.occurredAt,
    }));
  }
}
