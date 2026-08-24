// Mongoose implementation of IAuthUserRepository — docs/02 §7.1's Repository Pattern.
//
// docs/03 §3.1: "every repository-layer read applies isDeleted: false unless explicitly querying
// an admin trash view — enforced at the Infrastructure layer, not left to each caller."
// docs/09 §11 rule 2: every query uses parameterized builder methods, never a raw or
// dynamically-string-built query object.
import type { AuthUser } from '../domain/auth-user';
import type { UserStatus, UserType } from '../domain/user-type';
import type { CreateAuthUserInput, IAuthUserRepository } from '../application/ports';
import { UserModel } from './user.schema';

interface UserDocument {
  _id: { toString(): string };
  email: string;
  phone: string | null;
  passwordHash: string | null;
  userType: UserType;
  roleId: { toString(): string };
  status: UserStatus;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  passwordHistory: string[];
}

/**
 * A 24-character hex string — the only form Mongoose casts to ObjectId without throwing.
 * Deliberately stricter than `mongoose.Types.ObjectId.isValid`, which also accepts any 12-byte
 * string and would let a value through that round-trips to a different id than the caller sent.
 */
const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

function toDomain(doc: UserDocument): AuthUser {
  return {
    id: doc._id.toString(),
    email: doc.email,
    phone: doc.phone,
    passwordHash: doc.passwordHash,
    userType: doc.userType,
    roleId: doc.roleId.toString(),
    status: doc.status,
    mfaEnabled: doc.mfaEnabled,
    mfaSecret: doc.mfaSecret,
    failedLoginAttempts: doc.failedLoginAttempts ?? 0,
    lockedUntil: doc.lockedUntil,
    passwordHistory: doc.passwordHistory ?? [],
  };
}

export class MongoAuthUserRepository implements IAuthUserRepository {
  async findByEmail(email: string): Promise<AuthUser | null> {
    const doc = await UserModel.findOne({ email, isDeleted: false }).lean<UserDocument | null>();
    return doc ? toDomain(doc) : null;
  }

  async findById(id: string): Promise<AuthUser | null> {
    // A syntactically invalid id is "no such user", not a server fault. Mongoose throws CastError
    // when it cannot cast to ObjectId, which surfaced as 500 INTERNAL_ERROR on `POST
    // /auth/mfa/setup` and `/auth/mfa/verify` — both UNAUTHENTICATED endpoints taking a
    // client-supplied `userId`, so any caller could manufacture 500s on demand and inflate the
    // 5xx rate docs/10 §6.2 alerts on. Returning null instead also makes a malformed id
    // indistinguishable from a non-existent one (both -> 401 "Invalid session"), which is the
    // no-enumeration behaviour docs/09 §10 requires of the auth surface.
    //
    // The guard lives here because ObjectId shape is a persistence detail (docs/02 §7.1); the
    // presentation layer must not have to know how ids are stored.
    if (!OBJECT_ID_PATTERN.test(id)) {
      return null;
    }
    const doc = await UserModel.findOne({ _id: id, isDeleted: false }).lean<UserDocument | null>();
    return doc ? toDomain(doc) : null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    return (await UserModel.countDocuments({ email, isDeleted: false })) > 0;
  }

  async create(input: CreateAuthUserInput): Promise<AuthUser> {
    const created = await UserModel.create({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      passwordHash: input.passwordHash,
      authProviders: ['LOCAL'],
      userType: input.userType,
      roleId: input.roleId,
      status: input.status,
      isEmailVerified: false,
      isPhoneVerified: false,
      mfaEnabled: false,
      mfaSecret: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      passwordHistory: [input.passwordHash],
    });
    return toDomain(created.toObject() as unknown as UserDocument);
  }

  async updateLockout(
    id: string,
    failedLoginAttempts: number,
    lockedUntil: Date | null,
  ): Promise<void> {
    await UserModel.updateOne({ _id: id }, { $set: { failedLoginAttempts, lockedUntil } });
  }

  async recordSuccessfulLogin(id: string): Promise<void> {
    await UserModel.updateOne({ _id: id }, { $set: { lastLoginAt: new Date() } });
  }

  async setMfaSecret(id: string, secret: string): Promise<void> {
    await UserModel.updateOne({ _id: id }, { $set: { mfaSecret: secret } });
  }

  async enableMfa(id: string): Promise<void> {
    await UserModel.updateOne({ _id: id }, { $set: { mfaEnabled: true } });
  }
}
