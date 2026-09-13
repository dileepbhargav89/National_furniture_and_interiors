// Media asset Mongoose schema and repository.
import mongoose, { Schema } from 'mongoose';
import type { MediaAsset, MediaOwnerType } from '../domain/media.types';
import type { ConfirmUploadInput, IMediaAssetRepository } from '../application/ports';

const OWNER_TYPES: MediaOwnerType[] = ['PRODUCT', 'DESIGN_PROJECT', 'CATEGORY', 'CMS'];

const mediaAssetSchema = new Schema(
  {
    ownerType: { type: String, enum: OWNER_TYPES, required: true },
    ownerId: { type: Schema.Types.ObjectId, required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true, unique: true },
    format: { type: String, required: true },
    bytes: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
    uploadedBy: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: { createdAt: 'uploadedAt', updatedAt: false }, collection: 'media_assets' },
);
mediaAssetSchema.set('autoIndex', false);

const MediaAssetModel = (mongoose.models.MediaAsset ??
  mongoose.model('MediaAsset', mediaAssetSchema)) as mongoose.Model<Record<string, unknown>>;

function toMediaAsset(doc: Record<string, unknown>): MediaAsset {
  const asset: MediaAsset = {
    id: String(doc._id),
    ownerType: doc.ownerType as MediaOwnerType,
    ownerId: String(doc.ownerId),
    url: doc.url as string,
    publicId: doc.publicId as string,
    format: doc.format as string,
    bytes: doc.bytes as number,
    uploadedBy: String(doc.uploadedBy),
    uploadedAt: doc.uploadedAt as Date,
  };
  
  if (doc.width !== undefined && doc.width !== null) {
    asset.width = doc.width as number;
  }
  if (doc.height !== undefined && doc.height !== null) {
    asset.height = doc.height as number;
  }
  
  return asset;
}

export class MongoMediaAssetRepository implements IMediaAssetRepository {
  async create(input: ConfirmUploadInput): Promise<MediaAsset> {
    const doc = await MediaAssetModel.create({
      ownerType: input.ownerType,
      ownerId: new mongoose.Types.ObjectId(input.ownerId),
      url: input.url,
      publicId: input.publicId,
      format: input.format,
      bytes: input.bytes,
      width: input.width,
      height: input.height,
      uploadedBy: new mongoose.Types.ObjectId(input.uploadedBy),
    });
    return toMediaAsset(doc.toObject() as Record<string, unknown>);
  }

  async findByOwner(ownerType: MediaOwnerType, ownerId: string): Promise<MediaAsset[]> {
    const docs = await MediaAssetModel.find({
      ownerType,
      ownerId: new mongoose.Types.ObjectId(ownerId),
    })
      .sort({ uploadedAt: -1 })
      .lean<Record<string, unknown>[]>();
    return docs.map(toMediaAsset);
  }

  async deleteByPublicId(publicId: string): Promise<void> {
    await MediaAssetModel.deleteOne({ publicId });
  }
}
