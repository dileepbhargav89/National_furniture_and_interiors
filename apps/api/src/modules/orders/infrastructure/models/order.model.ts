import mongoose, { Schema, Document } from 'mongoose';
import { PaymentStatus, FulfillmentStatus } from '../../domain/orders.types';

export interface IOrderDocument extends Document {
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  items: {
    productId: mongoose.Types.ObjectId;
    variantId?: mongoose.Types.ObjectId;
    sku: string;
    name: string;
    image?: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
  shippingAddress: {
    label?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  billingAddress: {
    label?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  pricing: {
    subtotal: number;
    discount: number;
    shippingFee: number;
    tax: number;
    total: number;
    currency: string;
  };
  couponCode?: string;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  warehouseId?: mongoose.Types.ObjectId;
  timeline: {
    status: string;
    note?: string;
    changedBy?: mongoose.Types.ObjectId;
    changedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  version: number;
}

const AddressSchema = new Schema({
  label: { type: String },
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, required: true },
}, { _id: false });

const OrderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, required: true },
  variantId: { type: Schema.Types.ObjectId },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  lineTotal: { type: Number, required: true },
}, { _id: false });

const OrderSchema = new Schema<IOrderDocument>({
  orderNumber: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  items: { type: [OrderItemSchema], required: true },
  shippingAddress: { type: AddressSchema, required: true },
  billingAddress: { type: AddressSchema, required: true },
  pricing: {
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, required: true, default: 'INR' },
  },
  couponCode: { type: String },
  paymentStatus: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
  fulfillmentStatus: { type: String, enum: Object.values(FulfillmentStatus), default: FulfillmentStatus.PENDING },
  warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  timeline: [{
    status: { type: String, required: true },
    note: { type: String },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, required: true, default: Date.now },
  }],
  isDeleted: { type: Boolean, default: false },
}, {
  timestamps: true,
  optimisticConcurrency: true,
  versionKey: 'version'
});

export const OrderModel = mongoose.model<IOrderDocument>('Order', OrderSchema, 'orders');
