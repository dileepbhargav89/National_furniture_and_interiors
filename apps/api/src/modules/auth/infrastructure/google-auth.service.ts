import { OAuth2Client } from 'google-auth-library';
import type { IGoogleAuthService, GooglePayload, GoogleAuthParams } from '../application/ports';
import { env } from '../../../core/config/env';

export class GoogleAuthService implements IGoogleAuthService {
  private client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(env.GOOGLE_CLIENT_ID || 'dummy');
  }

  async verifyIdToken(idToken: string): Promise<GooglePayload> {
    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID || 'dummy',
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Invalid Google token payload');
    }

    return {
      email: payload.email,
      sub: payload.sub,
      ...(payload.name ? { name: payload.name } : {}),
    };
  }

  async verifyAccessToken(accessToken: string): Promise<GooglePayload> {
    // 1. Verify token validity via Google's tokeninfo
    const tokenInfo = await this.client.getTokenInfo(accessToken);
    if (!tokenInfo.email) {
      throw new Error('Google access token does not contain an email address');
    }

    if (env.GOOGLE_CLIENT_ID && tokenInfo.aud && tokenInfo.aud !== env.GOOGLE_CLIENT_ID) {
      throw new Error('Google token audience mismatch');
    }

    // 2. Retrieve user profile info (full name) from Google UserInfo endpoint
    let name: string | undefined;
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const profile = (await res.json()) as { name?: string; given_name?: string };
        name = profile.name || profile.given_name;
      }
    } catch {
      // Non-fatal if userinfo endpoint cannot be reached; proceed with email and sub
    }

    return {
      email: tokenInfo.email,
      sub: tokenInfo.sub || tokenInfo.user_id || tokenInfo.email,
      ...(name ? { name } : {}),
    };
  }

  async verifyToken(params: GoogleAuthParams): Promise<GooglePayload> {
    if (params.idToken) {
      return this.verifyIdToken(params.idToken);
    }
    if (params.accessToken) {
      return this.verifyAccessToken(params.accessToken);
    }
    throw new Error('Either idToken or accessToken must be provided');
  }
}
