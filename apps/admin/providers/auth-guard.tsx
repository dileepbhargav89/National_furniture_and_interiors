'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../features/auth/store/auth.store';

/**
 * Guards dashboard routes — waits for Zustand store hydration, then redirects
 * to /login if no valid token is found.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only evaluate redirect after client-side hydration is complete
    if ((hasHydrated || mounted) && !token) {
      router.replace('/login');
    }
  }, [token, hasHydrated, mounted, router]);

  // If still hydrating or unauthenticated, show a luxury splash loader
  if (!mounted || (!hasHydrated && !token) || !token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] text-[#171717]">
        <div className="w-10 h-10 rounded-xl bg-[#171717] flex items-center justify-center text-white font-bold text-sm mb-4 shadow-sm">
          NFI
        </div>
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#8C7355] border-t-transparent" />
        <span className="text-xs font-medium text-[#8C7355] mt-3 tracking-wider uppercase">
          Verifying Credentials...
        </span>
      </div>
    );
  }

  return <>{children}</>;
}
