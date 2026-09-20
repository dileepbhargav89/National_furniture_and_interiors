'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Role, Permission, AdminService, User } from '@nfi/api-client';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { AdminPasswordResetModal } from '@/components/users/admin-password-reset-modal';
import { InviteStaffModal } from '@/components/rbac/invite-staff-modal';
import { RolePermissionMatrix } from '@/components/rbac/role-permission-matrix';
import { RoleStaffRoster } from '@/components/rbac/role-staff-roster';
import { RbacAuditTrail } from '@/components/rbac/rbac-audit-trail';
import { ShieldCheck, UserPlus, RefreshCw, ChevronRight, Lock, Users } from 'lucide-react';

const ROLE_ORDER = [
  'SUPER_ADMIN',
  'ADMIN',
  'SALES_MANAGER',
  'DESIGN_MANAGER',
  'DESIGNER',
  'CATALOG_MANAGER',
  'SUPPORT_AGENT',
  'CUSTOMER',
];

const ROLE_ICONS: Record<string, string> = {
  SUPER_ADMIN: '👑',
  ADMIN: '🛡️',
  SALES_MANAGER: '📊',
  DESIGN_MANAGER: '📐',
  DESIGNER: '🎨',
  CATALOG_MANAGER: '🛋️',
  SUPPORT_AGENT: '🎧',
  CUSTOMER: '🧑‍💼',
};

const ROLE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  SUPER_ADMIN: {
    bg: 'rgba(197,160,89,0.12)',
    border: 'rgba(197,160,89,0.35)',
    text: 'var(--nfi-gold)',
  },
  ADMIN: {
    bg: 'rgba(58,31,15,0.07)',
    border: 'rgba(140,115,85,0.3)',
    text: 'var(--nfi-primary)',
  },
};

