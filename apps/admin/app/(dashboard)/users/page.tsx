'use client';

import React, { useEffect, useState } from 'react';
import { User, AdminService } from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { NfiButton } from '@/components/ui/nfi-button';
import { FormField, inputClassName, inputStyle } from '@/components/ui/form-field';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newUserType, setNewUserType] = useState('STAFF');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await AdminService.listUsers();
      setUsers(response.data?.items || (Array.isArray(response.data) ? response.data : []));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');
    try {
      const response = await AdminService.createUser({ email: newEmail, userType: newUserType });
      setIsModalOpen(false);
      setNewEmail('');
      setNewUserType('STAFF');
      if (response.data?.user) setUsers([...users, response.data.user]);
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage staff and customer accounts."
        breadcrumbs={[{ label: 'Access Control' }, { label: 'Users' }]}
        action={
          <div className="flex items-center gap-2">
            <NfiButton variant="secondary" size="sm" onClick={fetchUsers} disabled={loading}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </NfiButton>
            <NfiButton variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Account
            </NfiButton>
          </div>
        }
      />

      {error && (
        <div className="mb-5 p-4 rounded-md text-sm border" style={{ backgroundColor: 'rgba(198,40,40,0.05)', color: 'var(--nfi-danger)', borderColor: 'rgba(198,40,40,0.2)' }}>
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: 'var(--nfi-border)' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
            <thead style={{ backgroundColor: 'var(--nfi-surface-muted)' }}>
              <tr>
                {['User', 'Type', 'Status', 'MFA', 'Joined'].map((col, i) => (
                  <th key={i} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nfi-text-secondary)' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--nfi-primary)' }} />
                      Loading users…
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="group transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--nfi-surface-muted)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium" style={{ color: 'var(--nfi-text)' }}>
                        {user.profile?.firstName} {user.profile?.lastName}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--nfi-text-secondary)' }}>{user.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono font-medium px-2 py-1 rounded" style={{ backgroundColor: 'var(--nfi-surface-muted)', color: 'var(--nfi-text)' }}>
                        {user.userType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={user.status?.toLowerCase() ?? 'active'} label={user.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs" style={{ color: user.mfaEnabled ? 'var(--nfi-success)' : 'var(--nfi-text-secondary)' }}>
                        {user.mfaEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm whitespace-nowrap" style={{ color: 'var(--nfi-text-secondary)' }}>
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && users.length > 0 && (
          <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--nfi-border)', backgroundColor: 'var(--nfi-surface-muted)' }}>
            <p className="text-xs" style={{ color: 'var(--nfi-text-secondary)' }}>{users.length} users</p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative z-10 bg-white rounded-lg shadow-xl w-full max-w-md border" style={{ borderColor: 'var(--nfi-border)' }}>
            <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--nfi-border)' }}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--nfi-text)' }}>Create Staff Account</h2>
            </div>
            <form onSubmit={handleCreateUser} className="p-6">
              {modalError && (
                <div className="mb-4 p-3 rounded-md text-sm border" style={{ backgroundColor: 'rgba(198,40,40,0.05)', color: 'var(--nfi-danger)', borderColor: 'rgba(198,40,40,0.2)' }}>
                  {modalError}
                </div>
              )}
              <div className="space-y-4">
                <FormField label="Email" htmlFor="email" required>
                  <input id="email" type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputClassName} style={inputStyle} />
                </FormField>
                <FormField label="User Type" htmlFor="userType">
                  <select id="userType" value={newUserType} onChange={(e) => setNewUserType(e.target.value)} className={inputClassName} style={inputStyle}>
                    <option value="STAFF">STAFF</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </FormField>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <NfiButton type="button" variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</NfiButton>
                <NfiButton type="submit" variant="primary" size="sm" loading={submitting}>Create Account</NfiButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
