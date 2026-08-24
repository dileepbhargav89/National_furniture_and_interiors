// Success half of the API response envelope — docs/08_api_architecture.md §3.2.
//
// Placement note: docs/02_enterprise_architecture.md §16 lists "API response envelope — Consistent
// {success, data, error, meta} shape across all endpoints" as ONE cross-cutting concern, listed
// immediately beside "Error handling". Its error half already lives in this folder
// (error-response.ts), and docs/08 §3.2's whole rationale is that both halves share a shape so
// @nfi/api-client can unwrap every response identically. Keeping the two halves together — rather
// than duplicating a helper into each module's presentation layer, which docs/18 §4.3's DRY rule
// forbids — is why this sits in core/exceptions despite the folder's error-oriented name.
import type { Request, Response } from 'express';

export interface SuccessResponseBody<T> {
  success: true;
  data: T;
  error: null;
  meta: {
    requestId: string;
    timestamp: string;
  };
}

export function buildSuccessResponse<T>(data: T, requestId: string): SuccessResponseBody<T> {
  return {
    success: true,
    data,
    error: null,
    meta: { requestId, timestamp: new Date().toISOString() },
  };
}

/**
 * docs/08 §3.2: even actions with no payload return the envelope with `data: null` — never a bare
 * or bodyless response, so a client never has to special-case "did this endpoint return an
 * envelope or not". docs/08 §3.11 confirms 204 is deliberately unused for the same reason.
 */
export function sendSuccess<T>(req: Request, res: Response, status: number, data: T): void {
  res.status(status).json(buildSuccessResponse(data, req.id ?? 'unknown'));
}
