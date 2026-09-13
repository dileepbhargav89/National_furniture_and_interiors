import { IMediaService } from './ports';
import { MediaUploadParams, MediaUploadResult } from '../domain/media.types';

export class UploadMediaUseCase {
  constructor(private readonly mediaService: IMediaService) {}

  async execute(params: MediaUploadParams): Promise<MediaUploadResult> {
    return this.mediaService.uploadFile(params);
  }
}
