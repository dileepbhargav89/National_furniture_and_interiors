'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../features/auth/store/auth.store';
import { setTokenProvider, setUnauthorizedHandler } from '@nfi/api-client';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register the Zustand token with the shared api-client so every service
    // call automatically gets an Authorization: Bearer <token> header.
    setTokenProvider(() => useAuthStore.getState().token);

    // If an authenticated endpoint returns 401, clear credentials and redirect to /login
    setUnauthorizedHandler(() => {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    });
  }, []);

  return <>{children}</>;
}
