'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRealtimeNotifications, NotificationToast } from './realtime-notification-provider';

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: NotificationToast;
  onDismiss: (id: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [remainingMs, setRemainingMs] = useState(toast.duration);
  const startTimeRef = useRef(Date.now());
  const elapsedBeforePauseRef = useRef(0);

  useEffect(() => {
    if (isHovered) {
      // Record how much time elapsed before hover
      elapsedBeforePauseRef.current += Date.now() - startTimeRef.current;
      return;
    }

    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const currentRun = Date.now() - startTimeRef.current;
      const totalElapsed = elapsedBeforePauseRef.current + currentRun;
      const left = Math.max(0, toast.duration - totalElapsed);
      setRemainingMs(left);

      if (left <= 0) {
        clearInterval(interval);
        onDismiss(toast.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isHovered, toast.duration, toast.id, onDismiss]);

  const progressPercent = Math.max(0, Math.min(100, (remainingMs / toast.duration) * 100));

  const isUrgent = toast.priority === 'URGENT';
  const isSnag = toast.type === 'SNAG_ALERT';
  const isSwatch = toast.type === 'SWATCH_KIT_ORDERED';
  const isLead =
    toast.type === 'LEAD_CONCIERGE_ALERT' ||
    toast.type === 'CONSULTATION_BOOKED' ||
    toast.type === 'LEAD_ASSIGNED';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-88 pointer-events-auto relative overflow-hidden rounded-xl border bg-[#0B0F17]/95 p-4 shadow-2xl backdrop-blur-md transition-all duration-300 sm:w-96"
      style={{
        borderColor: isSnag ? '#EF4444' : isUrgent ? '#D4AF37' : 'rgba(197, 168, 128, 0.4)',
        boxShadow: isUrgent
          ? '0 10px 25px -5px rgba(212, 175, 55, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
          : '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
      }}
      role="alert"
    >
      {/* Top Header Badge & Close */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isSnag ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Site Snag
            </span>
          ) : isSwatch ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Material Swatch
            </span>
          ) : isLead ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#C5A880]/50 bg-[#C5A880]/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E6CA9E]">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              Concierge Lead
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Update
            </span>
          )}

          {isUrgent && (
            <span className="rounded bg-amber-500/30 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-300">
              URGENT
            </span>
          )}
        </div>

        <button
          onClick={() => onDismiss(toast.id)}
          className="rounded-md p-1 text-slate-400 transition-colors hover:text-white"
          aria-label="Dismiss notification"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <h4 className="text-sm font-semibold tracking-wide text-white">{toast.title}</h4>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-300">{toast.message}</p>

      {/* Action link */}
      {toast.actionUrl && (
        <div className="mt-3 flex justify-end">
          <Link
            href={toast.actionUrl}
            onClick={() => onDismiss(toast.id)}
            className="group inline-flex items-center gap-1 text-xs font-medium text-[#D4AF37] transition-colors hover:text-[#F3E5AB]"
          >
            <span>{toast.actionLabel || 'Inspect in Console'}</span>
            <svg
              className="h-3 w-3 transform transition-transform group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {/* Progress countdown bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/80">
        <div
          className="h-full transition-all ease-linear"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: isSnag ? '#EF4444' : isUrgent ? '#D4AF37' : '#C5A880',
          }}
        />
      </div>
    </div>
  );
}

export function NotificationToastContainer() {
  const { toasts, dismissToast, isMuted, toggleMute } = useRealtimeNotifications();

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Live notifications"
      className="pointer-events-none fixed right-5 top-16 z-50 flex max-h-[calc(100vh-5rem)] flex-col gap-3 overflow-y-auto p-2"
    >
      {/* Sound Mute Quick Toggle Pill */}
      <div className="pointer-events-auto mb-1 flex justify-end">
        <button
          onClick={toggleMute}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-[#171717]/90 px-2.5 py-1 text-[11px] font-medium text-slate-300 shadow-md backdrop-blur-sm transition-all hover:border-[#C5A880]/50 hover:text-white"
          title={isMuted ? 'Unmute luxury notification chime' : 'Mute notification chime'}
        >
          {isMuted ? (
            <>
              <svg
                className="h-3 w-3 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                />
              </svg>
              <span>Chime Muted</span>
            </>
          ) : (
            <>
              <svg
                className="h-3 w-3 text-[#D4AF37]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
              <span>Acoustic Audio On</span>
            </>
          )}
        </button>
      </div>

      {/* Stack of toasts */}
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </aside>
  );
}
