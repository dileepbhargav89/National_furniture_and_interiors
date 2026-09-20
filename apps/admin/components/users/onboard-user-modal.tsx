'use client';

import React, { useState, useEffect } from 'react';
import { AdminService, User } from '@nfi/api-client';
import {
  X,
  UserPlus,
  Mail,
  Phone,
  User as UserIcon,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Zap,
  Send,
  Building2,
  FileText,
  ChevronDown,
} from 'lucide-react';

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

const ROLE_OPTIONS: Record<
  'ADMIN' | 'STAFF' | 'CUSTOMER',
  Array<{ value: string; label: string }>
> = {
  ADMIN: [
    { value: 'ADMIN', label: 'Executive Administrator' },
    { value: 'SUPER_ADMIN', label: 'Super Administrator' },
  ],
  STAFF: [
    { value: 'SALES_MANAGER', label: 'Sales & Project Director' },
    { value: 'DESIGN_MANAGER', label: 'Head of Architecture & Design' },
    { value: 'DESIGNER', label: 'Interior Architect / Designer' },
    { value: 'CATALOG_MANAGER', label: 'Catalog & Inventory Manager' },
    { value: 'SUPPORT_AGENT', label: 'Concierge & Client Support' },
  ],
  CUSTOMER: [{ value: 'CUSTOMER', label: 'Customer / Trade VIP Patron' }],
};

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let pass = '';
  for (let i = 0; i < 12; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
}

