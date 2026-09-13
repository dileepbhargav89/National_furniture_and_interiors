// Media validators — docs/08 §3.12.
import { z } from 'zod';

export const generateSignatureSchema = z
  .object({
    ownerType: z.enum(['PRODUCT', 'DESIGN_PROJECT', 'CATEGORY', 'CMS']),
    ownerId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  })
  .strict();

export const confirmUploadSchema = z
  .object({
    publicId: z.string().min(1).max(500),
    url: z.string().url(),
    format: z.string().min(1).max(20),
    bytes: z.number().int().positive(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    ownerType: z.enum(['PRODUCT', 'DESIGN_PROJECT', 'CATEGORY', 'CMS']),
    ownerId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  })
  .strict();

export type GenerateSignatureBody = z.infer<typeof generateSignatureSchema>;
export type ConfirmUploadBody = z.infer<typeof confirmUploadSchema>;
