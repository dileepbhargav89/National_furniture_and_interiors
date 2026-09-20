'use client';

import React, { useEffect, useState } from 'react';
import { AdminService, AuditLog } from '@nfi/api-client';
import { History, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface RbacAuditTrailProps {
  refreshKey?: number;
}

const ACTION_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  CREATE: { label: 'Created', color: '#16a34a', bg: 'rgba(34,197,94,0.08)' },
  UPDATE: { label: 'Updated', color: '#d97706', bg: 'rgba(251,191,36,0.08)' },
  DELETE: { label: 'Deleted', color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
  STATUS_CHANGE: { label: 'Status Changed', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
  SUSPEND: { label: 'Suspended', color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
  RESET_PASSWORD: { label: 'Password Reset', color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
};

function formatRelative(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function RbacAuditTrail({ refreshKey = 0 }: RbacAuditTrailProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await AdminService.listAuditLogs({ limit: 10 });
      const items = res.data?.items ?? [];
      // Filter to relevant RBAC/user management actions
      const filtered = items.filter(
        (l) =>
          ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'SUSPEND', 'RESET_PASSWORD'].includes(
            l.action,
          ) && ['users', 'roles', 'permissions'].includes(l.resource),
      );
      setLogs(filtered.slice(0, 8));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs();
  }, [refreshKey]);

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4" style={{ color: 'var(--nfi-text-secondary)' }} />
          <h3 className="text-sm font-bold" style={{ color: 'var(--nfi-text)' }}>
            Recent Access Activity
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchLogs()}
            title="Refresh audit trail"
            className="rounded-lg p-1.5 transition-colors hover:bg-black/5"
            style={{ color: 'var(--nfi-text-secondary)' }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/audit-logs"
            className="flex items-center gap-1 text-[11px] font-semibold transition-colors hover:underline"
            style={{ color: 'var(--nfi-gold)' }}
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--nfi-gold)' }} />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <p className="py-4 text-center text-xs" style={{ color: 'var(--nfi-text-secondary)' }}>
          {error}
        </p>
      )}

      {/* Empty */}
      {!loading && !error && logs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <History className="mb-2 h-6 w-6" style={{ color: 'var(--nfi-border)' }} />
          <p className="text-xs" style={{ color: 'var(--nfi-text-secondary)' }}>
            No recent access control activity
          </p>
        </div>
      )}

      {/* Log list */}
      {!loading && logs.length > 0 && (
        <ul className="space-y-2">
          {logs.map((log) => {
            const actionCfg = ACTION_LABEL[log.action] ?? {
              label: log.action,
              color: 'var(--nfi-text-secondary)',
              bg: 'var(--nfi-surface-muted)',
            };

            return (
              <li
                key={log._id}
                className="flex items-start gap-3 rounded-xl p-3"
                style={{
                  border: '1px solid var(--nfi-border)',
                  backgroundColor: 'var(--nfi-surface-muted)',
                }}
              >
                {/* Action badge */}
                <span
                  className="mt-0.5 flex-shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                  style={{ backgroundColor: actionCfg.bg, color: actionCfg.color }}
                >
                  {actionCfg.label}
                </span>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[11px] font-medium"
                    style={{ color: 'var(--nfi-text)' }}
                  >
                    <span className="font-mono" style={{ color: 'var(--nfi-text-secondary)' }}>
                      {log.resource}
                    </span>
                    {log.resourceId && (
                      <span
                        className="font-mono text-[10px]"
                        style={{ color: 'var(--nfi-text-secondary)' }}
                      >
                        {' '}
                        · {log.resourceId.slice(-6)}
                      </span>
                    )}
                  </p>
                  <div
                    className="mt-0.5 flex items-center gap-2 text-[10px]"
                    style={{ color: 'var(--nfi-text-secondary)' }}
                  >
                    {log.ipAddress && <span className="font-mono">{log.ipAddress}</span>}
                    <span>·</span>
                    <span>{formatRelative(log.createdAt)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
