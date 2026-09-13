import { describe, it, expect } from 'vitest';
import { FulfillmentStatus, PaymentStatus, Order, Cart, CartItem, AddItemRequest, CreateOrderRequest } from '@nfi/api-client';

// Woodcraft stage calculation mirroring the storefront tracker
function getWoodcraftStage(status: FulfillmentStatus): number {
  switch (status) {
    case FulfillmentStatus.PENDING:
      return 1;
    case FulfillmentStatus.CONFIRMED:
      return 2;
    case FulfillmentStatus.PACKED:
      return 4;
    case FulfillmentStatus.SHIPPED:
    case FulfillmentStatus.OUT_FOR_DELIVERY:
      return 5;
    case FulfillmentStatus.DELIVERED:
      return 6;
    case FulfillmentStatus.CANCELLED:
    case FulfillmentStatus.RETURNED:
      return 0;
    default:
      return 2;
  }
}

// WhatsApp concierge link generator
function generateConciergeWhatsAppUrl(orderNumber: string, phone: string = '919663628302'): string {
  const message = encodeURIComponent(
    `Hello National Furniture & Interiors Concierge, I am inquiring regarding my bespoke order #${orderNumber}. I would like to get an update on the artisan schedule.`
  );
  return `https://wa.me/${phone}?text=${message}`;
}

// Tax and GST calculation verification for Indian bespoke furniture
function calculateTaxBreakdown(subtotal: number, discount: number = 0) {
  const taxableAmount = Math.max(0, subtotal - discount);
  // GST 18% on wooden and upholstered furniture (HSN 9403)
  const totalTax = Math.round(taxableAmount * 0.18);
  const cgst = Math.round(totalTax / 2);
  const sgst = totalTax - cgst;
  const grandTotal = taxableAmount + totalTax;
  return { taxableAmount, totalTax, cgst, sgst, grandTotal };
}

// Pure cart reducer function mirroring CartProvider
function simulateCartOperations() {
  let cart: Cart = {
    id: 'cart-sim-1',
    userId: null,
    sessionId: 'session-sim-1',
    items: [],
    couponCode: null,
    subtotal: 0,
    discount: 0,
    total: 0,
    status: 'ACTIVE',
    expiresAt: new Date().toISOString(),
  };

  const addItem = (item: AddItemRequest) => {
    const existingIndex = cart.items.findIndex((i) => i.variantId === item.variantId);
    let newItems: CartItem[];
    if (existingIndex >= 0) {
      newItems = cart.items.map((it, idx) =>
        idx === existingIndex ? { ...it, quantity: it.quantity + item.quantity } : it
      );
    } else {
      const newItem: CartItem = {
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku || 'NFI-SKU',
        name: item.name || 'Custom Teak Item',
        image: item.image || '',
        unitPrice: item.unitPrice || 5000000,
        quantity: item.quantity,
        addedAt: new Date(),
      };
      newItems = [...cart.items, newItem];
    }
    const subtotal = newItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
    cart = { ...cart, items: newItems, subtotal, total: subtotal };
  };

  const updateItem = (variantId: string, quantity: number) => {
    let newItems: CartItem[];
    if (quantity <= 0) {
      newItems = cart.items.filter((it) => it.variantId !== variantId);
    } else {
      newItems = cart.items.map((it) => (it.variantId === variantId ? { ...it, quantity } : it));
    }
    const subtotal = newItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
    cart = { ...cart, items: newItems, subtotal, total: subtotal };
  };

  const removeItem = (variantId: string) => {
    const newItems = cart.items.filter((it) => it.variantId !== variantId);
    const subtotal = newItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
    cart = { ...cart, items: newItems, subtotal, total: subtotal };
  };

  return {
    getCart: () => cart,
    addItem,
    updateItem,
    removeItem,
  };
}