export default function RolesPage() {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.roleName === 'SUPER_ADMIN';

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rosterRefreshKey, setRosterRefreshKey] = useState(0);
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);

  // Modal states
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteScope, setInviteScope] = useState<'ADMIN' | 'STAFF'>('ADMIN');
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [rolesRes, permsRes] = await Promise.all([
        AdminService.listRoles(),
        AdminService.listPermissions(),
      ]);
      const rawRoles = (
        rolesRes.data && 'items' in rolesRes.data
          ? rolesRes.data.items
          : Array.isArray(rolesRes.data)
            ? rolesRes.data
            : []
      ) as Role[];
      const fetchedRoles: Role[] = rawRoles.map((r) => ({
        ...r,
        _id: r._id || r.id || '',
        id: r.id || r._id || '',
        isSystem: r.isSystem ?? r.isSystemRole ?? false,
        permissionIds: r.permissionIds ?? [],
      }));
      // Sort by predefined order
      fetchedRoles.sort((a, b) => {
        const ai = ROLE_ORDER.indexOf(a.name);
        const bi = ROLE_ORDER.indexOf(b.name);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
      setRoles(fetchedRoles);

      const rawPerms = (
        permsRes.data && 'items' in permsRes.data
          ? permsRes.data.items
          : Array.isArray(permsRes.data)
            ? permsRes.data
            : []
      ) as Permission[];
      const fetchedPerms: Permission[] = rawPerms.map((p) => ({
        ...p,
        _id: p._id || p.id || '',
        id: p.id || p._id || '',
        group: p.group || p.module || 'UNDEFINED',
      }));
      setPermissions(fetchedPerms);

      // Auto-select first role
      if (fetchedRoles.length > 0 && !selectedRoleId) {
        setSelectedRoleId(fetchedRoles[0]!._id || fetchedRoles[0]!.id || '');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load RBAC data');
    } finally {
      setLoading(false);
    }
  }, [selectedRoleId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const selectedRole = roles.find((r) => (r._id || r.id) === selectedRoleId) ?? null;

  // Permission IDs assigned to selected role
  const assignedPermissionIds: string[] = selectedRole?.permissionIds ?? [];

  const handleInviteAdmin = () => {
    setInviteScope('ADMIN');
    setInviteModalOpen(true);
  };

  const handleInviteOperator = () => {
    setInviteScope('STAFF');
    setInviteModalOpen(true);
  };

  const handleInviteSuccess = (_email: string, _roleName: string) => {
    setRosterRefreshKey((k) => k + 1);
    setAuditRefreshKey((k) => k + 1);
  };

  const handleRosterInvite = () => {
    const isAdminRole = selectedRole ? ['SUPER_ADMIN', 'ADMIN'].includes(selectedRole.name) : false;
    setInviteScope(isAdminRole ? 'ADMIN' : 'STAFF');
    setInviteModalOpen(true);
  };

  return (
    <>
      <PageHeader
        title="RBAC Command Centre"
        description="Manage roles, permissions, and staff access across the enterprise portal."
        breadcrumbs={[{ label: 'Access Control' }, { label: 'Roles & Permissions' }]}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchData()}
              disabled={loading}
              title="Refresh"
              className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all hover:opacity-80 active:scale-95 disabled:opacity-50"
              style={{ borderColor: 'var(--nfi-border)', color: 'var(--nfi-text-secondary)' }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* Super Admin only CTAs */}
            {isSuperAdmin && (
              <>
                <button
                  type="button"
                  onClick={handleInviteOperator}
                  className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all hover:opacity-90 active:scale-95"
                  style={{
                    borderColor: 'rgba(197,160,89,0.35)',
                    color: 'var(--nfi-gold)',
                    backgroundColor: 'rgba(197,160,89,0.08)',
                  }}
                >
                  <Users className="h-3.5 w-3.5" />+ Add Operator
                </button>
                <button
                  type="button"
                  onClick={handleInviteAdmin}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: 'var(--nfi-gold)' }}
                >
                  <UserPlus className="h-3.5 w-3.5" />+ Add Admin
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Error banner */}
      {error && (
        <div
          className="mb-5 rounded-xl p-4 text-sm"
          style={{
            backgroundColor: 'rgba(198,40,40,0.05)',
            color: 'var(--nfi-danger)',
            border: '1px solid rgba(198,40,40,0.2)',
          }}
        >
          {error}
        </div>
      )}

      {/* Non-super-admin notice */}
      {!isSuperAdmin && (
        <div
          className="mb-5 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm"
          style={{
            backgroundColor: 'rgba(197,160,89,0.06)',
            border: '1px solid rgba(197,160,89,0.18)',
            color: 'var(--nfi-text-secondary)',
          }}
        >
          <Lock className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--nfi-gold)' }} />
          <span>
            You have <strong style={{ color: 'var(--nfi-text)' }}>view-only</strong> access to the
            RBAC matrix. Contact a Super Admin to manage roles or invite staff.
          </span>
        </div>
      )}

      {/* 3-Panel Layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* ── Left: Role Selector Panel ── */}
        <div className="lg:col-span-3">
          <SectionCard title="System Roles">
            {loading ? (
              <div className="space-y-2 py-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-xl"
                    style={{ backgroundColor: 'var(--nfi-surface-muted)' }}
                  />
                ))}
              </div>
            ) : roles.length === 0 ? (
              <p
                className="py-6 text-center text-sm"
                style={{ color: 'var(--nfi-text-secondary)' }}
              >
                No roles found.
              </p>
            ) : (
              <ul
                className="-mx-6 -mt-6 divide-y"
                style={{ borderColor: 'var(--nfi-border)' }}
                role="listbox"
                aria-label="System roles"
              >
                {roles.map((role) => {
                  const isSelected = role._id === selectedRoleId;
                  const icon = ROLE_ICONS[role.name] ?? '🔧';
                  const color = ROLE_COLORS[role.name];

                  return (
                    <li
                      key={role._id}
                      role="option"
                      aria-selected={isSelected}
                      tabIndex={0}
                      onClick={() => setSelectedRoleId(role._id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setSelectedRoleId(role._id);
                      }}
                      className="flex cursor-pointer items-center gap-3 px-6 py-3.5 transition-all focus:outline-none focus-visible:ring-2"
                      style={{
                        backgroundColor: isSelected
                          ? (color?.bg ?? 'rgba(58,31,15,0.07)')
                          : 'transparent',
                        borderLeft: isSelected
                          ? `3px solid ${color?.text ?? 'var(--nfi-primary)'}`
                          : '3px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected)
                          (e.currentTarget as HTMLElement).style.backgroundColor =
                            'var(--nfi-surface-muted)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected)
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                      }}
                    >
                      <span className="text-base">{icon}</span>
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-xs font-bold"
                          style={{
                            color: isSelected
                              ? (color?.text ?? 'var(--nfi-primary)')
                              : 'var(--nfi-text)',
                          }}
                        >
                          {role.name.replace(/_/g, ' ')}
                        </p>
                        {role.description && (
                          <p
                            className="mt-0.5 truncate text-[10px] leading-relaxed"
                            style={{ color: 'var(--nfi-text-secondary)' }}
                          >
                            {role.description}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <ChevronRight
                          className="h-3.5 w-3.5 flex-shrink-0"
                          style={{ color: color?.text ?? 'var(--nfi-primary)' }}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>

        {/* ── Centre: Permission Matrix ── */}
        <div className="lg:col-span-5">
          <SectionCard
            title={
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" style={{ color: 'var(--nfi-gold)' }} />
                <span>
                  Permission Matrix
                  {selectedRole && (
                    <span
                      className="ml-2 font-mono text-[11px] font-normal"
                      style={{ color: 'var(--nfi-text-secondary)' }}
                    >
                      — {selectedRole.name}
                    </span>
                  )}
                </span>
              </div>
            }
          >
            {loading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div
                      className="mb-2 h-4 w-24 animate-pulse rounded"
                      style={{ backgroundColor: 'var(--nfi-surface-muted)' }}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2].map((j) => (
                        <div
                          key={j}
                          className="h-16 animate-pulse rounded-xl"
                          style={{ backgroundColor: 'var(--nfi-surface-muted)' }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <RolePermissionMatrix
                selectedRole={selectedRole}
                permissions={permissions}
                assignedPermissionIds={assignedPermissionIds}
              />
            )}
          </SectionCard>
        </div>

        {/* ── Right: Staff Roster ── */}
        <div className="lg:col-span-4">
          <SectionCard title="Staff Roster">
            <RoleStaffRoster
              selectedRole={selectedRole}
              onInvite={handleRosterInvite}
              onResetPassword={(u) => setPasswordResetUser(u)}
              refreshKey={rosterRefreshKey}
            />
          </SectionCard>
        </div>

        {/* ── Bottom: Audit Trail ── (full width) */}
        <div className="lg:col-span-12">
          <SectionCard title="Recent Access Activity">
            <RbacAuditTrail refreshKey={auditRefreshKey} />
          </SectionCard>
        </div>
      </div>

      {/* Invite Staff Modal */}
      <InviteStaffModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onSuccess={handleInviteSuccess}
        defaultScope={inviteScope}
        roles={roles}
      />

      {/* Password Reset Modal */}
      {passwordResetUser && (
        <AdminPasswordResetModal
          open={!!passwordResetUser}
          user={passwordResetUser}
          onClose={() => setPasswordResetUser(null)}
          onSuccess={() => {
            setPasswordResetUser(null);
            setAuditRefreshKey((k) => k + 1);
          }}
        />
      )}
    </>
  );
}
