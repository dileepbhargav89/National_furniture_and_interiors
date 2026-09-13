// Strict origin allow-list — docs/08_api_architecture.md §4.8: only the storefront/admin origins
// (per environment) are ever allowed; credentials mode is enabled only for those exact origins,
// never a wildcard, since the refresh-token cookie (§4.2) depends on credentialed cross-origin
// requests working correctly between the API's own origin and the two frontend origins.
import cors from 'cors';
import { env } from '../config';
import { ForbiddenError } from '../exceptions/forbidden.error';

const allowedOrigins = env.CORS_ALLOWED_ORIGINS.split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter((origin) => origin.length > 0);

export const corsPolicy = cors({
  origin(requestOrigin, callback) {
    // No Origin header (server-to-server, curl, same-origin) is allowed through; browsers always
    // send Origin on cross-origin requests, so this does not weaken the browser-facing policy.
    if (!requestOrigin) {
      callback(null, true);
      return;
    }

    const cleanOrigin = requestOrigin.replace(/\/$/, '');

    // Allow explicitly configured origins
    if (allowedOrigins.includes(cleanOrigin)) {
      callback(null, true);
      return;
    }

    // In non-production environments, allow localhost, loopback, and private LAN origins
    if (env.NODE_ENV !== 'production') {
      const isLoopbackOrLocal =
        /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(cleanOrigin) ||
        /^https?:\/\/(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(cleanOrigin);

      if (isLoopbackOrLocal) {
        callback(null, true);
        return;
      }
    }

    // A rejected origin is a policy denial, so it maps to docs/08 §3.11's 403/FORBIDDEN row, not
    // the error handler's generic 500 branch. Browsers block the response either way once CORS
    // fails, but a 500 misreports a working policy as an unexpected server fault: it inflates the
    // 5xx error rate docs/10 §6.2 alerts on, and lets any unauthenticated caller manufacture 500s
    // by sending a foreign Origin. The message deliberately does not echo `requestOrigin` back —
    // docs/09 §11 rule 11 — since the caller controls it and it lands in logs verbatim.
    callback(new ForbiddenError('Origin is not allowed by CORS policy'));
  },
  credentials: true,
});

