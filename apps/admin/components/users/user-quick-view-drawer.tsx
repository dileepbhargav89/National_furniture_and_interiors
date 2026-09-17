'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User } from '@nfi/api-client';
import { StatusBadge } from '@/components/ui/status-badge';
import { NfiButton } from '@/components/ui/nfi-button';

interface UserQuickViewDrawerProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onResetPassword: (user: User) => void;
  onResendOnboarding: (user: User) => void;
  onToggleStatus: (user: User) => void;
}

export function UserQuickViewDrawer({
  user,
  open,
  onClose,
  onResetPassword,
  onResendOnboarding,
  onToggleStatus,
}: UserQuickViewDrawerProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!open || !user) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatDate = (d?: string | null) => {
    if (!d) return 'Never';
    return new Date(d).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const isSuspended = user.status === 'SUSPENDED' || user.status === 'BANNED';
  const totalSpendRupees = user.totalSpend ? user.totalSpend / 100 : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="backdrop-blur-xs fixed inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className="flex w-screen max-w-lg flex-col border-l bg-white shadow-2xl"
          style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b px-6 py-4"
            style={{
              borderColor: 'var(--nfi-border, #DDD0BE)',
              backgroundColor: 'var(--nfi-surface-muted, #FAF9F6)',
            }}
          >
            <div className="flex min-w-0 items-center gap-2.5 pr-4">
              <span className="rounded border border-[#F5A060]/50 bg-[#FEF2E8] px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-[#3D1A08]">
                {user.userType}
              </span>
              <StatusBadge status={user.status?.toLowerCase() ?? 'active'} label={user.status} />
              {user.onboardingStatus === 'INVITED' && (
                <span className="rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                  Invite Pending
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
              aria-label="Close user quick view"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {/* User Profile Card */}
            <div className="flex items-start gap-4">
              <div
                className="shadow-xs flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
                style={{ backgroundColor: 'var(--nfi-primary, #E07020)' }}
              >
                {getInitials(user.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-bold text-stone-900">{user.fullName}</h2>
                <div className="mt-1 flex items-center gap-2 text-xs text-stone-600">
                  <span className="truncate">{user.email}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(user.email, 'email')}
                    className="text-stone-400 hover:text-stone-700"
                    title="Copy Email"
                  >
                    {copiedField === 'email' ? (
                      <span className="text-[10px] font-medium text-emerald-600">Copied!</span>
                    ) : (
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {user.phone && (
                  <p className="mt-0.5 font-mono text-xs text-stone-500">{user.phone}</p>
                )}
              </div>
            </div>

            {/* Commercial LTV Card */}
            <div
              className="space-y-3 rounded-lg border bg-[#FAF9F6] p-4"
              style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7A5C45]">
                Commercial Lifetime Value (LTV)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded border border-stone-200/70 bg-white p-3">
                  <p className="text-[11px] text-stone-500">Total Spend</p>
                  <p className="mt-0.5 font-mono text-base font-bold text-stone-900">
                    ₹{totalSpendRupees.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="rounded border border-stone-200/70 bg-white p-3">
                  <p className="text-[11px] text-stone-500">Total Orders</p>
                  <p className="mt-0.5 font-mono text-base font-bold text-stone-900">
                    {user.ordersCount ?? 0}
                  </p>
                </div>
              </div>
              {user.lastOrderAt && (
                <p className="text-[11px] text-stone-500">
                  Last purchase:{' '}
                  <span className="font-medium text-stone-700">{formatDate(user.lastOrderAt)}</span>
                </p>
              )}
            </div>

            {/* Quick Action Matrix */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7A5C45]">
                Administrative Actions
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onResetPassword(user)}
                  className="shadow-2xs flex items-center justify-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 hover:text-stone-900"
                >
                  <svg
                    className="h-4 w-4 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                  Reset Password
                </button>

                <button
                  type="button"
                  onClick={() => onResendOnboarding(user)}
                  className="shadow-2xs flex items-center justify-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 hover:text-stone-900"
                >
                  <svg
                    className="h-4 w-4 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Resend Invite
                </button>

                <button
                  type="button"
                  onClick={() => onToggleStatus(user)}
                  className={`shadow-2xs col-span-2 flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                    isSuspended
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
                  }`}
                >
                  {isSuspended ? '✓ Re-activate Account' : '⚠ Suspend Account'}
                </button>
              </div>
            </div>

            {/* Entity & Security Overview */}
            <div className="space-y-2.5 text-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7A5C45]">
                Profile & Access Metadata
              </span>
              <dl className="grid grid-cols-2 gap-2">
                <div className="rounded border border-stone-200 bg-stone-50/70 p-2.5">
                  <dt className="text-stone-400">Organization / Firm</dt>
                  <dd className="mt-0.5 truncate font-medium text-stone-800">
                    {user.companyName || 'Individual Patron'}
                  </dd>
                </div>
                <div className="rounded border border-stone-200 bg-stone-50/70 p-2.5">
                  <dt className="text-stone-400">GSTIN</dt>
                  <dd className="mt-0.5 font-mono font-medium text-stone-800">
                    {user.gstin || 'Not Registered'}
                  </dd>
                </div>
                <div className="rounded border border-stone-200 bg-stone-50/70 p-2.5">
                  <dt className="text-stone-400">MFA Enrolled</dt>
                  <dd className="mt-0.5 font-medium text-stone-800">
                    {user.mfaEnabled ? (
                      <span className="font-semibold text-emerald-700">Enabled (TOTP)</span>
                    ) : (
                      <span className="text-stone-500">Disabled</span>
                    )}
                  </dd>
                </div>
                <div className="rounded border border-stone-200 bg-stone-50/70 p-2.5">
                  <dt className="text-stone-400">Auth Providers</dt>
                  <dd className="mt-0.5 font-medium text-stone-800">
                    {user.authProviders?.join(', ') || 'LOCAL (Email/Pass)'}
                  </dd>
                </div>
                <div className="col-span-2 rounded border border-stone-200 bg-stone-50/70 p-2.5">
                  <dt className="text-stone-400">Last Active / Login</dt>
                  <dd className="mt-0.5 font-medium text-stone-800">
                    {formatDate(user.lastLoginAt)}
                  </dd>
                </div>
                <div className="col-span-2 rounded border border-stone-200 bg-stone-50/70 p-2.5">
                  <dt className="text-stone-400">Joined Platform</dt>
                  <dd className="mt-0.5 font-medium text-stone-800">
                    {formatDate(user.createdAt)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            className="flex items-center justify-between border-t bg-white p-4"
            style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
          >
            <NfiButton variant="secondary" size="sm" onClick={onClose}>
              Close
            </NfiButton>

            <Link
              href={`/users/${user._id || user.id}`}
              className="shadow-xs inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-95"
              style={{ backgroundColor: 'var(--nfi-primary, #E07020)' }}
            >
              Open Full Dossier &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
