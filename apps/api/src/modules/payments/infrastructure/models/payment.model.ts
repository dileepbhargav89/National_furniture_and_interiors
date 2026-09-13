// payment.model.ts — Mongoose schema for the payments collection.
// docs/03_database_design.md §9.3.6 (payments collection fields).
// docs/03 §3.1 — immutable/append-only collection (no update hooks that allow overwriting).
// Critical indexes (docs/03 §10.6):
//   { payableType: 1, payableId: 1 }  — polymorphic lookup
//   { gatewayOrderId: 1 }             — unique, powers webhook idempotency check

import mongoose, { Schema, Document } from 'mongoose';
import { PayableType, PaymentGateway, PaymentMethod, PaymentRecordStatus } from '../../domain/payments.types';

export interface IPaymentDocument extends Document {
  payableType: PayableType;
  payableId: string;
  gateway: PaymentGateway;
  gatewayOrderId: string;
  gatewayPaymentId?: string | undefined;
  gatewaySignature?: string | undefined;
  amount: number; // paise
  currency: string;
  method?: PaymentMethod | undefined;
  status: PaymentRecordStatus;
  reconciliationDetails?: {
    utrNumber: string;
    bankName?: string;
    verifiedBy?: string;
    reconciledAt: Date;
    notes?: string;
  } | undefined;
  refundDetails?: {
    amount: number;
    reason: string;
    refundReference?: string;
    refundedAt: Date;
  } | undefined;
  rawWebhookPayload?: Record<string, unknown> | undefined;
  attemptedAt?: Date | undefined;
  capturedAt?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    payableType: {
      type: String,
      enum: Object.values(PayableType),
      required: true,
    },
    payableId: {
      type: String,
      required: true,
    },
    gateway: {
      type: String,
      enum: Object.values(PaymentGateway),
      required: true,
      default: PaymentGateway.RAZORPAY,
    },
    gatewayOrderId: {
      type: String,
      required: true,
      unique: true, // index: { gatewayOrderId: 1 } — unique (docs/03 §10.6)
    },
    gatewayPaymentId: { type: String },
    gatewaySignature: { type: String },
    // amount in paise — non-negative integer, never a float (docs/03 §2)
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR' },
    method: {
      type: String,
      enum: [...Object.values(PaymentMethod), null],
    },
    status: {
      type: String,
      enum: Object.values(PaymentRecordStatus),
      required: true,
      default: PaymentRecordStatus.CREATED,
    },
    reconciliationDetails: {
      utrNumber: { type: String },
      bankName: { type: String },
      verifiedBy: { type: String },
      reconciledAt: { type: Date },
      notes: { type: String },
    },
    refundDetails: {
      amount: { type: Number },
      reason: { type: String },
      refundReference: { type: String },
      refundedAt: { type: Date },
    },
    rawWebhookPayload: { type: Schema.Types.Mixed },
    attemptedAt: { type: Date },
    capturedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Compound index for polymorphic lookup (docs/03 §10.6)
PaymentSchema.index({ payableType: 1, payableId: 1 });

export const PaymentModel = mongoose.model<IPaymentDocument>('Payment', PaymentSchema, 'payments');
