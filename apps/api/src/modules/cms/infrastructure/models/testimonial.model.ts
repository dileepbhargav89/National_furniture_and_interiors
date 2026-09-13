import mongoose from 'mongoose';
import { TestimonialSource } from '../../domain/cms.types';

const TestimonialSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    customerName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, required: true },
    projectType: { type: String },
    mediaUrls: [
      {
        url: String,
        type: { type: String, enum: ['IMAGE', 'VIDEO'] },
      },
    ],
    isApproved: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    source: {
      type: String,
      enum: Object.values(TestimonialSource),
      default: TestimonialSource.MANUAL_ENTRY,
    },
  },
  { timestamps: true }
);

export const TestimonialModel = mongoose.model('Testimonial', TestimonialSchema, 'testimonials');
