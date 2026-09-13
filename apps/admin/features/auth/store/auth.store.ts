import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  roleName: string;
  userType: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  permissions?: string[];
}

interface AuthState {
  token: string | null;
  user: AdminUser | null;
  _hasHydrated: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: AdminUser | null) => void;
  setAuth: (token: string | null, user: AdminUser | null) => void;
  setHasHydrated: (state: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      _hasHydrated: false,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setAuth: (token, user) => set({ token, user }),
      setHasHydrated: (_hasHydrated) => set({ _hasHydrated }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'admin-auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
