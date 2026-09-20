'use client';

import React, { useState } from 'react';
import { SiteWorkPhase } from '@nfi/api-client';
import { NfiButton } from '../ui/nfi-button';

interface UploadPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedVersion: number;
  onUpload: (payload: {
    expectedVersion: number;
    url: string;
    thumbnailUrl?: string | undefined;
    roomName: string;
    caption: string;
    workPhase: SiteWorkPhase;
    uploadedBy: string;
    isClientVisible: boolean;
    tags?: string[] | undefined;
  }) => Promise<void>;
}

const PHASES: { value: SiteWorkPhase; label: string }[] = [
  { value: 'CIVIL_DEMOLITION', label: 'Civil & Demolition' },
  { value: 'ELECTRICAL_PLUMBING', label: 'Electrical & Plumbing Rough-in' },
  { value: 'CARPENTRY_CARCASES', label: 'Carpentry & Marine Ply Carcases' },
  { value: 'VENEER_PRESSING', label: 'Veneer Pressing & Fluting' },
  { value: 'POP_FALSE_CEILING', label: 'POP & Gypsum False Ceiling' },
  { value: 'PU_POLISH_PAINTING', label: 'PU Polish & Italian Marble Lamination' },
  { value: 'HARDWARE_COUNTERTOP', label: 'Hardware Fitting & Quartz Countertops' },
  { value: 'DEEP_CLEANING_SNAGGING', label: 'Deep Cleaning & Snagging' },
  { value: 'HANDOVER_READY', label: 'Handover Ready' },
];

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

export function UploadPhotoModal({
  isOpen,
  onClose,
  expectedVersion,
  onUpload,
}: UploadPhotoModalProps) {
  const [url, setUrl] = useState('');
  const [roomName, setRoomName] = useState(ROOM_PRESETS[1]!);
  const [caption, setCaption] = useState('');
  const [workPhase, setWorkPhase] = useState<SiteWorkPhase>('CARPENTRY_CARCASES');
  const [uploadedBy, setUploadedBy] = useState('Vijay Kumar (Project Engineer)');
  const [isClientVisible, setIsClientVisible] = useState(true);
  const [tagsInput, setTagsInput] = useState('joinery, bwp-710, bespoke');

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please provide a valid image URL.');
      return;
    }
    if (!caption.trim()) {
      setError('Please enter a descriptive caption for this photograph.');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await onUpload({
        expectedVersion,
        url: url.trim(),
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        roomName,
        caption: caption.trim(),
        workPhase,
        uploadedBy: uploadedBy.trim(),
        isClientVisible,
        tags: tags.length > 0 ? tags : undefined,
      });

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload site photograph.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="animate-fadeIn fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="text-xl">📸</span>
            <div>
              <h3 className="font-serif text-lg font-bold text-white">
                Upload On-Site Progress Photo
              </h3>
              <p className="text-xs text-amber-300">
                Daily visual stream for site engineering & client transparency
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
              Image CDN URL <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... or /uploads/..."
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
                Work Phase
              </label>
              <select
                value={workPhase}
                onChange={(e) => setWorkPhase(e.target.value as SiteWorkPhase)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none"
              >
                {PHASES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Caption / Craftsmanship Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Master wardrobe internal drawers assembled with Blum tip-on touch latches."
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Uploaded By
              </label>
              <input
                type="text"
                value={uploadedBy}
                onChange={(e) => setUploadedBy(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isClientVisible}
                onChange={(e) => setIsClientVisible(e.target.checked)}
                className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs font-bold text-amber-900">
                Visible to Client in Patron Portal Live Feed
              </span>
            </label>
            <p className="mt-1 pl-6 text-[11px] text-amber-700/80">
              When enabled, the homeowner can view this update in their dedicated site timeline.
              Uncheck for internal trade or QA audit records.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
            <NfiButton variant="secondary" size="md" onClick={onClose} disabled={uploading}>
              Cancel
            </NfiButton>
            <NfiButton
              variant="primary"
              size="md"
              type="submit"
              disabled={uploading}
              className="bg-slate-900 font-bold text-amber-400 hover:bg-slate-800"
            >
              {uploading ? 'Uploading...' : '✓ Publish Site Photo'}
            </NfiButton>
          </div>
        </form>
      </div>
    </div>
  );
}
