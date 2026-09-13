// Catalog Zod validators — docs/08 §3.12: strict schemas reject unknown fields.
import { z } from 'zod';

const moneySchema = z
  .object({ amount: z.number().int().min(0), currency: z.string().length(3) })
  .strict();

export const listProductsQuerySchema = z
  .object({
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    productType: z.enum(['READY_TO_SHIP', 'MADE_TO_ORDER', 'CUSTOM', 'INTERIOR_PRODUCT', 'ACCESSORY']).optional(),
    isFeatured: z
      .string()
      .optional()
      .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
    isBestSeller: z
      .string()
      .optional()
      .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
    tags: z.string().optional().transform((v) => (v ? v.split(',') : undefined)),
    search: z.string().max(200).optional(),
    material: z.string().max(200).optional(),
    inStock: z
      .string()
      .optional()
      .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
    minPrice: z.string().optional().transform((v) => (v ? parseInt(v, 10) : undefined)),
    maxPrice: z.string().optional().transform((v) => (v ? parseInt(v, 10) : undefined)),
    page: z
      .string()
      .optional()
      .transform((v) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? Math.min(100, Math.max(1, parseInt(v, 10))) : 24)),
    sortBy: z.enum(['createdAt', 'basePrice', 'ratingsAvg', 'name', 'featured']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  });

export const createProductSchema = z
  .object({
    name: z.string().min(1).max(500),
    slug: z.string().min(1).max(500).regex(/^[a-z0-9-]+$/, 'slug must be kebab-case'),
    sku: z.string().min(1).max(100),
    brand: z.string().max(200).optional(),
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    categoryIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
    description: z.string().min(1),
    shortDescription: z.string().max(1000).optional(),
    // Materials & Finishes
    material: z.string().max(500).optional(),
    primaryMaterial: z.string().max(500).optional(),
    frameMaterial: z.string().max(500).optional(),
    finishes: z.array(z.string().max(100)).max(50).optional(),
    colors: z.array(z.string().max(100)).max(50).optional(),
    careInstructions: z.string().max(1000).optional(),
    warranty: z.object({ durationMonths: z.number().int().min(0), terms: z.string() }).optional(),
    dimensions: z
      .object({ length: z.number().positive(), width: z.number().positive(), height: z.number().positive(), unit: z.string() })
      .optional(),
    weight: z.number().positive().optional(),
    specifications: z.record(z.string(), z.unknown()).optional(),
    // Pricing
    basePrice: moneySchema,
    mrp: moneySchema.optional(),
    taxRate: z.number().min(0).max(100).optional(),
    taxIncluded: z.boolean().optional(),
    // Commerce flags
    tags: z.array(z.string().max(100)).max(20).optional(),
    isFeatured: z.boolean().optional(),
    isBestSeller: z.boolean().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    productType: z.enum(['READY_TO_SHIP', 'MADE_TO_ORDER', 'CUSTOM', 'INTERIOR_PRODUCT', 'ACCESSORY']).optional(),
    // Customization / Logistics
    customization: z.object({
      enabled: z.boolean(),
      options: z.array(z.string().max(100)).max(50),
      additionalCost: z.number().min(0).optional(),
      leadTimeDays: z.number().int().min(0).optional(),
      notes: z.string().max(2000).optional(),
    }).optional(),
    shipping: z.object({
      type: z.enum(['STANDARD', 'EXPRESS', 'WHITE_GLOVE', 'FREIGHT', 'PICKUP_ONLY']),
      estimateDays: z.string().max(100),
      packageWeight: z.number().min(0).optional(),
      availableRegions: z.array(z.string().max(100)).max(50).optional(),
    }).optional(),
    assembly: z.object({
      required: z.boolean(),
      type: z.enum(['SELF_ASSEMBLY', 'PROFESSIONAL', 'PRE_ASSEMBLED']).optional(),
      estimatedMinutes: z.number().int().min(0).optional(),
      fee: z.number().min(0).optional(),
      professionalAvailable: z.boolean().optional(),
    }).optional(),
    relatedProductIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).max(20).optional(),
    documents: z.array(z.object({
      type: z.enum(['SPEC_SHEET', 'CARE_GUIDE', 'WARRANTY_CARD', 'ASSEMBLY_MANUAL', 'OTHER']),
      url: z.string().url(),
      publicId: z.string().max(500),
      label: z.string().max(200),
    })).max(10).optional(),
    images: z.array(z.object({
      url: z.string().url(),
      publicId: z.string().max(500),
      altText: z.string().max(200).optional(),
      sortOrder: z.number().int().min(0),
      isPrimary: z.boolean(),
    })).max(50).optional(),
    videos: z.array(z.object({
      url: z.string().url(),
      publicId: z.string().max(500).optional(),
      title: z.string().max(200).optional(),
    })).max(10).optional(),
    variants: z.array(z.object({
      variantId: z.string().max(100),
      sku: z.string().max(100),
      attributes: z.array(z.object({ name: z.string(), value: z.string() })).max(20),
      priceOverride: moneySchema.nullable().optional(),
      images: z.array(z.object({
        url: z.string().url(),
        publicId: z.string().max(500),
        altText: z.string().max(200).optional(),
        sortOrder: z.number().int().min(0),
        isPrimary: z.boolean(),
      })).max(20).optional(),
      dimensionsOverride: z.object({ length: z.number().positive(), width: z.number().positive(), height: z.number().positive(), unit: z.string() }).nullable().optional(),
      weightOverride: z.number().positive().nullable().optional(),
      isActive: z.boolean(),
    })).max(100).optional(),
    // SEO
    seo: z.object({ title: z.string().optional(), description: z.string().optional(), keywords: z.string().optional() }).optional(),
  })
  .strict();

