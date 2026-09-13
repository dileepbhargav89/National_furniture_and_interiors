'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { NotificationsService } from '@nfi/api-client';

export function AdminNotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchCount();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCount = async () => {
    try {
      const res = await NotificationsService.getUnreadCount();
      if (res && res.data && typeof res.data.count === 'number') {
        setUnreadCount(res.data.count);
      }
    } catch {
      // ignore
    }
  };

  return (
    <Link
      href="/notifications"
      className="relative p-2 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
      title="Notifications &amp; Operations Hub"
      aria-label="Notifications"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {unreadCount > 0 && (
        <span
          className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white"
          style={{ backgroundColor: 'var(--nfi-primary)' }}
        />
      )}
    </Link>
  );
}
