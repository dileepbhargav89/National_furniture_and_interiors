'use client';

import React from 'react';
import Link from 'next/link';
import { useOptionalRealtimeNotifications } from './realtime-notification-provider';

export function AdminNotificationBell() {
  const realtimeState = useOptionalRealtimeNotifications();
  const unreadCount = realtimeState?.unreadCount ?? 0;
  const hasNewAlert = realtimeState?.hasNewAlert ?? false;
  const isConnected = realtimeState?.isConnected ?? false;

  return (
    <Link
      href="/notifications"
      className={`relative rounded-md p-2 text-gray-500 transition-all duration-300 hover:bg-gray-50 hover:text-gray-800 ${
        hasNewAlert ? 'scale-105 bg-[#C5A880]/10 text-gray-900 ring-2 ring-[#C5A880]' : ''
      }`}
      title={`Notifications & Operations Hub${isConnected ? ' (Live Stream Active)' : ''}`}
      aria-label="Notifications"
    >
      <svg
        className={`h-5 w-5 transition-transform duration-300 ${hasNewAlert ? 'animate-bounce text-[#C5A880]' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {/* Unread count badge pill */}
      {unreadCount > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white"
          style={{ backgroundColor: hasNewAlert ? '#D4AF37' : '#171717' }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* Live SSE connection indicator dot */}
      {isConnected && (
        <span
          className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-1 ring-white"
          title="Real-time event stream connected"
        />
      )}
    </Link>
  );
}
