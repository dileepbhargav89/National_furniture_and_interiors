// Strict origin allow-list — docs/08_api_architecture.md §4.8: only the storefront/admin origins
// (per environment) are ever allowed; credentials mode is enabled only for those exact origins,
// never a wildcard, since the refresh-token cookie (§4.2) depends on credentialed cross-origin
// requests working correctly between the API's own origin and the two frontend origins.
import cors from 'cors';
import { env } from '../config';

const allowedOrigins = env.CORS_ALLOWED_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

export const corsPolicy = cors({
  origin(requestOrigin, callback) {
    // No Origin header (server-to-server, curl, same-origin) is allowed through; browsers always
    // send Origin on cross-origin requests, so this does not weaken the browser-facing policy.
    if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
      callback(null, true);
      return;
    }
    // A rejected origin currently falls through error-handler.middleware.ts's generic 500 branch
    // (no ForbiddenError/403 class exists yet — core/exceptions/unauthorized.error.ts documents
    // why). Browsers block the response regardless of status code once CORS fails, so this is a
    // low-stakes, deliberately deferred refinement, not a security gap.
    callback(new Error(`Origin ${requestOrigin} is not allowed by CORS policy`));
  },
  credentials: true,
});
