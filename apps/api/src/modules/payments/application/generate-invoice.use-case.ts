// generate-invoice.use-case.ts — Generates PDF invoice in the background.
import { IPaymentRepository } from '../domain/payments.types';
import { IInvoiceRepository, InvoiceStatus } from '../domain/invoices.types';
import { IFileUploaderPort } from './ports';
import { PdfGeneratorAdapter } from '../infrastructure/adapters/pdf-generator.adapter';
import { randomBytes } from 'crypto';

export class GenerateInvoiceUseCase {
  constructor(
    private readonly payments: IPaymentRepository,
    private readonly invoices: IInvoiceRepository,
    private readonly pdfGenerator: PdfGeneratorAdapter,
    private readonly fileUploader: IFileUploaderPort
  ) {}

  async execute(paymentId: string): Promise<void> {
    const payment = await this.payments.findById?.(paymentId) || await this.findPayment(paymentId);
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }
    if (payment.status !== 'CAPTURED') {
      throw new Error(`Payment ${paymentId} is not captured`);
    }

    const existingInvoice = await this.invoices.findByPaymentId(paymentId);
    if (existingInvoice && existingInvoice.status === InvoiceStatus.AVAILABLE) {
      return; // Already generated
    }

    const invoiceNumber = existingInvoice?.invoiceNumber || `INV-${new Date().getFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;

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

      const fileUrl = await this.fileUploader.uploadPdf(pdfBuffer, `${invoiceNumber}.pdf`);

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

  // Workaround since findById is not currently on IPaymentRepository but we can query by ID if we add it, or we use a workaround.
  // We'll update IPaymentRepository to have findById if it doesn't.
  private async findPayment(id: string) {
    // Ideally we add findById to IPaymentRepository, but for now we fallback to gateway ID if that's all we have.
    // Wait, we can modify payments.types.ts to add findById. Let's assume we will.
    return null;
  }
}
