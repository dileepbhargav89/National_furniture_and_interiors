'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { User, AdminService, UnregisteredLead } from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { NfiButton } from '@/components/ui/nfi-button';
import { UserQuickViewDrawer } from '@/components/users/user-quick-view-drawer';
import { OnboardUserModal } from '@/components/users/onboard-user-modal';
import { BulkOnboardModal } from '@/components/users/bulk-onboard-modal';
import { AdminPasswordResetModal } from '@/components/users/admin-password-reset-modal';
import {
  Search,
  UserPlus,
  UploadCloud,
  RefreshCw,
  KeyRound,
  Eye,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Users,
  Briefcase,
  Sparkles,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function UsersManagementPage() {
  // Main Navigation Tab
  const [activeTab, setActiveTab] = useState<'registered' | 'leads'>('registered');

  // Registered Users State
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Non-registered / Leads State
  const [leads, setLeads] = useState<UnregisteredLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // General Notification Banner
  const [bannerNotice, setBannerNotice] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Modal States
  const [quickViewUser, setQuickViewUser] = useState<User | null>(null);
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [onboardInitialData, setOnboardInitialData] = useState<{
    fullName?: string;
    email?: string;
    phone?: string;
    companyName?: string;
  } | null>(null);
  const [isBulkOnboardModalOpen, setIsBulkOnboardModalOpen] = useState(false);
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load Registered Users
  const fetchRegisteredUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await AdminService.listUsersWithFilters({
        page,
        limit,
        search: debouncedSearch || undefined,
        userType: selectedRole !== 'ALL' ? selectedRole : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      });

      if (res.data) {
        setUsers(res.data.items || []);
        setTotalUsers(res.data.total || 0);
      }
    } catch (err: unknown) {
      setBannerNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to fetch registered patrons',
      });
    } finally {
      setLoadingUsers(false);
    }
  }, [page, limit, debouncedSearch, selectedRole, selectedStatus]);

  // Load Non-Registered Leads
  const fetchNonRegisteredLeads = useCallback(async () => {
    try {
      setLoadingLeads(true);
      const res = await AdminService.listNonRegisteredUsers();
      if (res.data) {
        setLeads(res.data.items || (Array.isArray(res.data) ? res.data : []));
      }
    } catch (err: unknown) {
      setBannerNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to fetch non-registered leads',
      });
    } finally {
      setLoadingLeads(false);
    }
  }, []);

  useEffect(() => {
    fetchRegisteredUsers();
  }, [fetchRegisteredUsers]);

  useEffect(() => {
    fetchNonRegisteredLeads();
  }, [fetchNonRegisteredLeads]);

  // Handle Quick Action: Resend Onboarding Invite
  const handleResendInvite = async (targetUser: User) => {
    const userId = targetUser._id || targetUser.id;
    try {
      setBannerNotice({
        type: 'info',
        message: `Sending onboarding invitation to ${targetUser.email}…`,
      });
      const res = await AdminService.resendOnboarding(userId);
      setBannerNotice({
        type: 'success',
        message: res.data?.message || `Onboarding invitation dispatched to ${targetUser.email}`,
      });
      fetchRegisteredUsers();
    } catch (err: unknown) {
      setBannerNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to resend onboarding invitation',
      });
    }
  };

  // Handle Quick Action: Toggle User Suspension / Activation
  const handleToggleStatus = async (targetUser: User) => {
    const userId = targetUser._id || targetUser.id;
    const isCurrentlySuspended =
      targetUser.status === 'SUSPENDED' || targetUser.status === 'BANNED';
    const nextStatus: 'ACTIVE' | 'SUSPENDED' = isCurrentlySuspended ? 'ACTIVE' : 'SUSPENDED';

    const confirmed = window.confirm(
      isCurrentlySuspended
        ? `Re-activate access for ${targetUser.fullName || targetUser.email}?`
        : `Are you sure you want to suspend ${targetUser.fullName || targetUser.email}? They will be immediately blocked from signing in.`,
    );
    if (!confirmed) return;

    try {
      await AdminService.updateUserStatus(userId, nextStatus);
      setBannerNotice({
        type: 'success',
        message: `Account status updated to ${nextStatus} for ${targetUser.fullName || targetUser.email}`,
      });
      if (quickViewUser && (quickViewUser._id === userId || quickViewUser.id === userId)) {
        setQuickViewUser({ ...quickViewUser, status: nextStatus });
      }
      fetchRegisteredUsers();
    } catch (err: unknown) {
      setBannerNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update account status',
      });
    }
  };

  // Convert Lead to Registered Patron
  const handleConvertLeadToPatron = (lead: UnregisteredLead) => {
    setOnboardInitialData({
      fullName: lead.fullName || lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      companyName: '',
    });
    setIsOnboardModalOpen(true);
  };

  // Format Helpers
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Calculate High-level KPIs
  const kpiStats = useMemo(() => {
    const activePatronsCount = users.filter((u) => u.status === 'ACTIVE').length;
    const pendingOnboardingCount = users.filter((u) => u.onboardingStatus === 'INVITED').length;
    return {
      totalRegistered: totalUsers || users.length,
      activePatrons: activePatronsCount,
      nonRegisteredLeads: leads.length,
      pendingOnboarding: pendingOnboardingCount,
    };
  }, [users, totalUsers, leads]);

  const totalPages = Math.ceil(totalUsers / limit) || 1;

  return (
    <>
      <PageHeader
        title="Patrons & Access Control"
        description="Comprehensive client dossiers, architectural partner roster, and guest lead pipeline."
        breadcrumbs={[{ label: 'Commercial CRM' }, { label: 'Patrons & Users' }]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <NfiButton
              variant="secondary"
              size="sm"
              onClick={() => {
                fetchRegisteredUsers();
                fetchNonRegisteredLeads();
              }}
              disabled={loadingUsers || loadingLeads}
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
              Sync
            </NfiButton>

            <NfiButton
              variant="secondary"
              size="sm"
              onClick={() => setIsBulkOnboardModalOpen(true)}
            >
              <UploadCloud className="mr-1.5 h-4 w-4 text-stone-600" />
              Bulk Onboard (CSV)
            </NfiButton>

            <NfiButton
              variant="primary"
              size="sm"
              onClick={() => {
                setOnboardInitialData(null);
                setIsOnboardModalOpen(true);
              }}
            >
              <UserPlus className="mr-1.5 h-4 w-4" />
              Onboard Patron
            </NfiButton>
          </div>
        }
      />

      {/* Global Feedback Banner */}
      {bannerNotice && (
        <div
          className={`mb-5 flex items-center justify-between rounded-lg border p-4 text-xs font-medium transition-all ${
            bannerNotice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : bannerNotice.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-900'
                : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {bannerNotice.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : bannerNotice.type === 'error' ? (
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            ) : (
              <Sparkles className="h-4 w-4 text-amber-600" />
            )}
            <span>{bannerNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerNotice(null)}
            className="text-sm font-bold text-stone-400 hover:text-stone-700"
          >
            &times;
          </button>
        </div>
      )}

      {/* Topline KPI Ribbon */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          className="hover:shadow-xs rounded-xl border bg-white p-4 transition-all"
          style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Total Patrons
            </span>
            <Users className="h-4 w-4 text-[#E07020]" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-stone-900">
            {kpiStats.totalRegistered.toLocaleString('en-IN')}
          </p>
          <p className="mt-0.5 text-[11px] text-stone-500">Active roster in platform</p>
        </div>

        <div
          className="hover:shadow-xs rounded-xl border bg-white p-4 transition-all"
          style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Active VIPs
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-emerald-700">
            {kpiStats.activePatrons.toLocaleString('en-IN')}
          </p>
          <p className="mt-0.5 text-[11px] text-stone-500">Verified luxury clients</p>
        </div>

        <div
          className="hover:shadow-xs rounded-xl border bg-white p-4 transition-all"
          style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Guest Leads
            </span>
            <Sparkles className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-indigo-900">
            {kpiStats.nonRegisteredLeads.toLocaleString('en-IN')}
          </p>
          <p className="mt-0.5 text-[11px] text-stone-500">Unregistered inquiries</p>
        </div>

        <div
          className="hover:shadow-xs rounded-xl border bg-white p-4 transition-all"
          style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Pending Onboarding
            </span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-amber-800">
            {kpiStats.pendingOnboarding.toLocaleString('en-IN')}
          </p>
          <p className="mt-0.5 text-[11px] text-stone-500">Awaiting password activation</p>
        </div>
      </div>

      {/* Main Dual-View Tab Navigation */}
      <div className="mb-4 border-b border-stone-200">
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('registered')}
            className={`relative flex items-center gap-2 pb-3 text-sm font-semibold transition-all ${
              activeTab === 'registered' ? 'text-[#E07020]' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Registered Patrons</span>
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-xs font-bold ${
                activeTab === 'registered'
                  ? 'bg-[#FEF2E8] text-[#3D1A08]'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {kpiStats.totalRegistered}
            </span>
            {activeTab === 'registered' && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: 'var(--nfi-primary, #E07020)' }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leads')}
            className={`relative flex items-center gap-2 pb-3 text-sm font-semibold transition-all ${
              activeTab === 'leads' ? 'text-[#E07020]' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Non-Registered & Leads</span>
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-xs font-bold ${
                activeTab === 'leads'
                  ? 'bg-[#FEF2E8] text-[#3D1A08]'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {kpiStats.nonRegisteredLeads}
            </span>
            {activeTab === 'leads' && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: 'var(--nfi-primary, #E07020)' }}
              />
            )}
          </button>
        </div>
      </div>

      {/* VIEW 1: REGISTERED USERS */}
      {activeTab === 'registered' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div
            className="shadow-2xs flex flex-col items-center justify-between gap-3 rounded-xl border bg-white p-3.5 sm:flex-row"
            style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
          >
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, phone, firm…"
                className="w-full rounded-lg border border-stone-200 bg-stone-50/50 py-2 pl-9 pr-4 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E07020]"
              />
            </div>

            <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <Filter className="h-3.5 w-3.5 text-stone-400" />
                <span className="font-medium">Filter:</span>
              </div>

              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-stone-200 bg-stone-50/50 px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#E07020]"
              >
                <option value="ALL">All Roles</option>
                <option value="CUSTOMER">Patron (Customer)</option>
                <option value="STAFF">Studio Staff</option>
                <option value="ADMIN">Administrator</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-stone-200 bg-stone-50/50 px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#E07020]"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INVITED">Invited (Pending)</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="LOCKED">Locked</option>
              </select>

              {(searchQuery || selectedRole !== 'ALL' || selectedStatus !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedRole('ALL');
                    setSelectedStatus('ALL');
                    setPage(1);
                  }}
                  className="px-2 py-1 text-xs font-medium text-[#E07020] hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Registered Users Table */}
          <div
            className="shadow-2xs overflow-hidden rounded-xl border bg-white"
            style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200">
                <thead style={{ backgroundColor: 'var(--nfi-surface-muted, #FAF9F6)' }}>
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-600">
                      Patron & Organization
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-600">
                      Role
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-600">
                      Status
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-600">
                      Commercial LTV
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-600">
                      Security / MFA
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-600">
                      Joined
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-stone-600">
                      Administrative Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-14 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div
                            className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
                            style={{ borderColor: 'var(--nfi-primary, #E07020)' }}
                          />
                          <span className="text-xs font-medium text-stone-500">
                            Loading patron records…
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <Users className="mx-auto mb-2 h-10 w-10 text-stone-300" />
                        <p className="text-sm font-medium text-stone-700">No patrons found</p>
                        <p className="mt-1 text-xs text-stone-400">
                          Try adjusting your search criteria or onboard a new account.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const userId = user._id || user.id;
                      const isSuspended = user.status === 'SUSPENDED' || user.status === 'BANNED';
                      const spendInRupees = user.totalSpend ? user.totalSpend / 100 : 0;

                      return (
                        <tr
                          key={userId}
                          className="group cursor-pointer transition-colors hover:bg-[#FAF9F6]/80"
                          onClick={() => setQuickViewUser(user)}
                        >
                          {/* Patron & Org */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div
                                className="shadow-2xs flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                style={{ backgroundColor: 'var(--nfi-primary, #E07020)' }}
                              >
                                {getInitials(user.fullName)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-stone-900 transition-colors group-hover:text-[#E07020]">
                                  {user.fullName}
                                </p>
                                <p className="truncate text-[11px] text-stone-500">{user.email}</p>
                                {(user.companyName || user.gstin) && (
                                  <p className="mt-0.5 truncate text-[10px] text-stone-400">
                                    {user.companyName} {user.gstin ? `• ${user.gstin}` : ''}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-4 py-3.5">
                            <span className="rounded border border-[#F5A060]/40 bg-[#FEF2E8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#3D1A08]">
                              {user.userType}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <StatusBadge
                                status={user.status?.toLowerCase() ?? 'active'}
                                label={user.status}
                              />
                              {user.onboardingStatus === 'INVITED' && (
                                <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                  Invited
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Commercial LTV */}
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <p className="font-mono text-xs font-bold text-stone-900">
                              ₹{spendInRupees.toLocaleString('en-IN')}
                            </p>
                            <p className="font-mono text-[11px] text-stone-500">
                              {user.ordersCount ?? 0} order
                              {(user.ordersCount ?? 0) === 1 ? '' : 's'}
                            </p>
                          </td>

                          {/* Security / MFA */}
                          <td className="whitespace-nowrap px-4 py-3.5 text-xs">
                            {user.mfaEnabled ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                <ShieldCheck className="h-3.5 w-3.5" /> TOTP Active
                              </span>
                            ) : (
                              <span className="text-[11px] text-stone-400">Standard Pass</span>
                            )}
                          </td>

                          {/* Joined */}
                          <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-stone-500">
                            {formatDate(user.createdAt)}
                          </td>

                          {/* Actions */}
                          <td
                            className="whitespace-nowrap px-5 py-3.5 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-1">
                              {/* Quick View */}
                              <button
                                type="button"
                                onClick={() => setQuickViewUser(user)}
                                title="Quick View Drawer"
                                className="rounded p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              {/* Reset Password */}
                              <button
                                type="button"
                                onClick={() => setPasswordResetUser(user)}
                                title="Admin Password Reset"
                                className="rounded p-1.5 text-stone-500 transition-colors hover:bg-amber-50 hover:text-amber-700"
                              >
                                <KeyRound className="h-4 w-4" />
                              </button>

                              {/* Resend Onboarding */}
                              <button
                                type="button"
                                onClick={() => handleResendInvite(user)}
                                title="Resend Onboarding Invitation"
                                className="rounded p-1.5 text-stone-500 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                              >
                                <Mail className="h-4 w-4" />
                              </button>

                              {/* Toggle Status */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(user)}
                                title={isSuspended ? 'Re-activate Patron' : 'Suspend Account'}
                                className={`rounded p-1.5 transition-colors ${
                                  isSuspended
                                    ? 'text-emerald-600 hover:bg-emerald-50'
                                    : 'text-stone-400 hover:bg-rose-50 hover:text-rose-600'
                                }`}
                              >
                                {isSuspended ? (
                                  <ShieldCheck className="h-4 w-4" />
                                ) : (
                                  <ShieldAlert className="h-4 w-4" />
                                )}
                              </button>

                              {/* Deep Link to Full Dossier */}
                              <Link
                                href={`/users/${userId}`}
                                title="Open Full Dossier"
                                className="shadow-2xs ml-1 inline-flex items-center gap-1 rounded border border-[#F5A060]/50 bg-[#FEF2E8] px-2.5 py-1 text-[11px] font-bold text-[#3D1A08] transition-all hover:bg-[#F5A060] hover:text-white"
                              >
                                Dossier
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!loadingUsers && users.length > 0 && (
              <div
                className="flex items-center justify-between border-t px-5 py-3 text-xs"
                style={{
                  borderColor: 'var(--nfi-border, #DDD0BE)',
                  backgroundColor: 'var(--nfi-surface-muted, #FAF9F6)',
                }}
              >
                <span className="text-stone-500">
                  Showing <span className="font-bold text-stone-900">{users.length}</span> of{' '}
                  <span className="font-bold text-stone-900">{totalUsers}</span> registered patrons
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="px-2 font-mono text-xs text-stone-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: NON-REGISTERED LEADS & INQUIRIES */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          <div
            className="flex flex-col justify-between gap-3 rounded-xl border bg-gradient-to-r from-amber-500/10 via-[#FAF9F6] to-transparent p-4 text-xs text-stone-700 sm:flex-row sm:items-center"
            style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
          >
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#E07020]" />
                <h3 className="text-sm font-bold text-stone-900">Guest Leads & Trade Inquiries</h3>
              </div>
              <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-stone-600">
                These prospects have engaged with National Furniture & Interiors via bespoke design
                inquiries, consultation bookings, or guest checkouts, but have not yet completed
                patron account provisioning.
              </p>
            </div>
            <div className="shrink-0">
              <NfiButton
                variant="secondary"
                size="sm"
                onClick={fetchNonRegisteredLeads}
                disabled={loadingLeads}
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loadingLeads ? 'animate-spin' : ''}`} />
                Refresh Pipeline
              </NfiButton>
            </div>
          </div>

          <div
            className="shadow-2xs overflow-hidden rounded-xl border bg-white"
            style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200">
                <thead style={{ backgroundColor: 'var(--nfi-surface-muted, #FAF9F6)' }}>
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-600">
                      Lead / Prospect Name
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-600">
                      Contact Details
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-600">
                      Lead Source
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-600">
                      Interest Category
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-600">
                      Budget & Score
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-stone-600">
                      Last Engaged
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-stone-600">
                      Conversion Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {loadingLeads ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-14 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div
                            className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
                            style={{ borderColor: 'var(--nfi-primary, #E07020)' }}
                          />
                          <span className="text-xs font-medium text-stone-500">
                            Loading guest pipeline…
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : leads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <Sparkles className="mx-auto mb-2 h-10 w-10 text-stone-300" />
                        <p className="text-sm font-medium text-stone-700">No unregistered leads</p>
                        <p className="mt-1 text-xs text-stone-400">
                          All prospects in the pipeline have either been onboarded or converted.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => {
                      const budgetRupees = lead.estimatedBudget
                        ? lead.estimatedBudget / 100
                        : lead.budgetRange?.max
                          ? lead.budgetRange.max / 100
                          : 0;
                      const priorityScore =
                        lead.leadScore ||
                        (lead.priority === 'HOT'
                          ? 'HIGH'
                          : lead.priority === 'WARM'
                            ? 'MEDIUM'
                            : 'LOW');
                      const scoreColor =
                        priorityScore === 'HIGH'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : priorityScore === 'MEDIUM'
                            ? 'border-amber-300 bg-amber-50 text-amber-800'
                            : 'border-stone-200 bg-stone-50 text-stone-700';
                      const leadName = lead.fullName || lead.name;
                      const interest =
                        lead.interestedCategory || lead.interestType || 'Whole Home Interior';
                      const contactDate = lead.lastContactedAt || lead.createdAt;

                      return (
                        <tr key={lead.id} className="transition-colors hover:bg-[#FAF9F6]/80">
                          {/* Name */}
                          <td className="px-5 py-3.5">
                            <p className="text-xs font-bold text-stone-900">{leadName}</p>
                            {lead.notes && (
                              <p className="mt-0.5 max-w-xs truncate text-[11px] italic text-stone-500">
                                &ldquo;{lead.notes}&rdquo;
                              </p>
                            )}
                          </td>

                          {/* Contact */}
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <p className="font-mono text-xs text-stone-800">{lead.email || '—'}</p>
                            {lead.phone && (
                              <p className="mt-0.5 font-mono text-[11px] text-stone-500">
                                {lead.phone}
                              </p>
                            )}
                          </td>

                          {/* Source */}
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-stone-700">
                              {(lead.source || 'INQUIRY').replace(/_/g, ' ')}
                            </span>
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3.5 text-xs text-stone-700">{interest}</td>

                          {/* Budget & Score */}
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <p className="font-mono text-xs font-bold text-stone-900">
                              {budgetRupees > 0
                                ? `₹${budgetRupees.toLocaleString('en-IN')}`
                                : 'Undisclosed'}
                            </p>
                            <span
                              className={`mt-0.5 inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold ${scoreColor}`}
                            >
                              {priorityScore} Priority
                            </span>
                          </td>

                          {/* Last Engaged */}
                          <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-stone-500">
                            {formatDate(contactDate)}
                          </td>

                          {/* Conversion Action */}
                          <td className="whitespace-nowrap px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleConvertLeadToPatron(lead)}
                              className="shadow-xs inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold text-white transition-all hover:opacity-95"
                              style={{ backgroundColor: 'var(--nfi-primary, #E07020)' }}
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              Onboard as Patron
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            {!loadingLeads && leads.length > 0 && (
              <div
                className="border-t px-5 py-3 text-xs text-stone-500"
                style={{
                  borderColor: 'var(--nfi-border, #DDD0BE)',
                  backgroundColor: 'var(--nfi-surface-muted, #FAF9F6)',
                }}
              >
                <span>{leads.length} active leads pending patron account provisioning</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUICK VIEW SLIDE-OVER DRAWER */}
      <UserQuickViewDrawer
        user={quickViewUser}
        open={Boolean(quickViewUser)}
        onClose={() => setQuickViewUser(null)}
        onResetPassword={(u) => {
          setPasswordResetUser(u);
          setQuickViewUser(null);
        }}
        onResendOnboarding={(u) => handleResendInvite(u)}
        onToggleStatus={(u) => handleToggleStatus(u)}
      />

      {/* SINGLE USER ONBOARDING MODAL */}
      <OnboardUserModal
        open={isOnboardModalOpen}
        initialData={onboardInitialData}
        onClose={() => {
          setIsOnboardModalOpen(false);
          setOnboardInitialData(null);
        }}
        onSuccess={(newUser) => {
          setBannerNotice({
            type: 'success',
            message: `Patron account successfully provisioned for ${newUser.fullName} (${newUser.email})!`,
          });
          fetchRegisteredUsers();
          fetchNonRegisteredLeads();
        }}
      />

      {/* BULK CSV ONBOARDING MODAL */}
      <BulkOnboardModal
        open={isBulkOnboardModalOpen}
        onClose={() => setIsBulkOnboardModalOpen(false)}
        onSuccess={(createdUsers) => {
          setBannerNotice({
            type: 'success',
            message: `Successfully onboarded ${createdUsers.length} patron accounts via CSV!`,
          });
          fetchRegisteredUsers();
        }}
      />

      {/* ADMIN PASSWORD RESET MODAL */}
      <AdminPasswordResetModal
        user={passwordResetUser}
        open={Boolean(passwordResetUser)}
        onClose={() => setPasswordResetUser(null)}
        onSuccess={() => {
          setBannerNotice({
            type: 'success',
            message: `Password reset successfully completed for ${passwordResetUser?.fullName || 'patron'}.`,
          });
        }}
      />
    </>
  );
}
