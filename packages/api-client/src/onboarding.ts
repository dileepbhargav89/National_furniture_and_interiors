import { apiClient } from './client';
import type { User, UserAddress } from './users';

export interface VerifyOnboardingTokenResponse {
  valid: boolean;
  email: string;
  fullName: string;
  phone?: string | null;
  companyName?: string | null;
  gstin?: string | null;
  userType: string;
}

export interface CompleteOnboardingData {
  token: string;
  fullName: string;
  phone?: string | null | undefined;
  password: string;
  companyName?: string | null | undefined;
  gstin?: string | null | undefined;
  address?: UserAddress | undefined;
}

export interface CompleteOnboardingResponse {
  user: User;
  session?:
    | {
        accessToken: string;
        refreshToken: string;
        refreshTokenExpiresAt: string;
      }
    | undefined;
}

export const OnboardingService = {
  verifyToken: async (token: string) => {
    return apiClient.get<VerifyOnboardingTokenResponse>(
      `/api/v1/onboarding/verify?token=${encodeURIComponent(token)}`,
    );
  },

  completeOnboarding: async (data: CompleteOnboardingData) => {
    return apiClient.post<CompleteOnboardingResponse>('/api/v1/onboarding/complete', data);
  },
};
