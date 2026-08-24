// Zod validators — docs/08_api_architecture.md §3.12: "Strict-mode schemas (.strict()) reject
// unknown fields rather than silently stripping them", and docs/09 §4.5: strict primitive-typed
// schemas are what prevent a Mongo operator ({"$gt": ""}) being smuggled through a string field.
import { z } from 'zod';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../application/policy';

/**
 * ============================================================================================
 * ADR-0002 (APPROVED, Option A) — `userType` and `roleId` are ABSENT from this schema.
 *
 * Because the schema is `.strict()`, a request containing either is rejected with
 * 400 VALIDATION_ERROR rather than having the field silently stripped — which is the difference
 * between an attacker learning nothing and an attacker's escalation attempt failing loudly.
 * This is also the mass-assignment control required by docs/09 §3.10 and Secure Coding Rule 7.
 *
 * DO NOT add userType/roleId here without a new approved ADR.
 * ============================================================================================
 */
export const registerSchema = z
  .object({
    email: z.string().email('must be a valid email address').max(320),
    password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
    fullName: z.string().min(1).max(200),
    phone: z.string().min(6).max(20).optional(),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().email().max(320),
    password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
  })
  .strict();

export const mfaVerifySchema = z
  .object({
    userId: z.string().min(1),
    code: z.string().regex(/^\d{6}$/, 'must be a 6-digit TOTP code'),
  })
  .strict();

export const mfaSetupSchema = z
  .object({
    userId: z.string().min(1),
  })
  .strict();

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
