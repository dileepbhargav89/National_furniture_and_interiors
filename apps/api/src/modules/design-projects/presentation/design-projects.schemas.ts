import { z } from 'zod';
import { DesignProjectType, DesignProjectStage } from '../domain/design-projects.types';

export const createDesignProjectSchema = z.object({
  body: z.object({
    leadId: z.string().optional(),
    customerId: z.string(),
    projectType: z.nativeEnum(DesignProjectType),
    assignedDesignerId: z.string().optional(),
    budgetRange: z.object({
      min: z.number().int().nonnegative(),
      max: z.number().int().nonnegative()
    }),
    propertyAddress: z.object({
      street: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().min(1)
    }),
    propertyDetails: z.object({
      areaSqft: z.number().positive(),
      rooms: z.number().positive().optional(),
      bhk: z.number().positive().optional()
    })
  })
});

export const advanceProjectStageSchema = z.object({
  params: z.object({
    id: z.string()
  }),
  body: z.object({
    targetStage: z.nativeEnum(DesignProjectStage),
    expectedVersion: z.number().int().positive(),
    note: z.string().optional()
  })
});

export const addQuotationSchema = z.object({
  params: z.object({
    id: z.string()
  }),
  body: z.object({
    expectedVersion: z.number().int().positive(),
    boqItems: z.array(z.object({
      description: z.string().min(1),
      quantity: z.number().positive(),
      unitPrice: z.number().int().nonnegative(),
      total: z.number().int().nonnegative()
    })).min(1)
  })
});

export const approveQuotationSchema = z.object({
  params: z.object({
    id: z.string(),
    qid: z.string() // quotation version as string in URL
  }),
  body: z.object({
    expectedVersion: z.number().int().positive(),
    eSignatureRef: z.string().min(1)
  })
});

export const listDesignProjectsQuerySchema = z.object({
  stage: z.nativeEnum(DesignProjectStage).optional(),
  assignedDesignerId: z.string().optional(),
  limit: z.coerce.number().int().positive().default(10),
  offset: z.coerce.number().int().nonnegative().default(0)
});
