import { apiClient } from './client';

export interface GenerateSignatureBody {
  ownerType: 'PRODUCT' | 'DESIGN_PROJECT' | 'CATEGORY' | 'CMS';
  ownerId: string;
}

export interface UploadSignatureResult {
  signature: string;
  timestamp: number;
  folder: string;
  cloudName?: string;
  apiKey?: string;
  uploadPreset?: string;
}

export interface ConfirmUploadBody {
  publicId: string;
  url: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  ownerType: 'PRODUCT' | 'DESIGN_PROJECT' | 'CATEGORY' | 'CMS';
  ownerId: string;
}

export interface MediaAsset {
  id: string;
  publicId: string;
  url: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  ownerType: string;
  ownerId: string;
  createdAt: string;
}

export const MediaService = {
  generateSignature: (body: GenerateSignatureBody) =>
    apiClient.post<UploadSignatureResult>('/api/v1/media/signature', body),

  confirmUpload: (body: ConfirmUploadBody) =>
    apiClient.post<MediaAsset>('/api/v1/media/confirm', body),

  listByOwner: (ownerType: string, ownerId: string) => {
    return apiClient.get<MediaAsset[]>('/api/v1/media', {
      params: { ownerType, ownerId }
    });
  }
};
