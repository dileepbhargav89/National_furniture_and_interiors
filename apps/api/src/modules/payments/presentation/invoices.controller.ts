// invoices.controller.ts — Presentation layer for GST Tax Invoices and PDF streaming.
import { Request, Response, NextFunction } from 'express';
import { GetInvoiceUseCase } from '../application/get-invoice.use-case';
import { GenerateInvoiceUseCase } from '../application/generate-invoice.use-case';
import { sendSuccess } from '../../../core/exceptions';

export class InvoicesController {
  constructor(
    private readonly getInvoiceUseCase: GetInvoiceUseCase,
    private readonly generateInvoiceUseCase?: GenerateInvoiceUseCase,
  ) {}

  /**
   * GET /api/v1/payments/:paymentId/invoice
   * Returns JSON metadata of the invoice.
   */
  getInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paymentId = req.params.paymentId as string;
      try {
        const invoice = await this.getInvoiceUseCase.executeByPaymentId(paymentId);
        sendSuccess(req, res, 200, invoice);
      } catch {
        if (this.generateInvoiceUseCase) {
          const result = await this.generateInvoiceUseCase.generatePdfForPayment(paymentId);
          sendSuccess(req, res, 200, result.invoice);
        } else {
          throw new Error(`Invoice not found for payment ${paymentId}`);
        }
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/orders/:orderId/invoice
   * Returns JSON metadata of the invoice for an order.
   */
  getInvoiceByOrderId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orderId = req.params.orderId as string;
      try {
        const invoice = await this.getInvoiceUseCase.executeByOrderId(orderId);
        sendSuccess(req, res, 200, invoice);
      } catch {
        if (this.generateInvoiceUseCase) {
          const result = await this.generateInvoiceUseCase.generatePdfForOrder(orderId);
          sendSuccess(req, res, 200, result.invoice);
        } else {
          throw new Error(`Invoice not found for order ${orderId}`);
        }
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/orders/:orderId/invoice/pdf
   * Directly streams the official GST Tax Invoice PDF.
   */
  downloadInvoicePdfByOrderId = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const orderId = req.params.orderId as string;
      if (!this.generateInvoiceUseCase) {
        res
          .status(501)
          .json({ success: false, error: { message: 'PDF generator not configured' } });
        return;
      }

      const { buffer, filename } = await this.generateInvoiceUseCase.generatePdfForOrder(orderId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.end(buffer);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/payments/:paymentId/invoice/pdf
   * Directly streams the payment receipt PDF.
   */
  downloadInvoicePdfByPaymentId = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const paymentId = req.params.paymentId as string;
      if (!this.generateInvoiceUseCase) {
        res
          .status(501)
          .json({ success: false, error: { message: 'PDF generator not configured' } });
        return;
      }

      const { buffer, filename } =
        await this.generateInvoiceUseCase.generatePdfForPayment(paymentId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.end(buffer);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/orders/:orderId/invoice/generate
   * Admin triggers manual regeneration of the GST tax invoice.
   */
  generateInvoiceForOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const orderId = req.params.orderId as string;
      if (!this.generateInvoiceUseCase) {
        res
          .status(501)
          .json({ success: false, error: { message: 'PDF generator not configured' } });
        return;
      }

      const result = await this.generateInvoiceUseCase.generatePdfForOrder(orderId);
      sendSuccess(req, res, 201, result.invoice);
    } catch (error) {
      next(error);
    }
  };
}
