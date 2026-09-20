'use client';

import React, { useState, useEffect } from 'react';
import { AdminService, Role } from '@nfi/api-client';
import {
  X,
  UserPlus,
  Mail,
  Phone,
  User,
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
} from 'lucide-react';

interface InviteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string, roleName: string) => void;
  /** Pre-selected scope: 'ADMIN' shows admin roles; 'STAFF' shows operator roles */
  defaultScope?: 'ADMIN' | 'STAFF';
  roles: Role[];
}

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];
const STAFF_ROLES = [
  'SALES_MANAGER',
  'DESIGN_MANAGER',
  'DESIGNER',
  'CATALOG_MANAGER',
  'SUPPORT_AGENT',
];

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let pass = '';
  for (let i = 0; i < 12; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
}

export function InviteStaffModal({
  isOpen,
  onClose,
  onSuccess,
  defaultScope = 'ADMIN',
  roles,
}: InviteStaffModalProps) {
  const [scope, setScope] = useState<'ADMIN' | 'STAFF'>(defaultScope);
  const [provisionMode, setProvisionMode] = useState<'DIRECT' | 'INVITE'>('DIRECT');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset & sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setScope(defaultScope);
      setProvisionMode('DIRECT');
      setFullName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setSelectedRole('');
      setShowPassword(false);
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, defaultScope]);

  // Default role for scope
  useEffect(() => {
    const scopeRoles = scope === 'ADMIN' ? ADMIN_ROLES : STAFF_ROLES;
    const first = roles.find((r) => scopeRoles.includes(r.name));
    setSelectedRole(first?.name ?? '');
  }, [scope, roles]);

  // Keyboard: Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const filteredRoles = roles.filter((r) =>
    scope === 'ADMIN' ? ADMIN_ROLES.includes(r.name) : STAFF_ROLES.includes(r.name),
  );

  const handleGeneratePassword = () => {
    const newPass = generateSecurePassword();
    setPassword(newPass);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName || !selectedRole) {
      setError('Full name, email address, and role are required.');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password is required and must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (provisionMode === 'DIRECT') {
        // Direct Active Provisioning
        await AdminService.createUser({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          userType: scope,
          roleName: selectedRole,
          phone: phone.trim() || null,
        });
        setSuccessMsg(
          `Active account for ${fullName.trim()} created successfully. They can now log in immediately with this email and password.`,
        );
      } else {
        // Send Invitation Link
        await AdminService.inviteStaffMember({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          temporaryPassword: password,
          userType: scope,
          roleName: selectedRole,
          phone: phone.trim() || null,
          sendInvite: true,
        });
        setSuccessMsg(
          `Invitation sent to ${email.trim()}. An onboarding email with login credentials has been dispatched.`,
        );
      }

      setTimeout(() => {
        onSuccess(email.trim().toLowerCase(), selectedRole);
        onClose();
      }, 1600);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to provision staff member. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="provision-modal-title"
        className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl shadow-2xl"
        style={{ backgroundColor: 'var(--nfi-surface)', border: '1px solid var(--nfi-border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--nfi-border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'rgba(197,160,89,0.12)', color: 'var(--nfi-gold)' }}
            >
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="provision-modal-title"
                className="text-sm font-bold tracking-tight"
                style={{ color: 'var(--nfi-text)' }}
              >
                Add {scope === 'ADMIN' ? 'Administrator' : 'Staff Operator'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--nfi-text-secondary)' }}>
                Provision corporate credentials with custom email and password
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 transition-colors hover:bg-black/5"
            style={{ color: 'var(--nfi-text-secondary)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scope Selector */}
        <div className="px-6 pt-4">
          <div
            className="flex rounded-xl p-1"
            style={{ backgroundColor: 'var(--nfi-surface-muted)' }}
            role="tablist"
            aria-label="Access scope"
          >
            {(['ADMIN', 'STAFF'] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={scope === s}
                onClick={() => setScope(s)}
                className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all"
                style={
                  scope === s
                    ? {
                        backgroundColor: 'var(--nfi-surface)',
                        color: 'var(--nfi-text)',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                      }
                    : { color: 'var(--nfi-text-secondary)' }
                }
              >
                {s === 'ADMIN' ? '🛡️ Administrator' : '👤 Operator / Staff'}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          {/* Full Name */}
          <div>
            <label
              className="mb-1.5 block text-xs font-semibold"
              style={{ color: 'var(--nfi-text)' }}
            >
              Full Name <span style={{ color: 'var(--nfi-danger)' }}>*</span>
            </label>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                style={{ color: 'var(--nfi-text-secondary)' }}
              />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
                required
                className="w-full rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#C5A059]"
                style={{
                  border: '1px solid var(--nfi-border)',
                  backgroundColor: 'var(--nfi-surface-muted)',
                  color: 'var(--nfi-text)',
                }}
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label
              className="mb-1.5 block text-xs font-semibold"
              style={{ color: 'var(--nfi-text)' }}
            >
              Email Address <span style={{ color: 'var(--nfi-danger)' }}>*</span>
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                style={{ color: 'var(--nfi-text-secondary)' }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#C5A059]"
                style={{
                  border: '1px solid var(--nfi-border)',
                  backgroundColor: 'var(--nfi-surface-muted)',
                  color: 'var(--nfi-text)',
                }}
              />
            </div>
          </div>

          {/* Password (Manual Input + Generator Helper) */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold" style={{ color: 'var(--nfi-text)' }}>
                Password <span style={{ color: 'var(--nfi-danger)' }}>*</span>
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="flex items-center gap-1 text-[11px] font-semibold transition-colors hover:underline"
                style={{ color: 'var(--nfi-gold)' }}
              >
                <Sparkles className="h-3 w-3" />
                Generate Secure Password
              </button>
            </div>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                style={{ color: 'var(--nfi-text-secondary)' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 8 characters)"
                required
                minLength={8}
                className="w-full rounded-lg py-2.5 pl-9 pr-10 text-sm outline-none transition-all focus:ring-2 focus:ring-[#C5A059]"
                style={{
                  border: '1px solid var(--nfi-border)',
                  backgroundColor: 'var(--nfi-surface-muted)',
                  color: 'var(--nfi-text)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-400 transition-colors hover:text-neutral-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-[10px]" style={{ color: 'var(--nfi-text-secondary)' }}>
              Must be at least 8 characters. You can set any password or click generate.
            </p>
          </div>

          {/* Role Selection */}
          <div>
            <label
              className="mb-1.5 block text-xs font-semibold"
              style={{ color: 'var(--nfi-text)' }}
            >
              Assign Role <span style={{ color: 'var(--nfi-danger)' }}>*</span>
            </label>
            <div className="relative">
              <ShieldCheck
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                style={{ color: 'var(--nfi-text-secondary)' }}
              />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                required
                className="w-full appearance-none rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#C5A059]"
                style={{
                  border: '1px solid var(--nfi-border)',
                  backgroundColor: 'var(--nfi-surface-muted)',
                  color: 'var(--nfi-text)',
                }}
              >
                {filteredRoles.length === 0 && <option value="">No roles available</option>}
                {filteredRoles.map((r) => (
                  <option key={r._id || r.id} value={r.name}>
                    {r.name.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            {selectedRole && (
              <p className="mt-1 text-[11px]" style={{ color: 'var(--nfi-text-secondary)' }}>
                {roles.find((r) => r.name === selectedRole)?.description ?? ''}
              </p>
            )}
          </div>

          {/* Phone Number (Optional) */}
          <div>
            <label
              className="mb-1.5 block text-xs font-semibold"
              style={{ color: 'var(--nfi-text)' }}
            >
              Phone Number{' '}
              <span className="font-normal" style={{ color: 'var(--nfi-text-secondary)' }}>
                (optional)
              </span>
            </label>
            <div className="relative">
              <Phone
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                style={{ color: 'var(--nfi-text-secondary)' }}
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#C5A059]"
                style={{
                  border: '1px solid var(--nfi-border)',
                  backgroundColor: 'var(--nfi-surface-muted)',
                  color: 'var(--nfi-text)',
                }}
              />
            </div>
          </div>

          {/* Provisioning Option: Direct Active vs Invitation */}
          <div>
            <label
              className="mb-2 block text-xs font-semibold"
              style={{ color: 'var(--nfi-text)' }}
            >
              Account Activation Option
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <label
                onClick={() => setProvisionMode('DIRECT')}
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-all ${
                  provisionMode === 'DIRECT'
                    ? 'border-[#C5A059] bg-[#C5A059]/5 shadow-sm'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <input
                  type="radio"
                  name="provisionMode"
                  checked={provisionMode === 'DIRECT'}
                  onChange={() => setProvisionMode('DIRECT')}
                  className="mt-0.5"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                    <Zap className="h-3.5 w-3.5 text-[#C5A059]" />
                    Activate Immediately
                  </div>
                  <p className="mt-0.5 text-[10px] leading-snug text-neutral-500">
                    Sets password now. Staff member can log in right away.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setProvisionMode('INVITE')}
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-all ${
                  provisionMode === 'INVITE'
                    ? 'border-[#C5A059] bg-[#C5A059]/5 shadow-sm'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <input
                  type="radio"
                  name="provisionMode"
                  checked={provisionMode === 'INVITE'}
                  onChange={() => setProvisionMode('INVITE')}
                  className="mt-0.5"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                    <Send className="h-3.5 w-3.5 text-[#C5A059]" />
                    Send Invite Email
                  </div>
                  <p className="mt-0.5 text-[10px] leading-snug text-neutral-500">
                    Dispatches onboarding email with login link.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium"
              style={{
                backgroundColor: 'rgba(198,40,40,0.06)',
                color: 'var(--nfi-danger)',
                border: '1px solid rgba(198,40,40,0.2)',
              }}
            >
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium"
              style={{
                backgroundColor: 'rgba(34,197,94,0.08)',
                color: '#16a34a',
                border: '1px solid rgba(34,197,94,0.25)',
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              {successMsg}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-all hover:opacity-80"
              style={{
                border: '1px solid var(--nfi-border)',
                color: 'var(--nfi-text-secondary)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !!successMsg}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ backgroundColor: 'var(--nfi-gold)' }}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {loading
                ? 'Processing…'
                : provisionMode === 'DIRECT'
                  ? `Create ${scope === 'ADMIN' ? 'Admin' : 'Operator'}`
                  : `Send Invite`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
