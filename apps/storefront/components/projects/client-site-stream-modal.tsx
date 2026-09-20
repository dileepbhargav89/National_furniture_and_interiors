'use client';

import React, { useState } from 'react';
import {
  X,
  Camera,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  MessageCircle,
  Maximize2,
  Sparkles,
} from 'lucide-react';

export interface ClientPhotoFeedItem {
  id: string;
  url: string;
  roomName: string;
  caption: string;
  workPhase: string;
  date: string;
  verifiedBadge?: string;
}

export interface ClientSiteStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  projectLocation: string;
  currentPhase: string;
  progressPercent: number;
}

const DEMO_CLIENT_PHOTOS: ClientPhotoFeedItem[] = [
  {
    id: 'p-1',
    url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    roomName: 'Master Bedroom Suite',
    caption: 'Century Club Prime BWP 710 marine plywood carcases erected and laser-plumb verified.',
    workPhase: 'Custom Carpentry & Carcases',
    date: 'Sep 19, 2026',
    verifiedBadge: 'Century BWP 710 Verified',
  },
  {
    id: 'p-2',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    roomName: 'Living Room Atelier',
    caption:
      'Burma Teak fluted architectural panels aligned and clamped for cold hydraulic pressing.',
    workPhase: 'Veneer Pressing & Fluting',
    date: 'Sep 18, 2026',
    verifiedBadge: 'Authentic Burma Teak',
  },
  {
    id: 'p-3',
    url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
    roomName: 'Gourmet Modular Kitchen',
    caption:
      'Blum Tandembox Antaro double-wall steel drawer runners fitted with lifetime tension calibration.',
    workPhase: 'Hardware & Mechanism Fitting',
    date: 'Sep 17, 2026',
    verifiedBadge: 'Blum Austria Certified',
  },
  {
    id: 'p-4',
    url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
    roomName: 'Grand Foyer',
    caption: 'Concealed warm 3000K joinery cove lighting channel pre-wired and insulated.',
    workPhase: 'Electrical & Lighting Fitout',
    date: 'Sep 16, 2026',
    verifiedBadge: 'FR Grade Concealed Wiring',
  },
];

const DAILY_LOG_BULLETS = [
  {
    date: 'Sep 19, 2026',
    title: 'Master Suite Joinery Assembly Completed',
    details:
      '6 master carpenters on-site. Century BWP 710 carcases erected with Blum soft-close hinges. Site vacuumed and tidied.',
    cleanliness: '100% Clean (Vacuumed)',
  },
  {
    date: 'Sep 18, 2026',
    title: 'Burma Teak Architectural Flutes Staged',
    details:
      'Hydraulic cold-press veneer fluting completed for formal foyer partition wall. Zero adhesive bleedthrough.',
    cleanliness: 'Inspected & Staged',
  },
  {
    date: 'Sep 17, 2026',
    title: 'Kitchen Blum Runner Alignment Audit',
    details:
      '14 sets of Tandembox runners calibrated for 40kg dynamic load rating. Smooth gliding verified with laser gauge.',
    cleanliness: 'Hardware Boxes Organized',
  },
];

