import { apiClient } from '@nfi/api-client';
import type {
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
  ApiResponse,
} from '@nfi/shared';

export interface AuthResponse {
  status: 'AUTHENTICATED' | 'MFA_REQUIRED' | 'MFA_ENROLMENT_REQUIRED';
  accessToken?: string;
  userId?: string;
}

export const authService = {
  login: async (data: LoginFormData): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post<AuthResponse>('/api/v1/auth/login', data);
  },

  register: async (data: RegisterFormData): Promise<ApiResponse<{ accessToken: string }>> => {
    return apiClient.post<{ accessToken: string }>('/api/v1/auth/register', data);
  },

  refresh: async (): Promise<ApiResponse<{ accessToken: string }>> => {
    return apiClient.post<{ accessToken: string }>('/api/v1/auth/refresh');
  },

  logout: async (): Promise<ApiResponse<void>> => {
    return apiClient.post<void>('/api/v1/auth/logout');
  },

  setupMfa: async (data: {
    userId: string;
  }): Promise<ApiResponse<{ secret: string; otpAuthUrl: string }>> => {
    return apiClient.post<{ secret: string; otpAuthUrl: string }>('/api/v1/auth/mfa/setup', data);
  },

  verifyMfa: async (data: {
    userId: string;
    token: string;
  }): Promise<ApiResponse<{ status: 'AUTHENTICATED'; accessToken: string }>> => {
    return apiClient.post<{ status: 'AUTHENTICATED'; accessToken: string }>(
      '/api/v1/auth/mfa/verify',
      data,
    );
  },

  sendOtp: async (data: { phone: string }): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<{ message: string }>('/api/v1/auth/otp/send', data);
  },

  verifyOtp: async (data: {
    phone: string;
    code: string;
  }): Promise<ApiResponse<{ status: 'AUTHENTICATED'; accessToken?: string; userId?: string }>> => {
    return apiClient.post<{ status: 'AUTHENTICATED'; accessToken?: string; userId?: string }>(
      '/api/v1/auth/otp/verify',
      data,
    );
  },

  forgotPassword: async (
    data: ForgotPasswordFormData,
  ): Promise<ApiResponse<{ success: boolean; message: string; resetToken?: string }>> => {
    return apiClient.post<{ success: boolean; message: string; resetToken?: string }>(
      '/api/v1/auth/forgot-password',
      data,
    );
  },

  resetPassword: async (
    data: ResetPasswordFormData,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return apiClient.post<{ success: boolean; message: string }>(
      '/api/v1/auth/reset-password',
      data,
    );
  },
};
