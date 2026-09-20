'use client';

import React, { useState } from 'react';
import { SnagChecklistItem, SnagStatus } from '@nfi/api-client';
import { NfiButton } from '../ui/nfi-button';

interface ResolveSnagModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedVersion: number;
  snag: SnagChecklistItem;
  onResolve: (payload: {
    expectedVersion: number;
    status: SnagStatus;
    resolvedBy: string;
    resolutionNote: string;
    afterPhotoUrl?: string | undefined;
  }) => Promise<void>;
}

export function ResolveSnagModal({
  isOpen,
  onClose,
  expectedVersion,
  snag,
  onResolve,
}: ResolveSnagModalProps) {
  const [resolvedBy, setResolvedBy] = useState('Lead Carpenter Ravi');
  const [resolutionNote, setResolutionNote] = useState('');
  const [afterPhotoUrl, setAfterPhotoUrl] = useState('');
  const [status, setStatus] = useState<SnagStatus>('RESOLVED');

  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resolutionNote.trim()) {
      setError('Please provide a note explaining how this snag was rectified.');
      return;
    }

    try {
      setResolving(true);
      setError(null);

      await onResolve({
        expectedVersion,
        status,
        resolvedBy: resolvedBy.trim(),
        resolutionNote: resolutionNote.trim(),
        afterPhotoUrl: afterPhotoUrl.trim() || undefined,
      });

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update snag resolution status.');
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="animate-fadeIn fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-emerald-950 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="text-xl">✅</span>
            <div>
              <h3 className="font-serif text-lg font-bold text-white">Resolve Quality Snag Item</h3>
              <p className="text-xs text-emerald-300">
                Sign off craftsmanship rectification with before/after audit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-emerald-900 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              ⚠️ {error}
            </div>
          )}

          {/* Current Snag Brief */}
          <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">{snag.title}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  snag.severity === 'CRITICAL'
                    ? 'bg-red-100 text-red-700'
                    : snag.severity === 'MODERATE'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                }`}
              >
                {snag.severity}
              </span>
            </div>
            <p className="text-xs text-slate-600">{snag.description}</p>
            <div className="text-[11px] text-slate-400">
              Area: <strong className="text-slate-700">{snag.roomName}</strong> | Assigned:{' '}
              <strong className="text-slate-700">{snag.assignedTo || 'Unassigned'}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Rectified / Resolved By <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={resolvedBy}
                onChange={(e) => setResolvedBy(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Target Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SnagStatus)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="RESOLVED">🟢 Resolved (Work Complete)</option>
                <option value="CLIENT_VERIFIED">💎 Client Verified & Signed Off</option>
                <option value="IN_PROGRESS">🟡 In Progress (Partial Fix)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Rectification Notes / Proof of Fix <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="e.g. Planed and re-veneered edge with 2mm solid teak lip. Buffed and sealed with 2 coats Sirca PU matte finish."
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              After Photo URL (Verification Proof)
            </label>
            <input
              type="text"
              value={afterPhotoUrl}
              onChange={(e) => setAfterPhotoUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... or /uploads/..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
            <NfiButton variant="secondary" size="md" onClick={onClose} disabled={resolving}>
              Cancel
            </NfiButton>
            <NfiButton
              variant="primary"
              size="md"
              type="submit"
              disabled={resolving}
              className="bg-emerald-900 font-bold text-emerald-100 hover:bg-emerald-800"
            >
              {resolving ? 'Signing Off...' : '✓ Confirm Resolution'}
            </NfiButton>
          </div>
        </form>
      </div>
    </div>
  );
}
