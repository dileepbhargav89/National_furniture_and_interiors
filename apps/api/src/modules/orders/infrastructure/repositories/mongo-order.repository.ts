import mongoose from 'mongoose';
import { IOrderRepository, Order, PaymentStatus, FulfillmentStatus } from '../../domain/orders.types';
import { OrderModel } from '../models/order.model';

export class MongoOrderRepository implements IOrderRepository {
  async create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Order> {
    const doc = new OrderModel({
      ...order,
      version: 1,
    });
    await doc.save();
    return this.mapToDomain(doc);
  }

  async findById(id: string): Promise<Order | null> {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const filter = isObjectId ? { $or: [{ _id: id }, { orderNumber: id }] } : { orderNumber: id };
    const doc = await OrderModel.findOne(filter).lean().exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const doc = await OrderModel.findOne({ orderNumber }).lean().exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findUserOrders(userId: string): Promise<Order[]> {
    const docs = await OrderModel.find({ userId }).sort({ createdAt: -1 }).lean().exec();
    return docs.map(doc => this.mapToDomain(doc));
  }

  async findAll(skip: number = 0, limit: number = 50): Promise<Order[]> {
    const docs = await OrderModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec();
    return docs.map(doc => this.mapToDomain(doc));
  }

  async updatePaymentStatus(id: string, status: PaymentStatus): Promise<Order | null> {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const filter = isObjectId ? { $or: [{ _id: id }, { orderNumber: id }] } : { orderNumber: id };
    const doc = await OrderModel.findOneAndUpdate(
      filter,
      { $set: { paymentStatus: status } },
      { new: true }
    ).lean().exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async updateFulfillmentStatus(id: string, status: FulfillmentStatus, note?: string): Promise<Order | null> {
    const updateQuery: any = { $set: { fulfillmentStatus: status } };
    if (note) {
      updateQuery.$push = { 'fulfillment.notes': note };
    }
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const filter = isObjectId ? { $or: [{ _id: id }, { orderNumber: id }] } : { orderNumber: id };
    const doc = await OrderModel.findOneAndUpdate(
      filter,
      updateQuery,
      { new: true }
    ).lean().exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async getSalesMetrics(startDate?: string, endDate?: string): Promise<{
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  }> {
    const filter: any = { isDeleted: false, paymentStatus: PaymentStatus.PAID };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const aggregation = await OrderModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.total' },
          totalOrders: { $sum: 1 },
        }
      }
    ]);

    if (aggregation.length === 0) {
      return { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 };
    }

    const totalRevenue = aggregation[0].totalRevenue;
    const totalOrders = aggregation[0].totalOrders;
    
    return {
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    };
  }

  private mapToDomain(doc: any): Order {
    const order: any = { ...doc };
    if (order._id) {
      order.id = order._id.toString();
      delete order._id;
    }
    delete order.__v;
    return order as Order;
  }
}
