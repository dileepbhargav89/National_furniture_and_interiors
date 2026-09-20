'use client';

import React, { useState } from 'react';
import { AdminService, User } from '@nfi/api-client';
import { FormField, inputClassName, inputStyle } from '@/components/ui/form-field';
import { NfiButton } from '@/components/ui/nfi-button';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { canManageUserCredentials } from '@/lib/rbac-hierarchy';

interface AdminPasswordResetModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AdminPasswordResetModal({
  user,
  open,
  onClose,
  onSuccess,
}: AdminPasswordResetModalProps) {
  const currentActor = useAuthStore((s) => s.user);
  const isAuthorized = canManageUserCredentials(currentActor, user);

  const [resetMode, setResetMode] = useState<'LINK' | 'TEMPORARY'>('LINK');
  const [customPassword, setCustomPassword] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState<{
    message: string;
    temporaryPassword?: string | undefined;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open || !user) return null;

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) {
      setError('Access Denied: Only a Super Administrator can reset passwords for this account.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const res = await AdminService.adminResetPassword(user._id || user.id, {
        ...(resetMode === 'TEMPORARY' && customPassword ? { newPassword: customPassword } : {}),
        mustChangePassword,
        sendEmailLink: resetMode === 'LINK',
      });

      if (res.data) {
        setSuccessInfo({
          message: res.data.message || 'Password reset successfully executed.',
          temporaryPassword: res.data.temporaryPassword,
        });
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset user password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPassword = () => {
    if (successInfo?.temporaryPassword) {
      navigator.clipboard.writeText(successInfo.temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="backdrop-blur-xs absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border bg-white shadow-2xl"
        style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{
            borderColor: 'var(--nfi-border, #DDD0BE)',
            backgroundColor: 'var(--nfi-surface-muted, #FAF9F6)',
          }}
        >
          <div>
            <h2 className="text-base font-bold text-stone-900">Admin Password Reset</h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Assisted credential recovery for{' '}
              <span className="font-semibold text-stone-800">{user.fullName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="space-y-4 p-6">
          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {error}
            </div>
          )}

          {!isAuthorized ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-xs">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                  <span>Protected Account Hierarchy</span>
                </div>
                <p className="mt-2 leading-relaxed text-stone-700">
                  The account for <strong>{user.fullName}</strong> is configured with the{' '}
                  <span className="font-semibold text-stone-900">{user.userType}</span> role.
                  Platform security policy restricts credential recovery and password resets for
                  this tier exclusively to authorized <strong>Super Administrators</strong>.
                </p>
              </div>
              <div className="flex justify-end pt-2">
                <NfiButton variant="secondary" size="sm" onClick={onClose}>
                  Dismiss
                </NfiButton>
              </div>
            </div>
          ) : successInfo ? (
            <div className="space-y-4">
              <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                  <span>✓ Action Completed</span>
                </div>
                <p className="text-xs text-stone-700">{successInfo.message}</p>

                {successInfo.temporaryPassword && (
                  <div className="mt-3 space-y-1.5 rounded border border-emerald-300 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                      Generated Temporary Password:
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-base font-bold tracking-wider text-stone-900">
                        {successInfo.temporaryPassword}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="rounded border border-stone-300 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100"
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <p className="font-semibold">Security Protocol Notice:</p>
                <p className="text-[11px] text-amber-800">
                  The user will be required to change this temporary password immediately upon their
                  next login.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <NfiButton variant="primary" size="sm" onClick={onClose}>
                  Done
                </NfiButton>
              </div>
            </div>
          ) : (
            <form onSubmit={handleExecuteReset} className="space-y-4">
              {/* Reset Mode Switcher */}
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-stone-200 bg-stone-100 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setResetMode('LINK')}
                  className={`rounded-md px-3 py-2 font-medium transition-all ${
                    resetMode === 'LINK'
                      ? 'shadow-xs bg-white font-semibold text-stone-900'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Send 24h Reset Link
                </button>
                <button
                  type="button"
                  onClick={() => setResetMode('TEMPORARY')}
                  className={`rounded-md px-3 py-2 font-medium transition-all ${
                    resetMode === 'TEMPORARY'
                      ? 'shadow-xs bg-white font-semibold text-stone-900'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Set Temp Password
                </button>
              </div>

              {resetMode === 'LINK' ? (
                <div className="space-y-2 rounded-lg border border-stone-200 bg-[#FAF9F6] p-3.5 text-xs text-stone-600">
                  <p className="font-medium text-stone-800">Official Recovery Link</p>
                  <p className="text-[11px] leading-relaxed">
                    A cryptographically secure, time-limited reset link will be dispatched to{' '}
                    <span className="font-semibold text-stone-900">{user.email}</span> with a
                    24-hour expiration.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <FormField label="Custom Password (Optional)" htmlFor="customPassword">
                    <input
                      id="customPassword"
                      type="text"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      placeholder="Leave blank to auto-generate a secure string"
                      className={inputClassName}
                      style={inputStyle}
                    />
                  </FormField>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      id="mustChange"
                      type="checkbox"
                      checked={mustChangePassword}
                      onChange={(e) => setMustChangePassword(e.target.checked)}
                      className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                    />
                    <label htmlFor="mustChange" className="cursor-pointer text-xs text-stone-700">
                      Force password reset upon next login
                    </label>
                  </div>
                </div>
              )}

              <div
                className="flex justify-end gap-3 border-t pt-3"
                style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
              >
                <NfiButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </NfiButton>
                <NfiButton type="submit" variant="primary" size="sm" loading={submitting}>
                  {resetMode === 'LINK' ? 'Send Reset Link' : 'Generate & Update Password'}
                </NfiButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
