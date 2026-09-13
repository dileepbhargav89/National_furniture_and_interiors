import { apiClient } from './client';
import { RegisterFormData, LoginFormData } from '@nfi/shared';
import { User } from './users';

export const AuthService = {
  login: async (data: LoginFormData) => {
    return apiClient.post<{ status: 'AUTHENTICATED' | 'MFA_REQUIRED' | 'MFA_ENROLMENT_REQUIRED', accessToken?: string, userId?: string }>('/api/v1/auth/login', data);
  },
  
  register: async (data: RegisterFormData) => {
    return apiClient.post<{ user: User, token: string }>('/api/v1/auth/register', data);
  },
  
  logout: async () => {
    return apiClient.post<{ success: boolean }>('/api/v1/auth/logout');
  },
  
  me: async () => {
    return apiClient.get<{ user: User }>('/api/v1/auth/me');
  },
  
  refresh: async () => {
    return apiClient.post<{ user: User, token: string }>('/api/v1/auth/refresh');
  },
  
  setupMfa: async (data: { userId: string }) => {
    return apiClient.post<{ secret: string, otpAuthUrl: string }>('/api/v1/auth/mfa/setup', data);
  },
  
  verifyMfa: async (data: { userId: string, code: string }) => {
    return apiClient.post<{ status: 'AUTHENTICATED', accessToken: string }>('/api/v1/auth/mfa/verify', data);
  },

  googleLogin: async (data: { idToken: string }) => {
    return apiClient.post<{ status: 'AUTHENTICATED' | 'MFA_REQUIRED' | 'MFA_ENROLMENT_REQUIRED', accessToken?: string, userId?: string }>('/api/v1/auth/google', data);
  },

  facebookLogin: async (data: { accessToken: string }) => {
    return apiClient.post<{ status: 'AUTHENTICATED' | 'MFA_REQUIRED' | 'MFA_ENROLMENT_REQUIRED', accessToken?: string, userId?: string }>('/api/v1/auth/facebook', data);
  },

  sendOtp: async (data: { phone: string }) => {
    return apiClient.post<{ message: string }>('/api/v1/auth/otp/send', data);
  },

  verifyOtp: async (data: { phone: string, code: string }) => {
    return apiClient.post<{ status: 'AUTHENTICATED', accessToken?: string, userId?: string }>('/api/v1/auth/otp/verify', data);
  }
};
