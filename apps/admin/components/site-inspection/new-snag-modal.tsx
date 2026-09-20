'use client';

import React, { useState } from 'react';
import { SnagSeverity } from '@nfi/api-client';
import { NfiButton } from '../ui/nfi-button';

interface NewSnagModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedVersion: number;
  onSave: (payload: {
    expectedVersion: number;
    title: string;
    roomName: string;
    description: string;
    severity: SnagSeverity;
    reportedBy: string;
    assignedTo?: string | undefined;
    beforePhotoUrl?: string | undefined;
  }) => Promise<void>;
}

const ROOM_PRESETS = [
  'Grand Foyer',
  'Formal Living Room',
  'Dining Lounge',
  'Gourmet Modular Kitchen',
  'Master Suite',
  'Walk-in Wardrobe',
  'Home Theatre',
  'Balcony Deck',
  'Guest Bedroom',
  'Puja Mandir',
];

export function NewSnagModal({ isOpen, onClose, expectedVersion, onSave }: NewSnagModalProps) {
  const [title, setTitle] = useState('');
  const [roomName, setRoomName] = useState(ROOM_PRESETS[1]!);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<SnagSeverity>('MODERATE');
  const [reportedBy, setReportedBy] = useState('Quality Auditor K. Mehta');
  const [assignedTo, setAssignedTo] = useState('Master Carpenter Harish');
  const [beforePhotoUrl, setBeforePhotoUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a concise snag title.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a specific description of the defect or snag.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await onSave({
        expectedVersion,
        title: title.trim(),
        roomName,
        description: description.trim(),
        severity,
        reportedBy: reportedBy.trim(),
        assignedTo: assignedTo.trim() || undefined,
        beforePhotoUrl: beforePhotoUrl.trim() || undefined,
      });

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to log snag item.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fadeIn fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h3 className="font-serif text-lg font-bold text-white">
                Log Snag / Quality Punch List Item
              </h3>
              <p className="text-xs text-amber-300">
                Enforce zero-defect luxury joinery & finish standards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-800 hover:text-white"
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

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Snag Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Veneer edge chip on Crockery Unit shutter"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Room / Area
              </label>
              <select
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none"
              >
                {ROOM_PRESETS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SnagSeverity)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 focus:border-amber-500 focus:outline-none"
              >
                <option value="CRITICAL" className="text-red-600">
                  🔴 Critical (Structural / Defect)
                </option>
                <option value="MODERATE" className="text-amber-600">
                  🟡 Moderate (Alignment / Hardware)
                </option>
                <option value="COSMETIC" className="text-blue-600">
                  🔵 Cosmetic (Minor Touch-up)
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Defect Description & Rectification Plan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 0.5mm edge chip on left shutter bevel edge requires re-edging with 2mm solid teak lip and re-polishing."
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Reported By
              </label>
              <input
                type="text"
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Assigned Contractor / Specialist
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="e.g. Master Carpenter Harish"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Before Photo URL (Optional)
            </label>
            <input
              type="text"
              value={beforePhotoUrl}
              onChange={(e) => setBeforePhotoUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... or /uploads/..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
            <NfiButton variant="secondary" size="md" onClick={onClose} disabled={saving}>
              Cancel
            </NfiButton>
            <NfiButton
              variant="primary"
              size="md"
              type="submit"
              disabled={saving}
              className="bg-slate-900 font-bold text-amber-400 hover:bg-slate-800"
            >
              {saving ? 'Logging Snag...' : '✓ Add to Punch List'}
            </NfiButton>
          </div>
        </form>
      </div>
    </div>
  );
}
