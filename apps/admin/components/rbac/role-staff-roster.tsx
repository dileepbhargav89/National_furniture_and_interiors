'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AdminService, User, Role } from '@nfi/api-client';
import {
  UserPlus,
  RefreshCw,
  Mail,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  UserX,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Users,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { canManageUserCredentials, canChangeUserStatus, isSuperAdmin } from '@/lib/rbac-hierarchy';

interface RoleStaffRosterProps {
  selectedRole: Role | null;
  onInvite: () => void;
  onResetPassword: (user: User) => void;
  /** Refresh trigger: increment this to force a refetch */
  refreshKey?: number;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  ACTIVE: { label: 'Active', icon: CheckCircle2, color: '#16a34a', bg: 'rgba(34,197,94,0.08)' },
  INVITED: { label: 'Invited', icon: Clock, color: '#d97706', bg: 'rgba(251,191,36,0.08)' },
  SUSPENDED: {
    label: 'Suspended',
    icon: ShieldAlert,
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.08)',
  },
  INACTIVE: { label: 'Inactive', icon: XCircle, color: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
  LOCKED: { label: 'Locked', icon: XCircle, color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
  BANNED: { label: 'Banned', icon: XCircle, color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

function getAvatarColor(name?: string): string {
  const colors = [
    '#8C7355',
    '#C5A059',
    '#7C6348',
    '#A08060',
    '#6B7280',
    '#9CA3AF',
    '#B45309',
    '#92400E',
  ];
  if (!name) return colors[0]!;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length]!;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Map role name to the userType filter used in the API */
function roleToUserType(roleName: string): 'ADMIN' | 'STAFF' | null {
  if (['SUPER_ADMIN', 'ADMIN'].includes(roleName)) return 'ADMIN';
  if (
    ['SALES_MANAGER', 'DESIGN_MANAGER', 'DESIGNER', 'CATALOG_MANAGER', 'SUPPORT_AGENT'].includes(
      roleName,
    )
  )
    return 'STAFF';
  return null;
}

export function RoleStaffRoster({
  selectedRole,
  onInvite,
  onResetPassword,
  refreshKey = 0,
}: RoleStaffRosterProps) {
  const currentActor = useAuthStore((s) => s.user);
  const actorIsSuperAdmin = isSuperAdmin(currentActor);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const userType = selectedRole ? roleToUserType(selectedRole.name) : null;

  const fetchUsers = useCallback(async () => {
    if (!selectedRole || !userType) {
      setUsers([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await AdminService.listUsersByRole(userType, { limit: 50 });
      setUsers(res.data?.items ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load staff roster');
    } finally {
      setLoading(false);
    }
  }, [selectedRole, userType]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers, refreshKey]);

  const handleResendInvite = async (user: User) => {
    const id = user.id || user._id;
    if (!id) return;
    const canManage = canManageUserCredentials(currentActor, {
      roleName: selectedRole?.name,
      userType: user.userType,
    });
    if (!canManage) {
      setToastMsg('Unauthorized to resend invite for this account');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }
    setResendingId(id);
    try {
      await AdminService.resendOnboarding(id);
      setToastMsg(`Invite resent to ${user.email}`);
      setTimeout(() => setToastMsg(''), 3000);
    } catch {
      setToastMsg('Failed to resend invite');
      setTimeout(() => setToastMsg(''), 3000);
    } finally {
      setResendingId(null);
    }
  };

  const handleToggleStaffStatus = async (user: User) => {
    const id = user.id || user._id;
    if (!id) return;
    const targetMeta = {
      id,
      roleName: selectedRole?.name,
      userType: user.userType,
    };
    if (!canChangeUserStatus(currentActor, targetMeta)) {
      setToastMsg('Unauthorized to alter account status for this user');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }

    const isSuspended = user.status === 'SUSPENDED' || user.status === 'BANNED';
    const nextStatus: 'ACTIVE' | 'SUSPENDED' = isSuspended ? 'ACTIVE' : 'SUSPENDED';

    const confirmed = window.confirm(
      isSuspended
        ? `Re-activate staff portal access for ${user.fullName || user.email}?`
        : `Are you sure you want to deactivate ${user.fullName || user.email}? They will be immediately blocked from signing into the portal.`,
    );
    if (!confirmed) return;

    setTogglingId(id);
    try {
      await AdminService.updateUserStatus(id, nextStatus);
      setUsers((prev) =>
        prev.map((u) => {
          const uId = u.id || u._id;
          return uId === id ? { ...u, status: nextStatus } : u;
        }),
      );
      setToastMsg(
        `Staff member ${user.fullName || user.email} ${
          nextStatus === 'ACTIVE' ? 're-activated' : 'deactivated'
        }`,
      );
      setTimeout(() => setToastMsg(''), 3500);
    } catch (err: unknown) {
      setToastMsg(err instanceof Error ? err.message : 'Failed to update staff status');
      setTimeout(() => setToastMsg(''), 4000);
    } finally {
      setTogglingId(null);
    }
  };

  if (!selectedRole) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="mb-3 h-8 w-8" style={{ color: 'var(--nfi-border)' }} />
        <p className="text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>
          Select a role to view its staff members
        </p>
      </div>
    );
  }

  if (!userType) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="mb-3 h-8 w-8" style={{ color: 'var(--nfi-border)' }} />
        <p className="text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>
          Staff roster is not available for customer-facing roles
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--nfi-text)' }}>
            Staff Members
          </h3>
          {!loading && (
            <p className="mt-0.5 text-xs" style={{ color: 'var(--nfi-text-secondary)' }}>
              {users.length} member{users.length !== 1 ? 's' : ''} with {userType} access
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchUsers()}
            title="Refresh roster"
            className="rounded-lg p-1.5 transition-colors hover:bg-black/5"
            style={{ color: 'var(--nfi-text-secondary)' }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {actorIsSuperAdmin && (
            <button
              type="button"
              onClick={onInvite}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all active:scale-95"
              style={{ backgroundColor: 'var(--nfi-gold)' }}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invite
            </button>
          )}
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
          style={{
            backgroundColor: 'rgba(34,197,94,0.08)',
            color: '#16a34a',
            border: '1px solid rgba(34,197,94,0.2)',
          }}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {toastMsg}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="rounded-lg px-3 py-2 text-xs"
          style={{
            backgroundColor: 'rgba(198,40,40,0.06)',
            color: 'var(--nfi-danger)',
            border: '1px solid rgba(198,40,40,0.15)',
          }}
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--nfi-gold)' }} />
        </div>
      )}

      {/* Empty */}
      {!loading && !error && users.length === 0 && (
        <div
          className="flex flex-col items-center justify-center rounded-xl py-10 text-center"
          style={{ border: '2px dashed var(--nfi-border)' }}
        >
          <Users className="mb-2 h-7 w-7" style={{ color: 'var(--nfi-border)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--nfi-text-secondary)' }}>
            No staff members yet
          </p>
          {actorIsSuperAdmin && (
            <button
              type="button"
              onClick={onInvite}
              className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95"
              style={{ backgroundColor: 'rgba(197,160,89,0.1)', color: 'var(--nfi-gold)' }}
            >
              <UserPlus className="h-3 w-3" />
              Invite the first member
            </button>
          )}
        </div>
      )}

      {/* User list */}
      {!loading && users.length > 0 && (
        <ul className="space-y-2">
          {users.map((user) => {
            const id = user.id || user._id || '';
            const statusCfg = STATUS_CONFIG[user.status] ?? STATUS_CONFIG['INACTIVE']!;
            const StatusIcon = statusCfg.icon;
            const avatarColor = getAvatarColor(user.fullName);
            const targetMeta = {
              id,
              roleName: selectedRole.name,
              userType: user.userType,
            };
            const canManage = canManageUserCredentials(currentActor, targetMeta);
            const canToggleStatus = canChangeUserStatus(currentActor, targetMeta);
            const isSuspended = user.status === 'SUSPENDED' || user.status === 'BANNED';

            return (
              <li
                key={id}
                className="flex items-center gap-3 rounded-xl p-3 transition-colors"
                style={{
                  border: '1px solid var(--nfi-border)',
                  backgroundColor: 'var(--nfi-surface-muted)',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--nfi-surface)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor =
                    'var(--nfi-surface-muted)')
                }
              >
                {/* Avatar */}
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: avatarColor }}
                >
                  {getInitials(user.fullName)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className="truncate text-xs font-semibold"
                      style={{ color: 'var(--nfi-text)' }}
                    >
                      {user.fullName || '—'}
                    </p>
                    <span
                      className="flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                    >
                      <StatusIcon className="h-2.5 w-2.5" />
                      {statusCfg.label}
                    </span>
                  </div>
                  <p
                    className="mt-0.5 truncate text-[11px]"
                    style={{ color: 'var(--nfi-text-secondary)' }}
                  >
                    {user.email}
                  </p>
                  <p className="mt-0.5 text-[10px]" style={{ color: 'var(--nfi-text-secondary)' }}>
                    Last login: {formatDate(user.lastLoginAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-shrink-0 items-center gap-1">
                  {user.status === 'INVITED' && canManage && (
                    <button
                      type="button"
                      title="Resend invite email"
                      onClick={() => void handleResendInvite(user)}
                      disabled={resendingId === id}
                      className="rounded-lg p-1.5 transition-colors hover:bg-blue-50"
                      style={{ color: '#3b82f6' }}
                    >
                      {resendingId === id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Mail className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                  {canManage ? (
                    <button
                      type="button"
                      title="Reset password"
                      onClick={() => onResetPassword(user)}
                      className="rounded-lg p-1.5 transition-colors hover:bg-amber-50"
                      style={{ color: 'var(--nfi-gold)' }}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <div
                      title="Protected Account: Super Administrator credentials can only be reset by a Super Administrator"
                      className="flex cursor-not-allowed items-center justify-center rounded-lg p-1.5 opacity-40 transition-opacity hover:opacity-60"
                      style={{ color: 'var(--nfi-text-secondary)' }}
                    >
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                  )}

                  {/* Deactivate / Re-activate Staff Access */}
                  {canToggleStatus ? (
                    <button
                      type="button"
                      title={
                        isSuspended
                          ? 'Re-activate staff portal access'
                          : 'Deactivate staff portal access'
                      }
                      onClick={() => void handleToggleStaffStatus(user)}
                      disabled={togglingId === id}
                      className={`rounded-lg p-1.5 transition-colors ${
                        isSuspended
                          ? 'text-emerald-600 hover:bg-emerald-50'
                          : 'text-stone-400 hover:bg-rose-50 hover:text-rose-600'
                      }`}
                    >
                      {togglingId === id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isSuspended ? (
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <UserX className="h-3.5 w-3.5" />
                      )}
                    </button>
                  ) : selectedRole.name === 'SUPER_ADMIN' ? (
                    <div
                      title="Protected Account: Super Administrator accounts are permanent and cannot be deactivated"
                      className="flex cursor-not-allowed items-center justify-center rounded-lg p-1.5 opacity-40 transition-opacity hover:opacity-60"
                      style={{ color: 'var(--nfi-text-secondary)' }}
                    >
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
