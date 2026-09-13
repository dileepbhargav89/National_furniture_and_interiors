import { MediaOwnerType, MediaAsset, MediaUploadParams, MediaUploadResult, UploadSignatureParams } from '../domain/media.types';

export interface GenerateSignatureInput {
  ownerType: MediaOwnerType;
  ownerId: string;
}

export interface ConfirmUploadInput {
  publicId: string;
  url: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  ownerType: MediaOwnerType;
  ownerId: string;
  uploadedBy: string;
}

export interface IMediaService {
  uploadFile(params: MediaUploadParams): Promise<MediaUploadResult>;
  generateSignature(folder: string): UploadSignatureParams;
}

export interface IMediaAssetRepository {
  create(asset: ConfirmUploadInput): Promise<MediaAsset>;
  findByOwner(ownerType: MediaOwnerType, ownerId: string): Promise<MediaAsset[]>;
}
