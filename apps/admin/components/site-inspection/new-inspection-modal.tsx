'use client';

import React, { useState } from 'react';
import { SiteWorkPhase, SitePhotoStreamItem, SnagChecklistItem } from '@nfi/api-client';
import { NfiButton } from '../ui/nfi-button';

interface NewInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedVersion: number;
  onSave: (payload: {
    expectedVersion: number;
    inspectionDate: string;
    inspectorName: string;
    inspectorRole: 'SITE_SUPERVISOR' | 'PROJECT_ENGINEER' | 'QUALITY_AUDITOR' | 'LEAD_ARCHITECT';
    currentPhase: SiteWorkPhase;
    workCompletedToday: string;
    manpowerCount: {
      carpenters: number;
      polishers: number;
      electricians: number;
      helpers: number;
    };
    materialDeliveriesVerified?: string[] | undefined;
    siteCleanlinessRating?: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'FAILED' | undefined;
    blockersOrDelays?: string | undefined;
    photos?: Omit<SitePhotoStreamItem, 'id' | 'uploadedAt'>[] | undefined;
    snags?: Omit<SnagChecklistItem, 'id' | 'reportedAt' | 'status'>[] | undefined;
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

export function NewInspectionModal({
  isOpen,
  onClose,
  expectedVersion,
  onSave,
}: NewInspectionModalProps) {
  const [inspectorName, setInspectorName] = useState('Vijay Kumar');
  const [inspectorRole, setInspectorRole] = useState<
    'SITE_SUPERVISOR' | 'PROJECT_ENGINEER' | 'QUALITY_AUDITOR' | 'LEAD_ARCHITECT'
  >('PROJECT_ENGINEER');
  const [currentPhase, setCurrentPhase] = useState<SiteWorkPhase>('CARPENTRY_CARCASES');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]!);
  const [workCompletedToday, setWorkCompletedToday] = useState('');

  // Manpower
  const [carpenters, setCarpenters] = useState(4);
  const [polishers, setPolishers] = useState(0);
  const [electricians, setElectricians] = useState(2);
  const [helpers, setHelpers] = useState(3);

  // Materials & Cleanliness
  const [materialsText, setMaterialsText] = useState(
    'Century BWP 710 Marine Ply (24 sheets)\nBlum Tandembox runners (8 sets)',
  );
  const [siteCleanliness, setSiteCleanliness] = useState<
    'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'FAILED'
  >('EXCELLENT');
  const [blockersOrDelays, setBlockersOrDelays] = useState('');

  // Quick photo upload
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoRoom, setPhotoRoom] = useState('Living Room');
  const [photoCaption, setPhotoCaption] = useState('');
  const [isClientVisible, setIsClientVisible] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workCompletedToday.trim()) {
      setError('Please provide details of work completed today.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const verifiedMaterials = materialsText
        .split('\n')
        .map((m) => m.trim())
        .filter((m) => m.length > 0);

      const photos: Omit<SitePhotoStreamItem, 'id' | 'uploadedAt'>[] = [];
      if (photoUrl.trim()) {
        photos.push({
          url: photoUrl.trim(),
          roomName: photoRoom,
          caption: photoCaption.trim() || 'Site work verification',
          workPhase: currentPhase,
          uploadedBy: inspectorName,
          isClientVisible,
          tags: [currentPhase.toLowerCase().replace(/_/g, '-')],
        });
      }

      await onSave({
        expectedVersion,
        inspectionDate: new Date(inspectionDate).toISOString(),
        inspectorName,
        inspectorRole,
        currentPhase,
        workCompletedToday,
        manpowerCount: {
          carpenters,
          polishers,
          electricians,
          helpers,
        },
        materialDeliveriesVerified: verifiedMaterials,
        siteCleanlinessRating: siteCleanliness,
        blockersOrDelays: blockersOrDelays.trim() || undefined,
        photos: photos.length > 0 ? photos : undefined,
      });

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record site inspection.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fadeIn fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="text-xl">📋</span>
            <div>
              <h3 className="font-serif text-lg font-bold text-white">
                Log Turnkey Site Inspection
              </h3>
              <p className="text-xs text-amber-300">
                Daily engineering & craftsmanship quality audit
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
        <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              ⚠️ {error}
            </div>
          )}

          {/* Inspector Details */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Inspection Date
              </label>
              <input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Inspector Name
              </label>
              <input
                type="text"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Role
              </label>
              <select
                value={inspectorRole}
                onChange={(e) =>
                  setInspectorRole(
                    e.target.value as
                      'SITE_SUPERVISOR' | 'PROJECT_ENGINEER' | 'QUALITY_AUDITOR' | 'LEAD_ARCHITECT',
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none"
              >
                <option value="SITE_SUPERVISOR">Site Supervisor</option>
                <option value="PROJECT_ENGINEER">Project Engineer</option>
                <option value="QUALITY_AUDITOR">Quality Auditor</option>
                <option value="LEAD_ARCHITECT">Lead Architect</option>
              </select>
            </div>
          </div>

          {/* Work Phase & Cleanliness */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Current Work Phase
              </label>
              <select
                value={currentPhase}
                onChange={(e) => setCurrentPhase(e.target.value as SiteWorkPhase)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-amber-500 focus:outline-none"
              >
                {PHASES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Site Cleanliness Rating
              </label>
              <select
                value={siteCleanliness}
                onChange={(e) =>
                  setSiteCleanliness(
                    e.target.value as 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'FAILED',
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-amber-500 focus:outline-none"
              >
                <option value="EXCELLENT">✨ Excellent (Vacuumed, Organized)</option>
                <option value="GOOD">👍 Good (Materials Staged Properly)</option>
                <option value="NEEDS_ATTENTION">⚠️ Needs Attention (Sawdust/Debris)</option>
                <option value="FAILED">❌ Failed Safety/Cleanliness Standard</option>
              </select>
            </div>
          </div>

          {/* Work Completed */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Work Completed Today <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={workCompletedToday}
              onChange={(e) => setWorkCompletedToday(e.target.value)}
              placeholder="e.g., Century BWP 710 marine ply carcases erected for Master Bedroom Wardrobe. Laser level alignment checked and plumb."
              className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-800 focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          {/* On-Site Manpower Breakdown */}
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
              <span>👷</span> Active On-Site Manpower
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-600">
                  Carpenters
                </label>
                <input
                  type="number"
                  min="0"
                  value={carpenters}
                  onChange={(e) => setCarpenters(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-600">
                  Polishers
                </label>
                <input
                  type="number"
                  min="0"
                  value={polishers}
                  onChange={(e) => setPolishers(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-600">
                  Electricians
                </label>
                <input
                  type="number"
                  min="0"
                  value={electricians}
                  onChange={(e) => setElectricians(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-600">Helpers</label>
                <input
                  type="number"
                  min="0"
                  value={helpers}
                  onChange={(e) => setHelpers(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm font-semibold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Material Deliveries Verified */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Material Deliveries Verified (One per line)
            </label>
            <textarea
              rows={2}
              value={materialsText}
              onChange={(e) => setMaterialsText(e.target.value)}
              placeholder="Century BWP 710 Marine Plywood (30 sheets)&#10;Blum Hinges & Runner Sets (12 boxes)"
              className="w-full rounded-lg border border-slate-200 p-2.5 font-mono text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Blockers or Delays */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Blockers or Delays (Optional)
            </label>
            <input
              type="text"
              value={blockersOrDelays}
              onChange={(e) => setBlockersOrDelays(e.target.value)}
              placeholder="e.g. Society lift service maintenance between 2 PM - 4 PM."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Optional Quick Photo Attachment */}
          <div className="space-y-3 rounded-xl border border-amber-200/60 bg-amber-50/50 p-4">
            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900">
              <span>📸</span> Attach Inspection Photo (Optional)
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700">
                  Photo CDN URL
                </label>
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or /uploads/..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700">
                  Room / Area
                </label>
                <input
                  type="text"
                  value={photoRoom}
                  onChange={(e) => setPhotoRoom(e.target.value)}
                  placeholder="e.g. Master Bedroom"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">
                Photo Caption
              </label>
              <input
                type="text"
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                placeholder="e.g. Laser level plumb verification on wardrobe frame"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 pt-1">
              <input
                type="checkbox"
                checked={isClientVisible}
                onChange={(e) => setIsClientVisible(e.target.checked)}
                className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs font-semibold text-slate-700">
                Display in Patron Portal Live Feed 🌟
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <NfiButton variant="secondary" size="md" onClick={onClose} disabled={submitting}>
              Cancel
            </NfiButton>
            <NfiButton
              variant="primary"
              size="md"
              type="submit"
              disabled={submitting}
              className="bg-slate-900 font-bold text-amber-400 hover:bg-slate-800"
            >
              {submitting ? 'Saving Inspection...' : '✓ Record Inspection'}
            </NfiButton>
          </div>
        </form>
      </div>
    </div>
  );
}
