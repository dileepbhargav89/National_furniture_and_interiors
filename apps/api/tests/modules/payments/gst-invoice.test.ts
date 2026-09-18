import { describe, it, expect, vi } from 'vitest';
import { PdfGeneratorAdapter } from '../../../src/modules/payments/infrastructure/adapters/pdf-generator.adapter';
import { GenerateInvoiceUseCase } from '../../../src/modules/payments/application/generate-invoice.use-case';
import { IPaymentRepository } from '../../../src/modules/payments/domain/payments.types';
import {
  IInvoiceRepository,
  Invoice,
  InvoiceStatus,
} from '../../../src/modules/payments/domain/invoices.types';
import {
  IOrderRepository,
  Order,
  PaymentStatus,
  FulfillmentStatus,
} from '../../../src/modules/orders/domain/orders.types';

describe('GST Tax Invoice & PDF Generator Suite', () => {
  const pdfGenerator = new PdfGeneratorAdapter();

  it('should generate a valid PDF buffer with %PDF magic bytes for intra-state Karnataka order', async () => {
    const buffer = await pdfGenerator.generateBuffer({
      invoiceNumber: 'NFI/2026-27/INV-009021',
      orderNumber: 'NFI-BLR-2026-9021',
      date: new Date(),
      amount: 14537600, // ₹1,45,376
      currency: 'INR',
      subtotal: 12320000,
      discount: 0,
      cgst: 1108800, // 9%
      sgst: 1108800, // 9%
      isInterState: false,
      billedTo: {
        name: 'Rohit & Priya Nambiar',
        companyName: 'Nambiar Design Studio',
        gstin: '29AABCN1234F1Z5',
        line1: 'Tower 4, Apt 1402, Prestige Lakeside Habitat',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560087',
      },
      items: [
        {
          name: 'The Indiranagar Burma Teak Dining Table (8-Seater)',
          sku: 'NFI-DIN-001-BT',
          hsnCode: '9403',
          quantity: 1,
          unitPrice: 6800000,
          lineTotal: 6800000,
        },
        {
          name: 'Koramangala Minimalist Bouclé Dining Chairs (Set of 6)',
          sku: 'NFI-CHR-004-BC',
          hsnCode: '9403',
          quantity: 6,
          unitPrice: 1200000,
          lineTotal: 7200000,
        },
      ],
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    // Standard PDF header magic bytes "%PDF-"
    const header = buffer.subarray(0, 5).toString('ascii');
    expect(header).toBe('%PDF-');
  });

  it('should generate a valid PDF buffer for inter-state order (IGST 18%)', async () => {
    const buffer = await pdfGenerator.generateBuffer({
      invoiceNumber: 'NFI/2026-27/INV-008840',
      orderNumber: 'NFI-MUM-2026-8840',
      date: new Date(),
      amount: 9439882, // ₹94,398.82
      currency: 'INR',
      subtotal: 7999900,
      discount: 0,
      igst: 1439982, // 18% IGST
      isInterState: true,
      placeOfSupply: 'Maharashtra (Code 27)',
      billedTo: {
        name: 'Aditya Birla Interiors',
        gstin: '27AABCA5678K1Z2',
        line1: 'Bandra-Kurla Complex',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400051',
      },
      items: [
        {
          name: 'Vetra 3-Seater Italian Leather Sofa in Olive',
          sku: 'NFI-SOF-002-OL',
          hsnCode: '9403',
          quantity: 1,
          unitPrice: 7999900,
          lineTotal: 7999900,
        },
      ],
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('should generate PDF and create MongoDB invoice record in GenerateInvoiceUseCase', async () => {
    const mockOrder: Order = {
      id: 'ord-test-101',
      orderNumber: 'NFI-BLR-2026-101',
      userId: 'usr_patron_1',
      companyName: 'Boutique Architects LLP',
      customerGstin: '29ABCDE1234F1Z9',
      items: [
        {
          productId: 'prod-teak',
          sku: 'NFI-TEAK-01',
          name: 'Burma Teak Credenza',
          hsnCode: '9403',
          unitPrice: 5000000,
          quantity: 1,
          lineTotal: 5000000,
        },
      ],
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
        subtotal: 5000000,
        discount: 0,
        shippingFee: 0,
        tax: 900000,
        total: 5900000,
        currency: 'INR',
        taxBreakdown: {
          cgst: 450000,
          sgst: 450000,
          igst: 0,
          rate: 18,
          isInterState: false,
        },
      },
      paymentStatus: PaymentStatus.PAID,
      fulfillmentStatus: FulfillmentStatus.CONFIRMED,
      timeline: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
      version: 1,
    };

    const mockPaymentsRepo: IPaymentRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByGatewayOrderId: vi.fn(),
      markCaptured: vi.fn(),
      updateReconciliation: vi.fn(),
      recordRefund: vi.fn(),
      findAll: vi.fn(),
    };

    let savedInvoice: Invoice | null = null;
    const mockInvoicesRepo: IInvoiceRepository = {
      create: vi.fn().mockImplementation(async (params) => {
        savedInvoice = { id: 'inv_generated_1', ...params } as Invoice;
        return savedInvoice;
      }),
      findById: vi.fn(),
      findByPaymentId: vi.fn().mockResolvedValue(null),
      findByOrderId: vi.fn().mockImplementation(async () => savedInvoice),
      updateStatus: vi.fn(),
      findAll: vi.fn(),
    };

    const mockOrdersRepo: IOrderRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(mockOrder),
      findByOrderNumber: vi.fn(),
      findAll: vi.fn(),
      findUserOrders: vi.fn(),
      updateFulfillmentStatus: vi.fn(),
      updatePaymentStatus: vi.fn(),
      getSalesMetrics: vi.fn(),
    };

    const useCase = new GenerateInvoiceUseCase(
      mockPaymentsRepo,
      mockInvoicesRepo,
      pdfGenerator,
      undefined,
      mockOrdersRepo,
    );

    const result = await useCase.generatePdfForOrder('ord-test-101');

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(1000);
    expect(result.invoiceNumber).toContain('NFI-INV-');
    expect(result.invoice.status).toBe(InvoiceStatus.AVAILABLE);
    expect(mockInvoicesRepo.create).toHaveBeenCalledTimes(1);
  });
});
