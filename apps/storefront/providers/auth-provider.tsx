'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../features/auth/store/auth.store';
import { authService } from '../features/auth/services/auth.service';
import { setTokenProvider } from '@nfi/api-client';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setToken } = useAuthStore();

  useEffect(() => {
    // Register the Zustand token with the shared api-client so every service
    // call automatically gets an Authorization: Bearer <token> header.
    setTokenProvider(() => useAuthStore.getState().accessToken);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const currentToken = useAuthStore.getState().accessToken;
      if (currentToken) {
        try {
          const payloadBase64 = currentToken.split('.')[1];
          if (payloadBase64) {
            const decoded = JSON.parse(
              typeof window !== 'undefined'
                ? atob(payloadBase64)
                : Buffer.from(payloadBase64, 'base64').toString('utf-8')
            );
            if (decoded.exp && Date.now() >= (decoded.exp - 30) * 1000) {
              // Token expired or about to expire: attempt refresh
              const res = await authService.refresh();
              if (res.success && res.data?.accessToken) {
                setToken(res.data.accessToken);
                return;
              } else {
                setToken(null);
              }
            }
          }
        } catch {
          // If token inspection failed, try refresh or clear
          try {
            const res = await authService.refresh();
            if (res.success && res.data?.accessToken) {
              setToken(res.data.accessToken);
              return;
            }
          } catch {
            setToken(null);
          }
        }
      } else {
        // No token present: attempt silent refresh with httpOnly cookie
        try {
          const res = await authService.refresh();
          if (res.success && res.data?.accessToken) {
            setToken(res.data.accessToken);
          }
        } catch {
          // Unauthenticated guest user
        }
      }
    };
    initAuth();
  }, [setToken]);

  return <>{children}</>;
}

