// invoice.model.ts — Mongoose schema for the Invoice entity.
import mongoose, { Schema, Document } from 'mongoose';
import { InvoiceStatus } from '../../domain/invoices.types';

export interface IInvoiceDocument extends Document {
  invoiceNumber: string;
  paymentId: string;
  orderId?: string;
  amount: number;
  currency: string;
  fileUrl: string;
  status: InvoiceStatus;
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoiceDocument>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    paymentId: { type: String, required: true, index: true },
    orderId: { type: String, required: false },
    amount: { type: Number, required: true }, // paise
    currency: { type: String, required: true },
    fileUrl: { type: String, required: false },
    status: { 
      type: String, 
      required: true, 
      enum: Object.values(InvoiceStatus),
      default: InvoiceStatus.GENERATING 
    },
    issuedAt: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

export const InvoiceModel = mongoose.model<IInvoiceDocument>('Invoice', invoiceSchema);
