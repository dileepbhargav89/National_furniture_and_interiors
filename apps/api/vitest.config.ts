// Injects a valid test environment before any test file imports app code — core/config's
// boot-time validation (docs/09_security_architecture.md §5.2) runs at module-load time, so
// without this every test importing src/app.ts (transitively, via core/config) would fail fast.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      NODE_ENV: 'test',
      PORT: '4000',
      // 127.0.0.1, not `localhost`: Node resolves `localhost` to ::1 first on Windows, while
      // local Redis (Memurai) and MongoDB listen on IPv4 only — which surfaced as spurious
      // `ECONNREFUSED ::1:6379` noise in test output. Pinning the family removes the ambiguity.
      MONGODB_URI: 'mongodb://127.0.0.1:27017/nfi_test',
      REDIS_URL: 'redis://127.0.0.1:6379',
      CORS_ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:3001',
      JWT_ACCESS_SECRET: 'a'.repeat(32),
      JWT_REFRESH_SECRET: 'b'.repeat(32),
      JWT_ACCESS_TTL: '15m',
      JWT_REFRESH_TTL: '7d',
      MFA_TOTP_ISSUER: 'National Furniture & Interiors (Test)',
      RAZORPAY_KEY_ID: 'rzp_test_key',
      RAZORPAY_KEY_SECRET: 'rzp_test_secret',
      RAZORPAY_WEBHOOK_SECRET: 'rzp_test_webhook_secret',
      CLOUDINARY_CLOUD_NAME: 'nfi-test',
      CLOUDINARY_API_KEY: 'cloudinary_test_key',
      CLOUDINARY_API_SECRET: 'cloudinary_test_secret',
      CLOUDINARY_UPLOAD_PRESET: 'nfi-test-preset',
      EMAIL_PROVIDER_API_KEY: 'email_test_key',
      SMS_WHATSAPP_PROVIDER_API_KEY: 'sms_test_key',
      SENTRY_DSN: '',
      LOG_LEVEL: 'error',
    },
    coverage: {
      provider: 'v8',
      include: ['src/modules/**/domain/**', 'src/modules/**/application/**'],
      exclude: ['src/modules/**/application/ports.ts'],
      thresholds: {
        lines: 80,
      },
    },
  },
});
