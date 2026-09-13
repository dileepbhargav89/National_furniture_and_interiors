'use client';

import { setTokenProvider } from '@nfi/api-client';
import { useAuthStore } from '../features/auth/store/auth.store';

let isInitialized = false;

export function initStorefrontApiClient(): void {
  if (isInitialized) return;
  setTokenProvider(() => {
    if (typeof window === 'undefined') return null;
    return useAuthStore.getState().accessToken;
  });
  isInitialized = true;
}

if (typeof window !== 'undefined') {
  initStorefrontApiClient();
}
