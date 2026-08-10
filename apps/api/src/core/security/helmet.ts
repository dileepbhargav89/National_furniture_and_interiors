// Security response headers — docs/02_enterprise_architecture.md §16 ("Helmet.js defaults, strict
// CORS allow-list, CSP tuned for Cloudinary/Razorpay script/frame sources"). Default Helmet
// policy only for now — CSP tuning for Cloudinary/Razorpay sources is deferred until those
// integrations exist (Phase 2/Phase 5, docs/15_master_project_plan.md §3.1); tuning a CSP for
// third-party origins that aren't wired into any module yet would invent a requirement, not
// implement one.
import helmet from 'helmet';

export const securityHeaders = helmet();
