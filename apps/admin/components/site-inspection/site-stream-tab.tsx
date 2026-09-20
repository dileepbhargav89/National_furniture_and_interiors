'use client';

import React, { useState } from 'react';
import {
  DesignProject,
  SitePhotoStreamItem,
  SnagChecklistItem,
  SiteWorkPhase,
  RecordInspectionRequest,
  AddSitePhotoRequest,
  LogSnagRequest,
  UpdateSnagStatusRequest,
} from '@nfi/api-client';
import { NfiButton } from '../ui/nfi-button';
import { NewInspectionModal } from './new-inspection-modal';
import { UploadPhotoModal } from './upload-photo-modal';
import { NewSnagModal } from './new-snag-modal';
import { ResolveSnagModal } from './resolve-snag-modal';

interface SiteStreamTabProps {
  project: DesignProject;
  onRecordInspection: (payload: RecordInspectionRequest) => Promise<void>;
  onUploadPhoto: (payload: AddSitePhotoRequest) => Promise<void>;
  onLogSnag: (payload: LogSnagRequest) => Promise<void>;
  onResolveSnag: (snagId: string, payload: UpdateSnagStatusRequest) => Promise<void>;
}

const PHASE_LABELS: Record<SiteWorkPhase, string> = {
  CIVIL_DEMOLITION: 'Civil & Demolition',
  ELECTRICAL_PLUMBING: 'Electrical & Plumbing Rough-in',
  CARPENTRY_CARCASES: 'Carpentry & Marine Ply Carcases',
  VENEER_PRESSING: 'Veneer Pressing & Fluting',
  POP_FALSE_CEILING: 'POP & Gypsum False Ceiling',
  PU_POLISH_PAINTING: 'PU Polish & Italian Marble Lamination',
  HARDWARE_COUNTERTOP: 'Hardware Fitting & Quartz Countertops',
  DEEP_CLEANING_SNAGGING: 'Deep Cleaning & Snagging',
  HANDOVER_READY: 'Handover Ready',
};

