// Boot-time environment schema — docs/06_project_structure.md §4.2, docs/09_security_architecture.md §5.2.
// Mirrors .env.example exactly: every variable documented there is validated here, none silently optional.
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']),
  PORT: z.coerce.number().int().positive(),

  MONGODB_URI: z
    .string()
    .url('MONGODB_URI must be a valid mongodb:// or mongodb+srv:// connection string'),
  REDIS_URL: z.string().url('REDIS_URL must be a valid redis:// connection string'),

  // Comma-separated, no wildcard — docs/08_api_architecture.md §4.8: only the storefront/admin
  // origins are ever allowed, credentialed CORS is never opened to "*".
  CORS_ALLOWED_ORIGINS: z
    .string()
    .min(1, 'CORS_ALLOWED_ORIGINS is required (comma-separated origin list)'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL: z
    .string()
    .regex(/^\d+[smhd]$/, 'JWT_ACCESS_TTL must look like "15m", "1h", "7d"'),
  JWT_REFRESH_TTL: z
    .string()
    .regex(/^\d+[smhd]$/, 'JWT_REFRESH_TTL must look like "15m", "1h", "7d"'),
  MFA_TOTP_ISSUER: z.string().min(1, 'MFA_TOTP_ISSUER is required'),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),

  RAZORPAY_KEY_ID: z.string().min(1, 'RAZORPAY_KEY_ID is required'),
  RAZORPAY_KEY_SECRET: z.string().min(1, 'RAZORPAY_KEY_SECRET is required'),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1, 'RAZORPAY_WEBHOOK_SECRET is required'),

  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
  CLOUDINARY_UPLOAD_PRESET: z.string().min(1, 'CLOUDINARY_UPLOAD_PRESET is required'),

  EMAIL_PROVIDER_API_KEY: z.string().min(1, 'EMAIL_PROVIDER_API_KEY is required'),
  SMS_WHATSAPP_PROVIDER_API_KEY: z.string().min(1, 'SMS_WHATSAPP_PROVIDER_API_KEY is required'),

  SENTRY_DSN: z.string().url().optional().or(z.literal('')),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']),
});

export type Env = z.infer<typeof envSchema>;
