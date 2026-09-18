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
    confirmPassword: z.string().optional(),
    fullName: z.string().min(1).max(200),
    phone: z
      .string()
      .optional()
      .transform((v) => (v ? v.replace(/[\s\-()]/g, '') : v))
      .refine((v) => !v || /^\+?[1-9]\d{1,14}$/.test(v), {
        message: 'Valid phone number is required',
      }),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().email().max(320),
    password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
  })
  .strict();

export const mfaVerifySchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  code: z
    .string()
    .length(6, 'TOTP code must be 6 digits')
    .regex(/^\d+$/, 'TOTP code must contain only digits'),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'idToken is required'),
});

export const facebookAuthSchema = z.object({
  accessToken: z.string().min(1, 'accessToken is required'),
});

export const sendOtpSchema = z.object({
  phone: z
    .string()
    .transform((v) => v.replace(/[\s\-()]/g, ''))
    .pipe(z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Valid phone number is required')),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .transform((v) => v.replace(/[\s\-()]/g, ''))
    .pipe(z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Valid phone number is required')),
  code: z
    .string()
    .length(6, 'OTP code must be 6 digits')
    .regex(/^\d+$/, 'OTP code must contain only digits'),
});

export const mfaSetupSchema = z
  .object({
    userId: z.string().min(1),
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    email: z.string().email('Must be a valid email address').max(320),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH).optional(),
    newPassword: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH).optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => Boolean(data.password || data.newPassword), {
    message: 'Password is required',
    path: ['password'],
  });

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;
