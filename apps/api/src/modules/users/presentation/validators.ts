// users module Zod validators — docs/08 §3.12 (strict mode), docs/09 §3.10 + §11 rule 7.
//
// ============================================================================================
// ROLE-PARAMETERIZED SCHEMAS — docs/09 §11 rule 7, verbatim:
//   "Every new endpoint's Zod schema is role-parameterized wherever the same resource has
//    differing writable-field sets per role — NEVER a single permissive schema plus a runtime
//    strip-check."
//
// So there are two distinct schemas below, not one schema plus filtering. A CUSTOMER's
// self-update schema has no `userType`/`roleId`/`status` fields to smuggle values into, and
// because it is .strict(), attempting to send them is a 400, not a silent strip. This is the
// mass-assignment control (docs/09 §3.10) and the defence for docs/12 §3's `users` row negative
// scenario: "Role-parameterized schema rejects a customer smuggling roleId/status".
// ============================================================================================
import { z } from 'zod';
import { MAX_ADDRESSES, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../application/policy';

const addressSchema = z
  .object({
    label: z.string().min(1).max(50),
    line1: z.string().min(1).max(200),
    line2: z.string().max(200).nullable().optional(),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    pincode: z.string().min(3).max(12),
    country: z.string().min(1).max(100),
    isDefault: z.boolean(),
  })
  .strict();

/** Self-service profile update. Deliberately has NO privileged fields at all. */
export const updateOwnProfileSchema = z
  .object({
    fullName: z.string().min(1).max(200).optional(),
    phone: z.string().min(6).max(20).nullable().optional(),
    avatarUrl: z.string().url().max(2048).nullable().optional(),
    addresses: z.array(addressSchema).max(MAX_ADDRESSES).optional(),
  })
  .strict();

/**
 * Admin-only privileged account creation — the separate, higher-privilege schema. `userType` is
 * present here and constrained to STAFF|ADMIN: this endpoint's entire purpose (ADR-0002 Option A)
 * is privileged provisioning, and CUSTOMER accounts are created by public registration instead.
 */
export const adminCreateUserSchema = z
  .object({
    email: z.string().email().max(320),
    fullName: z.string().min(1).max(200),
    phone: z.string().min(6).max(20).nullable().optional(),
    password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
    userType: z.enum(['STAFF', 'ADMIN']),
    roleName: z.string().min(1).max(50),
  })
  .strict();

export const listUsersQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();
