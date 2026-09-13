import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import { GenerateInvoiceUseCase } from './generate-invoice.use-case';
import { IPaymentRepository, Payment, PaymentGateway, PaymentRecordStatus } from '../domain/payments.types';
import { IInvoiceRepository, Invoice, InvoiceStatus } from '../domain/invoices.types';
import { IFileUploaderPort } from './ports';

// Missing IPdfGeneratorPort from ports.ts, declare it locally or import the concrete one for now
export interface IPdfGeneratorPort {
  generateBuffer(params: any): Promise<Buffer>;
}

describe('GenerateInvoiceUseCase', () => {
  let paymentRepo: Mocked<IPaymentRepository>;
  let invoiceRepo: Mocked<IInvoiceRepository>;
  let pdfGenerator: Mocked<IPdfGeneratorPort>;
  let fileUploader: Mocked<IFileUploaderPort>;
  let useCase: GenerateInvoiceUseCase;

  beforeEach(() => {
    paymentRepo = {
      create: vi.fn(),
      findByGatewayOrderId: vi.fn(),
      findById: vi.fn(),
      markCaptured: vi.fn(),
      updateReconciliation: vi.fn(),
      recordRefund: vi.fn(),
      findAll: vi.fn()
    };

    invoiceRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByPaymentId: vi.fn(),
      findByOrderId: vi.fn(),
      updateStatus: vi.fn(),
      findAll: vi.fn()
    };

    pdfGenerator = {
      generateBuffer: vi.fn()
    } as any;

    fileUploader = {
      uploadPdf: vi.fn()
    };

    useCase = new GenerateInvoiceUseCase(paymentRepo, invoiceRepo, pdfGenerator as any, fileUploader);
  });

  it('should generate and save an invoice', async () => {
    const paymentId = 'pay_123';
    const mockPayment: Payment = {
      id: paymentId,
      payableType: 'ORDER' as any,
      payableId: 'order_123',
      gateway: PaymentGateway.RAZORPAY,
      gatewayOrderId: 'rzp_order_123',
      amount: 50000,
      currency: 'INR',
      status: PaymentRecordStatus.CAPTURED,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    paymentRepo.findById.mockResolvedValue(mockPayment);
    invoiceRepo.findByPaymentId.mockResolvedValue(null);

    const mockInvoice: Invoice = {
      id: 'inv_123',
      invoiceNumber: 'INV-2023-ABCD',
      paymentId,
      orderId: 'order_123',
      status: InvoiceStatus.GENERATING,
      amount: 50000,
      currency: 'INR',
      fileUrl: '', // Add missing property
      issuedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    invoiceRepo.create.mockResolvedValue(mockInvoice);

    
    (pdfGenerator.generateBuffer as any).mockResolvedValue(Buffer.from('pdf content'));
    fileUploader.uploadPdf.mockResolvedValue('https://cloudinary.com/invoice.pdf');

    await useCase.execute(paymentId);

    expect(paymentRepo.findById).toHaveBeenCalledWith(paymentId);
    expect(invoiceRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      paymentId,
      orderId: 'order_123',
      amount: 50000,
      currency: 'INR',
      status: InvoiceStatus.GENERATING
    }));
    expect(pdfGenerator.generateBuffer).toHaveBeenCalledWith(expect.objectContaining({
      amount: 50000
    }));
    expect(fileUploader.uploadPdf).toHaveBeenCalledWith(expect.any(Buffer), expect.stringContaining('.pdf'));
    expect(invoiceRepo.updateStatus).toHaveBeenCalledWith('inv_123', {
        status: InvoiceStatus.AVAILABLE,
        fileUrl: 'https://cloudinary.com/invoice.pdf',
    });
  });

  it('should not generate invoice if already exists', async () => {
    const paymentId = 'pay_123';
    const mockPayment: Payment = {
      id: paymentId,
      payableType: 'ORDER' as any,
      payableId: 'order_123',
      gateway: PaymentGateway.RAZORPAY,
      gatewayOrderId: 'rzp_order_123',
      amount: 50000,
      currency: 'INR',
      status: PaymentRecordStatus.CAPTURED,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    paymentRepo.findById.mockResolvedValue(mockPayment);
    invoiceRepo.findByPaymentId.mockResolvedValue({ id: 'inv_existing', status: InvoiceStatus.AVAILABLE } as any);

    await useCase.execute(paymentId);

    expect(invoiceRepo.create).not.toHaveBeenCalled();
    expect(pdfGenerator.generateBuffer).not.toHaveBeenCalled();
  });
});
