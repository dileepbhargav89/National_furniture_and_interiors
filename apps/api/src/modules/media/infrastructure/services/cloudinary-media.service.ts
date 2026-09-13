import { v2 as cloudinary } from 'cloudinary';
import { IMediaService } from '../../application/ports';
import { MediaUploadParams, MediaUploadResult, UploadSignatureParams } from '../../domain/media.types';
import { AppError } from '../../../../core/exceptions/app-error';

export class MediaUploadError extends AppError {
  readonly statusCode = 500;
  readonly code = 'MEDIA_UPLOAD_FAILED';
  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

export class CloudinaryMediaService implements IMediaService {
  constructor() {
    // Cloudinary picks up CLOUDINARY_URL from the environment automatically
    // or can be explicitly configured if needed.
    if (!process.env.CLOUDINARY_URL && (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY)) {
      console.warn('Cloudinary environment variables not set. Uploads will fail unless mocked.');
    } else {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
        api_key: process.env.CLOUDINARY_API_KEY as string,
        api_secret: process.env.CLOUDINARY_API_SECRET as string,
      });
    }
  }

  async uploadFile(params: MediaUploadParams): Promise<MediaUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: params.folder || 'national-interiors',
          resource_type: 'auto', // Auto-detect image vs video
        },
        (error, result) => {
          if (error) {
            return reject(new MediaUploadError('Failed to upload media to Cloudinary', error));
          }
          if (!result) {
            return reject(new MediaUploadError('No result from Cloudinary'));
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          });
        }
      );

      // Write the buffer to the stream
      uploadStream.end(params.buffer);
    });
  }

  generateSignature(folder: string): UploadSignatureParams {
    const timestamp = Math.floor(Date.now() / 1000);
    const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
    const apiKey = process.env.CLOUDINARY_API_KEY || 'mock_api_key';
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'mock_cloud';
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'nfi_unsigned';

    if (!apiSecret) {
      return {
        timestamp,
        signature: 'mock_signature_dev_only',
        apiKey,
        cloudName,
        folder,
        uploadPreset,
      };
    }

    const crypto = require('crypto');
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}&upload_preset=${uploadPreset}`;
    const signature = crypto
      .createHmac('sha1', apiSecret)
      .update(paramsToSign)
      .digest('hex');

    return {
      timestamp,
      signature,
      apiKey,
      cloudName,
      folder,
      uploadPreset,
    };
  }
}
