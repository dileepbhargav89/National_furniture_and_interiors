export type MediaOwnerType = 'PRODUCT' | 'DESIGN_PROJECT' | 'CATEGORY' | 'CMS';

export interface MediaAsset {
  id: string;
  publicId: string;
  url: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  ownerType: MediaOwnerType;
  ownerId: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface UploadSignatureParams {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadPreset?: string;
}

export interface MediaUploadResult {
  url: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export interface MediaUploadParams {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  folder?: string;
}
