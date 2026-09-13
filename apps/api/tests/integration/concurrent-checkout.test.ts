import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { InventoryModel, ProductModel } from '../../src/modules/catalog/infrastructure/catalog.schemas';
import { buildAppContext } from '../../src/core/di';

import { MongoMemoryServer } from 'mongodb-memory-server';

describe.skip('Concurrent Checkout Integration Test (Phase 5/6 Hardening Gate)', () => {
  let context: ReturnType<typeof buildAppContext>;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }
    context = buildAppContext();

    // Clear collections
    await Promise.all([
      InventoryModel.deleteMany({}),
      ProductModel.deleteMany({}),
      mongoose.model('Cart').deleteMany({}),
      context.mongoose.connection.collection('orders').deleteMany({})
    ]);
  }, 60000); // 60 seconds timeout

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('prevents stock overselling under concurrent checkout load', async () => {
    // 1. Setup Product and Inventory (3 available)
    const product = await ProductModel.create({
      sku: 'TEST-SKU-1',
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test',
      basePrice: 1000,
      currency: 'INR',
      isAvailable: true
    });

    const inventory = await InventoryModel.create({
      productId: product._id,
      sku: 'TEST-SKU-1',
      quantityOnHand: 3,
      quantityReserved: 0,
      quantityAvailable: 3,
      reorderThreshold: 1
    });

    // 2. Setup Carts for 5 users attempting to buy 1 item each
    const userIds = ['user1', 'user2', 'user3', 'user4', 'user5'];
    const CartModel = mongoose.model('Cart');
    for (const userId of userIds) {
      await CartModel.create({
        userId,
        items: [{
          productId: product._id.toString(),
          sku: 'TEST-SKU-1',
          name: 'Test Product',
          unitPrice: 1000,
          quantity: 1
        }],
        subtotal: 1000,
        discount: 0,
        total: 1000,
        status: 'ACTIVE'
      });
    }

    const mockAddress = {
      line1: '123 Test St',
      city: 'Test City',
      state: 'TS',
      pincode: '123456',
      country: 'IN'
    };

    // 3. Execute checkouts concurrently
    const promises = userIds.map((userId, index) => 
      context.orders.checkout.execute({
        userId,
        shippingAddress: mockAddress,
        billingAddress: mockAddress,
        idempotencyKey: `idemp-${index}`
      }).catch((e: Error) => e) // Catch errors to allow Promise.all to finish
    );

    const results = await Promise.all(promises);

    // 4. Verify exactly 3 succeeded and 2 failed
    const successes = results.filter(r => !(r instanceof Error));
    const failures = results.filter(r => r instanceof Error);

    expect(successes.length).toBe(3);
    expect(failures.length).toBe(2);

    // 5. Verify errors are ConflictError (Insufficient stock)
    failures.forEach(f => {
      expect(f.message).toContain('Insufficient stock');
    });

    // 6. Verify inventory is exactly 0 available and 3 reserved
    const finalInventory = await InventoryModel.findById(inventory._id);
    expect(finalInventory?.quantityAvailable).toBe(0);
    expect(finalInventory?.quantityReserved).toBe(3);
    expect(finalInventory?.quantityOnHand).toBe(3);
  });
});
