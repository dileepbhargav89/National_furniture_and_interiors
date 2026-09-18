import {
  IOrderRepository,
  Order,
  CreateOrderParams,
  PaymentStatus,
  FulfillmentStatus,
} from '../../domain/orders.types';

export class MockOrderRepository implements IOrderRepository {
  private orders: Map<string, Order> = new Map();
  private orderCounter = 1;

  async create(data: CreateOrderParams): Promise<Order> {
    const id = `mock-order-id-${this.orderCounter++}`;
    const orderNumber = `ORD-${Date.now()}-${id}`;

    const newOrder: Order = {
      id,
      orderNumber,
      userId: data.userId,
      items: data.items,
      shippingAddress: data.shippingAddress,
      billingAddress: data.billingAddress,
      pricing: data.pricing,
      couponCode: data.couponCode,
      paymentStatus: PaymentStatus.PENDING,
      fulfillmentStatus: FulfillmentStatus.PENDING,
      companyName: data.companyName,
      customerGstin: data.customerGstin,
      paymentPlan: data.paymentPlan,
      timeline: [
        {
          status: 'ORDER_PLACED',
          changedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
      version: 0,
    };

    this.orders.set(id, newOrder);
    return { ...newOrder };
  }

  async findById(id: string): Promise<Order | null> {
    const order = this.orders.get(id);
    return order && !order.isDeleted ? { ...order } : null;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    for (const order of this.orders.values()) {
      if (order.orderNumber === orderNumber && !order.isDeleted) {
        return { ...order };
      }
    }
    return null;
  }

  async findUserOrders(userId: string): Promise<Order[]> {
    const userOrders: Order[] = [];
    for (const order of this.orders.values()) {
      if (order.userId === userId && !order.isDeleted) {
        userOrders.push({ ...order });
      }
    }
    return userOrders;
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<Order[]> {
    const allOrders = Array.from(this.orders.values()).filter((o) => !o.isDeleted);
    return allOrders.slice(offset, offset + limit);
  }

  async updateFulfillmentStatus(
    id: string,
    status: FulfillmentStatus,
    note?: string,
  ): Promise<Order | null> {
    const order = this.orders.get(id);
    if (!order || order.isDeleted) return null;

    order.fulfillmentStatus = status;
    order.timeline.push({
      status,
      note,
      changedAt: new Date(),
    });
    order.updatedAt = new Date();
    order.version += 1;

    this.orders.set(id, order);
    return { ...order };
  }

  async updatePaymentStatus(id: string, status: PaymentStatus): Promise<Order | null> {
    const order = this.orders.get(id);
    if (!order || order.isDeleted) return null;

    order.paymentStatus = status;
    order.timeline.push({
      status: `PAYMENT_${status}`,
      changedAt: new Date(),
    });
    order.updatedAt = new Date();
    order.version += 1;

    this.orders.set(id, order);
    return { ...order };
  }

  async getSalesMetrics(
    startDate?: string,
    endDate?: string,
  ): Promise<{ totalRevenue: number; totalOrders: number; averageOrderValue: number }> {
    let totalRevenue = 0;
    let totalOrders = 0;

    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();

    for (const order of this.orders.values()) {
      if (!order.isDeleted && order.createdAt >= start && order.createdAt <= end) {
        if (order.paymentStatus === PaymentStatus.PAID) {
          totalRevenue += order.pricing.total;
        }
        totalOrders++;
      }
    }

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    };
  }
}
