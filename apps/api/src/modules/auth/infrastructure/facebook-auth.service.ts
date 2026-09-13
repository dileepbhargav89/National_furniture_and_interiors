import type { IFacebookAuthService, FacebookPayload } from '../application/ports';

export class FacebookAuthService implements IFacebookAuthService {
  async verifyAccessToken(accessToken: string): Promise<FacebookPayload> {
    const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
    const data = (await response.json()) as any;

    if (data.error || !data.email) {
      throw new Error(data.error?.message || 'Invalid Facebook token payload');
    }

    return {
      email: data.email,
      id: data.id,
      name: data.name,
    };
  }
}