export function SiteStreamTab({
  project,
  onRecordInspection,
  onUploadPhoto,
  onLogSnag,
  onResolveSnag,
}: SiteStreamTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'photos' | 'inspections' | 'snags'>('photos');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('ALL');

  // Modals state
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showSnagModal, setShowSnagModal] = useState(false);
  const [selectedSnagForResolution, setSelectedSnagForResolution] =
    useState<SnagChecklistItem | null>(null);

  // Lightbox preview
  const [previewPhoto, setPreviewPhoto] = useState<SitePhotoStreamItem | null>(null);

  const inspections = project.siteInspections || [];
  const photos = project.sitePhotos || [];
  const snags = project.snagItems || [];

  const openSnagsCount = snags.filter(
    (s) => s.status === 'OPEN' || s.status === 'IN_PROGRESS',
  ).length;
  const criticalSnagsCount = snags.filter(
    (s) => s.severity === 'CRITICAL' && s.status !== 'RESOLVED' && s.status !== 'CLIENT_VERIFIED',
  ).length;
  const clientPhotosCount = photos.filter((p) => p.isClientVisible).length;

  const roomsList = Array.from(new Set(photos.map((p) => p.roomName).filter(Boolean)));
  const filteredPhotos =
    selectedRoomFilter === 'ALL' ? photos : photos.filter((p) => p.roomName === selectedRoomFilter);

  return (
    <div className="space-y-6">
      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Work Phase
          </div>
          <div
            className="mt-1 truncate text-sm font-bold text-slate-900"
            title={PHASE_LABELS[inspections[0]?.currentPhase || 'CARPENTRY_CARCASES']}
          >
            🏗️ {PHASE_LABELS[inspections[0]?.currentPhase || 'CARPENTRY_CARCASES']}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Stage: {(project.stage || 'STAGE').replace(/_/g, ' ')}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Quality Punch List
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{openSnagsCount}</span>
            <span className="text-xs text-slate-400">Open Snags</span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-red-600">
            {criticalSnagsCount > 0
              ? `🚨 ${criticalSnagsCount} Critical Defects`
              : '✓ No Critical Defects'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Site Photo Stream
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{photos.length}</span>
            <span className="text-xs text-slate-400">Total Photos</span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-amber-700">
            🌟 {clientPhotosCount} Visible to Client Feed
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Site Inspections
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{inspections.length}</span>
            <span className="text-xs text-slate-400">Daily Logs</span>
          </div>
          <div className="mt-1 text-[11px] font-medium text-emerald-600">
            {inspections[0]
              ? `Last: ${new Date(inspections[0].inspectionDate).toLocaleDateString()}`
              : 'No inspections yet'}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Sub Navigation Bar & Quick Actions */}
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Sub Tabs */}
          <div className="flex w-fit items-center gap-1.5 rounded-lg bg-slate-200/70 p-1">
            <button
              onClick={() => setActiveSubTab('photos')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                activeSubTab === 'photos'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📸</span> Photo Stream
              <span className="py-0.2 ml-1 rounded-full bg-slate-100 px-1.5 text-[10px] text-slate-700">
                {photos.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('inspections')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                activeSubTab === 'inspections'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📋</span> Inspection Logs
              <span className="py-0.2 ml-1 rounded-full bg-slate-100 px-1.5 text-[10px] text-slate-700">
                {inspections.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('snags')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                activeSubTab === 'snags'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>⚠️</span> Snag Punch List
              {openSnagsCount > 0 && (
                <span className="py-0.2 ml-1 rounded-full bg-red-100 px-1.5 text-[10px] font-bold text-red-700">
                  {openSnagsCount}
                </span>
              )}
            </button>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-2">
            <NfiButton
              variant="secondary"
              size="sm"
              onClick={() => setShowPhotoModal(true)}
              className="border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              📸 Upload Photo
            </NfiButton>
            <NfiButton
              variant="secondary"
              size="sm"
              onClick={() => setShowSnagModal(true)}
              className="border-amber-300 bg-amber-50 text-xs font-semibold text-amber-900 hover:bg-amber-100"
            >
              ⚠️ Log Snag
            </NfiButton>
            <NfiButton
              variant="primary"
              size="sm"
              onClick={() => setShowInspectionModal(true)}
              className="bg-slate-900 text-xs font-bold text-amber-400 hover:bg-slate-800"
            >
              📋 Daily Inspection
            </NfiButton>
          </div>
        </div>

        {/* Sub-view 1: Photo Stream Gallery */}
        {activeSubTab === 'photos' && (
          <div className="space-y-6 p-6">
            {/* Room Filter Pills */}
            {roomsList.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="whitespace-nowrap font-semibold text-slate-500">Filter Area:</span>
                <button
                  onClick={() => setSelectedRoomFilter('ALL')}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    selectedRoomFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Rooms ({photos.length})
                </button>
                {roomsList.map((room) => (
                  <button
                    key={room}
                    onClick={() => setSelectedRoomFilter(room)}
                    className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition ${
                      selectedRoomFilter === room
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {room} ({photos.filter((p) => p.roomName === room).length})
                  </button>
                ))}
              </div>
            )}

            {filteredPhotos.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <span className="mb-2 block text-4xl">📸</span>
                <p className="text-sm font-semibold text-slate-700">
                  No on-site progress photos captured yet.
                </p>
                <p className="mt-1 text-xs">
                  Upload mobile photos of joinery, carcase alignment, and veneer pressing.
                </p>
                <NfiButton
                  variant="primary"
                  size="sm"
                  onClick={() => setShowPhotoModal(true)}
                  className="mt-4 bg-slate-900 font-bold text-amber-400"
                >
                  + Upload First Site Photograph
                </NfiButton>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition hover:shadow-lg"
                  >
                    <div
                      className="relative aspect-video cursor-pointer overflow-hidden bg-slate-800 sm:aspect-square"
                      onClick={() => setPreviewPhoto(photo)}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Client Visibility Pill */}
                      <div className="absolute left-2 top-2 z-10">
                        {photo.isClientVisible ? (
                          <span className="flex items-center gap-1 rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-bold text-slate-950 shadow-sm backdrop-blur-sm">
                            🌟 Client Feed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-slate-300 shadow-sm backdrop-blur-sm">
                            🔒 Internal QA
                          </span>
                        )}
                      </div>

                      {/* Phase Tag */}
                      <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <span className="max-w-[80%] truncate rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                          {photo.roomName}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col justify-between space-y-2 bg-white p-3">
                      <p className="line-clamp-2 text-xs font-medium leading-relaxed text-slate-800">
                        {photo.caption}
                      </p>
                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                        <span className="max-w-[120px] truncate">{photo.uploadedBy}</span>
                        <span>{new Date(photo.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sub-view 2: Inspection Logs History */}
        {activeSubTab === 'inspections' && (
          <div className="p-6">
            {inspections.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <span className="mb-2 block text-4xl">📋</span>
                <p className="text-sm font-semibold text-slate-700">
                  No site inspection reports on record.
                </p>
                <p className="mt-1 text-xs">
                  Supervisors log daily manpower, verified deliveries, and craftsmanship ratings.
                </p>
                <NfiButton
                  variant="primary"
                  size="sm"
                  onClick={() => setShowInspectionModal(true)}
                  className="mt-4 bg-slate-900 font-bold text-amber-400"
                >
                  + Log First Daily Inspection
                </NfiButton>
              </div>
            ) : (
              <div className="space-y-4">
                {inspections.map((insp, idx) => (
                  <div
                    key={insp.id}
                    className="shadow-xs space-y-4 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-amber-300/80"
                  >
                    {/* Header */}
                    <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-xs font-bold text-amber-800">
                          #{inspections.length - idx}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">
                              {new Date(insp.inspectionDate).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </h4>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              {PHASE_LABELS[insp.currentPhase]}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Audited by{' '}
                            <strong className="text-slate-800">{insp.inspectorName}</strong> (
                            {(insp.inspectorRole || 'INSPECTOR').replace(/_/g, ' ')})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            insp.siteCleanlinessRating === 'EXCELLENT'
                              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                              : insp.siteCleanlinessRating === 'GOOD'
                                ? 'border border-blue-200 bg-blue-50 text-blue-700'
                                : 'border border-amber-200 bg-amber-50 text-amber-700'
                          }`}
                        >
                          Cleanliness: {insp.siteCleanlinessRating}
                        </span>
                      </div>
                    </div>

                    {/* Work Completed Description */}
                    <div>
                      <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Work Executed Today
                      </span>
                      <p className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm leading-relaxed text-slate-800">
                        {insp.workCompletedToday}
                      </p>
                    </div>

                    {/* Manpower Breakdown */}
                    <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                        <span className="block text-slate-500">Carpenters</span>
                        <strong className="text-sm text-slate-900">
                          {insp.manpowerCount.carpenters}
                        </strong>
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                        <span className="block text-slate-500">Polishers</span>
                        <strong className="text-sm text-slate-900">
                          {insp.manpowerCount.polishers}
                        </strong>
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                        <span className="block text-slate-500">Electricians</span>
                        <strong className="text-sm text-slate-900">
                          {insp.manpowerCount.electricians}
                        </strong>
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                        <span className="block text-slate-500">Helpers</span>
                        <strong className="text-sm text-slate-900">
                          {insp.manpowerCount.helpers}
                        </strong>
                      </div>
                    </div>

                    {/* Materials Verified */}
                    {insp.materialDeliveriesVerified &&
                      insp.materialDeliveriesVerified.length > 0 && (
                        <div className="space-y-1 text-xs">
                          <span className="block font-bold uppercase tracking-wider text-slate-700">
                            📦 Verified Material Deliveries
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {insp.materialDeliveriesVerified.map((mat, i) => (
                              <span
                                key={i}
                                className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700"
                              >
                                ✓ {mat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {insp.blockersOrDelays && (
                      <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 p-2.5 text-xs text-amber-900">
                        ⚠️ <strong>Obstacles / Delays:</strong> {insp.blockersOrDelays}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sub-view 3: Snag Punch List */}
        {activeSubTab === 'snags' && (
          <div className="p-6">
            {snags.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <span className="mb-2 block text-4xl">💎</span>
                <p className="text-sm font-semibold text-slate-700">Zero defect snag list!</p>
                <p className="mt-1 text-xs">
                  No snags or quality defects have been logged for this project.
                </p>
                <NfiButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowSnagModal(true)}
                  className="mt-4 border-amber-300 bg-amber-50 text-amber-900"
                >
                  + Log A Defect / Snag
                </NfiButton>
              </div>
            ) : (
              <div className="space-y-3">
                {snags.map((snag) => (
                  <div
                    key={snag.id}
                    className={`flex flex-col gap-4 rounded-xl border p-4 transition md:flex-row md:items-center md:justify-between ${
                      snag.status === 'RESOLVED' || snag.status === 'CLIENT_VERIFIED'
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : snag.severity === 'CRITICAL'
                          ? 'border-red-200 bg-red-50/30'
                          : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Severity Badge */}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            snag.severity === 'CRITICAL'
                              ? 'bg-red-600 text-white'
                              : snag.severity === 'MODERATE'
                                ? 'bg-amber-500 text-white'
                                : 'bg-blue-600 text-white'
                          }`}
                        >
                          {snag.severity}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            snag.status === 'RESOLVED' || snag.status === 'CLIENT_VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : snag.status === 'IN_PROGRESS'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          ● {(snag.status || 'OPEN').replace(/_/g, ' ')}
                        </span>

                        <span className="text-xs font-semibold text-slate-500">
                          {snag.roomName}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">{snag.title}</h4>
                      <p className="text-xs leading-relaxed text-slate-600">{snag.description}</p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-slate-500">
                        <span>
                          Reported by: <strong className="text-slate-700">{snag.reportedBy}</strong>
                        </span>
                        {snag.assignedTo && (
                          <span>
                            Assigned to:{' '}
                            <strong className="text-slate-700">{snag.assignedTo}</strong>
                          </span>
                        )}
                        {snag.resolvedBy && (
                          <span>
                            Resolved by:{' '}
                            <strong className="text-emerald-700">{snag.resolvedBy}</strong>
                          </span>
                        )}
                      </div>

                      {snag.resolutionNote && (
                        <div className="mt-2 rounded border border-emerald-200/80 bg-emerald-100/60 p-2 text-xs text-emerald-900">
                          ✓ <strong>Resolution:</strong> {snag.resolutionNote}
                        </div>
                      )}
                    </div>

                    {/* Action & Photos */}
                    <div className="flex items-center gap-3">
                      {snag.beforePhotoUrl && (
                        <a
                          href={snag.beforePhotoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                        >
                          📷 Before
                        </a>
                      )}
                      {snag.afterPhotoUrl && (
                        <a
                          href={snag.afterPhotoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline"
                        >
                          📷 After
                        </a>
                      )}

                      {snag.status !== 'RESOLVED' && snag.status !== 'CLIENT_VERIFIED' ? (
                        <NfiButton
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedSnagForResolution(snag)}
                          className="bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-600"
                        >
                          ✓ Resolve Snag
                        </NfiButton>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                          ✓ Signed Off
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal for Photo Preview */}
      {previewPhoto && (
        <div
          className="animate-fadeIn fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative flex max-h-[90vh] max-w-4xl flex-col overflow-hidden rounded-2xl bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.caption}
                className="max-h-[75vh] w-auto object-contain"
              />
              <button
                onClick={() => setPreviewPhoto(null)}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-sm font-bold text-white hover:bg-black/90"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center justify-between bg-slate-900 p-4 text-white">
              <div>
                <span className="block text-xs font-semibold text-amber-400">
                  {previewPhoto.roomName}
                </span>
                <h4 className="text-sm font-medium text-slate-100">{previewPhoto.caption}</h4>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  Uploaded by {previewPhoto.uploadedBy} on{' '}
                  {new Date(previewPhoto.uploadedAt).toLocaleDateString()}
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  previewPhoto.isClientVisible
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {previewPhoto.isClientVisible ? 'Patron Visible' : 'Internal Only'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <NewInspectionModal
        isOpen={showInspectionModal}
        onClose={() => setShowInspectionModal(false)}
        expectedVersion={project.version}
        onSave={onRecordInspection}
      />

      <UploadPhotoModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        expectedVersion={project.version}
        onUpload={onUploadPhoto}
      />

      <NewSnagModal
        isOpen={showSnagModal}
        onClose={() => setShowSnagModal(false)}
        expectedVersion={project.version}
        onSave={onLogSnag}
      />

      {selectedSnagForResolution && (
        <ResolveSnagModal
          isOpen={true}
          onClose={() => setSelectedSnagForResolution(null)}
          expectedVersion={project.version}
          snag={selectedSnagForResolution}
          onResolve={async (payload) => {
            await onResolveSnag(selectedSnagForResolution.id, payload);
            setSelectedSnagForResolution(null);
          }}
        />
      )}
    </div>
  );
}
