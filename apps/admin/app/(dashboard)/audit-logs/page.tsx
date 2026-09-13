'use client';

import React, { useEffect, useState } from 'react';
import { AuditLog, AdminService } from '@nfi/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { NfiButton } from '@/components/ui/nfi-button';

const getActionStyle = (action: string): { bg: string; text: string } => {
  if (action.includes('FAILED') || action.includes('REUSE_DETECTED'))
    return { bg: 'rgba(198,40,40,0.08)', text: 'var(--nfi-danger)' };
  if (action.includes('LOGIN') || action.includes('LOGOUT'))
    return { bg: 'rgba(21,101,192,0.08)', text: '#1565C0' };
  if (action.includes('CREATE') || action.includes('UPDATE') || action.includes('DELETE'))
    return { bg: 'rgba(183,121,31,0.1)', text: 'var(--nfi-warning)' };
  return { bg: 'var(--nfi-surface-muted)', text: 'var(--nfi-text-secondary)' };
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await AdminService.listAuditLogs();
      setLogs(response.data?.items || (Array.isArray(response.data) ? response.data : []));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <>
      <PageHeader
        title="Audit Logs"
        description="Review security events and system actions."
        breadcrumbs={[{ label: 'Access Control' }, { label: 'Audit Logs' }]}
        action={
          <NfiButton variant="secondary" size="sm" onClick={fetchLogs} disabled={loading}>
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

      <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: 'var(--nfi-border)' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--nfi-border)' }}>
            <thead style={{ backgroundColor: 'var(--nfi-surface-muted)' }}>
              <tr>
                {['Timestamp', 'Action', 'Actor', 'Resource', 'Details'].map((col, i) => (
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
                      Loading audit logs…
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: 'var(--nfi-text-secondary)' }}>No audit logs found.</td>
                </tr>
              ) : (
                logs.map((log) => {
                  const s = getActionStyle(log.action);
                  return (
                    <tr key={log._id} className="group transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--nfi-surface-muted)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <td className="px-5 py-3.5 text-xs font-mono whitespace-nowrap" style={{ color: 'var(--nfi-text-secondary)' }}>
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: s.bg, color: s.text }}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-mono" style={{ color: 'var(--nfi-text-secondary)' }}>{log.actorId || 'SYSTEM'}</p>
                        {log.ipAddress && <p className="text-[10px] mt-0.5" style={{ color: 'var(--nfi-text-secondary)', opacity: 0.7 }}>{log.ipAddress}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm" style={{ color: 'var(--nfi-text)' }}>{log.resource}</p>
                        {log.resourceId && <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--nfi-text-secondary)' }}>{log.resourceId}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        {log.details && Object.keys(log.details).length > 0 ? (
                          <pre className="text-[10px] p-2 rounded max-w-xs overflow-x-auto" style={{ color: 'var(--nfi-text-secondary)', backgroundColor: 'var(--nfi-surface-muted)' }}>
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--nfi-text-secondary)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && logs.length > 0 && (
          <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--nfi-border)', backgroundColor: 'var(--nfi-surface-muted)' }}>
            <p className="text-xs" style={{ color: 'var(--nfi-text-secondary)' }}>{logs.length} log entries</p>
          </div>
        )}
      </div>
    </>
  );
}
