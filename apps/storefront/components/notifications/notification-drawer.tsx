'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Check,
  ShoppingBag,
  Palette,
  MessageSquare,
  ExternalLink,
  Sparkles,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { NotificationsService, Notification, NotificationType } from '@nfi/api-client';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

type FilterCategory = 'ALL' | 'ORDERS' | 'DESIGN' | 'CONCIERGE';

export function NotificationDrawer({ isOpen, onClose, onCountChange }: NotificationDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterCategory>('ALL');

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await NotificationsService.getMyNotifications(30, 0);
      const list = res.data || [];
      setNotifications(list);
      const unread = list.filter((n) => !n.isRead).length;
      if (onCountChange) onCountChange(unread);
    } catch {
      // If unauthenticated or offline, show empty gracefully
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // Accessibility: Listen for Escape key to close dialog
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Performance & CWV: Lock body scroll to prevent scroll chaining
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const previous = [...notifications];
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await NotificationsService.markAsRead(id);
      const remainingUnread = notifications.filter((n) => n.id !== id && !n.isRead).length;
      if (onCountChange) onCountChange(remainingUnread);
    } catch {
      // Rollback on network failure
      setNotifications(previous);
    }
  };

  const handleMarkAllAsRead = async () => {
    const previous = [...notifications];
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (onCountChange) onCountChange(0);
    try {
      await NotificationsService.markAllAsRead();
    } catch {
      setNotifications(previous);
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === 'ALL') return true;
      if (activeTab === 'ORDERS') {
        return (
          n.type === 'ORDER_CONFIRMED' ||
          n.type === 'ORDER_IN_PRODUCTION' ||
          n.type === 'PAYMENT_RECEIVED' ||
          n.type === 'INVOICE_GENERATED'
        );
      }
      if (activeTab === 'DESIGN') {
        return (
          n.type === 'DESIGN_PROPOSAL_READY' ||
          n.type === 'STUDIO_VISIT_SCHEDULED'
        );
      }
      if (activeTab === 'CONCIERGE') {
        return (
          n.type === 'LEAD_ASSIGNED' ||
          n.type === 'BROADCAST' ||
          n.type === 'GENERAL' ||
          n.type === 'SECURITY_ALERT'
        );
      }
      return true;
    });
  }, [notifications, activeTab]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'ORDER_CONFIRMED':
      case 'ORDER_IN_PRODUCTION':
      case 'PAYMENT_RECEIVED':
      case 'INVOICE_GENERATED':
        return <ShoppingBag className="w-4 h-4 text-[#8C7355]" />;
      case 'DESIGN_PROPOSAL_READY':
      case 'STUDIO_VISIT_SCHEDULED':
        return <Palette className="w-4 h-4 text-[#C5A059]" />;
      case 'SECURITY_ALERT':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-stone-500" />;
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHrs < 1) return 'Just now';
      if (diffHrs < 24) return `${diffHrs}h ago`;
      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Agent 4: Smart Funnel Checkpoints for Actionable Deep-linking
  const getActionDetails = (n: Notification) => {
    if (n.actionUrl) {
      return { url: n.actionUrl, label: n.actionLabel || 'View Details' };
    }
    switch (n.type) {
      case 'ORDER_CONFIRMED':
      case 'ORDER_IN_PRODUCTION':
      case 'PAYMENT_RECEIVED':
      case 'INVOICE_GENERATED':
        return { url: '/account/orders', label: 'Track Order' };
      case 'DESIGN_PROPOSAL_READY':
        return { url: '/design-services', label: 'Review 3D Concept' };
      case 'STUDIO_VISIT_SCHEDULED':
      case 'LEAD_ASSIGNED':
        return { url: '/contact', label: 'Studio Directions' };
      default:
        return null;
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-drawer-title"
    >
      {/* Backdrop with a11y click dismiss */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Luxury Drawer */}
      <div className="relative w-full max-w-md bg-[#FAF9F6] h-full max-h-screen shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 border-l border-[#EAE6DF]">
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-[#2C2C2C] flex items-center justify-between bg-[#171717] text-white">
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="notification-drawer-title"
                className="text-base font-serif font-semibold tracking-wide"
              >
                Notification Center
              </h2>
              {unreadCount > 0 && (
                <span className="bg-[#C5A059] text-black text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5 tracking-wider uppercase font-sans">
              National Concierge &amp; Client Services
            </p>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="min-h-[44px] px-3 py-2 text-xs text-[#C5A059] hover:text-white transition-colors flex items-center gap-1 rounded focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
                title="Mark all as read"
                aria-label="Mark all notifications as read"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-400 hover:text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
              aria-label="Close notifications panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Luxury Segmented Filter Control — Zero Overflow, No Scrollbars */}
        <div className="px-4 py-2.5 bg-[#F4F1EB] border-b border-[#EAE6DF]">
          <div
            className="grid grid-cols-4 gap-1 p-1 bg-[#EAE6DF]/70 rounded-lg"
            role="tablist"
            aria-label="Notification filters"
          >
            {[
              { key: 'ALL' as FilterCategory, label: 'All' },
              { key: 'ORDERS' as FilterCategory, label: 'Orders' },
              { key: 'DESIGN' as FilterCategory, label: 'Design' },
              { key: 'CONCIERGE' as FilterCategory, label: 'Concierge' },
            ].map(({ key, label }) => (
              <button
                key={key}
                role="tab"
                aria-selected={activeTab === key}
                onClick={() => setActiveTab(key)}
                className={`py-2 px-1 text-xs rounded-md font-medium transition-all text-center flex items-center justify-center min-h-[38px] ${
                  activeTab === key
                    ? 'bg-[#171717] text-white shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                }`}
              >
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden luxury-scrollbar divide-y divide-[#EFECE6] p-3 space-y-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-400">
              <div className="w-6 h-6 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs mt-3 font-medium">Connecting to concierge desk...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-white border border-[#EAE6DF] flex items-center justify-center text-[#8C7355] mb-4 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-serif font-medium text-stone-900">
                You&apos;re completely up to date
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-xs leading-relaxed">
                No unread alerts in this category. We will notify you when your bespoke pieces or 3D concepts advance.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const action = getActionDetails(notification);
              const isExternal =
                action?.url.startsWith('http://') ||
                action?.url.startsWith('https://') ||
                action?.url.startsWith('tel:') ||
                action?.url.startsWith('mailto:');

              return (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg transition-all relative group ${
                    !notification.isRead
                      ? 'bg-[#FCFAF7] border border-[#EAE6DF] shadow-xs'
                      : 'bg-white/70 hover:bg-white border border-transparent hover:border-[#EAE6DF]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        !notification.isRead
                          ? 'bg-white shadow-xs border border-[#EAE6DF]'
                          : 'bg-stone-100'
                      }`}
                    >
                      {getTypeIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-xs truncate ${
                            !notification.isRead
                              ? 'text-stone-900 font-bold'
                              : 'text-stone-800 font-medium'
                          }`}
                        >
                          {notification.title}
                        </h4>
                        <span className="text-[10px] text-stone-400 flex-shrink-0 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>

                      {/* Action Deep Link & Read Handler */}
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        {action && (
                          isExternal ? (
                            <a
                              href={action.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                if (!notification.isRead) handleMarkAsRead(notification.id);
                                onClose();
                              }}
                              className="min-h-[44px] inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8C7355] hover:text-[#171717] uppercase tracking-wider transition-colors"
                            >
                              <span>{action.label}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <Link
                              href={action.url}
                              onClick={() => {
                                if (!notification.isRead) handleMarkAsRead(notification.id);
                                onClose();
                              }}
                              className="min-h-[44px] inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8C7355] hover:text-[#171717] uppercase tracking-wider transition-colors"
                            >
                              <span>{action.label}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )
                        )}

                        {!notification.isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                            className="min-h-[44px] px-2 py-1 text-[11px] text-stone-400 hover:text-stone-900 transition-colors ml-auto flex items-center"
                            aria-label={`Mark "${notification.title}" as read`}
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Unread indicator dot */}
                    {!notification.isRead && (
                      <span
                        className="w-2 h-2 rounded-full bg-[#C5A059] flex-shrink-0 mt-1.5 shadow-xs"
                        aria-label="Unread notification"
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer with Link to Full Notification Hub */}
        <div className="p-3.5 bg-white border-t border-[#EAE6DF] flex items-center justify-between">
          <Link
            href="/notifications"
            onClick={onClose}
            className="w-full py-2.5 px-4 text-center text-xs font-semibold text-stone-800 hover:text-black bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-[#EAE6DF] rounded-md transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Open Full Notification Hub</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#8C7355]" />
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
