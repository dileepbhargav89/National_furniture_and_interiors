'use client';

import React, { useState } from 'react';
import { AdminService, User } from '@nfi/api-client';
import { FormField, inputClassName, inputStyle } from '@/components/ui/form-field';
import { NfiButton } from '@/components/ui/nfi-button';

interface OnboardUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialData?: {
    fullName?: string;
    email?: string;
    phone?: string;
    companyName?: string;
  } | null;
}

export function OnboardUserModal({ open, onClose, onSuccess, initialData }: OnboardUserModalProps) {
  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [userType, setUserType] = useState<'CUSTOMER' | 'STAFF' | 'ADMIN'>('CUSTOMER');
  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  const [gstin, setGstin] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [sendInvite, setSendInvite] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Update initial data when opened or initialData changes
  React.useEffect(() => {
    if (open) {
      if (initialData) {
        setFullName(initialData.fullName || '');
        setEmail(initialData.email || '');
        setPhone(initialData.phone || '');
        setCompanyName(initialData.companyName || '');
      }
      setError('');
    }
  }, [open, initialData]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await AdminService.onboardUser({
        fullName,
        email,
        phone: phone || null,
        userType,
        companyName: companyName || null,
        gstin: gstin || null,
        ...(temporaryPassword ? { temporaryPassword } : {}),
        sendInvite,
      });

      if (res.data) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to onboard user');
    } finally {
      setSubmitting(false);
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
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border bg-white shadow-2xl"
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
            <h2 className="text-base font-bold text-stone-900">Onboard New Account</h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Provision patron credentials or invite trade partners and team members.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField label="Full Name" htmlFor="fullName" required>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Vikramaditya Singhania"
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>
            </div>

            <div>
              <FormField label="Email Address" htmlFor="email" required>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patron@domain.com"
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>
            </div>

            <div>
              <FormField label="Phone Number" htmlFor="phone">
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>
            </div>

            <div>
              <FormField label="Account Type" htmlFor="userType" required>
                <select
                  id="userType"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as 'CUSTOMER' | 'STAFF' | 'ADMIN')}
                  className={inputClassName}
                  style={inputStyle}
                >
                  <option value="CUSTOMER">Customer / Trade VIP</option>
                  <option value="STAFF">Studio Staff / Designer</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </FormField>
            </div>

            <div>
              <FormField label="Organization / Firm" htmlFor="companyName">
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Architectural Studio / Firm"
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>
            </div>

            <div className="col-span-2">
              <FormField label="GSTIN (Optional for Commercial Accounts)" htmlFor="gstin">
                <input
                  id="gstin"
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="29AAAAA0000A1Z5"
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>
            </div>

            <div className="col-span-2">
              <FormField label="Custom Temporary Password (Optional)" htmlFor="temporaryPassword">
                <input
                  id="temporaryPassword"
                  type="text"
                  value={temporaryPassword}
                  onChange={(e) => setTemporaryPassword(e.target.value)}
                  placeholder="Leave blank to auto-generate a secure temporary password"
                  className={inputClassName}
                  style={inputStyle}
                />
              </FormField>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 p-3.5">
            <div>
              <p className="text-xs font-semibold text-stone-900">Dispatch Welcome Invitation</p>
              <p className="text-[11px] text-stone-500">
                Sends onboarding link and instructions via verified email & SMS.
              </p>
            </div>
            <input
              type="checkbox"
              checked={sendInvite}
              onChange={(e) => setSendInvite(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
            />
          </div>

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
              Complete Onboarding
            </NfiButton>
          </div>
        </form>
      </div>
    </div>
  );
}
