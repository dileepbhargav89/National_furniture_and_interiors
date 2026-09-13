import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckoutUseCase } from '../../../src/modules/orders/application/orders.use-cases';
import { MockOrderRepository } from '../../../src/modules/orders/infrastructure/repositories/mock-order.repository';
import { ICartProvider, IPaymentProvider, IInventoryProvider } from '../../../src/modules/orders/application/ports';
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
      paymentProvider
    );
  });

  const mockAddress = {
    line1: '123 Test St',
    city: 'Test City',
    state: 'TS',
    pincode: '123456',
    country: 'IN'
  };

  it('should successfully create an order and payment intent', async () => {
    const mockCart = {
      items: [{
        productId: 'prod-1',
        sku: 'SKU-1',
        name: 'Test Product',
        unitPrice: 1000,
        quantity: 2
      }],
      subtotal: 2000,
      discount: 0,
      total: 2000
    };

    vi.mocked(cartProvider.getUserCart).mockResolvedValue(mockCart);
    vi.mocked(inventoryProvider.reserveStock).mockResolvedValue(true);
    vi.mocked(paymentProvider.createPaymentIntent).mockResolvedValue({
      gatewayOrderId: 'gw-123',
      status: 'created'
    });

    const result = await checkoutUseCase.execute({
      userId: 'user-1',
      shippingAddress: mockAddress,
      billingAddress: mockAddress,
      idempotencyKey: 'idemp-1'
    });

    expect(result.order).toBeDefined();
    expect(result.order.userId).toBe('user-1');
    expect(result.order.pricing.total).toBe(2000);
    expect(result.paymentIntent.gatewayOrderId).toBe('gw-123');
    
    expect(cartProvider.clearCart).toHaveBeenCalledWith('user-1');
    expect(inventoryProvider.reserveStock).toHaveBeenCalledTimes(1);
  });

  it('should throw ValidationError if cart is empty', async () => {
    vi.mocked(cartProvider.getUserCart).mockResolvedValue({ items: [] });

    await expect(checkoutUseCase.execute({
      userId: 'user-1',
      shippingAddress: mockAddress,
      billingAddress: mockAddress,
      idempotencyKey: 'idemp-1'
    })).rejects.toThrow(ValidationError);
  });

  it('should throw ConflictError if stock reservation fails', async () => {
    const mockCart = {
      items: [{
        productId: 'prod-1',
        sku: 'SKU-1',
        name: 'Test Product',
        unitPrice: 1000,
        quantity: 2
      }],
      subtotal: 2000,
      discount: 0,
      total: 2000
    };

    vi.mocked(cartProvider.getUserCart).mockResolvedValue(mockCart);
    vi.mocked(inventoryProvider.reserveStock).mockResolvedValue(false);

    await expect(checkoutUseCase.execute({
      userId: 'user-1',
      shippingAddress: mockAddress,
      billingAddress: mockAddress,
      idempotencyKey: 'idemp-1'
    })).rejects.toThrow(ConflictError);
    
    // Ensure order is not created
    const orders = await orderRepository.findUserOrders('user-1');
    expect(orders.length).toBe(0);
  });
});
