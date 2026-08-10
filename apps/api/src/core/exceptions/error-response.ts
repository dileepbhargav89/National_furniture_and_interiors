// The one error-envelope shape every endpoint returns — docs/08_api_architecture.md §3.2-3.3.
export interface ErrorResponseBody {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details?: unknown;
    traceId: string;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}

export function buildErrorResponse(params: {
  code: string;
  message: string;
  details?: unknown;
  requestId: string;
}): ErrorResponseBody {
  return {
    success: false,
    data: null,
    error: {
      code: params.code,
      message: params.message,
      details: params.details,
      // traceId correlates this response to the server-side structured log entry for the same
      // request (docs/08_api_architecture.md §3.3) — the request-scoped ID already serves that
      // purpose here, so a second, independent ID system isn't introduced.
      traceId: params.requestId,
    },
    meta: {
      requestId: params.requestId,
      timestamp: new Date().toISOString(),
    },
  };
}
