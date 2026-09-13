// mongo-invoice.repository.ts — Mongoose implementation of IInvoiceRepository
import { InvoiceModel, IInvoiceDocument } from '../models/invoice.model';
import {
  Invoice,
  IInvoiceRepository,
  CreateInvoiceParams,
  UpdateInvoiceStatusParams,
  InvoiceStatus,
} from '../../domain/invoices.types';
import { Types } from 'mongoose';

export class MongoInvoiceRepository implements IInvoiceRepository {
  private toDomain(doc: IInvoiceDocument): Invoice {
    return {
      id: (doc._id as Types.ObjectId).toString(),
      invoiceNumber: doc.invoiceNumber,
      paymentId: doc.paymentId,
      orderId: doc.orderId,
      amount: doc.amount,
      currency: doc.currency,
      fileUrl: doc.fileUrl,
      status: doc.status as InvoiceStatus,
      issuedAt: doc.issuedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async create(params: CreateInvoiceParams): Promise<Invoice> {
    const doc = new InvoiceModel({
      invoiceNumber: params.invoiceNumber,
      paymentId: params.paymentId,
      orderId: params.orderId,
      amount: params.amount,
      currency: params.currency,
      fileUrl: params.fileUrl || '',
      status: params.status,
      issuedAt: params.issuedAt,
    });
    await doc.save();
    return this.toDomain(doc);
  }

  async findById(id: string): Promise<Invoice | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await InvoiceModel.findById(id).lean<IInvoiceDocument>();
    return doc ? this.toDomain(doc) : null;
  }

  async findByPaymentId(paymentId: string): Promise<Invoice | null> {
    const doc = await InvoiceModel.findOne({ paymentId }).lean<IInvoiceDocument>();
    return doc ? this.toDomain(doc) : null;
  }

  async findByOrderId(orderId: string): Promise<Invoice | null> {
    const doc = await InvoiceModel.findOne({ orderId }).lean<IInvoiceDocument>();
    return doc ? this.toDomain(doc) : null;
  }

  async updateStatus(id: string, params: UpdateInvoiceStatusParams): Promise<Invoice | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const updatePayload: any = { status: params.status };
    if (params.fileUrl !== undefined) {
      updatePayload.fileUrl = params.fileUrl;
    }
    const doc = await InvoiceModel.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true }
    ).lean<IInvoiceDocument>();
    
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(limit: number, offset: number): Promise<Invoice[]> {
    const docs = await InvoiceModel.find()
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean<IInvoiceDocument[]>();
    return docs.map((doc) => this.toDomain(doc));
  }
}
