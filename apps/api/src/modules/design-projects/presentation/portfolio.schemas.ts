import { z } from 'zod';

export const listPortfolioQuerySchema = z.object({
  sector: z.enum(['residential', 'commercial']).optional(),
  category: z
    .enum(['3bhk-4bhk', '2bhk', 'villa', 'kitchen', 'penthouse', 'office', 'restaurant', 'hotel', 'retail'])
    .optional(),
  isFeatured: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
});

export const adminListPortfolioQuerySchema = z.object({
  limit: z.coerce.number().int().positive().default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
  sector: z.enum(['residential', 'commercial']).optional(),
});

export const createPortfolioSchema = z.object({
  body: z.object({
    slug: z.string().min(2).optional(),
    title: z.string().min(2),
    subtitle: z.string().min(2),
    community: z.string().min(2),
    locality: z.string().min(2),
    city: z.string().default('Bengaluru'),
    sector: z.enum(['residential', 'commercial']),
    category: z.enum(['3bhk-4bhk', '2bhk', 'villa', 'kitchen', 'penthouse', 'office', 'restaurant', 'hotel', 'retail']),
    categoryLabel: z.string().optional(),
    areaSqFt: z.number().positive(),
    budgetInLakhs: z.number().positive(),
    budgetString: z.string().optional(),
    turnaroundDays: z.number().int().positive(),
    style: z.string().min(2),
    coverImage: z.string().url(),
    galleryImages: z.array(z.string().url()).default([]),
    scope: z.array(z.string()).default([]),
    materials: z
      .array(
        z.object({
          category: z.string(),
          detail: z.string(),
        })
      )
      .default([]),
    designerNotes: z.string().default(''),
    clientTestimonial: z
      .object({
        clientName: z.string(),
        society: z.string(),
        quote: z.string(),
        rating: z.number().min(1).max(5).default(5),
      })
      .optional(),
    isPublished: z.boolean().default(true),
    displayOrder: z.number().int().default(0),
    isFeatured: z.boolean().default(false),
  }),
});

export const updatePortfolioSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: createPortfolioSchema.shape.body.partial(),
});
