'use client';

import React, { useEffect, useCallback } from 'react';
import { NfiButton } from './nfi-button';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // Close on Escape
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onCancel();
    },
    [open, onCancel]
  );

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative z-10 bg-white rounded-lg shadow-xl max-w-sm w-full p-6 border"
        style={{ borderColor: 'var(--nfi-border)' }}
      >
        {/* Icon */}
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor:
                variant === 'danger' ? 'rgba(198, 40, 40, 0.1)' : 'rgba(58, 31, 15, 0.1)',
            }}
          >
            {variant === 'danger' ? (
              <svg
                className="w-5 h-5"
                style={{ color: 'var(--nfi-danger)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                style={{ color: 'var(--nfi-primary)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>

          <div className="flex-1">
            <h3
              id="modal-title"
              className="text-base font-semibold mb-1"
              style={{ color: 'var(--nfi-text)' }}
            >
              {title}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--nfi-text-secondary)' }}>
              {description}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <NfiButton variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </NfiButton>
          <NfiButton variant={variant} size="sm" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </NfiButton>
        </div>
      </div>
    </div>
  );
}
