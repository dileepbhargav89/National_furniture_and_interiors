// Media use-cases — docs/06 §4.3: application/ calls no infrastructure directly.
// docs/08 §4.6: GenerateSignature + ConfirmUpload.
import type { MediaAsset, UploadSignatureParams } from '../domain/media.types';
import type {
  ConfirmUploadInput,
  GenerateSignatureInput,
  IMediaAssetRepository,
  IMediaService,
} from './ports';

// ---- GenerateUploadSignature ----------------------------------------------------------------

export class GenerateUploadSignature {
  constructor(private readonly mediaService: IMediaService) {}

  execute(input: GenerateSignatureInput): UploadSignatureParams {
    // docs/08 §4.6: folder is scoped per owner type to enforce path-based ACLs in Cloudinary.
    const folder = `nfi/${input.ownerType.toLowerCase()}/${input.ownerId}`;
    return this.mediaService.generateSignature(folder);
  }
}

// ---- ConfirmUpload --------------------------------------------------------------------------

export class ConfirmUpload {
  constructor(private readonly mediaAssets: IMediaAssetRepository) {}

  /**
   * docs/08 §4.6 — re-validates ownership (ownerId belongs to caller's context) and persists
   * the asset reference. Ownership check must be done by the caller (controller) before invoking.
   */
  async execute(input: ConfirmUploadInput): Promise<MediaAsset> {
    return this.mediaAssets.create(input);
  }
}

// ---- ListMediaByOwner -----------------------------------------------------------------------

export class ListMediaByOwner {
  constructor(private readonly mediaAssets: IMediaAssetRepository) {}

  async execute(ownerType: ConfirmUploadInput['ownerType'], ownerId: string): Promise<MediaAsset[]> {
    return this.mediaAssets.findByOwner(ownerType, ownerId);
  }
}
