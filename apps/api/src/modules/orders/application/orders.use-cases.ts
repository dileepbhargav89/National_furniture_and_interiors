import { ValidationError, NotFoundError, ConflictError } from '../../../core/exceptions';
import { IOrderRepository, Order, PaymentStatus, FulfillmentStatus, OrderItem, OrderPricing } from '../domain/orders.types';
import { CheckoutInput, ICartProvider, IPaymentProvider, IInventoryProvider } from './ports';

export class CheckoutUseCase {
  constructor(
    private readonly orders: IOrderRepository,
    private readonly cart: ICartProvider,
    private readonly inventory: IInventoryProvider,
    private readonly payments: IPaymentProvider
  ) {}

  async execute(input: CheckoutInput): Promise<{ order: Order; paymentIntent: any }> {
    // 1. Fetch user cart
    const cart = await this.cart.getUserCart(input.userId);
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new ValidationError('Cart is empty');
    }

    // 2. Validate and map items
    const items: OrderItem[] = cart.items.map((i: any) => ({
      productId: i.productId,
      variantId: i.variantId,
      sku: i.sku,
      name: i.name,
      image: i.image,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.unitPrice * i.quantity
    }));

    // 3. Reserve Stock
    const reserved = await this.inventory.reserveStock(input.idempotencyKey, items.map(i => ({
      productId: i.productId,
      variantId: i.variantId,
      quantity: i.quantity
    })));
    if (!reserved) {
      throw new ConflictError('Insufficient stock for one or more items in the cart');
    }

    // 4. Create Order
    const pricing: OrderPricing = {
      subtotal: cart.subtotal,
      discount: cart.discount,
      shippingFee: 0, // Placeholder
      tax: 0, // Placeholder
      total: cart.total,
      currency: 'INR'
    };

    const order = await this.orders.create({
      userId: input.userId,
      items,
      shippingAddress: input.shippingAddress,
      billingAddress: input.billingAddress,
      pricing,
      couponCode: input.couponCode
    });

    // 5. Create Payment Intent
    const paymentIntent = await this.payments.createPaymentIntent(order.id, order.pricing.total, order.pricing.currency);

    // 6. Clear cart (after successful order creation)
    await this.cart.clearCart(input.userId);

    return { order, paymentIntent };
  }
}

export class GetOrdersUseCase {
  constructor(private readonly orders: IOrderRepository) {}

  async execute(userId: string): Promise<Order[]> {
    return this.orders.findUserOrders(userId);
  }

  async executeAdmin(skip?: number, limit?: number): Promise<Order[]> {
    return this.orders.findAll(skip, limit);
  }
}

export class GetOrderByIdUseCase {
  constructor(private readonly orders: IOrderRepository) {}

  async execute(id: string): Promise<Order> {
    const order = await this.orders.findById(id);
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    return order;
  }
}

export class UpdateOrderStatusUseCase {
  constructor(private readonly orders: IOrderRepository) {}

  async executeFulfillment(id: string, status: FulfillmentStatus, note?: string): Promise<Order> {
    const order = await this.orders.updateFulfillmentStatus(id, status, note);
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    return order;
  }
}

export class GetSalesMetricsUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(startDate?: string, endDate?: string) {
    return this.orderRepo.getSalesMetrics(startDate, endDate);
  }
}
