'use client';

import React, { useEffect, useState } from 'react';
import { Role, Permission, AdminService } from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { NfiButton } from '@/components/ui/nfi-button';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([AdminService.listRoles(), AdminService.listPermissions()]);
      setRoles(rolesRes.data?.items || (Array.isArray(rolesRes.data) ? rolesRes.data : []));
      setPermissions(permsRes.data?.items || (Array.isArray(permsRes.data) ? permsRes.data : []));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch RBAC data');
    } finally {
      setLoading(false);
    }
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.group]) acc[perm.group] = [];
    acc[perm.group]!.push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        description="View and manage the Role-Based Access Control matrix."
        breadcrumbs={[{ label: 'Access Control' }, { label: 'Roles & Permissions' }]}
        action={
          <NfiButton variant="secondary" size="sm" onClick={fetchData} disabled={loading}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </NfiButton>
        }
      />

      {error && (
        <div className="mb-5 p-4 rounded-md text-sm border" style={{ backgroundColor: 'rgba(198,40,40,0.05)', color: 'var(--nfi-danger)', borderColor: 'rgba(198,40,40,0.2)' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Roles */}
        <div className="lg:col-span-1">
          <SectionCard title="System Roles">
            {loading ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--nfi-text-secondary)' }}>Loading…</p>
            ) : roles.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--nfi-text-secondary)' }}>No roles found.</p>
            ) : (
              <ul className="divide-y -mx-6 -mt-6" style={{ borderColor: 'var(--nfi-border)' }}>
                {roles.map((role) => (
                  <li key={role._id} className="px-6 py-3.5 transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--nfi-surface-muted)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-sm font-semibold" style={{ color: 'var(--nfi-text)' }}>{role.name}</span>
                        {role.description && <p className="text-xs mt-0.5" style={{ color: 'var(--nfi-text-secondary)' }}>{role.description}</p>}
                      </div>
                      {role.isSystem && (
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(58,31,15,0.08)', color: 'var(--nfi-primary)' }}>
                          System
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        {/* Permissions */}
        <div className="lg:col-span-2">
          <SectionCard title="Permission Keys">
            {loading ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--nfi-text-secondary)' }}>Loading permissions…</p>
            ) : Object.keys(groupedPermissions).length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--nfi-text-secondary)' }}>No permissions found.</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([group, perms]) => (
                  <div key={group}>
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-3 pb-2 border-b" style={{ color: 'var(--nfi-text-secondary)', borderColor: 'var(--nfi-border)' }}>
                      {group}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {perms.map((perm) => (
                        <div key={perm._id} className="p-3 rounded-md border" style={{ borderColor: 'var(--nfi-border)', backgroundColor: 'var(--nfi-surface-muted)' }}>
                          <div className="font-mono text-xs font-semibold mb-1" style={{ color: 'var(--nfi-text)' }}>{perm.key}</div>
                          <div className="text-xs leading-relaxed" style={{ color: 'var(--nfi-text-secondary)' }}>{perm.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
