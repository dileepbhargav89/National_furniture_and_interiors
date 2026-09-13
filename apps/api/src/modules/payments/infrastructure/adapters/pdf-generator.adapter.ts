// pdf-generator.adapter.ts — Adapter for generating PDF invoices.
import PDFDocument from 'pdfkit';
import { Writable } from 'stream';

export interface GeneratePdfParams {
  invoiceNumber: string;
  amount: number;
  currency: string;
  orderId?: string;
  customerDetails?: {
    name?: string;
    email?: string;
  };
  date: Date;
}

export class PdfGeneratorAdapter {
  /**
   * Generates a PDF invoice in memory and returns a Buffer.
   * This is intended to run inside the background worker process.
   */
  async generateBuffer(params: GeneratePdfParams): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];
        const writeStream = new Writable({
          write(chunk, encoding, callback) {
            buffers.push(chunk);
            callback();
          },
        });
        
        writeStream.on('finish', () => resolve(Buffer.concat(buffers)));
        writeStream.on('error', reject);
        
        doc.pipe(writeStream);
        
        // Header
        doc.fontSize(20).text('National Furniture & Interiors', { align: 'right' });
        doc.fontSize(10).text('Invoice', { align: 'right' });
        doc.moveDown();
        
        // Invoice Details
        doc.fontSize(12).text(`Invoice Number: ${params.invoiceNumber}`);
        doc.text(`Date: ${params.date.toLocaleDateString('en-IN')}`);
        if (params.orderId) {
          doc.text(`Order ID: ${params.orderId}`);
        }
        doc.moveDown();
        
        // Customer Details
        if (params.customerDetails) {
          doc.text('Bill To:');
          if (params.customerDetails.name) doc.text(params.customerDetails.name);
          if (params.customerDetails.email) doc.text(params.customerDetails.email);
          doc.moveDown();
        }
        
        // Summary
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
        doc.fontSize(14).text(`Total Amount: ${(params.amount / 100).toFixed(2)} ${params.currency}`, { align: 'right' });
        
        // Footer
        doc.moveDown(5);
        doc.fontSize(10).text('Thank you for your business!', { align: 'center' });
        
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
