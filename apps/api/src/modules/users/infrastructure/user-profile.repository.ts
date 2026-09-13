// Mongoose implementation of IUserProfileRepository over the shared `users` collection.
//
// docs/03 §3.1 — every read filters isDeleted: false at the Infrastructure layer.
// Projections deliberately EXCLUDE passwordHash, mfaSecret, and passwordHistory: those are
// `auth`-owned secret-equivalent fields (docs/09 §1.4 Tier 1) and this module has no reason to
// read them, let alone return them.
import mongoose, { Schema } from 'mongoose';
import type { Address } from '../domain/address';
import type {
  AdminCreateUserInput,
  IUserProfileRepository,
  UpdateOwnProfileInput,
  UserProfile,
} from '../application/ports';

const profileSchema = new Schema({}, { strict: false, collection: 'users', timestamps: true });
profileSchema.set('autoIndex', false);

type AnyModel = mongoose.Model<Record<string, unknown>>;

const ProfileModel = (mongoose.models.UserProfile ??
  mongoose.model('UserProfile', profileSchema)) as unknown as AnyModel;

/** Never selects secret-equivalent fields. */
const SAFE_PROJECTION = {
  fullName: 1,
  email: 1,
  phone: 1,
  userType: 1,
  roleId: 1,
  status: 1,
  avatarUrl: 1,
  addresses: 1,
  mfaEnabled: 1,
  createdAt: 1,
  companyName: 1,
  gstin: 1,
} as const;

interface ProfileDoc {
  _id: { toString(): string };
  fullName: string;
  email: string;
  phone: string | null;
  userType: string;
  roleId: { toString(): string };
  status: string;
  avatarUrl: string | null;
  addresses?: Address[];
  mfaEnabled?: boolean;
  createdAt: Date;
  companyName?: string | null;
  gstin?: string | null;
}

function toProfile(doc: ProfileDoc): UserProfile {
  return {
    id: doc._id.toString(),
    fullName: doc.fullName,
    email: doc.email,
    phone: doc.phone ?? null,
    userType: doc.userType,
    roleId: doc.roleId.toString(),
    status: doc.status,
    avatarUrl: doc.avatarUrl ?? null,
    addresses: doc.addresses ?? [],
    mfaEnabled: doc.mfaEnabled ?? false,
    createdAt: doc.createdAt,
    companyName: doc.companyName ?? null,
    gstin: doc.gstin ?? null,
  };
}

export class MongoUserProfileRepository implements IUserProfileRepository {
  async findById(id: string): Promise<UserProfile | null> {
    const doc = await ProfileModel.findOne(
      { _id: id, isDeleted: false },
      SAFE_PROJECTION,
    ).lean<ProfileDoc | null>();
    return doc ? toProfile(doc) : null;
  }

  async findByEmail(email: string): Promise<UserProfile | null> {
    const doc = await ProfileModel.findOne(
      { email, isDeleted: false },
      SAFE_PROJECTION,
    ).lean<ProfileDoc | null>();
    return doc ? toProfile(doc) : null;
  }

  async list(limit: number): Promise<UserProfile[]> {
    const docs = await ProfileModel.find({ isDeleted: false }, SAFE_PROJECTION)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<ProfileDoc[]>();
    return docs.map(toProfile);
  }

  async updateOwn(id: string, input: UpdateOwnProfileInput): Promise<UserProfile | null> {
    // Explicit field-by-field assignment — never a spread of raw request input into the update
    // document (docs/09 §3.9 prototype-pollution rule, §11 rule 3, §3.10 mass assignment).
    const update: Record<string, unknown> = {};
    if (input.fullName !== undefined) update.fullName = input.fullName;
    if (input.phone !== undefined) update.phone = input.phone;
    if (input.avatarUrl !== undefined) update.avatarUrl = input.avatarUrl;
    if (input.addresses !== undefined) update.addresses = input.addresses;
    if (input.companyName !== undefined) update.companyName = input.companyName;
    if (input.gstin !== undefined) update.gstin = input.gstin;

    if (Object.keys(update).length === 0) {
      return this.findById(id);
    }

    update.updatedAt = new Date();
    await ProfileModel.updateOne(
      { _id: id, isDeleted: false },
      { $set: update, $inc: { version: 1 } },
    );
    return this.findById(id);
  }

  async createPrivileged(input: AdminCreateUserInput): Promise<UserProfile> {
    const now = new Date();
    const created = await ProfileModel.create({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      passwordHash: input.passwordHash,
      authProviders: ['LOCAL'],
      userType: input.userType,
      roleId: new mongoose.Types.ObjectId(input.roleId),
      status: 'ACTIVE',
      isEmailVerified: false,
      isPhoneVerified: false,
      addresses: [],
      // docs/09 §2.8 — created un-enrolled; auth blocks privileged access until enrolment.
      mfaEnabled: false,
      mfaSecret: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      passwordHistory: [input.passwordHash],
      createdAt: now,
      updatedAt: now,
      createdBy: null,
      updatedBy: null,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      version: 0,
    });
    const profile = await this.findById((created._id as { toString(): string }).toString());
    if (!profile) {
      throw new Error('Failed to read back the created user');
    }
    return profile;
  }
}
