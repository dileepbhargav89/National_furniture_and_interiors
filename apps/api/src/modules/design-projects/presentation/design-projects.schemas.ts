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
      max: z.number().int().nonnegative(),
    }),
    propertyAddress: z.object({
      street: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().min(1),
    }),
    propertyDetails: z.object({
      areaSqft: z.number().positive(),
      rooms: z.number().positive().optional(),
      bhk: z.number().positive().optional(),
    }),
  }),
});

export const advanceProjectStageSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    targetStage: z.nativeEnum(DesignProjectStage),
    expectedVersion: z.number().int().positive(),
    note: z.string().optional(),
  }),
});

export const addQuotationSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    expectedVersion: z.number().int().positive(),
    boqItems: z
      .array(
        z.object({
          description: z.string().min(1),
          quantity: z.number().positive(),
          unitPrice: z.number().int().nonnegative(),
          total: z.number().int().nonnegative(),
          id: z.string().optional(),
          roomName: z.string().optional(),
          category: z.string().optional(),
          dimensions: z
            .object({
              widthFt: z.number().positive().optional(),
              heightFt: z.number().positive().optional(),
              depthFt: z.number().positive().optional(),
              areaSqft: z.number().positive().optional(),
              rft: z.number().positive().optional(),
            })
            .optional(),
          coreMaterial: z.string().optional(),
          finish: z.string().optional(),
          hardwareBrand: z.string().optional(),
          hardwareDetails: z.string().optional(),
          ratePerUnit: z.number().int().nonnegative().optional(),
          hardwareAddonPaise: z.number().int().nonnegative().optional(),
          notes: z.string().optional(),
        }),
      )
      .min(1),
    financialBreakdown: z
      .object({
        baseJoineryAmount: z.number().int().nonnegative(),
        hardwareAmount: z.number().int().nonnegative(),
        finishingPolishAmount: z.number().int().nonnegative().optional(),
        designFeePercent: z.number().nonnegative(),
        designFeeAmount: z.number().int().nonnegative(),
        gstRate: z.number().nonnegative(),
        gstAmount: z.number().int().nonnegative(),
        grandTotal: z.number().int().nonnegative(),
      })
      .optional(),
    milestoneSchedule: z
      .array(
        z.object({
          stageName: z.string().min(1),
          percentage: z.number().positive(),
          amount: z.number().int().positive(),
          dueTrigger: z.string().min(1),
        }),
      )
      .optional(),
  }),
});

export const approveQuotationSchema = z.object({
  params: z.object({
    id: z.string(),
    qid: z.string(), // quotation version as string in URL
  }),
  body: z.object({
    expectedVersion: z.number().int().positive(),
    eSignatureRef: z.string().min(1),
  }),
});

export const listDesignProjectsQuerySchema = z.object({
  stage: z.nativeEnum(DesignProjectStage).optional(),
  assignedDesignerId: z.string().optional(),
  limit: z.coerce.number().int().positive().default(10),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export const siteWorkPhaseEnum = z.enum([
  'CIVIL_DEMOLITION',
  'ELECTRICAL_PLUMBING',
  'CARPENTRY_CARCASES',
  'VENEER_PRESSING',
  'POP_FALSE_CEILING',
  'PU_POLISH_PAINTING',
  'HARDWARE_COUNTERTOP',
  'DEEP_CLEANING_SNAGGING',
  'HANDOVER_READY',
]);

export const recordInspectionSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    expectedVersion: z.number().int().positive(),
    inspectionDate: z
      .string()
      .datetime()
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
    inspectorName: z.string().min(1),
    inspectorRole: z.enum([
      'SITE_SUPERVISOR',
      'PROJECT_ENGINEER',
      'QUALITY_AUDITOR',
      'LEAD_ARCHITECT',
    ]),
    currentPhase: siteWorkPhaseEnum,
    workCompletedToday: z.string().min(1),
    manpowerCount: z.object({
      carpenters: z.number().int().nonnegative().default(0),
      polishers: z.number().int().nonnegative().default(0),
      electricians: z.number().int().nonnegative().default(0),
      helpers: z.number().int().nonnegative().default(0),
    }),
    materialDeliveriesVerified: z.array(z.string()).optional().default([]),
    siteCleanlinessRating: z
      .enum(['EXCELLENT', 'GOOD', 'NEEDS_ATTENTION', 'FAILED'])
      .default('GOOD'),
    blockersOrDelays: z.string().optional(),
    photos: z
      .array(
        z.object({
          url: z.string().url().or(z.string().startsWith('/')),
          thumbnailUrl: z.string().optional(),
          roomName: z.string().min(1),
          caption: z.string().min(1),
          workPhase: siteWorkPhaseEnum,
          uploadedBy: z.string(),
          isClientVisible: z.boolean().default(true),
          tags: z.array(z.string()).optional(),
        }),
      )
      .optional(),
    snags: z
      .array(
        z.object({
          title: z.string().min(1),
          roomName: z.string().min(1),
          description: z.string().min(1),
          severity: z.enum(['CRITICAL', 'MODERATE', 'COSMETIC']),
          reportedBy: z.string(),
          assignedTo: z.string().optional(),
          beforePhotoUrl: z.string().optional(),
        }),
      )
      .optional(),
  }),
});

export const addSitePhotoSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    expectedVersion: z.number().int().positive(),
    url: z.string().min(1),
    thumbnailUrl: z.string().optional(),
    roomName: z.string().min(1),
    caption: z.string().min(1),
    workPhase: siteWorkPhaseEnum,
    uploadedBy: z.string().min(1),
    isClientVisible: z.boolean().default(true),
    tags: z.array(z.string()).optional(),
  }),
});

export const logSnagSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    expectedVersion: z.number().int().positive(),
    title: z.string().min(1),
    roomName: z.string().min(1),
    description: z.string().min(1),
    severity: z.enum(['CRITICAL', 'MODERATE', 'COSMETIC']),
    reportedBy: z.string().min(1),
    assignedTo: z.string().optional(),
    beforePhotoUrl: z.string().optional(),
  }),
});

export const updateSnagStatusSchema = z.object({
  params: z.object({
    id: z.string(),
    snagId: z.string(),
  }),
  body: z.object({
    expectedVersion: z.number().int().positive(),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLIENT_VERIFIED']),
    resolvedBy: z.string().optional(),
    resolutionNote: z.string().optional(),
    afterPhotoUrl: z.string().optional(),
  }),
});
