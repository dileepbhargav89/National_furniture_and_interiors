import { describe, expect, it } from 'vitest';
import { parseEnv } from '../../../src/core/config/env';

const VALID_ENV: NodeJS.ProcessEnv = {
  NODE_ENV: 'test',
  PORT: '4000',
  MONGODB_URI: 'mongodb://localhost:27017/nfi_test',
  REDIS_URL: 'redis://localhost:6379',
  CORS_ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:3001',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_TTL: '7d',
  MFA_TOTP_ISSUER: 'National Furniture & Interiors',
  RAZORPAY_KEY_ID: 'rzp_test_key',
  RAZORPAY_KEY_SECRET: 'rzp_test_secret',
  RAZORPAY_WEBHOOK_SECRET: 'rzp_test_webhook_secret',
  CLOUDINARY_CLOUD_NAME: 'nfi-test',
  CLOUDINARY_API_KEY: 'cloudinary_key',
  CLOUDINARY_API_SECRET: 'cloudinary_secret',
  CLOUDINARY_UPLOAD_PRESET: 'nfi-preset',
  EMAIL_PROVIDER_API_KEY: 'email_key',
  SMS_WHATSAPP_PROVIDER_API_KEY: 'sms_key',
  SENTRY_DSN: '',
  LOG_LEVEL: 'info',
};

describe('parseEnv', () => {
  it('accepts a fully populated, valid environment', () => {
    const env = parseEnv(VALID_ENV);
    expect(env.NODE_ENV).toBe('test');
    expect(env.PORT).toBe(4000);
  });

  it('fails fast with a clear message when a required variable is missing', () => {
    const { MONGODB_URI: _MONGODB_URI, ...rest } = VALID_ENV;
    expect(() => parseEnv(rest)).toThrowError(/MONGODB_URI/);
  });

  it('rejects a JWT secret that is too short', () => {
    expect(() => parseEnv({ ...VALID_ENV, JWT_ACCESS_SECRET: 'too-short' })).toThrowError(
      /JWT_ACCESS_SECRET/,
    );
  });

  it('rejects an invalid NODE_ENV value', () => {
    expect(() => parseEnv({ ...VALID_ENV, NODE_ENV: 'production-ish' })).toThrowError(/NODE_ENV/);
  });
});
