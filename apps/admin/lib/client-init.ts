'use client';

import { setTokenProvider } from '@nfi/api-client';
import { useAuthStore } from '../features/auth/store/auth.store';

let isInitialized = false;

export function initAdminApiClient(): void {
  if (isInitialized) return;
  setTokenProvider(() => {
    if (typeof window === 'undefined') return null;
    return useAuthStore.getState().token;
  });
  isInitialized = true;
}

if (typeof window !== 'undefined') {
  initAdminApiClient();
}