export function OnboardUserModal({ open, onClose, onSuccess, initialData }: OnboardUserModalProps) {
  const [userType, setUserType] = useState<'CUSTOMER' | 'STAFF' | 'ADMIN'>('CUSTOMER');
  const [roleName, setRoleName] = useState('CUSTOMER');
  const [provisionMode, setProvisionMode] = useState<'DIRECT' | 'INVITE'>('DIRECT');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCommercialDetails, setShowCommercialDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset & populate state when modal opens
  useEffect(() => {
    if (open) {
      if (initialData) {
        setEmail(initialData.email || '');
        setFullName(initialData.fullName || '');
        setPhone(initialData.phone || '');
        setCompanyName(initialData.companyName || '');
        if (initialData.companyName) {
          setShowCommercialDetails(true);
        }
      } else {
        setEmail('');
        setFullName('');
        setPhone('');
        setCompanyName('');
        setGstin('');
        setShowCommercialDetails(false);
      }
      setPassword('');
      setUserType('CUSTOMER');
      setRoleName('CUSTOMER');
      setProvisionMode('DIRECT');
      setShowPassword(false);
      setError('');
      setSuccessMsg('');
    }
  }, [open, initialData]);

  // Sync roleName default when userType changes
  const handleUserTypeChange = (type: 'CUSTOMER' | 'STAFF' | 'ADMIN') => {
    setUserType(type);
    const defaultRole = ROLE_OPTIONS[type][0]?.value ?? 'CUSTOMER';
    setRoleName(defaultRole);
  };

  // Keyboard: Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleGeneratePassword = () => {
    const newPass = generateSecurePassword();
    setPassword(newPass);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password is required and must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      let createdUser: User | null = null;

      if (provisionMode === 'DIRECT') {
        // Direct Active Provisioning
        if (userType === 'STAFF' || userType === 'ADMIN') {
          const res = await AdminService.createUser({
            email: email.trim().toLowerCase(),
            fullName: fullName.trim(),
            password,
            userType,
            roleName,
            phone: phone.trim() ? phone.trim() : null,
          });
          createdUser = res.data ?? null;
        } else {
          // Direct Customer Provisioning
          const res = await AdminService.onboardUser({
            email: email.trim().toLowerCase(),
            fullName: fullName.trim(),
            temporaryPassword: password,
            userType: 'CUSTOMER',
            roleName: 'CUSTOMER',
            phone: phone.trim() ? phone.trim() : null,
            companyName: companyName.trim() ? companyName.trim() : null,
            gstin: gstin.trim() ? gstin.trim() : null,
            sendInvite: false,
          });
          createdUser = res.data ?? null;
        }

        setSuccessMsg(
          `Account for ${fullName.trim()} activated successfully. They can now log in immediately with this email and password.`,
        );
      } else {
        // Send Invitation Email Mode
        const res = await AdminService.onboardUser({
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          temporaryPassword: password,
          userType,
          roleName,
          phone: phone.trim() ? phone.trim() : null,
          companyName: companyName.trim() ? companyName.trim() : null,
          gstin: gstin.trim() ? gstin.trim() : null,
          sendInvite: true,
        });
        createdUser = res.data ?? null;

        setSuccessMsg(
          `Invitation dispatched to ${email.trim()}. Onboarding credentials have been delivered.`,
        );
      }

      if (createdUser) {
        const userToReturn = createdUser;
        setTimeout(() => {
          onSuccess(userToReturn);
          onClose();
        }, 1500);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to provision account. Please verify input and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboard-modal-title"
    >
      {/* Backdrop */}
      <div
        className="backdrop-blur-xs fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className="relative z-10 max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        style={{
          border: '1px solid var(--nfi-border, #DDD0BE)',
          backgroundColor: 'var(--nfi-surface, #FFFFFF)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{
            borderColor: 'var(--nfi-border, #DDD0BE)',
            backgroundColor: 'var(--nfi-surface-muted, #FAF9F6)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                backgroundColor: 'rgba(197,160,89,0.15)',
                color: 'var(--nfi-gold, #C5A059)',
              }}
            >
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 id="onboard-modal-title" className="text-base font-bold text-stone-900">
                Add User & Provision Account
              </h2>
              <p className="text-xs text-stone-500">
                Set custom email, password, and name with instant activation or invite.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User Type Tier Tabs */}
        <div className="px-6 pt-4">
          <label className="mb-1.5 block text-xs font-semibold text-stone-700">Account Type</label>
          <div
            className="flex rounded-xl p-1"
            style={{
              backgroundColor: 'var(--nfi-surface-muted, #FAF9F6)',
              border: '1px solid #E5E7EB',
            }}
            role="tablist"
            aria-label="Account Type"
          >
            {(['CUSTOMER', 'STAFF', 'ADMIN'] as const).map((type) => (
              <button
                key={type}
                type="button"
                role="tab"
                aria-selected={userType === type}
                onClick={() => handleUserTypeChange(type)}
                className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all"
                style={
                  userType === type
                    ? {
                        backgroundColor: '#FFFFFF',
                        color: '#171717',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                      }
                    : { color: '#6B7280' }
                }
              >
                {type === 'CUSTOMER' && '🧑‍💼 Patron / VIP'}
                {type === 'STAFF' && '📐 Studio Staff'}
                {type === 'ADMIN' && '🛡️ Administrator'}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          {/* Feedback Banners */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Full Name & Email Grid */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                Full Name <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full rounded-xl border border-stone-200 py-2.5 pl-9 pr-3 text-sm text-stone-900 outline-none transition-all focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                Email Address <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-stone-200 py-2.5 pl-9 pr-3 text-sm text-stone-900 outline-none transition-all focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20"
                />
              </div>
            </div>
          </div>

          {/* Password (Manual Input + Generator Helper) */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">
                Password <span className="text-rose-600">*</span>
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#8C7355] transition-colors hover:text-[#C5A059]"
              >
                <Sparkles className="h-3 w-3" />
                Generate Secure Password
              </button>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 8 characters)"
                className="w-full rounded-xl border border-stone-200 py-2.5 pl-9 pr-10 text-sm text-stone-900 outline-none transition-all focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-stone-400 transition-colors hover:text-stone-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-stone-500">
              Type custom password or click Generate. Minimum 8 characters.
            </p>
          </div>

          {/* Specific Role Assignment & Phone Grid */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                Assigned Role <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <select
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-stone-200 py-2.5 pl-9 pr-8 text-sm text-stone-900 outline-none transition-all focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20"
                >
                  {ROLE_OPTIONS[userType].map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                Phone Number <span className="font-normal text-stone-400">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-stone-200 py-2.5 pl-9 pr-3 text-sm text-stone-900 outline-none transition-all focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20"
                />
              </div>
            </div>
          </div>

          {/* Collapsible Firm / GSTIN Details */}
          <div className="border-t border-stone-200 pt-3">
            <button
              type="button"
              onClick={() => setShowCommercialDetails(!showCommercialDetails)}
              className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 transition-colors hover:text-stone-900"
            >
              <Building2 className="h-3.5 w-3.5 text-stone-500" />
              <span>Commercial Firm & GSTIN Details (Optional)</span>
              <ChevronDown
                className={`h-3 w-3 transition-transform ${showCommercialDetails ? 'rotate-180' : ''}`}
              />
            </button>

            {showCommercialDetails && (
              <div className="mt-3 grid grid-cols-1 gap-3.5 rounded-xl border border-stone-100 bg-stone-50/70 p-3.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">
                    Firm / Architectural Studio
                  </label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Atelier Singhania Design"
                      className="w-full rounded-lg border border-stone-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">GSTIN</label>
                  <div className="relative">
                    <FileText className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      placeholder="29AAAAA0000A1Z5"
                      className="w-full rounded-lg border border-stone-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Provisioning Option: Direct Active vs Invitation */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-stone-700">
              Account Activation Option
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <label
                onClick={() => setProvisionMode('DIRECT')}
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-all ${
                  provisionMode === 'DIRECT'
                    ? 'shadow-xs border-[#C5A059] bg-[#C5A059]/5'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="provisionModeUsers"
                  checked={provisionMode === 'DIRECT'}
                  onChange={() => setProvisionMode('DIRECT')}
                  className="mt-0.5"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                    <Zap className="h-3.5 w-3.5 text-[#C5A059]" />
                    Activate Immediately
                  </div>
                  <p className="mt-0.5 text-[10px] leading-snug text-stone-500">
                    Sets password now. User can log in right away with this email and password.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setProvisionMode('INVITE')}
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-all ${
                  provisionMode === 'INVITE'
                    ? 'shadow-xs border-[#C5A059] bg-[#C5A059]/5'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="provisionModeUsers"
                  checked={provisionMode === 'INVITE'}
                  onChange={() => setProvisionMode('INVITE')}
                  className="mt-0.5"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                    <Send className="h-3.5 w-3.5 text-[#C5A059]" />
                    Send Invite Email
                  </div>
                  <p className="mt-0.5 text-[10px] leading-snug text-stone-500">
                    Dispatches onboarding email with verification link.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className="flex justify-end gap-3 border-t pt-3"
            style={{ borderColor: 'var(--nfi-border, #DDD0BE)' }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !!successMsg}
              className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: 'var(--nfi-gold, #C5A059)' }}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {submitting
                ? 'Processing…'
                : provisionMode === 'DIRECT'
                  ? 'Create & Activate Account'
                  : 'Send Onboarding Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
