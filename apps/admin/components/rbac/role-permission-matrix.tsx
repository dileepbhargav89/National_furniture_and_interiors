'use client';

import React from 'react';
import { Role, Permission } from '@nfi/api-client';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

interface RolePermissionMatrixProps {
  selectedRole: Role | null;
  permissions: Permission[];
  /** Permission IDs assigned to the selected role */
  assignedPermissionIds: string[];
}

const MODULE_LABELS: Record<string, string> = {
  UNDEFINED: 'Platform & Auth',
  users: 'User Management',
  orders: 'Orders & Fulfilment',
  catalog: 'Catalog & Inventory',
  leads: 'CRM & Leads',
  design_projects: 'Design Projects',
  cms: 'Content Management',
  analytics: 'Analytics',
  notifications: 'Notifications',
  reviews: 'Reviews',
  payments: 'Payments',
  admin: 'Admin & RBAC',
};

const MODULE_ICONS: Record<string, string> = {
  UNDEFINED: '🔐',
  users: '👥',
  orders: '📦',
  catalog: '🛋️',
  leads: '📊',
  design_projects: '📐',
  cms: '📝',
  analytics: '📈',
  notifications: '🔔',
  reviews: '⭐',
  payments: '💳',
  admin: '🛡️',
};

export function RolePermissionMatrix({
  selectedRole,
  permissions,
  assignedPermissionIds,
}: RolePermissionMatrixProps) {
  if (!selectedRole) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
          style={{ backgroundColor: 'var(--nfi-surface-muted)' }}
        >
          🛡️
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--nfi-text-secondary)' }}>
          Select a role to view its permissions
        </p>
      </div>
    );
  }

  // Group permissions by their module/group
  const grouped = permissions.reduce(
    (acc, perm) => {
      const group = perm.group || perm.module || 'UNDEFINED';
      if (!acc[group]) acc[group] = [];
      acc[group]!.push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>,
  );

  const assignedSet = new Set(assignedPermissionIds);
  const totalPermissions = permissions.length;
  const assignedCount = permissions.filter(
    (p) => assignedSet.has(p._id) || (p.id ? assignedSet.has(p.id) : false),
  ).length;

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div
        className="flex items-center justify-between rounded-xl px-4 py-3"
        style={{
          backgroundColor: 'var(--nfi-surface-muted)',
          border: '1px solid var(--nfi-border)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold" style={{ color: 'var(--nfi-text)' }}>
            {selectedRole.name.replace(/_/g, ' ')}
          </span>
          {selectedRole.isSystem && (
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: 'rgba(197,160,89,0.12)',
                color: 'var(--nfi-gold)',
                border: '1px solid rgba(197,160,89,0.25)',
              }}
            >
              System Role
            </span>
          )}
        </div>
        <div
          className="flex items-center gap-1.5 text-xs"
          style={{ color: 'var(--nfi-text-secondary)' }}
        >
          <CheckCircle2 className="h-3.5 w-3.5" style={{ color: '#16a34a' }} />
          <span>
            <strong style={{ color: 'var(--nfi-text)' }}>{assignedCount}</strong> /{' '}
            {totalPermissions} permissions
          </span>
        </div>
      </div>

      {/* Read-only notice */}
      <div
        className="flex items-start gap-2 rounded-lg px-3 py-2.5"
        style={{
          backgroundColor: 'rgba(197,160,89,0.06)',
          border: '1px solid rgba(197,160,89,0.18)',
        }}
      >
        <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--nfi-gold)' }} />
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--nfi-text-secondary)' }}>
          System role permissions are read-only. Contact your system architect to modify role
          boundaries.
        </p>
      </div>

      {/* Permission groups */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([group, perms]) => {
          const groupAssigned = perms.filter((p) => assignedSet.has(p._id)).length;
          const icon = MODULE_ICONS[group] ?? '🔧';
          const label = MODULE_LABELS[group] ?? group;

          return (
            <div key={group}>
              {/* Group header */}
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{icon}</span>
                  <h3
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--nfi-text-secondary)' }}
                  >
                    {label}
                  </h3>
                </div>
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: groupAssigned > 0 ? '#16a34a' : 'var(--nfi-text-secondary)' }}
                >
                  {groupAssigned}/{perms.length}
                </span>
              </div>

              {/* Permission cards */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {perms.map((perm) => {
                  const assigned =
                    assignedSet.has(perm._id) || (perm.id ? assignedSet.has(perm.id) : false);
                  const permKey = perm._id || perm.id || perm.key;
                  return (
                    <div
                      key={permKey}
                      className="flex items-start gap-3 rounded-xl p-3 transition-colors"
                      style={{
                        border: `1px solid ${assigned ? 'rgba(34,197,94,0.2)' : 'var(--nfi-border)'}`,
                        backgroundColor: assigned
                          ? 'rgba(34,197,94,0.04)'
                          : 'var(--nfi-surface-muted)',
                      }}
                    >
                      {assigned ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                      ) : (
                        <XCircle
                          className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
                          style={{ color: 'var(--nfi-border)' }}
                        />
                      )}
                      <div className="min-w-0">
                        <p
                          className="font-mono text-[11px] font-semibold leading-tight"
                          style={{
                            color: assigned ? 'var(--nfi-text)' : 'var(--nfi-text-secondary)',
                          }}
                        >
                          {perm.key}
                        </p>
                        <p
                          className="mt-0.5 text-[10px] leading-relaxed"
                          style={{ color: 'var(--nfi-text-secondary)' }}
                        >
                          {perm.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
