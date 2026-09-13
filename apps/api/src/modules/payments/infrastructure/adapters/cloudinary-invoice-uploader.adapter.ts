// cloudinary-invoice-uploader.adapter.ts
import { IFileUploaderPort } from '../../application/ports';

// Assuming we want a simple abstraction for uploading PDFs
export class CloudinaryInvoiceUploaderAdapter implements IFileUploaderPort {
  constructor(private readonly cloudinaryService: any) {}

  async uploadPdf(buffer: Buffer, filename: string): Promise<string> {
    try {
      // For MVP, we can directly call the cloudinary service, or we can mock it
      // if environment variables aren't set.
      if (!process.env.CLOUDINARY_API_KEY) {
        console.warn(`[Invoice Uploader] Mocking upload for ${filename}`);
        return `https://mock-invoice-url.com/invoices/${filename}`;
      }

      const result = await this.cloudinaryService.uploadFile({
        buffer,
        folder: 'invoices',
      });
      return result.url;
    } catch (error) {
      console.error('Failed to upload invoice to Cloudinary:', error);
      throw error;
    }
  }
}
