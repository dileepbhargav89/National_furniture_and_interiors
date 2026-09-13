import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setToken: (token: string | null, user?: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, accessToken: token, isAuthenticated: true }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
      setToken: (token, user = null) => {
        let parsedUser = user;
        if (token && !parsedUser) {
          try {
            const payloadBase64 = token.split('.')[1];
            if (payloadBase64) {
              const decoded = JSON.parse(
                typeof window !== 'undefined'
                  ? atob(payloadBase64)
                  : Buffer.from(payloadBase64, 'base64').toString('utf-8')
              );
              parsedUser = {
                id: decoded.sub || decoded.userId || 'user-default',
                email: decoded.email || '',
                fullName: decoded.name || decoded.fullName || 'Valued Patron',
                role: decoded.role || decoded.userType || 'CUSTOMER',
              };
            }
          } catch {
            // Ignore malformed token decode
          }
        }
        set({
          accessToken: token,
          isAuthenticated: !!token,
          ...(parsedUser ? { user: parsedUser } : {}),
        });
      },
    }),
    {
      name: 'nfi-auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        isAuthenticated: !!state.accessToken,
        user: state.user,
      }),
    }
  )
);
