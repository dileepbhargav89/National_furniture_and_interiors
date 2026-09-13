import { z } from 'zod';

export const createCustomerSchema = z.object({
  userId: z.string().optional(),
  customerCode: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Valid phone number is required'),
  tags: z.array(z.string()).optional(),
  clientTier: z.enum(['VIP_PLATINUM', 'HIGH_NET_WORTH', 'COMMERCIAL', 'RETAIL', 'PROSPECT']).optional(),
  preferredStudio: z.enum(['INDIRANAGAR', 'WHITEFIELD', 'HSR_LAYOUT', 'VIRTUAL']).optional(),
  propertyDetails: z.object({
    community: z.string().optional(),
    configuration: z.string().optional(),
    estimatedAreaSqFt: z.number().optional(),
    possessionDate: z.string().optional(),
  }).optional(),
  estimatedDealValue: z.number().optional(),
  currentPipelineStage: z.enum([
    'NEW_INQUIRY',
    'QUALIFIED',
    'STUDIO_CONSULTATION',
    'DESIGN_PROPOSAL_SENT',
    'NEGOTIATION',
    'CLOSED_WON',
    'CLOSED_LOST',
  ]).optional(),
  assignedRepId: z.string().optional(),
  assignedRepName: z.string().optional(),
  preferredContactChannel: z.string().optional(),
  acquisitionSource: z.string().optional(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  tags: z.array(z.string()).optional(),
  clientTier: z.enum(['VIP_PLATINUM', 'HIGH_NET_WORTH', 'COMMERCIAL', 'RETAIL', 'PROSPECT']).optional(),
  preferredStudio: z.enum(['INDIRANAGAR', 'WHITEFIELD', 'HSR_LAYOUT', 'VIRTUAL']).optional(),
  propertyDetails: z.object({
    community: z.string().optional(),
    configuration: z.string().optional(),
    estimatedAreaSqFt: z.number().optional(),
    possessionDate: z.string().optional(),
  }).optional(),
  estimatedDealValue: z.number().optional(),
  currentPipelineStage: z.enum([
    'NEW_INQUIRY',
    'QUALIFIED',
    'STUDIO_CONSULTATION',
    'DESIGN_PROPOSAL_SENT',
    'NEGOTIATION',
    'CLOSED_WON',
    'CLOSED_LOST',
  ]).optional(),
  assignedRepId: z.string().optional(),
  assignedRepName: z.string().optional(),
  preferredContactChannel: z.string().optional(),
  acquisitionSource: z.string().optional(),
  notes: z.string().optional(),
});

export const updatePipelineStageSchema = z.object({
  stage: z.enum([
    'NEW_INQUIRY',
    'QUALIFIED',
    'STUDIO_CONSULTATION',
    'DESIGN_PROPOSAL_SENT',
    'NEGOTIATION',
    'CLOSED_WON',
    'CLOSED_LOST',
  ]),
  reason: z.string().optional(),
});

export const assignSalesRepSchema = z.object({
  repId: z.string().min(1, 'Representative ID is required'),
});

export const convertLeadToProjectSchema = z.object({
  projectName: z.string().optional(),
  scope: z.string().optional(),
  estimatedBudget: z.number().optional(),
});

export const convertLeadToOrderSchema = z.object({
  itemsDescription: z.string().optional(),
  totalAmount: z.number().optional(),
});

export const recordLeadActivitySchema = z.object({
  leadId: z.string(),
  type: z.enum(['CALL', 'EMAIL', 'WHATSAPP', 'NOTE', 'STATUS_CHANGE', 'MEETING', 'STUDIO_VISIT']),
  direction: z.enum(['INBOUND', 'OUTBOUND']).optional(),
  summary: z.string().min(1, 'Summary is required'),
  outcome: z.enum(['CONNECTED', 'LEFT_VOICEMAIL', 'WHATSAPP_SENT', 'MEETING_COMPLETED', 'RESCHEDULED', 'NO_ANSWER']).optional(),
  performedBy: z.string().optional(),
  scheduledFollowUpAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const trackLeadStatusTransitionSchema = z.object({
  leadId: z.string(),
  fromStatus: z.string(),
  toStatus: z.string(),
  changedBy: z.string().optional(),
  reason: z.string().optional(),
});