export const updateProductSchema = createProductSchema.partial();

export const createCategorySchema = z
  .object({
    name: z.string().min(1).max(200),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'slug must be kebab-case'),
    description: z.string().max(2000).optional(),
    parentId: z.string().regex(/^[0-9a-fA-F]{24}$/).nullable().optional(),
    imageUrl: z.string().url().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
    level: z.number().int().min(0).optional(),
    seo: z.object({ title: z.string().optional(), description: z.string().optional(), keywords: z.string().optional() }).optional(),
  })
  .strict();

export const updateCategorySchema = createCategorySchema.partial();

export const adjustInventorySchema = z
  .object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    variantId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    warehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    type: z.enum(['ORDER_RESERVED', 'ORDER_COMMITTED', 'ORDER_CANCELLED', 'RESTOCK', 'ADJUSTMENT', 'RETURN']),
    quantityDelta: z.number().int(),
    note: z.string().max(500).optional(),
  })
  .strict();

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type CreateProductBody = z.infer<typeof createProductSchema>;
export type CreateCategoryBody = z.infer<typeof createCategorySchema>;
export type UpdateCategoryBody = z.infer<typeof updateCategorySchema>;
export type AdjustInventoryBody = z.infer<typeof adjustInventorySchema>;

const imageSubdocSchema = z.object({
  url: z.string().url(),
  publicId: z.string().max(500),
  altText: z.string().max(200).optional(),
  sortOrder: z.number().int().min(0),
  isPrimary: z.boolean(),
});

export const createCollectionSchema = z
  .object({
    title: z.string().min(1).max(200),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'slug must be kebab-case'),
    shortDescription: z.string().max(1000).optional(),
    description: z.string().max(5000).optional(),
    heroImage: imageSubdocSchema.optional().nullable(),
    heroVideo: z.string().url().optional().nullable(),
    thumbnailImage: imageSubdocSchema.optional().nullable(),
    galleryImages: z.array(imageSubdocSchema).max(50).optional(),
    galleryVideos: z.array(z.string().url()).max(10).optional(),
    productIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).max(100).optional(),
    rules: z.record(z.string(), z.unknown()).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    featured: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
    seo: z.object({ title: z.string().optional(), description: z.string().optional(), keywords: z.string().optional() }).optional(),
    publishedAt: z.string().datetime().optional(),
  })
  .strict();

export const updateCollectionSchema = createCollectionSchema.partial();
export type CreateCollectionBody = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionBody = z.infer<typeof updateCollectionSchema>;
