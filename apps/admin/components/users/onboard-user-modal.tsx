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
  const [email, setEmail] = useState(initialData?.email || '');
  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [userType, setUserType] = useState<'CUSTOMER' | 'STAFF' | 'ADMIN'>('CUSTOMER');
  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  const [gstin, setGstin] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Update initial data when opened or initialData changes
  React.useEffect(() => {
    if (open) {
      if (initialData) {
        setEmail(initialData.email || '');
        setFullName(initialData.fullName || '');
        setPhone(initialData.phone || '');
        setCompanyName(initialData.companyName || '');
        if (initialData.fullName || initialData.phone || initialData.companyName) {
          setShowOptionalFields(true);
        }
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
        email: email.trim().toLowerCase(),
        ...(fullName.trim() ? { fullName: fullName.trim() } : {}),
        phone: phone.trim() ? phone.trim() : null,
        userType,
        companyName: companyName.trim() ? companyName.trim() : null,
        gstin: gstin.trim() ? gstin.trim() : null,
        sendInvite: true,
      });

      if (res.data) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to dispatch onboarding invitation');
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
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-900">Onboard Patron & Partner</h2>
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                Email-Only Ingestion
              </span>
            </div>
            <p className="mt-0.5 text-xs text-stone-500">
              Enter the client email to dispatch a private self-activation invitation.
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

          {/* Email: Primary & Only Mandatory Input */}
          <div className="rounded-lg border border-amber-200/70 bg-amber-50/40 p-4">
            <FormField label="Patron Email Address" htmlFor="email" required>
              <input
                id="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patron@domain.com or architect@studio.in"
                className={inputClassName}
                style={inputStyle}
              />
            </FormField>
            <p className="mt-1.5 text-[11px] text-amber-900/80">
              The invitation token will be dispatched directly to this email address.
            </p>
          </div>

          {/* Collapsible/Optional Fields */}
          <div className="border-t border-stone-200 pt-3">
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-amber-700"
            >
              <svg
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  showOptionalFields ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span>Pre-fill Client Dossier (Optional)</span>
            </button>

            {showOptionalFields && (
              <div className="mt-3 grid grid-cols-2 gap-3.5 rounded-lg border border-stone-100 bg-stone-50/70 p-3.5">
                <div className="col-span-2">
                  <FormField label="Full Name (Optional)" htmlFor="fullName">
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Vikramaditya Singhania"
                      className={inputClassName}
                      style={inputStyle}
                    />
                  </FormField>
                </div>

                <div>
                  <FormField label="Phone Number (Optional)" htmlFor="phone">
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
                  <FormField label="Account Type" htmlFor="userType">
                    <select
                      id="userType"
                      value={userType}
                      onChange={(e) =>
                        setUserType(e.target.value as 'CUSTOMER' | 'STAFF' | 'ADMIN')
                      }
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
                  <FormField label="Organization / Firm (Optional)" htmlFor="companyName">
                    <input
                      id="companyName"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Architectural Studio"
                      className={inputClassName}
                      style={inputStyle}
                    />
                  </FormField>
                </div>

                <div>
                  <FormField label="GSTIN (Optional)" htmlFor="gstin">
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
              </div>
            )}
          </div>

          {/* White-Glove Self-Activation Flow Info */}
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3.5 text-xs text-stone-600">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 text-base">✨</span>
              <div>
                <p className="font-semibold text-stone-900">White-Glove Patron Self-Activation</p>
                <p className="mt-0.5 text-[11px] text-stone-500">
                  Patron receives an invitation link to verify their email, enrich their profile
                  (phone, address, firm/GSTIN), and create their own secure password. Passwords are
                  never handled by administrative staff.
                </p>
              </div>
            </div>
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
              Send Onboarding Invitation
            </NfiButton>
          </div>
        </form>
      </div>
    </div>
  );
}
