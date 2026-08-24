// Mongoose schema for the `users` collection — docs/03_database_design.md §9.1.1.
//
// Shared collection: `auth` owns the credential/session fields, `users` owns profile/address
// fields (docs/06 §4.3). Both modules define their own Mongoose model over the same collection
// via their own infrastructure layer — neither imports the other's (docs/06 §4.3's import rules).
// `strict: false` is NOT used; each module's schema declares the full document shape so a write
// from either module preserves the other's fields.
import mongoose, { Schema } from 'mongoose';
import { USER_STATUSES, USER_TYPES } from '../domain/user-type';

const addressSchema = new Schema(
  {
    label: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
    isDefault: Boolean,
  },
  { _id: true },
);

const userSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: null },
    passwordHash: { type: String, default: null },
    authProviders: { type: [String], default: ['LOCAL'] },
    googleId: { type: String, default: null },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    userType: { type: String, enum: USER_TYPES, required: true },
    roleId: { type: Schema.Types.ObjectId, ref: 'roles', required: true },
    additionalRoleIds: { type: [Schema.Types.ObjectId], default: [] },
    status: { type: String, enum: USER_STATUSES, default: 'ACTIVE' },
    avatarUrl: { type: String, default: null },
    avatarPublicId: { type: String, default: null },
    // docs/03 §9.1.1 — embedded, bounded (<10), always fetched with checkout/profile.
    addresses: { type: [addressSchema], default: [] },
    // MFA fields (docs/09 §2.8). `mfaSecret` is a Tier 1 secret-equivalent: it must never appear
    // in an audit snapshot or a log line (docs/03 §9.8.2's redaction rule, docs/09 §11 rule 8).
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, default: null },
    lastLoginAt: { type: Date, default: null },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    // docs/09 §2.7 — last 5 password hashes retained to block immediate reuse.
    passwordHistory: { type: [String], default: [] },
    // docs/03 §3's standard audit block.
    createdBy: { type: Schema.Types.ObjectId, default: null },
    updatedBy: { type: Schema.Types.ObjectId, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, default: null },
    version: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'users' },
);

// Indexes are created by packages/database migration 0001, not here — docs/06 §4.4's split
// between runtime connection code and offline schema evolution.
userSchema.set('autoIndex', false);

type AnyModel = mongoose.Model<Record<string, unknown>>;

export const UserModel = (mongoose.models.AuthUser ??
  mongoose.model('AuthUser', userSchema)) as unknown as AnyModel;
