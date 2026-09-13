import mongoose from 'mongoose';
import { ConsentChannel } from '../../domain/cms.types';

const NewsletterSubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    subscribedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    unsubscribedAt: { type: Date },
    consentChannel: {
      type: String,
      enum: Object.values(ConsentChannel),
      default: ConsentChannel.EMAIL,
    },
    source: { type: String },
  },
  { timestamps: true }
);

NewsletterSubscriberSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

export const NewsletterSubscriberModel = mongoose.model('NewsletterSubscriber', NewsletterSubscriberSchema, 'newsletter_subscribers');
