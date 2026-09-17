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
  AdminOnboardUserInput,
  IUserProfileRepository,
  UpdateOwnProfileInput,
  UserDetailDossier,
  UserListFilter,
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
  onboardingStatus: 1,
  onboardingToken: 1,
  onboardingTokenExpiresAt: 1,
  invitedAt: 1,
  lastLoginAt: 1,
  failedLoginAttempts: 1,
  lockedUntil: 1,
  mustChangePassword: 1,
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
  onboardingStatus?: 'INVITED' | 'PENDING_PASSWORD' | 'COMPLETED';
  onboardingToken?: string | null;
  onboardingTokenExpiresAt?: Date | null;
  invitedAt?: Date | null;
  lastLoginAt?: Date | null;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  mustChangePassword?: boolean;
}

function toProfile(doc: ProfileDoc): UserProfile {
  return {
    id: doc._id.toString(),
    fullName: doc.fullName,
    email: doc.email,
    phone: doc.phone ?? null,
    userType: doc.userType,
    roleId: doc.roleId ? doc.roleId.toString() : '',
    status: doc.status,
    avatarUrl: doc.avatarUrl ?? null,
    addresses: doc.addresses ?? [],
    mfaEnabled: doc.mfaEnabled ?? false,
    createdAt: doc.createdAt,
    companyName: doc.companyName ?? null,
    gstin: doc.gstin ?? null,
    ...(doc.onboardingStatus ? { onboardingStatus: doc.onboardingStatus } : {}),
    ...(doc.onboardingToken !== undefined ? { onboardingToken: doc.onboardingToken } : {}),
    ...(doc.onboardingTokenExpiresAt
      ? { onboardingTokenExpiresAt: doc.onboardingTokenExpiresAt }
      : {}),
    ...(doc.invitedAt ? { invitedAt: doc.invitedAt } : {}),
    ...(doc.lastLoginAt ? { lastLoginAt: doc.lastLoginAt } : {}),
    ...(doc.failedLoginAttempts !== undefined
      ? { failedLoginAttempts: doc.failedLoginAttempts }
      : {}),
    ...(doc.lockedUntil ? { lockedUntil: doc.lockedUntil } : {}),
    ...(doc.mustChangePassword !== undefined ? { mustChangePassword: doc.mustChangePassword } : {}),
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

  async findByIdDetailed(id: string): Promise<UserDetailDossier | null> {
    const profile = await this.findById(id);
    if (!profile) return null;

    let ordersCount = 0;
    let totalSpend = 0;
    let lastOrderAt: Date | null = null;
    let authProviders: string[] = ['LOCAL'];

    try {
      const ordersCol = mongoose.connection.collection('orders');
      const orders = await ordersCol
        .find({ userId: id, isDeleted: false }, { projection: { pricing: 1, createdAt: 1 } })
        .sort({ createdAt: -1 })
        .toArray();

      ordersCount = orders.length;
      totalSpend = orders.reduce((sum, o) => {
        const p = o['pricing'] as { total?: number } | undefined;
        return sum + (Number(p?.total) || 0);
      }, 0);
      if (orders.length > 0 && orders[0]?.['createdAt']) {
        lastOrderAt = new Date(orders[0]['createdAt'] as string | number | Date);
      }

      const rawUser = await ProfileModel.findById(id, { authProviders: 1 }).lean<{
        authProviders?: string[];
      }>();
      if (rawUser?.authProviders && Array.isArray(rawUser.authProviders)) {
        authProviders = rawUser.authProviders;
      }
    } catch {
      // Gracefully handle empty or mock environment
    }

    return {
      ...profile,
      ordersCount,
      totalSpend,
      ...(lastOrderAt ? { lastOrderAt } : {}),
      authProviders,
    };
  }

  async findByEmail(email: string): Promise<UserProfile | null> {
    const doc = await ProfileModel.findOne(
      { email, isDeleted: false },
      SAFE_PROJECTION,
    ).lean<ProfileDoc | null>();
    return doc ? toProfile(doc) : null;
  }

  async findByOnboardingToken(token: string): Promise<UserProfile | null> {
    const doc = await ProfileModel.findOne(
      { onboardingToken: token, isDeleted: false },
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

  async listWithFilters(filter: UserListFilter): Promise<{ items: UserProfile[]; total: number }> {
    const query: Record<string, unknown> = { isDeleted: false };
    if (filter.userType) {
      query['userType'] = filter.userType;
    }
    if (filter.status) {
      query['status'] = filter.status;
    }
    if (filter.search && filter.search.trim()) {
      const term = filter.search.trim();
      query['$or'] = [
        { fullName: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { phone: { $regex: term, $options: 'i' } },
        { companyName: { $regex: term, $options: 'i' } },
      ];
    }

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const [total, docs] = await Promise.all([
      ProfileModel.countDocuments(query),
      ProfileModel.find(query, SAFE_PROJECTION)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<ProfileDoc[]>(),
    ]);

    return {
      items: docs.map(toProfile),
      total,
    };
  }

  async updateOwn(id: string, input: UpdateOwnProfileInput): Promise<UserProfile | null> {
    const update: Record<string, unknown> = {};
    if (input.fullName !== undefined) update['fullName'] = input.fullName;
    if (input.phone !== undefined) update['phone'] = input.phone;
    if (input.avatarUrl !== undefined) update['avatarUrl'] = input.avatarUrl;
    if (input.addresses !== undefined) update['addresses'] = input.addresses;
    if (input.companyName !== undefined) update['companyName'] = input.companyName;
    if (input.gstin !== undefined) update['gstin'] = input.gstin;

    if (Object.keys(update).length === 0) {
      return this.findById(id);
    }

    update['updatedAt'] = new Date();
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

  async onboardUser(
    input: AdminOnboardUserInput,
    passwordHash: string | null,
    onboardingToken?: string,
    onboardingTokenExpiresAt?: Date,
  ): Promise<UserProfile> {
    const now = new Date();
    const fullName = input.fullName?.trim() || input.email.split('@')[0] || 'Patron';
    const created = await ProfileModel.create({
      fullName,
      email: input.email.toLowerCase().trim(),
      phone: input.phone ?? null,
      passwordHash: passwordHash ?? null,
      authProviders: ['LOCAL'],
      userType: input.userType,
      roleId: new mongoose.Types.ObjectId(input.roleId),
      status: 'INVITED',
      companyName: input.companyName ?? null,
      gstin: input.gstin ?? null,
      isEmailVerified: false,
      isPhoneVerified: false,
      addresses: [],
      mfaEnabled: false,
      mfaSecret: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      passwordHistory: passwordHash ? [passwordHash] : [],
      onboardingStatus: 'INVITED',
      onboardingToken: onboardingToken ?? null,
      onboardingTokenExpiresAt: onboardingTokenExpiresAt ?? null,
      invitedAt: now,
      mustChangePassword: true,
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
      throw new Error('Failed to read back onboarded user');
    }
    return profile;
  }

  async updateStatus(id: string, status: string): Promise<UserProfile | null> {
    await ProfileModel.updateOne(
      { _id: id, isDeleted: false },
      { $set: { status, updatedAt: new Date() }, $inc: { version: 1 } },
    );
    return this.findById(id);
  }

  async resetPassword(
    id: string,
    newPasswordHash: string,
    mustChangePassword = true,
  ): Promise<boolean> {
    const result = await ProfileModel.updateOne(
      { _id: id, isDeleted: false },
      {
        $set: {
          passwordHash: newPasswordHash,
          mustChangePassword,
          failedLoginAttempts: 0,
          lockedUntil: null,
          updatedAt: new Date(),
        },
        $push: {
          passwordHistory: {
            $each: [newPasswordHash],
            $slice: -5,
          },
        },
        $inc: { version: 1 },
      },
    );
    return result.modifiedCount > 0;
  }

  async recordOnboardingInvite(id: string): Promise<boolean> {
    const result = await ProfileModel.updateOne(
      { _id: id, isDeleted: false },
      {
        $set: {
          onboardingStatus: 'INVITED',
          invitedAt: new Date(),
          updatedAt: new Date(),
        },
        $inc: { version: 1 },
      },
    );
    return result.modifiedCount > 0;
  }

  async refreshOnboardingToken(id: string, token: string, expiresAt: Date): Promise<boolean> {
    const result = await ProfileModel.updateOne(
      { _id: id, isDeleted: false },
      {
        $set: {
          onboardingToken: token,
          onboardingTokenExpiresAt: expiresAt,
          onboardingStatus: 'INVITED',
          invitedAt: new Date(),
          updatedAt: new Date(),
        },
        $inc: { version: 1 },
      },
    );
    return result.modifiedCount > 0;
  }

  async completeOnboarding(
    id: string,
    data: import('../application/ports').CompleteOnboardingData,
  ): Promise<UserProfile | null> {
    const update: Record<string, unknown> = {
      fullName: data.fullName,
      phone: data.phone ?? null,
      passwordHash: data.passwordHash,
      status: 'ACTIVE',
      onboardingStatus: 'COMPLETED',
      onboardingToken: null,
      onboardingTokenExpiresAt: null,
      isEmailVerified: true,
      mustChangePassword: false,
      updatedAt: new Date(),
    };
    if (data.companyName !== undefined) update['companyName'] = data.companyName;
    if (data.gstin !== undefined) update['gstin'] = data.gstin;
    if (data.address) {
      update['addresses'] = [data.address];
    }

    await ProfileModel.updateOne(
      { _id: id, isDeleted: false },
      {
        $set: update,
        $push: {
          passwordHistory: {
            $each: [data.passwordHash],
            $slice: -5,
          },
        },
        $inc: { version: 1 },
      },
    );
    return this.findById(id);
  }
}