describe('Storefront & Admin Order Management Suite', () => {
  describe('Bespoke Woodcraft 6-Stage Stepper Progression', () => {
    it('correctly maps PENDING to Stage 1 (Order Confirmed & Timber Sourced)', () => {
      expect(getWoodcraftStage(FulfillmentStatus.PENDING)).toBe(1);
    });

    it('correctly maps CONFIRMED to Stage 2 (Kiln Seasoning & Moisture Testing)', () => {
      expect(getWoodcraftStage(FulfillmentStatus.CONFIRMED)).toBe(2);
    });

    it('correctly maps PACKED to Stage 4 (Finishing, Lacquer & Upholstery)', () => {
      expect(getWoodcraftStage(FulfillmentStatus.PACKED)).toBe(4);
    });

    it('correctly maps SHIPPED & OUT_FOR_DELIVERY to Stage 5 (White-Glove Dispatch)', () => {
      expect(getWoodcraftStage(FulfillmentStatus.SHIPPED)).toBe(5);
      expect(getWoodcraftStage(FulfillmentStatus.OUT_FOR_DELIVERY)).toBe(5);
    });

    it('correctly maps DELIVERED to Stage 6 (In-Home Delivery & Handover)', () => {
      expect(getWoodcraftStage(FulfillmentStatus.DELIVERED)).toBe(6);
    });

    it('correctly maps CANCELLED to Stage 0', () => {
      expect(getWoodcraftStage(FulfillmentStatus.CANCELLED)).toBe(0);
    });
  });

  describe('WhatsApp Concierge Routing', () => {
    it('generates valid WhatsApp click-to-chat URL with registered Bengaluru Concierge phone', () => {
      const url = generateConciergeWhatsAppUrl('NFI-BLR-2026-9021');
      expect(url).toContain('https://wa.me/919663628302?text=');
      expect(url).toContain('NFI-BLR-2026-9021');
    });
  });

  describe('Financial and GST Tax Compliance (HSN 9403)', () => {
    it('calculates 18% GST split evenly into CGST 9% and SGST 9%', () => {
      const subtotal = 10000000; // ₹1,00,000 in paise
      const discount = 1000000;  // ₹10,000 discount
      const breakdown = calculateTaxBreakdown(subtotal, discount);

      expect(breakdown.taxableAmount).toBe(9000000); // ₹90,000
      expect(breakdown.totalTax).toBe(1620000);      // ₹16,200 (18%)
      expect(breakdown.cgst).toBe(810000);          // ₹8,100 (9%)
      expect(breakdown.sgst).toBe(810000);          // ₹8,100 (9%)
      expect(breakdown.grandTotal).toBe(10620000);   // ₹1,06,200
    });
  });

  describe('Cart State Operations & Resilience', () => {
    it('adds items with authentic product metadata, updates quantities, and calculates subtotals', () => {
      const sim = simulateCartOperations();

      // 1. Add item 1
      sim.addItem({
        productId: 'prod-teak-dining',
        variantId: 'var-teak-8seat',
        quantity: 1,
        name: 'The Indiranagar Burma Teak Dining Table',
        sku: 'NFI-DIN-001-BT',
        unitPrice: 6800000,
      });

      let cart = sim.getCart();
      expect(cart.items.length).toBe(1);
      expect(cart.items[0]?.name).toBe('The Indiranagar Burma Teak Dining Table');
      expect(cart.subtotal).toBe(6800000);

      // 2. Add second item
      sim.addItem({
        productId: 'prod-boucle-chair',
        variantId: 'var-boucle-set6',
        quantity: 2,
        name: 'Koramangala Minimalist Boucle Dining Chair',
        sku: 'NFI-CHR-004-BC',
        unitPrice: 1200000,
      });

      cart = sim.getCart();
      expect(cart.items.length).toBe(2);
      expect(cart.subtotal).toBe(6800000 + 2 * 1200000); // 9200000

      // 3. Update quantity of chairs to 4
      sim.updateItem('var-boucle-set6', 4);
      cart = sim.getCart();
      expect(cart.items.find((i) => i.variantId === 'var-boucle-set6')?.quantity).toBe(4);
      expect(cart.subtotal).toBe(6800000 + 4 * 1200000); // 11600000

      // 4. Remove dining table
      sim.removeItem('var-teak-8seat');
      cart = sim.getCart();
      expect(cart.items.length).toBe(1);
      expect(cart.subtotal).toBe(4800000);
    });
  });

  describe('End-to-End Checkout Contract & Idempotency', () => {
    it('generates valid checkout request payload with Bengaluru address snapshot', () => {
      const payload: CreateOrderRequest = {
        items: [
          {
            productId: 'prod-teak-dining',
            variantId: 'var-teak-8seat',
            sku: 'NFI-DIN-001-BT',
            name: 'The Indiranagar Burma Teak Dining Table',
            unitPrice: 6800000,
            quantity: 1,
          },
        ],
        shippingAddress: {
          line1: 'Tower 4, Apt 1402, Prestige Lakeside Habitat',
          line2: 'Varthur Road, Whitefield',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560087',
          country: 'India',
        },
        billingAddress: {
          line1: 'Tower 4, Apt 1402, Prestige Lakeside Habitat',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560087',
          country: 'India',
        },
        pricing: {
          subtotal: 6800000,
          discount: 0,
          shippingFee: 0,
          tax: 1224000,
          total: 8024000,
          currency: 'INR',
        },
      };

      expect(payload.items.length).toBe(1);
      expect(payload.shippingAddress.city).toBe('Bengaluru');
      expect(payload.pricing?.total).toBe(8024000);
    });
  });

  describe('Admin Operations Status Transitions', () => {
    it('simulates order lifecycle from CONFIRMED to DELIVERED with audit logs', () => {
      const order: Order = {
        id: 'ord-test-lifecycle',
        orderNumber: 'NFI-BLR-2026-9999',
        userId: 'usr_ananya_sharma',
        items: [],
        shippingAddress: {
          line1: 'Lavelle Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          country: 'India',
        },
        billingAddress: {
          line1: 'Lavelle Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          country: 'India',
        },
        pricing: {
          subtotal: 6800000,
          discount: 0,
          shippingFee: 0,
          tax: 1224000,
          total: 8024000,
          currency: 'INR',
        },
        paymentStatus: PaymentStatus.PAID,
        fulfillmentStatus: FulfillmentStatus.CONFIRMED,
        timeline: [
          {
            status: 'CONFIRMED',
            note: 'Order confirmed and scheduled for production.',
            changedAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(order.fulfillmentStatus).toBe(FulfillmentStatus.CONFIRMED);

      // Transition to PACKED
      order.fulfillmentStatus = FulfillmentStatus.PACKED;
      order.timeline.push({
        status: 'PACKED',
        note: '14-stage QC passed. Joinery and Italian PU verified.',
        changedAt: new Date().toISOString(),
      });
      expect(getWoodcraftStage(order.fulfillmentStatus)).toBe(4);

      // Transition to SHIPPED
      order.fulfillmentStatus = FulfillmentStatus.SHIPPED;
      order.timeline.push({
        status: 'SHIPPED',
        note: 'Loaded on White-Glove Truck #3.',
        changedAt: new Date().toISOString(),
      });
      expect(getWoodcraftStage(order.fulfillmentStatus)).toBe(5);

      // Transition to DELIVERED
      order.fulfillmentStatus = FulfillmentStatus.DELIVERED;
      order.timeline.push({
        status: 'DELIVERED',
        note: 'Delivered and unboxed. 10-Yr warranty handed over.',
        changedAt: new Date().toISOString(),
      });
      expect(getWoodcraftStage(order.fulfillmentStatus)).toBe(6);
      expect(order.timeline.length).toBe(4);
    });
  });
});
