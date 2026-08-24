// Mongoose implementation of IRefreshTokenRepository — docs/03_database_design.md §9.1.4.
//
// Ephemeral collection: TTL-indexed on expiresAt (migration 0001), hard-deleted, NO soft delete
// (docs/03 §3.1's exception list). Only the token HASH is ever stored (docs/02 §9.1, docs/03
// §9.1.4: "tokenHash | String | hashed, never plaintext").
import mongoose, { Schema } from 'mongoose';
import type { IRefreshTokenRepository, StoredRefreshToken } from '../application/ports';

const refreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    tokenHash: { type: String, required: true },
    deviceInfo: {
      userAgent: { type: String, default: '' },
      ip: { type: String, default: '' },
    },
    issuedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByTokenId: { type: Schema.Types.ObjectId, default: null },
  },
  { collection: 'refresh_tokens' },
);
refreshTokenSchema.set('autoIndex', false);

type AnyModel = mongoose.Model<Record<string, unknown>>;

const RefreshTokenModel = (mongoose.models.RefreshToken ??
  mongoose.model('RefreshToken', refreshTokenSchema)) as unknown as AnyModel;

interface RefreshTokenDocument {
  _id: { toString(): string };
  userId: { toString(): string };
  revokedAt: Date | null;
  replacedByTokenId: { toString(): string } | null;
}

export class MongoRefreshTokenRepository implements IRefreshTokenRepository {
  async store(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    deviceInfo: { userAgent: string; ip: string };
  }): Promise<string> {
    const created = await RefreshTokenModel.create({
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      deviceInfo: input.deviceInfo,
      issuedAt: new Date(),
    });
    return (created._id as { toString(): string }).toString();
  }

  async findByHash(tokenHash: string): Promise<StoredRefreshToken | null> {
    const doc = await RefreshTokenModel.findOne({ tokenHash }).lean<RefreshTokenDocument | null>();
    if (!doc) {
      return null;
    }
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      revokedAt: doc.revokedAt,
      replacedByTokenId: doc.replacedByTokenId ? doc.replacedByTokenId.toString() : null,
    };
  }

  async markRotated(id: string, replacedByTokenId: string): Promise<void> {
    await RefreshTokenModel.updateOne({ _id: id }, { $set: { replacedByTokenId } });
  }

  async revoke(id: string): Promise<void> {
    await RefreshTokenModel.updateOne({ _id: id }, { $set: { revokedAt: new Date() } });
  }

  /** docs/09 §2.6 — reuse detection revokes EVERY session for the affected user. */
  async revokeAllForUser(userId: string): Promise<void> {
    await RefreshTokenModel.updateMany(
      { userId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  }

  async countActiveForUser(userId: string): Promise<number> {
    return RefreshTokenModel.countDocuments({
      userId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });
  }

  /** docs/09 §2.5 — oldest session force-revoked when the concurrent-session cap is exceeded. */
  async revokeOldestForUser(userId: string): Promise<void> {
    const oldest = await RefreshTokenModel.findOne({
      userId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    })
      .sort({ issuedAt: 1 })
      .lean<{ _id: unknown } | null>();
    if (oldest) {
      await RefreshTokenModel.updateOne({ _id: oldest._id }, { $set: { revokedAt: new Date() } });
    }
  }
}
