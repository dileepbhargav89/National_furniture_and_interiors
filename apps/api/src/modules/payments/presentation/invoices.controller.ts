// invoices.controller.ts — Presentation layer for invoices
import { Request, Response, NextFunction } from 'express';
import { GetInvoiceUseCase } from '../application/get-invoice.use-case';
import { sendSuccess } from '../../../core/exceptions';

export class InvoicesController {
  constructor(private readonly getInvoiceUseCase: GetInvoiceUseCase) {}

  /**
   * GET /api/v1/payments/:paymentId/invoice
   * Customer/Admin gets invoice details/URL.
   */
  getInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paymentId = req.params.paymentId as string;
      const invoice = await this.getInvoiceUseCase.executeByPaymentId(paymentId);
      sendSuccess(req, res, 200, invoice);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/orders/:orderId/invoice
   */
  getInvoiceByOrderId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orderId = req.params.orderId as string;
      const invoice = await this.getInvoiceUseCase.executeByOrderId(orderId);
      sendSuccess(req, res, 200, invoice);
    } catch (error) {
      next(error);
    }
  };
}
