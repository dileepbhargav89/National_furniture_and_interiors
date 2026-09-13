import { OAuth2Client } from 'google-auth-library';
import type { IGoogleAuthService, GooglePayload } from '../application/ports';
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
}
