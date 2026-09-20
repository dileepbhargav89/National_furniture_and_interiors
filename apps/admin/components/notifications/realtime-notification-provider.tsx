'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { NotificationsService, type NotificationToast } from '@nfi/api-client';

export type { NotificationToast };

interface RealtimeNotificationContextType {
  isConnected: boolean;
  unreadCount: number;
  toasts: NotificationToast[];
  isMuted: boolean;
  hasNewAlert: boolean;
  toggleMute: () => void;
  dismissToast: (id: string) => void;
  markAllAsRead: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const RealtimeNotificationContext = createContext<RealtimeNotificationContextType | null>(null);

/**
 * Synthesizes a luxury acoustic double chime using Web Audio API.
 * Uses zero audio file downloads, zero lag, zero 404 risk.
 */
function playLuxuryAcousticChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic double chime (D5: 587.33Hz -> A5: 880Hz)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.09);

    // Warm exponential decay
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    gain2.gain.setValueAtTime(0.001, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.09, now + 0.13);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.65);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.9);
  } catch {
    // Graceful handling of browser autoplay restrictions
  }
}

export function RealtimeNotificationProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [hasNewAlert, setHasNewAlert] = useState(false);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize mute preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nfi_chime_muted');
      if (stored === 'true') {
        setIsMuted(true);
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('nfi_chime_muted', String(next));
      }
      return next;
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await NotificationsService.getUnreadCount();
      if (res && res.data && typeof res.data.count === 'number') {
        setUnreadCount(res.data.count);
      }
    } catch {
      // ignore
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await NotificationsService.markAllAsRead();
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }, []);

  // Fetch initial unread count on mount or token change
  useEffect(() => {
    if (token) {
      refreshUnreadCount();
    }
  }, [token, refreshUnreadCount]);

  // Connect to SSE stream
  useEffect(() => {
    if (!token || typeof window === 'undefined') {
      setIsConnected(false);
      return;
    }

    const streamUrl = NotificationsService.getStreamUrl(token);
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(streamUrl);

      eventSource.addEventListener('connected', () => {
        setIsConnected(true);
      });

      eventSource.addEventListener('notification', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          // 1. Play audio chime if not muted
          if (!isMuted) {
            playLuxuryAcousticChime();
          }

          // 2. Pulse the bell indicator
          setHasNewAlert(true);
          if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
          alertTimeoutRef.current = setTimeout(() => setHasNewAlert(false), 5000);

          // 3. Increment unread count
          setUnreadCount((c) => c + 1);

          // 4. Add floating toast
          const duration = data.priority === 'URGENT' ? 12000 : 8000;
          const newToast: NotificationToast = {
            id: data.id || `toast-${Date.now()}`,
            title: data.title || 'New Notification',
            message: data.message || '',
            type: data.type,
            priority: data.priority || 'NORMAL',
            actionUrl: data.actionUrl,
            actionLabel: data.actionLabel,
            createdAt: data.createdAt || new Date().toISOString(),
            duration,
          };

          setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
        } catch {
          // ignore malformed message
        }
      });

      eventSource.onerror = () => {
        setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, [token, isMuted]);

  return (
    <RealtimeNotificationContext.Provider
      value={{
        isConnected,
        unreadCount,
        toasts,
        isMuted,
        hasNewAlert,
        toggleMute,
        dismissToast,
        markAllAsRead,
        refreshUnreadCount,
      }}
    >
      {children}
    </RealtimeNotificationContext.Provider>
  );
}

export function useRealtimeNotifications() {
  const context = useContext(RealtimeNotificationContext);
  if (!context) {
    throw new Error('useRealtimeNotifications must be used within a RealtimeNotificationProvider');
  }
  return context;
}

export function useOptionalRealtimeNotifications() {
  return useContext(RealtimeNotificationContext);
}
