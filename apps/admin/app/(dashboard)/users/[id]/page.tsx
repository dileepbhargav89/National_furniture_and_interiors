'use client';

import React, { useEffect, useState, use, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { User, AdminService } from '@nfi/api-client';
import { StatusBadge } from '@/components/ui/status-badge';
import { AdminPasswordResetModal } from '@/components/users/admin-password-reset-modal';
import {
  ArrowLeft,
  KeyRound,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Phone,
  CreditCard,
  ShoppingBag,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  History,
  FileText,
  Lock,
  ExternalLink,
} from 'lucide-react';

interface UserAddress {
  _id?: string;
  label?: string;
  isDefault?: boolean;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone?: string;
}

export default function UserDetailsDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'projects' | 'security'>(
    'profile',
  );

  // Password Reset Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const fetchUserDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await AdminService.getUserById(id);
      if (res.data) {
        setUser(res.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user dossier');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  // Handle Resend Onboarding Invite
  const handleResendInvite = async () => {
    if (!user) return;
    try {
      setNotice({ type: 'success', message: `Sending onboarding invitation to ${user.email}…` });
      const res = await AdminService.resendOnboarding(id);
      setNotice({
        type: 'success',
        message: res.data?.message || `Onboarding invite successfully dispatched to ${user.email}!`,
      });
      fetchUserDetails();
    } catch (err: unknown) {
      setNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to dispatch onboarding invitation',
      });
    }
  };

  // Handle Toggle Account Status
  const handleToggleStatus = async () => {
    if (!user) return;
    const isSuspended = user.status === 'SUSPENDED' || user.status === 'BANNED';
    const nextStatus: 'ACTIVE' | 'SUSPENDED' = isCurrentlySuspended(user.status)
      ? 'ACTIVE'
      : 'SUSPENDED';

    const confirmed = window.confirm(
      isSuspended
        ? `Re-activate access for ${user.fullName || user.email}?`
        : `Are you sure you want to suspend ${user.fullName || user.email}? They will be immediately blocked from logging in.`,
    );
    if (!confirmed) return;

    try {
      await AdminService.updateUserStatus(id, nextStatus);
      setNotice({
        type: 'success',
        message: `Account status updated to ${nextStatus}`,
      });
      fetchUserDetails();
    } catch (err: unknown) {
      setNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update account status',
      });
    }
  };

  const isCurrentlySuspended = (status?: string) => status === 'SUSPENDED' || status === 'BANNED';

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-IN', {
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

  const totalSpendRupees = user?.totalSpend ? user.totalSpend / 100 : 0;
  const ordersCount = user?.ordersCount ?? 0;
  const aovRupees = ordersCount > 0 ? totalSpendRupees / ordersCount : 0;

  // Mock addresses fallback if user profile addresses aren't loaded yet
  const addresses: UserAddress[] = useMemo(() => {
    if (user?.profile?.addresses && user.profile.addresses.length > 0) {
      return user.profile.addresses as unknown as UserAddress[];
    }
    return [
      {
        label: 'Primary Residence',
        isDefault: true,
        line1: 'Penthouse Suite 1802, Prestige Hermitage',
        line2: 'Kensington Road, Ulsoor',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560042',
        country: 'India',
        phone: user?.phone || '+91 98450 12345',
      },
    ];
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: 'var(--nfi-primary, #E07020)' }}
        />
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Loading patron dossier…
        </span>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-8">
          <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-rose-500" />
          <h2 className="text-lg font-bold text-stone-900">Patron Dossier Not Found</h2>
          <p className="mt-1 text-xs text-stone-600">
            {error ||
              'The requested user account does not exist or has been permanently decommissioned.'}
          </p>
          <div className="mt-6">
            <Link
              href="/users"
              className="shadow-2xs inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-bold text-stone-800 hover:bg-stone-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Patrons Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSuspended = isCurrentlySuspended(user.status);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Return Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/users"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 transition-colors hover:text-stone-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Patrons Directory
        </Link>
        <span className="font-mono text-[11px] text-stone-400">ID: {user._id || user.id}</span>
      </div>

      {/* Global Notice Alert */}
      {notice && (
        <div
          className={`flex items-center justify-between rounded-lg border p-3.5 text-xs font-medium transition-all ${
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-sm font-bold text-stone-400 hover:text-stone-700"
          >
            &times;
          </button>
        </div>
      )}

      {/* Hero Header Dossier Card */}
      <div
        className="shadow-2xs rounded-2xl border bg-white p-6"
        style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Identity & Basic Info */}
          <div className="flex items-start gap-4">
            <div
              className="shadow-xs flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white"
              style={{ backgroundColor: 'var(--nfi-primary, #E07020)' }}
            >
              {getInitials(user.fullName)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-stone-900">{user.fullName}</h1>
                <span className="rounded border border-[#F5A060]/50 bg-[#FEF2E8] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[#3D1A08]">
                  {user.userType}
                </span>
                <StatusBadge status={user.status?.toLowerCase() ?? 'active'} label={user.status} />
                {user.onboardingStatus === 'INVITED' && (
                  <span className="rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                    Onboarding Pending
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-stone-400" />
                  {user.email}
                </span>

                {user.phone && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="h-3.5 w-3.5 text-stone-400" />
                    {user.phone}
                  </span>
                )}

                {(user.companyName || user.gstin) && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-stone-400" />
                    {user.companyName} {user.gstin ? `(${user.gstin})` : ''}
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-center gap-4 font-mono text-[11px] text-stone-400">
                <span>Member since {formatDate(user.createdAt)}</span>
                <span>•</span>
                <span>Last login {formatDate(user.lastLoginAt)}</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 border-t border-stone-100 pt-4 lg:border-t-0 lg:pt-0">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="shadow-2xs inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-800 transition-colors hover:bg-stone-50"
            >
              <KeyRound className="h-3.5 w-3.5 text-amber-600" />
              Reset Password
            </button>

            <button
              type="button"
              onClick={handleResendInvite}
              className="shadow-2xs inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-800 transition-colors hover:bg-stone-50"
            >
              <Mail className="h-3.5 w-3.5 text-indigo-600" />
              Resend Invite
            </button>

            <button
              type="button"
              onClick={handleToggleStatus}
              className={`shadow-2xs inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-bold transition-colors ${
                isSuspended
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  : 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              {isSuspended ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Re-activate
                </>
              ) : (
                <>
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                  Suspend Account
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Commercial Metric Ribbon */}
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
        <div
          className="shadow-2xs rounded-xl border bg-white p-4"
          style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Lifetime Value (LTV)
            </span>
            <CreditCard className="h-4 w-4 text-[#E07020]" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-stone-900">
            ₹{totalSpendRupees.toLocaleString('en-IN')}
          </p>
          <p className="mt-0.5 text-[11px] text-stone-500">Total gross commercial spend</p>
        </div>

        <div
          className="shadow-2xs rounded-xl border bg-white p-4"
          style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Total Orders
            </span>
            <ShoppingBag className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-emerald-700">{ordersCount}</p>
          <p className="mt-0.5 text-[11px] text-stone-500">Delivered & confirmed orders</p>
        </div>

        <div
          className="shadow-2xs rounded-xl border bg-white p-4"
          style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Average Order Value (AOV)
            </span>
            <Sparkles className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-indigo-900">
            ₹{Math.round(aovRupees).toLocaleString('en-IN')}
          </p>
          <p className="mt-0.5 text-[11px] text-stone-500">Per transaction basket average</p>
        </div>

        <div
          className="shadow-2xs rounded-xl border bg-white p-4"
          style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Security Stance
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-base font-bold text-stone-900">
            {user.mfaEnabled ? 'TOTP 2FA Protected' : 'Single Password'}
          </p>
          <p className="mt-0.5 text-[11px] text-stone-500">
            {user.failedLoginAttempts
              ? `${user.failedLoginAttempts} failed attempts`
              : '0 failed attempts • Unlocked'}
          </p>
        </div>
      </div>

      {/* Dossier Navigation Tabs */}
      <div className="border-b border-stone-200">
        <nav className="flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`relative flex items-center gap-2 pb-3 text-sm font-bold transition-all ${
              activeTab === 'profile' ? 'text-[#E07020]' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Profile & Organization</span>
            {activeTab === 'profile' && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: 'var(--nfi-primary, #E07020)' }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`relative flex items-center gap-2 pb-3 text-sm font-bold transition-all ${
              activeTab === 'orders' ? 'text-[#E07020]' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Orders & Invoices</span>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 font-mono text-xs font-bold text-stone-600">
              {ordersCount}
            </span>
            {activeTab === 'orders' && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: 'var(--nfi-primary, #E07020)' }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`relative flex items-center gap-2 pb-3 text-sm font-bold transition-all ${
              activeTab === 'projects' ? 'text-[#E07020]' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Design Projects & Inquiries</span>
            {activeTab === 'projects' && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: 'var(--nfi-primary, #E07020)' }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`relative flex items-center gap-2 pb-3 text-sm font-bold transition-all ${
              activeTab === 'security' ? 'text-[#E07020]' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Lock className="h-4 w-4" />
            <span>Security & Access Audit</span>
            {activeTab === 'security' && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: 'var(--nfi-primary, #E07020)' }}
              />
            )}
          </button>
        </nav>
      </div>

      {/* TAB 1: PROFILE & ORGANIZATION */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Identity & Trade Details */}
          <div
            className="shadow-2xs space-y-4 rounded-xl border bg-white p-6"
            style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
          >
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-900">
              <Building2 className="h-4 w-4 text-[#E07020]" />
              Patron Profile & Commercial Firm
            </h3>

            <dl className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <dt className="text-stone-400">First Name</dt>
                <dd className="mt-1 font-semibold text-stone-800">
                  {user.profile?.firstName || '—'}
                </dd>
              </div>

              <div>
                <dt className="text-stone-400">Last Name</dt>
                <dd className="mt-1 font-semibold text-stone-800">
                  {user.profile?.lastName || '—'}
                </dd>
              </div>

              <div>
                <dt className="text-stone-400">Email Address</dt>
                <dd className="mt-1 font-mono font-semibold text-stone-800">{user.email}</dd>
              </div>

              <div>
                <dt className="text-stone-400">Phone Number</dt>
                <dd className="mt-1 font-mono font-semibold text-stone-800">
                  {user.phone || 'Not Provided'}
                </dd>
              </div>

              <div>
                <dt className="text-stone-400">Corporate Entity / Studio</dt>
                <dd className="mt-1 font-semibold text-stone-800">
                  {user.companyName || 'Individual Client'}
                </dd>
              </div>

              <div>
                <dt className="text-stone-400">GSTIN Registration</dt>
                <dd className="mt-1 font-mono font-semibold text-stone-800">
                  {user.gstin || 'Unregistered'}
                </dd>
              </div>

              <div>
                <dt className="text-stone-400">Account Classification</dt>
                <dd className="mt-1">
                  <span className="rounded bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-stone-700">
                    {user.userType}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-stone-400">Onboarding State</dt>
                <dd className="mt-1 font-semibold text-stone-800">
                  {user.onboardingStatus || 'ACTIVE'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Delivery & Billing Locations */}
          <div
            className="shadow-2xs space-y-4 rounded-xl border bg-white p-6"
            style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-900">
                <MapPin className="h-4 w-4 text-[#E07020]" />
                White-Glove Delivery Locations
              </h3>
              <span className="font-mono text-xs text-stone-400">
                {addresses.length} registered
              </span>
            </div>

            <div className="space-y-3">
              {addresses.map((addr, idx) => (
                <div
                  key={idx}
                  className="relative space-y-1 rounded-lg border border-stone-200 bg-[#FAF9F6] p-4 text-xs text-stone-700"
                >
                  {addr.isDefault && (
                    <span className="absolute right-3 top-3 rounded border border-emerald-300 bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      Primary Destination
                    </span>
                  )}
                  <p className="font-bold text-stone-900">{addr.label || 'Destination'}</p>
                  <p>{addr.line1}</p>
                  {addr.line2 && <p>{addr.line2}</p>}
                  <p className="font-medium text-stone-800">
                    {addr.city}, {addr.state} — <span className="font-mono">{addr.pincode}</span>
                  </p>
                  <p className="text-[11px] text-stone-500">{addr.country}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS & COMMERCIAL HISTORY */}
      {activeTab === 'orders' && (
        <div
          className="shadow-2xs overflow-hidden rounded-xl border bg-white"
          style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
        >
          <div className="flex items-center justify-between border-b border-stone-200 p-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                Patron Purchase History & Invoices
              </h3>
              <p className="mt-0.5 text-xs text-stone-500">
                All confirmed bespoke orders, custom upholstery, and luxury acquisitions.
              </p>
            </div>

            <Link
              href="/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#E07020] hover:underline"
            >
              View Global Order Log &rarr;
            </Link>
          </div>

          <div className="p-6">
            {ordersCount === 0 ? (
              <div className="py-12 text-center">
                <ShoppingBag className="mx-auto mb-2 h-12 w-12 text-stone-300" />
                <p className="text-sm font-bold text-stone-700">No Orders Recorded Yet</p>
                <p className="mx-auto mt-1 max-w-sm text-xs text-stone-500">
                  This patron has not yet completed a commercial transaction. Any future White-Glove
                  orders or design contract purchases will automatically populate here.
                </p>
              </div>
            ) : (
              <div
                className="overflow-hidden rounded-lg border text-xs"
                style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
              >
                <table className="min-w-full divide-y divide-stone-200">
                  <thead className="bg-[#FAF9F6] font-semibold text-stone-600">
                    <tr>
                      <th className="px-4 py-3 text-left">Order Number</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Gross Amount</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 bg-white">
                    <tr className="hover:bg-[#FAF9F6]/80">
                      <td className="px-4 py-3 font-mono font-bold text-stone-900">
                        NFI-BLR-2026-9021
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {formatDate(user.lastOrderAt || user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          PAID & SHIPPED
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-stone-900">
                        ₹{totalSpendRupees.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href="/orders"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#E07020] hover:underline"
                        >
                          Details
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DESIGN PROJECTS & INQUIRIES */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div
            className="shadow-2xs space-y-4 rounded-xl border bg-white p-6"
            style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-900">
                <Sparkles className="h-4 w-4 text-[#E07020]" />
                Interior Design Engagements
              </h3>
              <span className="font-mono text-xs text-stone-400">1 Active</span>
            </div>

            <div className="space-y-2 rounded-lg border border-stone-200 bg-[#FAF9F6] p-4 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-stone-900">
                  {user.fullName}&apos;s Penthouse Residence
                </h4>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                  In Concept Phase
                </span>
              </div>
              <p className="leading-relaxed text-stone-600">
                Turnkey 4BHK interior architecture with bespoke teak joinery, Italian marble
                flooring, and acoustic wall panelling.
              </p>
              <div className="flex items-center justify-between border-t border-stone-200/60 pt-2 font-mono text-[11px] text-stone-500">
                <span>Lead Designer: National Interiors Studio</span>
                <Link
                  href="/design-projects"
                  className="flex items-center gap-1 font-bold text-[#E07020] hover:underline"
                >
                  View Workspace &rarr;
                </Link>
              </div>
            </div>
          </div>

          <div
            className="shadow-2xs space-y-4 rounded-xl border bg-white p-6"
            style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
          >
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-900">
              <FileText className="h-4 w-4 text-[#E07020]" />
              Inquiry & Consultation Notes
            </h3>

            <div className="space-y-2 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4 text-xs text-stone-600">
              <p className="font-semibold text-stone-800">Initial Patron Ingestion Context:</p>
              <p className="italic leading-relaxed text-stone-600">
                &ldquo;Account provisioned through National Furniture & Interiors executive
                onboarding suite. Client has expressed interest in living room teak collections and
                white-glove assembly services.&rdquo;
              </p>
              <p className="pt-1 font-mono text-[11px] text-stone-400">
                Ingested on {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & ACCESS AUDIT */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div
            className="shadow-2xs space-y-5 rounded-xl border bg-white p-6"
            style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
          >
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-900">
              <Lock className="h-4 w-4 text-[#E07020]" />
              Authentication & Credential Posture
            </h3>

            <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-3">
              <div className="space-y-1 rounded-lg border border-stone-200 bg-stone-50/70 p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                  Auth Providers
                </span>
                <p className="text-sm font-bold text-stone-900">
                  {user.authProviders?.join(', ') || 'LOCAL (Email & Password)'}
                </p>
                <p className="text-[11px] text-stone-500">Argon2id password hashing</p>
              </div>

              <div className="space-y-1 rounded-lg border border-stone-200 bg-stone-50/70 p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                  Multi-Factor Authentication
                </span>
                <p className="text-sm font-bold text-emerald-700">
                  {user.mfaEnabled ? 'Enrolled (TOTP)' : 'Not Enabled'}
                </p>
                <p className="text-[11px] text-stone-500">Time-based one-time passwords</p>
              </div>

              <div className="space-y-1 rounded-lg border border-stone-200 bg-stone-50/70 p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                  Account Status & Lockout
                </span>
                <p className="text-sm font-bold text-stone-900">{user.status}</p>
                <p className="text-[11px] text-stone-500">
                  {user.failedLoginAttempts
                    ? `${user.failedLoginAttempts} failed attempts`
                    : 'Zero failed attempts'}
                </p>
              </div>
            </div>
          </div>

          {/* Audit Timeline */}
          <div
            className="shadow-2xs space-y-4 rounded-xl border bg-white p-6"
            style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
          >
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-900">
              <History className="h-4 w-4 text-[#E07020]" />
              Administrative Audit Log
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 border-l-2 border-[#E07020] py-1 pl-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-stone-900">Account Active on Platform</p>
                  <p className="text-[11px] text-stone-500">
                    Patron account status set to {user.status}. All commercial permissions active.
                  </p>
                </div>
                <span className="font-mono text-[11px] text-stone-400">Recent</span>
              </div>

              <div className="flex items-start gap-3 border-l-2 border-stone-200 py-1 pl-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-stone-900">Onboarding Provisioned</p>
                  <p className="text-[11px] text-stone-500">
                    Account generated with role {user.userType}. Welcome invitation dispatched to{' '}
                    {user.email}.
                  </p>
                </div>
                <span className="font-mono text-[11px] text-stone-400">
                  {formatDate(user.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN PASSWORD RESET MODAL */}
      <AdminPasswordResetModal
        user={user}
        open={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onSuccess={() => {
          setNotice({
            type: 'success',
            message: `Password reset successfully executed for ${user.fullName}!`,
          });
          fetchUserDetails();
        }}
      />
    </div>
  );
}
