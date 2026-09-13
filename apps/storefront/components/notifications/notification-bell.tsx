'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { NotificationsService } from '@nfi/api-client';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { NotificationDrawer } from './notification-drawer';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuthStore();

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await NotificationsService.getUnreadCount();
      if (res && res.data && typeof res.data.count === 'number') {
        setUnreadCount(res.data.count);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    // Subtle background refresh every 45 seconds when tab is active
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-800 hover:text-black transition-colors relative rounded-full focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
        aria-label={`Concierge and order notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="Concierge &amp; Order Notifications"
      >
        <Bell strokeWidth={1.3} size={20} className={unreadCount > 0 ? 'text-[#171717]' : ''} />
        {unreadCount > 0 && (
          <span
            className="absolute top-2 right-2 bg-[#C5A059] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full shadow-xs border border-white animate-pulse"
            aria-hidden="true"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onCountChange={(count) => setUnreadCount(count)}
      />
    </>
  );
}
