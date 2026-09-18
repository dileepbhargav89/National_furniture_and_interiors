// generate-invoice.use-case.ts — Enterprise GST Tax Invoice generator and PDF streamer.
import { IPaymentRepository, PayableType } from '../domain/payments.types';
import { IInvoiceRepository, Invoice, InvoiceStatus } from '../domain/invoices.types';
import { IFileUploaderPort } from './ports';
import {
  PdfGeneratorAdapter,
  GeneratePdfParams,
  InvoiceItemDetails,
} from '../infrastructure/adapters/pdf-generator.adapter';
import { IOrderRepository } from '../../orders/domain/orders.types';
import { randomBytes } from 'crypto';
import { NotFoundError } from '../../../core/exceptions';

export interface GeneratedPdfResult {
  buffer: Buffer;
  filename: string;
  invoiceNumber: string;
  invoice: Invoice;
}

export class GenerateInvoiceUseCase {
  constructor(
    private readonly payments: IPaymentRepository,
    private readonly invoices: IInvoiceRepository,
    private readonly pdfGenerator: PdfGeneratorAdapter,
    private readonly fileUploader?: IFileUploaderPort,
    private readonly orders?: IOrderRepository,
  ) {}

  /**
   * Generates and returns a downloadable GST Tax Invoice PDF buffer for a given Order ID.
   * Also ensures the Invoice document is created/updated in MongoDB.
   */
  async generatePdfForOrder(orderId: string): Promise<GeneratedPdfResult> {
    const order = this.orders ? await this.orders.findById(orderId) : null;
    const existingInvoice = await this.invoices.findByOrderId(orderId);

    const invoiceNumber =
      existingInvoice?.invoiceNumber ||
      `NFI-INV-${new Date().getFullYear()}-${order?.orderNumber ? order.orderNumber.replace(/[^A-Za-z0-9]/g, '').slice(-4) : randomBytes(3).toString('hex').toUpperCase()}`;

    const totalPaise = order ? order.pricing.total : existingInvoice?.amount || 0;
    const currency = order ? order.pricing.currency : existingInvoice?.currency || 'INR';

    const mappedItems: InvoiceItemDetails[] = order?.items?.map((it) => ({
      name: it.name,
      sku: it.sku,
      hsnCode: it.hsnCode || '9403',
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      lineTotal: it.lineTotal,
    })) || [
      {
        name: 'Handcrafted Bespoke Furniture Suite',
        sku: 'NFI-BESPOKE-01',
        hsnCode: '9403',
        quantity: 1,
        unitPrice: order?.pricing.subtotal || totalPaise,
        lineTotal: order?.pricing.subtotal || totalPaise,
      },
    ];

    const isInterState =
      order?.pricing.taxBreakdown?.isInterState ??
      (order?.shippingAddress.state || '').trim().toLowerCase() !== 'karnataka';

    const pdfParams: GeneratePdfParams = {
      invoiceNumber,
      orderNumber: order?.orderNumber || orderId,
      orderId: order?.id || orderId,
      amount: totalPaise,
      currency,
      date: order?.createdAt || new Date(),
      subtotal: order?.pricing.subtotal,
      discount: order?.pricing.discount,
      shippingFee: order?.pricing.shippingFee,
      cgst: order?.pricing.taxBreakdown?.cgst,
      sgst: order?.pricing.taxBreakdown?.sgst,
      igst: order?.pricing.taxBreakdown?.igst,
      isInterState,
      paymentMode:
        order?.paymentStatus === 'PAID' ? 'Online Gateway (Razorpay)' : 'NEFT / RTGS Bank Transfer',
      paymentStatus:
        order?.paymentStatus === 'PAID' ? 'PAID & VERIFIED' : 'PAYMENT PENDING / MILESTONE',
      placeOfSupply: isInterState
        ? `${order?.shippingAddress.state || 'Inter-State'} (IGST 18%)`
        : 'Karnataka (Code 29 · CGST 9% + SGST 9%)',
      customerDetails: {
        name: order?.companyName || order?.shippingAddress.label || 'Valued Patron',
        companyName: order?.companyName,
        gstin: order?.customerGstin,
      },
      billedTo: order
        ? {
            name: order.companyName || order.billingAddress.label || 'Valued Patron',
            companyName: order.companyName,
            gstin: order.customerGstin,
            line1: order.billingAddress.line1,
            line2: order.billingAddress.line2,
            city: order.billingAddress.city,
            state: order.billingAddress.state,
            pincode: order.billingAddress.pincode,
          }
        : undefined,
      shippedTo: order
        ? {
            name: order.shippingAddress.label || order.companyName || 'Valued Patron',
            line1: order.shippingAddress.line1,
            line2: order.shippingAddress.line2,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            pincode: order.shippingAddress.pincode,
          }
        : undefined,
      items: mappedItems,
    };

    const buffer = await this.pdfGenerator.generateBuffer(pdfParams);
    const filename = `${invoiceNumber}.pdf`;

    // Persist or update invoice in DB
    let invoice = existingInvoice;
    const downloadEndpoint = `/api/v1/orders/${orderId}/invoice/pdf`;

    if (!invoice) {
      invoice = await this.invoices.create({
        invoiceNumber,
        paymentId: `pay_${orderId.slice(-6)}`,
        orderId,
        amount: totalPaise,
        currency,
        status: InvoiceStatus.AVAILABLE,
        fileUrl: downloadEndpoint,
        issuedAt: new Date(),
      });
    } else {
      await this.invoices.updateStatus(invoice.id, {
        status: InvoiceStatus.AVAILABLE,
        fileUrl: downloadEndpoint,
      });
    }

    return {
      buffer,
      filename,
      invoiceNumber,
      invoice,
    };
  }

