import { apiClient } from '@nfi/api-client';
import type { LoginFormData, ApiResponse } from '@nfi/shared';

export interface AuthResponse {
  status: 'AUTHENTICATED' | 'MFA_REQUIRED' | 'MFA_ENROLMENT_REQUIRED';
  accessToken?: string;
  userId?: string;
}

export const authService = {
  login: async (data: LoginFormData): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post<AuthResponse>('/api/v1/auth/login', data);
  },

  logout: async (): Promise<ApiResponse<void>> => {
    return apiClient.post<void>('/api/v1/auth/logout');
  },

  setupMfa: async (data: { userId: string }): Promise<ApiResponse<{ secret: string, otpAuthUrl: string }>> => {
    return apiClient.post<{ secret: string, otpAuthUrl: string }>('/api/v1/auth/mfa/setup', data);
  },

  verifyMfa: async (data: { userId: string, code: string }): Promise<ApiResponse<{ status: 'AUTHENTICATED', accessToken: string }>> => {
    return apiClient.post<{ status: 'AUTHENTICATED', accessToken: string }>('/api/v1/auth/mfa/verify', data);
  }
};
