import { z } from 'zod';

export const submitReviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  title: z.string().max(120, 'Title cannot exceed 120 characters').optional(),
  content: z.string().min(1, 'Review content cannot be empty').max(2000, 'Review content too long').optional(),
  comment: z.string().min(1).max(2000).optional(), // Backwards compatibility with storefront payloads
  images: z.array(z.union([
    z.string().url('Image must be a valid URL'),
    z.object({
      url: z.string().url('Image must be a valid URL'),
      alt: z.string().optional(),
    }),
  ])).max(5, 'Maximum of 5 images allowed').optional(),
}).refine((data) => Boolean(data.content || data.comment), {
  message: 'Review content is required',
  path: ['content'],
});

export const moderateReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  isFeatured: z.boolean().optional(),
});

export const adminReplySchema = z.object({
  message: z.string().min(2, 'Reply must be at least 2 characters').max(1000, 'Reply cannot exceed 1000 characters'),
});