export function ClientSiteStreamModal({
  isOpen,
  onClose,
  projectTitle,
  projectLocation,
  currentPhase,
  progressPercent,
}: ClientSiteStreamModalProps) {
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [activePhoto, setActivePhoto] = useState<ClientPhotoFeedItem | null>(null);

  if (!isOpen) return null;

  const rooms = Array.from(new Set(DEMO_CLIENT_PHOTOS.map((p) => p.roomName)));
  const filteredPhotos =
    selectedRoom === 'ALL'
      ? DEMO_CLIENT_PHOTOS
      : DEMO_CLIENT_PHOTOS.filter((p) => p.roomName === selectedRoom);

  const whatsappHref = `https://wa.me/919109059791?text=${encodeURIComponent(
    `Hello National Furniture & Interiors Concierge, I am reviewing the live site progress for my project "${projectTitle}" (${projectLocation}) and have a quick inquiry.`,
  )}`;

  return (
    <div className="animate-fadeIn fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[#C5A880]/30 bg-[#0E131F] text-[#FAF9F6] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#C5A880]/20 bg-gradient-to-r from-[#0B0F17] via-[#121826] to-[#0B0F17] px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full border border-[#C5A880]/40 bg-[#C5A880]/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                <Sparkles className="h-3 w-3 text-[#D4AF37]" />
                Live On-Site Stream
              </span>
              <span className="text-xs text-gray-400">· {projectLocation}</span>
            </div>
            <h3 className="mt-1 font-serif text-xl font-bold text-white">{projectTitle}</h3>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Milestone & Phase Bar */}
        <div className="flex flex-col gap-4 border-b border-[#C5A880]/15 bg-[#141B2D] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-gray-400">
              Current Engineering Phase
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">🏗️ {currentPhase}</span>
              <span className="text-xs font-bold text-[#D4AF37]">
                ({progressPercent}% Complete)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-[#25D366] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-[#25D366]/20 transition hover:bg-[#20ba59]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>WhatsApp Site Concierge</span>
            </a>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 space-y-8 overflow-y-auto p-6">
          {/* Quality Assurance Guarantees Strip */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl border border-[#C5A880]/20 bg-gradient-to-br from-white/5 to-white/0 p-3.5">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#C5A880]/15 text-[#D4AF37]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-white">Century BWP 710</span>
                <span className="text-[11px] text-gray-400">10-Yr Marine Ply Guarantee</span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-[#C5A880]/20 bg-gradient-to-br from-white/5 to-white/0 p-3.5">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#C5A880]/15 text-[#D4AF37]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-white">Blum Austria Systems</span>
                <span className="text-[11px] text-gray-400">Soft-Close Lifetime Warranty</span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-[#C5A880]/20 bg-gradient-to-br from-white/5 to-white/0 p-3.5">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#C5A880]/15 text-[#D4AF37]">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-white">Daily Visual Audits</span>
                <span className="text-[11px] text-gray-400">Architect-Inspected Feeds</span>
              </div>
            </div>
          </div>

          {/* Room Filter Pills */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-2 font-serif text-base font-bold text-white">
                <Camera className="h-4 w-4 text-[#D4AF37]" />
                <span>Residence Photo Stream</span>
              </h4>
              <span className="text-xs text-gray-400">
                {filteredPhotos.length} high-resolution updates
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedRoom('ALL')}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  selectedRoom === 'ALL'
                    ? 'bg-[#D4AF37] font-bold text-slate-950 shadow-md shadow-[#D4AF37]/20'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                All Areas ({DEMO_CLIENT_PHOTOS.length})
              </button>
              {rooms.map((room) => (
                <button
                  key={room}
                  onClick={() => setSelectedRoom(room)}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                    selectedRoom === room
                      ? 'bg-[#D4AF37] font-bold text-slate-950 shadow-md shadow-[#D4AF37]/20'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {room}
                </button>
              ))}
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setActivePhoto(photo)}
                  className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#C5A880]/20 bg-[#131A2B] shadow-lg transition-all duration-300 hover:border-[#C5A880]"
                >
                  <div className="relative aspect-video overflow-hidden bg-black">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0E131F] via-transparent to-black/30" />

                    {photo.verifiedBadge && (
                      <div className="absolute left-3 top-3">
                        <span className="rounded-full border border-[#D4AF37]/50 bg-black/70 px-2.5 py-1 text-[10px] font-bold text-[#D4AF37] backdrop-blur-md">
                          ✓ {photo.verifiedBadge}
                        </span>
                      </div>
                    )}

                    <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <Maximize2 className="h-3.5 w-3.5" />
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                      <span className="font-semibold text-[#D4AF37]">{photo.roomName}</span>
                      <span className="text-[11px] text-gray-300">{photo.date}</span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-4">
                    <p className="text-xs leading-relaxed text-gray-200">{photo.caption}</p>
                    <div className="mt-2 border-t border-white/5 pt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Phase: {photo.workPhase}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Engineering Inspection Log Summary */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-serif text-base font-bold text-white">
              <Calendar className="h-4 w-4 text-[#D4AF37]" />
              <span>Architectural Site Visits & Engineering Log</span>
            </h4>

            <div className="space-y-3">
              {DAILY_LOG_BULLETS.map((log, idx) => (
                <div
                  key={idx}
                  className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-[#C5A880]/40"
                >
                  <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#D4AF37]">{log.date}</span>
                      <span className="font-semibold text-white">· {log.title}</span>
                    </div>
                    <span className="w-fit rounded-full border border-emerald-800 bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      {log.cleanliness}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-300">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* High-Res Lightbox Modal */}
        {activePhoto && (
          <div
            className="z-60 animate-fadeIn fixed inset-0 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl"
            onClick={() => setActivePhoto(null)}
          >
            <div
              className="relative flex max-h-[85vh] max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#C5A880]/30 bg-[#0E131F] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative flex items-center justify-center overflow-hidden bg-black">
                <img
                  src={activePhoto.url}
                  alt={activePhoto.caption}
                  className="max-h-[70vh] w-auto object-contain"
                />
                <button
                  onClick={() => setActivePhoto(null)}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col justify-between gap-3 border-t border-white/10 bg-[#0B0F17] p-4 text-white sm:flex-row sm:items-center">
                <div>
                  <span className="text-xs font-bold text-[#D4AF37]">{activePhoto.roomName}</span>
                  <h4 className="mt-0.5 text-sm font-medium text-gray-200">
                    {activePhoto.caption}
                  </h4>
                  <p className="mt-0.5 text-[11px] text-gray-400">Recorded on {activePhoto.date}</p>
                </div>
                {activePhoto.verifiedBadge && (
                  <span className="whitespace-nowrap rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/20 px-3 py-1 text-xs font-bold text-[#D4AF37]">
                    ✓ {activePhoto.verifiedBadge}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
