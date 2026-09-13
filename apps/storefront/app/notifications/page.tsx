'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  CheckCheck,
  RefreshCw,
  ShoppingBag,
  Palette,
  MessageSquare,
  ExternalLink,
  Sparkles,
  Clock,
  ShieldAlert,
  Search,
  Filter,
  ArrowRight,
} from 'lucide-react';
import { NotificationsService, Notification, NotificationType } from '@nfi/api-client';

type FilterCategory = 'ALL' | 'ORDERS' | 'DESIGN' | 'CONCIERGE';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterCategory>('ALL');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadNotifications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await NotificationsService.getMyNotifications(50, 0);
      setNotifications(res.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await NotificationsService.markAsRead(id);
    } catch {
      // rollback on failure
      loadNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await NotificationsService.markAllAsRead();
    } catch {
      loadNotifications();
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Unread filter
      if (showUnreadOnly && n.isRead) return false;

      // Category filter
      if (activeTab === 'ORDERS') {
        const match =
          n.type === 'ORDER_CONFIRMED' ||
          n.type === 'ORDER_IN_PRODUCTION' ||
          n.type === 'PAYMENT_RECEIVED' ||
          n.type === 'INVOICE_GENERATED';
        if (!match) return false;
      } else if (activeTab === 'DESIGN') {
        const match =
          n.type === 'DESIGN_PROPOSAL_READY' ||
          n.type === 'STUDIO_VISIT_SCHEDULED';
        if (!match) return false;
      } else if (activeTab === 'CONCIERGE') {
        const match =
          n.type === 'LEAD_ASSIGNED' ||
          n.type === 'BROADCAST' ||
          n.type === 'GENERAL' ||
          n.type === 'SECURITY_ALERT';
        if (!match) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = (n.title || '').toLowerCase().includes(q);
        const inMsg = (n.message || '').toLowerCase().includes(q);
        const inType = (n.type || '').toLowerCase().includes(q);
        if (!inTitle && !inMsg && !inType) return false;
      }

      return true;
    });
  }, [notifications, activeTab, showUnreadOnly, searchQuery]);

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'ORDER_CONFIRMED':
      case 'ORDER_IN_PRODUCTION':
      case 'PAYMENT_RECEIVED':
      case 'INVOICE_GENERATED':
        return <ShoppingBag className="w-5 h-5 text-[#8C7355]" />;
      case 'DESIGN_PROPOSAL_READY':
      case 'STUDIO_VISIT_SCHEDULED':
        return <Palette className="w-5 h-5 text-[#C5A059]" />;
      case 'SECURITY_ALERT':
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-stone-600" />;
    }
  };

  const getActionDetails = (n: Notification) => {
    if (n.actionUrl) {
      return { url: n.actionUrl, label: n.actionLabel || 'View Details' };
    }
    switch (n.type) {
      case 'ORDER_CONFIRMED':
      case 'ORDER_IN_PRODUCTION':
      case 'PAYMENT_RECEIVED':
      case 'INVOICE_GENERATED':
        return { url: '/orders', label: 'View Order Status' };
      case 'DESIGN_PROPOSAL_READY':
        return { url: '/design-services', label: 'Review Design Concept' };
      case 'STUDIO_VISIT_SCHEDULED':
      case 'LEAD_ASSIGNED':
        return { url: '/contact', label: 'Concierge Studio' };
      default:
        return null;
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF9F6] pb-24">
      {/* Luxury Hero Banner */}
      <section className="bg-[#171717] text-white pt-12 pb-14 border-b border-[#2C2C2C]">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#C5A059] text-xs font-semibold tracking-wider uppercase mb-3">
                <Bell className="w-3.5 h-3.5" />
                <span>Concierge &amp; Dispatch Feed</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-medium tracking-tight text-white">
                Notification Center
              </h1>
              <p className="text-sm text-stone-400 mt-2 max-w-xl font-light leading-relaxed">
                Real-time updates on bespoke furnishings, artisan workshop milestones, 3D architectural renders, and white-glove deliveries.
              </p>
            </div>

            {/* Quick Actions Header */}
            <div className="flex items-center gap-3 flex-wrap">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="min-h-[44px] px-4 py-2 text-xs font-medium text-[#FAF9F6] bg-white/10 hover:bg-white/20 border border-white/20 rounded-md transition-all flex items-center gap-2"
                  aria-label="Mark all notifications as read"
                >
                  <CheckCheck className="w-4 h-4 text-[#C5A059]" />
                  <span>Mark All Read</span>
                </button>
              )}
              <button
                onClick={() => loadNotifications(true)}
                disabled={refreshing}
                className="min-h-[44px] min-w-[44px] px-3.5 py-2 text-xs font-medium text-stone-300 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 rounded-md transition-all flex items-center justify-center gap-2"
                aria-label="Refresh notifications feed"
                title="Refresh feed"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#C5A059]' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-8 pt-6 border-t border-white/10">
            <div className="bg-white/5 rounded-lg p-3.5 border border-white/5">
              <span className="text-[11px] uppercase tracking-wider text-stone-400 font-sans">Total Dispatches</span>
              <p className="text-xl font-serif font-bold text-white mt-1">{notifications.length}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3.5 border border-white/5">
              <span className="text-[11px] uppercase tracking-wider text-stone-400 font-sans">Unread Alerts</span>
              <p className="text-xl font-serif font-bold text-[#C5A059] mt-1">{unreadCount}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3.5 border border-white/5">
              <span className="text-[11px] uppercase tracking-wider text-stone-400 font-sans">Orders &amp; Invoices</span>
              <p className="text-xl font-serif font-bold text-white mt-1">
                {notifications.filter((n) => n.type.startsWith('ORDER') || n.type.startsWith('PAYMENT') || n.type.startsWith('INVOICE')).length}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3.5 border border-white/5">
              <span className="text-[11px] uppercase tracking-wider text-stone-400 font-sans">Design &amp; 3D BIM</span>
              <p className="text-xl font-serif font-bold text-white mt-1">
                {notifications.filter((n) => n.type.startsWith('DESIGN') || n.type.startsWith('STUDIO')).length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 md:px-8 max-w-6xl mt-8">
        {/* Controls Toolbar: Filters, Search, Unread Toggle */}
        <div className="bg-white rounded-xl border border-[#EAE6DF] p-4 shadow-xs mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Category Tabs */}
            <div
              className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 luxury-scrollbar"
              role="tablist"
              aria-label="Notification category filters"
            >
              {[
                { key: 'ALL' as FilterCategory, label: 'All Updates' },
                { key: 'ORDERS' as FilterCategory, label: 'Orders & Production' },
                { key: 'DESIGN' as FilterCategory, label: 'Design & Concepts' },
                { key: 'CONCIERGE' as FilterCategory, label: 'Concierge & Advisories' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={activeTab === key}
                  onClick={() => setActiveTab(key)}
                  className={`min-h-[40px] px-3.5 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                    activeTab === key
                      ? 'bg-[#171717] text-white shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF8F5]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Search and Unread Toggle */}
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              {/* Unread Only Toggle */}
              <button
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                className={`min-h-[40px] px-3.5 py-2 text-xs font-medium rounded-lg border transition-all flex items-center gap-2 whitespace-nowrap ${
                  showUnreadOnly
                    ? 'bg-[#8C7355] text-white border-[#8C7355]'
                    : 'bg-[#FAF8F5] text-stone-700 border-[#EAE6DF] hover:bg-stone-100'
                }`}
                aria-pressed={showUnreadOnly}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Unread only</span>
                {unreadCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    showUnreadOnly ? 'bg-white text-[#8C7355]' : 'bg-[#C5A059] text-white'
                  }`}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Search Box */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search updates…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[40px] text-xs pl-8 pr-3 py-2 bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg focus:outline-none focus:border-[#8C7355] focus:bg-white text-stone-900 transition-all placeholder:text-stone-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Feed */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 bg-white rounded-xl border border-[#EAE6DF]">
            <div className="w-8 h-8 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-stone-500 mt-4 font-medium tracking-wide">
              Retrieving verified dispatches from National Concierge…
            </p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 px-6 bg-white rounded-xl border border-[#EAE6DF] text-center shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-[#EAE6DF] flex items-center justify-center text-[#8C7355] mb-4 shadow-sm">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-serif font-medium text-stone-900">
              No Dispatches in This View
            </h2>
            <p className="text-xs text-stone-500 mt-1.5 max-w-md leading-relaxed">
              {showUnreadOnly
                ? 'You have read all notifications in this category. Toggle off "Unread only" to review your complete history.'
                : searchQuery
                ? `No notifications matched "${searchQuery}". Clear your search query to see all updates.`
                : 'Your bespoke commissions and concierge messages will appear here in real time.'}
            </p>
            {(showUnreadOnly || searchQuery) && (
              <button
                onClick={() => {
                  setShowUnreadOnly(false);
                  setSearchQuery('');
                }}
                className="min-h-[44px] mt-5 px-4 py-2 text-xs font-semibold text-[#8C7355] hover:text-[#171717] transition-colors inline-flex items-center gap-1.5"
              >
                <span>Reset Filters</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const action = getActionDetails(notification);
              const isExternal =
                action?.url.startsWith('http://') ||
                action?.url.startsWith('https://') ||
                action?.url.startsWith('tel:') ||
                action?.url.startsWith('mailto:');

              return (
                <div
                  key={notification.id}
                  className={`p-5 rounded-xl border transition-all relative ${
                    !notification.isRead
                      ? 'bg-white border-[#C5A059]/40 shadow-sm ring-1 ring-[#C5A059]/20'
                      : 'bg-white/80 hover:bg-white border-[#EAE6DF] hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Channel & Category Badge */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        !notification.isRead
                          ? 'bg-[#FAF8F5] border border-[#C5A059]/30 shadow-xs'
                          : 'bg-stone-100 border border-stone-200'
                      }`}
                    >
                      {getTypeIcon(notification.type)}
                    </div>

                    {/* Notification Main Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3
                              className={`text-sm tracking-tight ${
                                !notification.isRead
                                  ? 'text-stone-900 font-bold'
                                  : 'text-stone-800 font-medium'
                              }`}
                            >
                              {notification.title}
                            </h3>
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-semibold">
                              {notification.channel}
                            </span>
                            {!notification.isRead && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8C7355] bg-[#FAF5EE] border border-[#C5A059]/30 px-2 py-0.5 rounded-full">
                                New
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Timestamp */}
                        <span className="text-[11px] text-stone-400 flex-shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>

                      {/* Message Content */}
                      <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                        {notification.message}
                      </p>

                      {/* Action Deep Links & Mark Read */}
                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-stone-100 flex-wrap">
                        {action && (
                          isExternal ? (
                            <a
                              href={action.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                if (!notification.isRead) handleMarkAsRead(notification.id);
                              }}
                              className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C7355] hover:text-[#171717] uppercase tracking-wider transition-colors"
                            >
                              <span>{action.label}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <Link
                              href={action.url}
                              onClick={() => {
                                if (!notification.isRead) handleMarkAsRead(notification.id);
                              }}
                              className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C7355] hover:text-[#171717] uppercase tracking-wider transition-colors"
                            >
                              <span>{action.label}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )
                        )}

                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="min-h-[44px] px-3 py-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors ml-auto flex items-center gap-1.5 rounded hover:bg-stone-50"
                            aria-label={`Mark "${notification.title}" as read`}
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Mark as read</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
