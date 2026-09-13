'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  NotificationsService,
  Notification,
  NotificationStats,
  NotificationChannel,
  NotificationType,
} from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { NfiButton } from '@/components/ui/nfi-button';

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeChannelFilter, setActiveChannelFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Test send sandbox modal state
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testChannel, setTestChannel] = useState<NotificationChannel>('EMAIL');
  const [testType, setTestType] = useState<NotificationType>('ORDER_CONFIRMED');
  const [testRecipient, setTestRecipient] = useState('');
  const [testTitle, setTestTitle] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState('');

  // Broadcast announcement modal state
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastChannel, setBroadcastChannel] = useState<NotificationChannel>('IN_APP');
  const [broadcastPriority, setBroadcastPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [broadcastActionUrl, setBroadcastActionUrl] = useState('');
  const [broadcastActionLabel, setBroadcastActionLabel] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState('');

  // Template preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewType, setPreviewType] = useState<NotificationType>('ORDER_CONFIRMED');
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [listRes, statsRes] = await Promise.allSettled([
        NotificationsService.listNotifications(100, 0),
        NotificationsService.getStats(),
      ]);

      if (listRes.status === 'fulfilled') {
        setNotifications(listRes.value.data || []);
      }
      if (statsRes.status === 'fulfilled' && statsRes.value.data) {
        setStats(statsRes.value.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // a11y & Performance: Escape key listener for open modals
  useEffect(() => {
    if (!testModalOpen && !previewModalOpen && !broadcastModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (testModalOpen) setTestModalOpen(false);
        if (previewModalOpen) setPreviewModalOpen(false);
        if (broadcastModalOpen) setBroadcastModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [testModalOpen, previewModalOpen, broadcastModalOpen]);

  // Performance & CWV: Lock body scroll during modal display
  useEffect(() => {
    if (testModalOpen || previewModalOpen || broadcastModalOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [testModalOpen, previewModalOpen, broadcastModalOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await NotificationsService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      alert('Failed to mark notification as read');
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient.trim()) {
      alert('Please enter a recipient (email, phone, or patron ID)');
      return;
    }

    try {
      setSendingTest(true);
      setTestSuccess('');
      const res = await NotificationsService.testSend({
        channel: testChannel,
        type: testType,
        recipient: testRecipient.trim(),
        title: testTitle.trim() || undefined,
        message: testMessage.trim() || undefined,
      });

      setTestSuccess(res.message || 'Test notification dispatched successfully!');
      fetchData();
      setTimeout(() => {
        setTestModalOpen(false);
        setTestSuccess('');
        setTestRecipient('');
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to dispatch test notification';
      alert(msg);
    } finally {
      setSendingTest(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      alert('Please enter both a title and message for the announcement.');
      return;
    }

    try {
      setSendingBroadcast(true);
      setBroadcastSuccess('');
      const res = await NotificationsService.broadcast({
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        channel: broadcastChannel,
        priority: broadcastPriority,
        actionUrl: broadcastActionUrl.trim() || undefined,
        actionLabel: broadcastActionLabel.trim() || undefined,
      });

      setBroadcastSuccess(res.message || 'Broadcast announcement published successfully to all patrons!');
      fetchData();
      setTimeout(() => {
        setBroadcastModalOpen(false);
        setBroadcastSuccess('');
        setBroadcastTitle('');
        setBroadcastMessage('');
        setBroadcastActionUrl('');
        setBroadcastActionLabel('');
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish broadcast announcement';
      alert(msg);
    } finally {
      setSendingBroadcast(false);
    }
  };

  const loadTemplatePreview = async (type: NotificationType) => {
    try {
      setPreviewLoading(true);
      setPreviewType(type);
      const res = await NotificationsService.previewTemplate(type);
      if (res.data) {
        setPreviewHtml(res.data.html);
        setPreviewSubject(res.data.subject);
      }
    } catch {
      alert('Failed to load email preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const openPreview = (type: NotificationType = 'ORDER_CONFIRMED') => {
    setPreviewModalOpen(true);
    loadTemplatePreview(type);
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchesChannel = activeChannelFilter === 'ALL' || n.channel === activeChannelFilter;
      if (!matchesChannel) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const recipient = (n.recipientId || '').toLowerCase();
      const title = (n.title || '').toLowerCase();
      const message = (n.message || '').toLowerCase();
      const type = (n.type || '').toLowerCase();

      return recipient.includes(q) || title.includes(q) || message.includes(q) || type.includes(q);
    });
  }, [notifications, activeChannelFilter, searchQuery]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  return (
    <>
      <PageHeader
        title="Notifications & Omnichannel Hub"
        description="Unified delivery engine: Resend (Email), Meta WhatsApp Concierge, MSG91 SMS, and In-App Centers."
        breadcrumbs={[{ label: 'Operations' }, { label: 'Notifications' }]}
        action={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <NfiButton variant="primary" size="sm" onClick={() => setBroadcastModalOpen(true)}>
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              Send Broadcast Alert
            </NfiButton>

            <NfiButton variant="secondary" size="sm" onClick={() => openPreview()}>
              <svg className="w-3.5 h-3.5 mr-1 text-[#8C7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Email Previews
            </NfiButton>

            <NfiButton variant="secondary" size="sm" onClick={() => setTestModalOpen(true)}>
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Test Sandbox
            </NfiButton>

            <NfiButton variant="secondary" size="sm" onClick={fetchData} disabled={loading} aria-label="Refresh notifications">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </NfiButton>
          </div>
        }
      />

      {/* Metrics & Channel Health Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Deliveries */}
        <div className="bg-white p-5 rounded-lg border shadow-xs" style={{ borderColor: 'var(--nfi-border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Total Dispatches</span>
            <span className="p-2 rounded-full bg-stone-100 text-stone-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div className="mt-2 text-2xl font-serif font-bold text-stone-900">{stats?.total ?? notifications.length}</div>
          <div className="mt-1 text-xs text-emerald-600 font-medium">
            {stats ? `${stats.sent} delivered • ${stats.failed} failed` : 'Delivery active'}
          </div>
        </div>

        {/* Resend Email Channel */}
        <div className="bg-white p-5 rounded-lg border shadow-xs" style={{ borderColor: 'var(--nfi-border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Resend Email</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Ready
            </span>
          </div>
          <div className="mt-2 text-2xl font-serif font-bold text-stone-900">
            {stats?.byChannel?.EMAIL ?? notifications.filter((n) => n.channel === 'EMAIL').length}
          </div>
          <div className="mt-1 text-xs text-stone-500">Luxury HTML Branded Templates</div>
        </div>

        {/* WhatsApp Concierge Channel */}
        <div className="bg-white p-5 rounded-lg border shadow-xs" style={{ borderColor: 'var(--nfi-border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">WhatsApp Concierge</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Ready
            </span>
          </div>
          <div className="mt-2 text-2xl font-serif font-bold text-stone-900">
            {stats?.byChannel?.WHATSAPP ?? notifications.filter((n) => n.channel === 'WHATSAPP').length}
          </div>
          <div className="mt-1 text-xs text-stone-500">1-Click Client Messaging</div>
        </div>

        {/* In-App Notifications */}
        <div className="bg-white p-5 rounded-lg border shadow-xs" style={{ borderColor: 'var(--nfi-border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">In-App Centers</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              {unreadCount} unread
            </span>
          </div>
          <div className="mt-2 text-2xl font-serif font-bold text-stone-900">
            {stats?.byChannel?.IN_APP ?? notifications.filter((n) => n.channel === 'IN_APP').length}
          </div>
          <div className="mt-1 text-xs text-stone-500">Storefront &amp; Admin Real-time</div>
        </div>
      </div>

      {error && (
        <div
          className="mb-5 p-4 rounded-md text-sm border"
          style={{
            backgroundColor: 'rgba(198,40,40,0.05)',
            color: 'var(--nfi-danger)',
            borderColor: 'rgba(198,40,40,0.2)',
          }}
        >
          {error}
        </div>
      )}

      {/* Channel Filters & Real-time Search */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto" role="tablist" aria-label="Channel filter">
          {['ALL', 'EMAIL', 'WHATSAPP', 'SMS', 'IN_APP'].map((channel) => (
            <button
              key={channel}
              role="tab"
              aria-selected={activeChannelFilter === channel}
              onClick={() => setActiveChannelFilter(channel)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeChannelFilter === channel
                  ? 'bg-[#171717] text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {channel === 'ALL' && 'All Channels'}
              {channel === 'EMAIL' && 'Email (Resend)'}
              {channel === 'WHATSAPP' && 'WhatsApp Cloud'}
              {channel === 'SMS' && 'SMS (MSG91)'}
              {channel === 'IN_APP' && 'In-App Center'}
            </button>
          ))}
        </div>

        {/* Real-time search filter */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by recipient, title, or type…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 min-h-[38px] text-xs px-3 py-1.5 rounded-md border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-black"
          />
          <span className="text-xs text-stone-500 font-medium whitespace-nowrap">
            Showing {filteredNotifications.length} of {notifications.length} dispatches
          </span>
        </div>
      </div>

      {/* Logs Table / List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-stone-200">
          <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin border-[#8C7355]" />
          <p className="mt-3 text-sm text-stone-500">Loading delivery registry…</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-lg border p-16 text-center border-stone-200">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-sm font-medium text-stone-900">No dispatches found</p>
          <p className="text-xs text-stone-500 mt-1">
            Trigger a test dispatch using the button above to verify multi-channel delivery.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden shadow-xs" style={{ borderColor: 'var(--nfi-border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b text-stone-600 font-semibold uppercase tracking-wider text-[11px]" style={{ borderColor: 'var(--nfi-border)' }}>
                  <th className="py-3 px-4">Status &amp; Channel</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Event &amp; Content</th>
                  <th className="py-3 px-4">Dispatched At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredNotifications.map((notification) => (
                  <tr
                    key={notification.id}
                    className={`hover:bg-stone-50/60 transition-colors ${
                      !notification.isRead ? 'bg-[#FAF8F5]/60' : ''
                    }`}
                  >
                    {/* Status & Channel */}
                    <td className="py-3 px-4 align-top">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            notification.status === 'SENT'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : notification.status === 'FAILED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {notification.status}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600">
                          {notification.channel}
                        </span>
                      </div>
                    </td>

                    {/* Recipient */}
                    <td className="py-3 px-4 align-top">
                      <div className="font-mono text-[11px] text-stone-800 font-medium max-w-[180px] truncate" title={notification.recipientId || 'GLOBAL BROADCAST'}>
                        {notification.recipientId || 'BROADCAST'}
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5">Priority: {notification.priority || 'NORMAL'}</div>
                    </td>

                    {/* Event & Content */}
                    <td className="py-3 px-4 align-top max-w-md">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-stone-900">{notification.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-medium">
                          {notification.type}
                        </span>
                      </div>
                      <p className="text-stone-600 mt-1 leading-relaxed line-clamp-2">{notification.message}</p>
                      {notification.failureReason && (
                        <p className="text-rose-600 text-[10px] mt-1 font-medium">
                          Error: {notification.failureReason}
                        </p>
                      )}
                    </td>

                    {/* Dispatched At */}
                    <td className="py-3 px-4 align-top text-stone-500 whitespace-nowrap">
                      {formatDate(notification.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                      {!notification.isRead && notification.channel === 'IN_APP' && (
                        <NfiButton variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                          Mark read
                        </NfiButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Test Dispatch Sandbox Modal */}
      {testModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="test-sandbox-title"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <h3 id="test-sandbox-title" className="text-base font-serif font-bold text-stone-900">
                  Omnichannel Test Sandbox
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">Dispatch an instant live test to verify channel integration.</p>
              </div>
              <button
                onClick={() => setTestModalOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-400 hover:text-stone-800 rounded-full transition-colors focus:outline-none"
                aria-label="Close test modal"
              >
                ✕
              </button>
            </div>

            {testSuccess && (
              <div className="my-4 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                ✓ {testSuccess}
              </div>
            )}

            <form onSubmit={handleSendTest} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Channel</label>
                  <select
                    value={testChannel}
                    onChange={(e) => setTestChannel(e.target.value as NotificationChannel)}
                    className="w-full text-xs rounded-md border border-stone-300 p-2.5 focus:ring-1 focus:ring-black focus:outline-none bg-white"
                  >
                    <option value="EMAIL">Email (Resend)</option>
                    <option value="WHATSAPP">WhatsApp Concierge</option>
                    <option value="SMS">SMS (MSG91)</option>
                    <option value="IN_APP">In-App Center</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Event Template</label>
                  <select
                    value={testType}
                    onChange={(e) => setTestType(e.target.value as NotificationType)}
                    className="w-full text-xs rounded-md border border-stone-300 p-2.5 focus:ring-1 focus:ring-black focus:outline-none bg-white"
                  >
                    <option value="ORDER_CONFIRMED">Order Confirmed</option>
                    <option value="DESIGN_PROPOSAL_READY">Design Proposal Ready</option>
                    <option value="PAYMENT_RECEIVED">Payment Receipt</option>
                    <option value="STUDIO_VISIT_SCHEDULED">Studio Visit Scheduled</option>
                    <option value="LEAD_ASSIGNED">Lead Consultation</option>
                    <option value="ORDER_IN_PRODUCTION">Order In Production</option>
                    <option value="INVOICE_GENERATED">Invoice Generated</option>
                    <option value="BROADCAST">Broadcast Announcement</option>
                    <option value="GENERAL">General Notice</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Recipient ({testChannel === 'EMAIL' ? 'Email Address' : testChannel === 'WHATSAPP' || testChannel === 'SMS' ? 'Phone with Country Code e.g. +919845012345' : 'Patron / User ID'})
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    testChannel === 'EMAIL'
                      ? 'patron@example.com'
                      : testChannel === 'IN_APP'
                      ? 'user_id or patron_name'
                      : '+91 98450 12345'
                  }
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="w-full text-xs rounded-md border border-stone-300 p-2.5 focus:ring-1 focus:ring-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Custom Title (Optional)</label>
                <input
                  type="text"
                  placeholder="Defaults to template title if blank"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full text-xs rounded-md border border-stone-300 p-2.5 focus:ring-1 focus:ring-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Custom Message / Note (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Defaults to template message if blank"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full text-xs rounded-md border border-stone-300 p-2.5 focus:ring-1 focus:ring-black focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <NfiButton variant="secondary" size="sm" type="button" onClick={() => setTestModalOpen(false)}>
                  Cancel
                </NfiButton>
                <NfiButton variant="primary" size="sm" type="submit" disabled={sendingTest}>
                  {sendingTest ? 'Dispatching…' : 'Send Test Dispatch'}
                </NfiButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Email Template Preview Modal */}
      {previewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-modal-title"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-4xl h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#2A2A2A] flex items-center justify-between bg-[#171717] text-white rounded-t-xl">
              <div>
                <h3 id="preview-modal-title" className="text-base font-serif font-semibold">
                  Luxury Email Template Previewer
                </h3>
                <p className="text-xs text-stone-400 mt-0.5 font-mono">{previewSubject || 'Subject preview'}</p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={previewType}
                  onChange={(e) => loadTemplatePreview(e.target.value as NotificationType)}
                  className="bg-stone-800 text-white text-xs border border-stone-700 rounded px-2.5 py-1.5 focus:outline-none"
                  aria-label="Select notification template"
                >
                  <option value="ORDER_CONFIRMED">Order Confirmed</option>
                  <option value="DESIGN_PROPOSAL_READY">Design Proposal Ready</option>
                  <option value="PAYMENT_RECEIVED">Payment Receipt</option>
                  <option value="STUDIO_VISIT_SCHEDULED">Studio Visit Scheduled</option>
                  <option value="LEAD_ASSIGNED">Lead Consultation</option>
                </select>

                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-400 hover:text-white rounded-full transition-colors text-lg focus:outline-none"
                  aria-label="Close template preview"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Iframe Render Body */}
            <div className="flex-1 bg-stone-100 p-4 overflow-hidden flex items-center justify-center">
              {previewLoading ? (
                <div className="text-stone-500 text-sm font-medium">Rendering luxury template…</div>
              ) : (
                <iframe
                  title="Email Template Render"
                  srcDoc={previewHtml}
                  className="w-full h-full bg-white rounded shadow-xs border border-stone-200"
                />
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-stone-200 bg-white flex items-center justify-between text-xs text-stone-500 rounded-b-xl">
              <span>National Palette: Obsidian (#171717) • Warm Gold (#C5A059) • Taupe (#8C7355) • Alabaster (#FAF9F6)</span>
              <NfiButton variant="secondary" size="sm" onClick={() => setPreviewModalOpen(false)}>
                Close Preview
              </NfiButton>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Announcement Modal */}
      {broadcastModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="broadcast-modal-title"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <h3 id="broadcast-modal-title" className="text-base font-serif font-bold text-stone-900">
                  Send Customer Broadcast Alert
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Publish a global announcement or advisory to all patron notification centers.
                </p>
              </div>
              <button
                onClick={() => setBroadcastModalOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-400 hover:text-stone-800 rounded-full transition-colors focus:outline-none"
                aria-label="Close broadcast modal"
              >
                ✕
              </button>
            </div>

            {broadcastSuccess && (
              <div className="my-4 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                ✓ {broadcastSuccess}
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Channel</label>
                  <select
                    value={broadcastChannel}
                    onChange={(e) => setBroadcastChannel(e.target.value as NotificationChannel)}
                    className="w-full text-xs rounded-md border border-stone-300 p-2.5 focus:ring-1 focus:ring-black focus:outline-none bg-white"
                  >
                    <option value="IN_APP">In-App Notification Center</option>
                    <option value="EMAIL">Email (Resend Broadcast)</option>
                    <option value="WHATSAPP">WhatsApp Concierge</option>
                    <option value="SMS">SMS (MSG91 Broadcast)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Priority</label>
                  <select
                    value={broadcastPriority}
                    onChange={(e) => setBroadcastPriority(e.target.value as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT')}
                    className="w-full text-xs rounded-md border border-stone-300 p-2.5 focus:ring-1 focus:ring-black focus:outline-none bg-white"
                  >
                    <option value="NORMAL">Normal Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Advisory</option>
                    <option value="LOW">Low / Info</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Announcement Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Private Preview: Spring Artisan Collection Now Open"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full text-xs rounded-md border border-stone-300 p-2.5 focus:ring-1 focus:ring-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Announcement Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Exclusive bespoke pieces are now viewable in the atelier. Request a complimentary 3D consultation today."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full text-xs rounded-md border border-stone-300 p-2.5 focus:ring-1 focus:ring-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Action Link URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="/collections or /products"
                    value={broadcastActionUrl}
                    onChange={(e) => setBroadcastActionUrl(e.target.value)}
                    className="w-full text-xs rounded-md border border-stone-300 p-2.5 focus:ring-1 focus:ring-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Button Label (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Explore Portfolio"
                    value={broadcastActionLabel}
                    onChange={(e) => setBroadcastActionLabel(e.target.value)}
                    className="w-full text-xs rounded-md border border-stone-300 p-2.5 focus:ring-1 focus:ring-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <NfiButton variant="secondary" size="sm" type="button" onClick={() => setBroadcastModalOpen(false)}>
                  Cancel
                </NfiButton>
                <NfiButton variant="primary" size="sm" type="submit" disabled={sendingBroadcast}>
                  {sendingBroadcast ? 'Publishing…' : 'Publish Broadcast'}
                </NfiButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
