import { describe, it, expect, vi } from 'vitest';
import { authService } from '../services/auth.service';
import { apiClient } from '@nfi/api-client';

// Mock the apiClient
vi.mock('@nfi/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('AuthService', () => {
  it('should call the login endpoint correctly', async () => {
    const mockResponse = { status: 'success', data: { accessToken: 'token123' } };
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse as never);

    const data = { email: 'test@example.com', password: 'password123' };
    const res = await authService.login(data);

    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/login', data);
    expect(res).toEqual(mockResponse);
  });

  it('should call the register endpoint correctly', async () => {
    const mockResponse = { status: 'success', data: { accessToken: 'token456' } };
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse as never);

    const data = {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      fullName: 'John Doe',
    };
    const res = await authService.register(data);

    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/register', data);
    expect(res).toEqual(mockResponse);
  });
});
