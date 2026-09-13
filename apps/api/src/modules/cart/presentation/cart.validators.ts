// Cart validators — docs/08 §3.12.
import { z } from 'zod';

export const addItemSchema = z
  .object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    variantId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    quantity: z.number().int().min(1).max(100),
  })
  .strict();

export const updateItemSchema = z
  .object({
    quantity: z.number().int().min(0).max(100),
  })
  .strict();

export const mergeCartSchema = z
  .object({
    sessionId: z.string().min(1).max(200),
  })
  .strict();

export type AddItemBody = z.infer<typeof addItemSchema>;
export type UpdateItemBody = z.infer<typeof updateItemSchema>;
export type MergeCartBody = z.infer<typeof mergeCartSchema>;
