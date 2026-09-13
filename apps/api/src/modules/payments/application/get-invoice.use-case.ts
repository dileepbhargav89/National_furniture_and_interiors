// get-invoice.use-case.ts — Retrieves invoice details
import { IInvoiceRepository, Invoice } from '../domain/invoices.types';
import { NotFoundError } from '../../../core/exceptions';

export class GetInvoiceUseCase {
  constructor(private readonly invoices: IInvoiceRepository) {}

  async executeByPaymentId(paymentId: string): Promise<Invoice> {
    const invoice = await this.invoices.findByPaymentId(paymentId);
    if (!invoice) {
      throw new NotFoundError(`Invoice not found for payment ${paymentId}`);
    }
    return invoice;
  }

  async executeByOrderId(orderId: string): Promise<Invoice> {
    const invoice = await this.invoices.findByOrderId(orderId);
    if (!invoice) {
      throw new NotFoundError(`Invoice not found for order ${orderId}`);
    }
    return invoice;
  }
}
