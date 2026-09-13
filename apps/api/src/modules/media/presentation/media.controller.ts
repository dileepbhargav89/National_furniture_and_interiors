import type { Request, Response, NextFunction } from 'express';
import type { GenerateUploadSignature, ConfirmUpload, ListMediaByOwner } from '../application/media.use-cases';
import { sendSuccess } from '../../../core/exceptions';
import type { MediaOwnerType } from '../domain/media.types';

export function createMediaController(useCases: {
  generateUploadSignature: GenerateUploadSignature;
  confirmUpload: ConfirmUpload;
  listMediaByOwner: ListMediaByOwner;
}) {
  return {
    generateSignature: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { ownerType, ownerId } = req.body;
        const result = useCases.generateUploadSignature.execute({ ownerType, ownerId });
        sendSuccess(req, res, 200, result);
      } catch (err) {
        next(err);
      }
    },
    confirmUpload: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { publicId, url, format, bytes, width, height, ownerType, ownerId } = req.body;
        const result = await useCases.confirmUpload.execute({
          publicId, url, format, bytes, width, height, ownerType, ownerId,
          uploadedBy: req.auth?.sub || ''
        });
        sendSuccess(req, res, 200, result);
      } catch (err) {
        next(err);
      }
    },
    listByOwner: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { ownerType, ownerId } = req.query as { ownerType: MediaOwnerType, ownerId: string };
        const result = await useCases.listMediaByOwner.execute(ownerType, ownerId);
        sendSuccess(req, res, 200, result);
      } catch (err) {
        next(err);
      }
    }
  };
}
