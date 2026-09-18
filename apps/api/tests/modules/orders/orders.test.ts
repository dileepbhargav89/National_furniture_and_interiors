import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckoutUseCase } from '../../../src/modules/orders/application/orders.use-cases';
import { MockOrderRepository } from '../../../src/modules/orders/infrastructure/repositories/mock-order.repository';
import {
  ICartProvider,
  IPaymentProvider,
  IInventoryProvider,
} from '../../../src/modules/orders/application/ports';
import { ValidationError, ConflictError } from '../../../src/core/exceptions';

describe('Orders Module - CheckoutUseCase', () => {
  let checkoutUseCase: CheckoutUseCase;
  let orderRepository: MockOrderRepository;
  let cartProvider: ICartProvider;
  let inventoryProvider: IInventoryProvider;
  let paymentProvider: IPaymentProvider;

  beforeEach(() => {
    orderRepository = new MockOrderRepository();

    cartProvider = {
      getUserCart: vi.fn(),
      clearCart: vi.fn(),
    };

    inventoryProvider = {
      reserveStock: vi.fn(),
    };

    paymentProvider = {
      createPaymentIntent: vi.fn(),
    };

    checkoutUseCase = new CheckoutUseCase(
      orderRepository,
      cartProvider,
      inventoryProvider,
      paymentProvider,
    );
  });

  const mockAddress = {
    line1: '123 Test St',
    city: 'Test City',
    state: 'TS',
    pincode: '123456',
    country: 'IN',
  };

  it('should successfully create an order and payment intent', async () => {
    const mockCart = {
      items: [
        {
          productId: 'prod-1',
          sku: 'SKU-1',
          name: 'Test Product',
          unitPrice: 1000,
          quantity: 2,
        },
      ],
      subtotal: 2000,
      discount: 0,
      total: 2000,
    };

    vi.mocked(cartProvider.getUserCart).mockResolvedValue(mockCart);
    vi.mocked(inventoryProvider.reserveStock).mockResolvedValue(true);
    vi.mocked(paymentProvider.createPaymentIntent).mockResolvedValue({
      gatewayOrderId: 'gw-123',
      status: 'created',
    });

    const result = await checkoutUseCase.execute({
      userId: 'user-1',
      shippingAddress: mockAddress,
      billingAddress: mockAddress,
      idempotencyKey: 'idemp-1',
    });

    expect(result.order).toBeDefined();
    expect(result.order.userId).toBe('user-1');
    expect(result.order.pricing.subtotal).toBe(2000);
    expect(result.order.pricing.tax).toBe(360);
    expect(result.order.pricing.total).toBe(2360);
    expect(result.order.pricing.taxBreakdown?.igst).toBe(360);
    expect(result.order.pricing.taxBreakdown?.isInterState).toBe(true);
    expect(result.paymentIntent.gatewayOrderId).toBe('gw-123');

    expect(cartProvider.clearCart).toHaveBeenCalledWith('user-1');
    expect(inventoryProvider.reserveStock).toHaveBeenCalledTimes(1);
    expect(paymentProvider.createPaymentIntent).toHaveBeenCalledWith(result.order.id, 2360, 'INR');
  });

  it('should calculate 50% milestone payment intent for MILESTONE_50_50 plan with intra-state CGST+SGST', async () => {
    const mockCart = {
      items: [
        {
          productId: 'prod-high-ticket',
          sku: 'SKU-HT',
          name: 'Indiranagar Teak Dining',
          unitPrice: 10000000, // ₹1,00,000
          quantity: 1,
        },
      ],
      subtotal: 10000000,
      discount: 0,
      total: 10000000,
    };

    vi.mocked(cartProvider.getUserCart).mockResolvedValue(mockCart);
    vi.mocked(inventoryProvider.reserveStock).mockResolvedValue(true);
    vi.mocked(paymentProvider.createPaymentIntent).mockResolvedValue({
      gatewayOrderId: 'gw-milestone-123',
      status: 'created',
    });

    const result = await checkoutUseCase.execute({
      userId: 'user-b2b',
      shippingAddress: { ...mockAddress, state: 'Karnataka' },
      billingAddress: { ...mockAddress, state: 'Karnataka' },
      idempotencyKey: 'idemp-milestone-1',
      paymentPlan: 'MILESTONE_50_50',
      companyName: 'Prestige Living Pvt Ltd',
      customerGstin: '29ABCDE1234F1Z5',
    });

    // Subtotal 1,00,000 + 18% GST (18,000) = 1,18,000 Total
    // 50% Milestone Advance = 59,000
    expect(result.order.pricing.total).toBe(11800000);
    expect(result.order.pricing.taxBreakdown?.cgst).toBe(900000);
    expect(result.order.pricing.taxBreakdown?.sgst).toBe(900000);
    expect(result.order.pricing.taxBreakdown?.isInterState).toBe(false);
    expect(result.order.paymentPlan).toBe('MILESTONE_50_50');
    expect(result.order.companyName).toBe('Prestige Living Pvt Ltd');
    expect(paymentProvider.createPaymentIntent).toHaveBeenCalledWith(
      result.order.id,
      5900000,
      'INR',
    );
  });

  it('should throw ValidationError if cart is empty', async () => {
    vi.mocked(cartProvider.getUserCart).mockResolvedValue({ items: [] });

    await expect(
      checkoutUseCase.execute({
        userId: 'user-1',
        shippingAddress: mockAddress,
        billingAddress: mockAddress,
        idempotencyKey: 'idemp-1',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ConflictError if stock reservation fails', async () => {
    const mockCart = {
      items: [
        {
          productId: 'prod-1',
          sku: 'SKU-1',
          name: 'Test Product',
          unitPrice: 1000,
          quantity: 2,
        },
      ],
      subtotal: 2000,
      discount: 0,
      total: 2000,
    };

    vi.mocked(cartProvider.getUserCart).mockResolvedValue(mockCart);
    vi.mocked(inventoryProvider.reserveStock).mockResolvedValue(false);

    await expect(
      checkoutUseCase.execute({
        userId: 'user-1',
        shippingAddress: mockAddress,
        billingAddress: mockAddress,
        idempotencyKey: 'idemp-1',
      }),
    ).rejects.toThrow(ConflictError);

    // Ensure order is not created
    const orders = await orderRepository.findUserOrders('user-1');
    expect(orders.length).toBe(0);
  });
});
