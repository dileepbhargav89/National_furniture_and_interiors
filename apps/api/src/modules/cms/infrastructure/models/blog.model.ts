import mongoose from 'mongoose';
import { BlogStatus } from '../../domain/cms.types';

const BlogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true },
    content: { type: String, required: true },
    excerpt: { type: String },
    coverImage: { type: String },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    categoryTags: [{ type: String }],
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },
    status: {
      type: String,
      enum: Object.values(BlogStatus),
      default: BlogStatus.DRAFT,
    },
    publishedAt: { type: Date },
    viewCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Partial index for slug uniqueness
BlogSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const BlogModel = mongoose.model('Blog', BlogSchema, 'blogs');
