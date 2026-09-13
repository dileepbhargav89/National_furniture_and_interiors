import { IMediaService } from '../../application/ports';
import { MediaUploadParams, MediaUploadResult, UploadSignatureParams } from '../../domain/media.types';

export class MockMediaService implements IMediaService {
  async uploadFile(params: MediaUploadParams): Promise<MediaUploadResult> {
    const publicId = `mock-${Date.now()}-${params.originalname.replace(/\s+/g, '-')}`;
    
    // Fake a delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      url: `https://mock-media.com/${params.folder ? params.folder + '/' : ''}${publicId}`,
      publicId,
      format: params.mimetype.split('/')[1] || 'jpeg',
      bytes: params.buffer.length
    };
  }

  generateSignature(folder: string): UploadSignatureParams {
    return {
      signature: 'mock_signature',
      timestamp: Date.now(),
      apiKey: 'mock_api_key',
      cloudName: 'mock_cloud_name',
      folder
    };
  }
}
