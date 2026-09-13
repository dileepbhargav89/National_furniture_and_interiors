// mongo-payment.repository.ts — Mongoose implementation of IPaymentRepository.
// docs/03_database_design.md §3.1 — payments collection is immutable/append-only.
// Exposes create, findByGatewayOrderId (idempotency), markCaptured (status update), findAll (admin).
// No delete methods.

import mongoose from 'mongoose';
import {
  IPaymentRepository,
  Payment,
  CreatePaymentParams,
  UpdatePaymentCapturedParams,
  PayableType,
  PaymentGateway,
  PaymentMethod,
  PaymentRecordStatus,
} from '../../domain/payments.types';
import { PaymentModel } from '../models/payment.model';

export class MongoPaymentRepository implements IPaymentRepository {

  async create(params: CreatePaymentParams): Promise<Payment> {
    const doc = new PaymentModel({
      payableType: params.payableType,
      payableId: params.payableId,
      gateway: params.gateway,
      gatewayOrderId: params.gatewayOrderId,
      amount: params.amount,
      currency: params.currency,
      status: params.status,
      attemptedAt: params.attemptedAt,
    });
    await doc.save();
    return this.mapToDomain(doc);
  }

  async findById(id: string): Promise<Payment | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await PaymentModel.findById(id).lean().exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findByGatewayOrderId(gatewayOrderId: string): Promise<Payment | null> {
    const doc = await PaymentModel.findOne({ gatewayOrderId }).lean().exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async markCaptured(gatewayOrderId: string, params: UpdatePaymentCapturedParams): Promise<Payment | null> {
    const doc = await PaymentModel.findOneAndUpdate(
      { gatewayOrderId },
      {
        $set: {
          gatewayPaymentId: params.gatewayPaymentId,
          gatewaySignature: params.gatewaySignature,
          ...(params.method !== undefined ? { method: params.method } : {}),
          ...(params.rawWebhookPayload !== undefined ? { rawWebhookPayload: params.rawWebhookPayload } : {}),
          capturedAt: params.capturedAt,
          status: PaymentRecordStatus.CAPTURED,
        },
      },
      { new: true }
    ).lean().exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async updateReconciliation(id: string, details: any): Promise<Payment | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await PaymentModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: PaymentRecordStatus.CAPTURED,
          capturedAt: details.reconciledAt || new Date(),
          reconciliationDetails: details,
        },
      },
      { new: true }
    ).lean().exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async recordRefund(id: string, details: any): Promise<Payment | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await PaymentModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: PaymentRecordStatus.REFUNDED,
          refundDetails: details,
        },
      },
      { new: true }
    ).lean().exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findAll(limit: number, offset: number): Promise<Payment[]> {
    const docs = await PaymentModel.find()
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec();
    return docs.map((doc) => this.mapToDomain(doc));
  }

  async getMetrics(): Promise<any> {
    const docs = await PaymentModel.find().lean().exec();
    let totalRevenue = 0;
    let pendingCount = 0;
    let capturedCount = 0;
    let failedCount = 0;
    let refundedCount = 0;

    for (const doc of docs) {
      if (doc.status === PaymentRecordStatus.CAPTURED) {
        totalRevenue += doc.amount;
        capturedCount++;
      } else if (doc.status === PaymentRecordStatus.CREATED || doc.status === PaymentRecordStatus.AUTHORIZED) {
        pendingCount++;
      } else if (doc.status === PaymentRecordStatus.FAILED) {
        failedCount++;
      } else if (doc.status === PaymentRecordStatus.REFUNDED) {
        refundedCount++;
      }
    }

    const totalCount = docs.length;
    const averageOrderValue = capturedCount > 0 ? Math.round(totalRevenue / capturedCount) : 0;

    return {
      totalRevenue,
      pendingCount,
      capturedCount,
      failedCount,
      refundedCount,
      totalCount,
      averageOrderValue,
    };
  }

  private mapToDomain(doc: any): Payment {
    return {
      id: (doc._id as mongoose.Types.ObjectId).toString(),
      payableType: doc.payableType as PayableType,
      payableId: doc.payableId.toString(),
      gateway: doc.gateway as PaymentGateway,
      gatewayOrderId: doc.gatewayOrderId as string,
      gatewayPaymentId: doc.gatewayPaymentId as string | undefined,
      gatewaySignature: doc.gatewaySignature as string | undefined,
      amount: doc.amount as number,
      currency: doc.currency as string,
      method: doc.method as PaymentMethod | undefined,
      status: doc.status as PaymentRecordStatus,
      reconciliationDetails: doc.reconciliationDetails,
      refundDetails: doc.refundDetails,
      rawWebhookPayload: doc.rawWebhookPayload as Record<string, unknown> | undefined,
      attemptedAt: doc.attemptedAt as Date | undefined,
      capturedAt: doc.capturedAt as Date | undefined,
      createdAt: doc.createdAt as Date,
      updatedAt: doc.updatedAt as Date,
    };
  }
}
