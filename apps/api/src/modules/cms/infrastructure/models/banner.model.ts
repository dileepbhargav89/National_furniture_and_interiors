import mongoose from 'mongoose';
import { BannerPlacement } from '../../domain/cms.types';

const BannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    badgeText: { type: String, trim: true },
    ctaText: { type: String, default: 'Explore Now', trim: true },
    linkUrl: { type: String, trim: true },
    secondaryCtaText: { type: String, trim: true },
    secondaryLinkUrl: { type: String, trim: true },
    imageUrl: { type: String, required: true, trim: true },
    mobileImageUrl: { type: String, trim: true },
    placement: {
      type: String,
      enum: Object.values(BannerPlacement),
      required: true,
      index: true,
    },
    targetCategory: { type: String, trim: true },
    discountCode: { type: String, trim: true },
    sortOrder: { type: Number, default: 0, index: true },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
    impressionCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

BannerSchema.index({ placement: 1, isActive: 1, sortOrder: 1 });

export const BannerModel = mongoose.model('Banner', BannerSchema, 'banners');
