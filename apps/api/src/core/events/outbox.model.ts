import mongoose from 'mongoose';
import { OutboxStatus } from './domain-events';

const OutboxSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    aggregateType: {
      type: String,
      required: true,
    },
    aggregateId: {
      type: String,
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(OutboxStatus),
      default: OutboxStatus.PENDING,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      required: true,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for relay polling: find PENDING events sorted by creation time
OutboxSchema.index({ status: 1, createdAt: 1 });

export const OutboxModel = mongoose.model('Outbox', OutboxSchema, 'outbox');
