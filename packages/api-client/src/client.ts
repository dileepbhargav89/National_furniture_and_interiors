import { ApiResponse } from '@nfi/shared';

export type FetchOptions = Omit<RequestInit, 'body'> & {
  params?: Record<string, unknown>;
  body?: BodyInit | null;
};

export class ApiError extends Error {
  public code?: string;
  public data?: unknown;

  constructor(message: string, code?: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    if (code !== undefined) this.code = code;
    if (data !== undefined) this.data = data;
  }
}

// Global token provider — call setTokenProvider() once on app startup to inject
// a getter that returns the current Bearer token. The api-client never imports
// from the auth store directly, keeping the dependency direction clean.
let _getToken: (() => string | null) | null = null;
let _onUnauthorized: (() => void) | null = null;

export function setTokenProvider(fn: () => string | null): void {
  _getToken = fn;
}

export function setUnauthorizedHandler(fn: () => void): void {
  _onUnauthorized = fn;
}

/** Convenience: read the resolved token from whichever provider is registered. */
export function getAuthToken(): string | null {
  return _getToken ? _getToken() : null;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    let url =
      baseUrl ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:4000';

    // In client browser, if baseUrl targets localhost and browser is accessing via 127.0.0.1 or LAN, align hostname
    if (typeof window !== 'undefined' && window.location?.hostname) {
      const host = window.location.hostname;
      if (host !== 'localhost' && url.includes('//localhost:')) {
        url = url.replace('//localhost:', `//${host}:`);
      }
    }

    this.baseUrl = url;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async fetch<T>(path: string, options?: FetchOptions): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers = new Headers(options?.headers);
    if (!headers.has('Content-Type') && options?.body && typeof options.body === 'string') {
      headers.set('Content-Type', 'application/json');
    }

    // Inject stored JWT as Bearer token if a provider is registered and the
    // caller hasn't already set their own Authorization header.
    if (!headers.has('Authorization')) {
      const token = _getToken ? _getToken() : null;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const { params: _params, body, ...restOptions } = options ?? {};

    const requestInit: RequestInit = {
      credentials: 'include',
      ...restOptions,
      headers,
    };
    if (body !== undefined) {
      requestInit.body = body;
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), requestInit);
    } catch (networkErr: unknown) {
      const errMessage = networkErr instanceof Error ? networkErr.message : String(networkErr);
      throw new ApiError(
        `Failed to connect to API at ${url.toString()} (${errMessage}). Ensure the API server is active on port 4000.`,
        'NETWORK_ERROR',
        { url: url.toString(), originalError: errMessage },
      );
    }

    let data: Record<string, unknown>;
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      throw new ApiError(`Invalid JSON response: ${response.statusText}`);
    }

    if (!response.ok || data.success === false) {
      if (response.status === 401 && _onUnauthorized && !path.includes('/auth/login')) {
        _onUnauthorized();
      }
      const errObj = (data.error && typeof data.error === 'object' ? data.error : null) as Record<
        string,
        unknown
      > | null;
      const message = String(data.message || errObj?.message || response.statusText);
      const code = errObj?.code ? String(errObj.code) : undefined;
      const errorData = errObj?.details || data.data;
      throw new ApiError(message, code, errorData);
    }

    return data as unknown as ApiResponse<T>;
  }

  public get<T>(path: string, options?: FetchOptions | undefined) {
    return this.fetch<T>(path, { ...(options ?? {}), method: 'GET' });
  }

  public post<T>(path: string, data?: unknown, options?: FetchOptions | undefined) {
    const init: FetchOptions = { ...(options ?? {}), method: 'POST' };
    if (data !== undefined) init.body = JSON.stringify(data);
    return this.fetch<T>(path, init);
  }

  public put<T>(path: string, data?: unknown, options?: FetchOptions | undefined) {
    const init: FetchOptions = { ...(options ?? {}), method: 'PUT' };
    if (data !== undefined) init.body = JSON.stringify(data);
    return this.fetch<T>(path, init);
  }

  public patch<T>(path: string, data?: unknown, options?: FetchOptions | undefined) {
    const init: FetchOptions = { ...(options ?? {}), method: 'PATCH' };
    if (data !== undefined) init.body = JSON.stringify(data);
    return this.fetch<T>(path, init);
  }

  public delete<T>(path: string, options?: FetchOptions | undefined) {
    return this.fetch<T>(path, { ...(options ?? {}), method: 'DELETE' });
  }
}

// Export a default instance for client-side usage
export const apiClient = new ApiClient();
