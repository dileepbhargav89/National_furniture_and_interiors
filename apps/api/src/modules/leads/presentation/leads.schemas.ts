import { z } from 'zod';

export const submitLeadSchema = z.object({
  source: z.enum(['WEBSITE_FORM', 'WHATSAPP', 'CALL', 'WALK_IN', 'REFERRAL', 'CAMPAIGN']),
  sourceDetail: z.object({
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
  }).optional(),
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Must be a valid E.164 phone number'),
  interestType: z.enum(['INTERIOR_DESIGN', 'FURNITURE_PURCHASE', 'BOTH']),
  projectType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'MODULAR_KITCHEN', 'BEDROOM', 'LIVING_ROOM', 'HOTEL', 'RESTAURANT', 'INSTITUTION']).optional(),
  budgetRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }).optional(),
  timeline: z.enum(['IMMEDIATE', '1_3_MONTHS', '3_6_MONTHS', 'EXPLORING']).optional(),
  marketingConsent: z.object({
    granted: z.boolean(),
    source: z.string().optional(),
    channels: z.array(z.enum(['SMS', 'WHATSAPP', 'EMAIL'])),
  }),
  captchaToken: z.string().min(1, 'CAPTCHA token is required'),
});

export const listLeadsQuerySchema = z.object({
  status: z.enum(['NEW', 'QUALIFIED', 'CONTACTED', 'CONSULTATION_SCHEDULED', 'CONVERTED', 'DISQUALIFIED', 'LOST']).optional(),
  priority: z.enum(['HOT', 'WARM', 'COLD']).optional(),
  assignedToId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export const assignLeadSchema = z.object({
  assignedToId: z.string(),
  expectedVersion: z.number().int().min(0),
});

export const updateLeadStatusSchema = z.object({
  status: z.enum(['NEW', 'QUALIFIED', 'CONTACTED', 'CONSULTATION_SCHEDULED', 'CONVERTED', 'DISQUALIFIED', 'LOST']),
  expectedVersion: z.number().int().min(0),
});