  /**
   * Generates and returns a downloadable GST Tax Invoice PDF buffer for a given Payment ID.
   */
  async generatePdfForPayment(paymentId: string): Promise<GeneratedPdfResult> {
    const payment = await this.payments.findById(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment ${paymentId} not found`);
    }

    if (payment.payableType === PayableType.ORDER && payment.payableId) {
      return this.generatePdfForOrder(payment.payableId);
    }

    // Fallback for non-order payables (e.g. Design Projects)
    const existingInvoice = await this.invoices.findByPaymentId(paymentId);
    const invoiceNumber =
      existingInvoice?.invoiceNumber ||
      `NFI-INV-${new Date().getFullYear()}-${randomBytes(3).toString('hex').toUpperCase()}`;

    const pdfParams: GeneratePdfParams = {
      invoiceNumber,
      orderId: payment.payableId,
      amount: payment.amount,
      currency: payment.currency,
      date: payment.capturedAt || payment.createdAt || new Date(),
      paymentMode: payment.gateway,
      paymentStatus: payment.status,
    };

    const buffer = await this.pdfGenerator.generateBuffer(pdfParams);
    const filename = `${invoiceNumber}.pdf`;

    let invoice = existingInvoice;
    const downloadEndpoint = `/api/v1/payments/${paymentId}/invoice/pdf`;

    if (!invoice) {
      invoice = await this.invoices.create({
        invoiceNumber,
        paymentId,
        orderId: payment.payableId,
        amount: payment.amount,
        currency: payment.currency,
        status: InvoiceStatus.AVAILABLE,
        fileUrl: downloadEndpoint,
        issuedAt: new Date(),
      });
    } else {
      await this.invoices.updateStatus(invoice.id, {
        status: InvoiceStatus.AVAILABLE,
        fileUrl: downloadEndpoint,
      });
    }

    return {
      buffer,
      filename,
      invoiceNumber,
      invoice,
    };
  }

  /**
   * Legacy execution method called by tests or workers.
   */
  async execute(paymentId: string): Promise<void> {
    const payment = await this.payments.findById(paymentId);
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }
    if (payment.status !== 'CAPTURED') {
      throw new Error(`Payment ${paymentId} is not captured`);
    }

    const existingInvoice = await this.invoices.findByPaymentId(paymentId);
    if (existingInvoice && existingInvoice.status === InvoiceStatus.AVAILABLE) {
      return;
    }

    const invoiceNumber =
      existingInvoice?.invoiceNumber ||
      `INV-${new Date().getFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;

    let invoice = existingInvoice;
    if (!invoice) {
      invoice = await this.invoices.create({
        invoiceNumber,
        paymentId,
        orderId: payment.payableId,
        amount: payment.amount,
        currency: payment.currency,
        status: InvoiceStatus.GENERATING,
        issuedAt: new Date(),
      });
    } else {
      await this.invoices.updateStatus(invoice.id, { status: InvoiceStatus.GENERATING });
    }

    try {
      const pdfBuffer = await this.pdfGenerator.generateBuffer({
        invoiceNumber,
        amount: payment.amount,
        currency: payment.currency,
        orderId: payment.payableId,
        date: new Date(),
      });

      let fileUrl = `/api/v1/payments/${paymentId}/invoice/pdf`;
      if (this.fileUploader) {
        try {
          fileUrl = await this.fileUploader.uploadPdf(pdfBuffer, `${invoiceNumber}.pdf`);
        } catch {
          // Fall back to direct local streaming endpoint
        }
      }

      await this.invoices.updateStatus(invoice.id, {
        status: InvoiceStatus.AVAILABLE,
        fileUrl,
      });
    } catch (error) {
      await this.invoices.updateStatus(invoice.id, {
        status: InvoiceStatus.FAILED,
      });
      throw error;
    }
  }
}
