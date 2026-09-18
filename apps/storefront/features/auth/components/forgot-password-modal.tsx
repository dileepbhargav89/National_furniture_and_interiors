'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button, Input, Label } from '@nfi/ui';
import { authService } from '../services/auth.service';
import {
  KeyRound,
  Mail,
  Check,
  X,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSuccessReset?: () => void;
}

export function ForgotPasswordModal({
  isOpen,
  onClose,
  initialEmail = '',
  onSuccessReset,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<'REQUEST' | 'RESET' | 'SUCCESS'>('REQUEST');
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Sync initial email when modal opens
  React.useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  // Prevent background scroll when modal is active
  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle ESC key to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  // Real-time password policy validation checks
  const checks = {
    length: newPassword.length >= 10,
    lowercase: /[a-z]/.test(newPassword),
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };
  const isPasswordValid = Object.values(checks).every(Boolean);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      const res = await authService.forgotPassword({ email: email.trim() });
      if (res.success && res.data) {
        setInfoMessage(res.data.message);
        if (res.data.resetToken) {
          // Dev / demo mode: token returned for frictionless verification
          setToken(res.data.resetToken);
        }
        setStep('RESET');
      } else {
        setError('Unable to initiate password reset. Please try again.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('A valid reset token is required.');
      return;
    }
    if (!isPasswordValid) {
      setError('Please fulfill all password security requirements.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await authService.resetPassword({
        token: token.trim(),
        password: newPassword,
        confirmPassword,
      });

      if (res.success) {
        setStep('SUCCESS');
      } else {
        setError('Password reset failed. The token may be expired or invalid.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onClose();
    if (onSuccessReset) onSuccessReset();
  };

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-title"
    >
      <div className="bg-card relative w-full max-w-md space-y-6 rounded-2xl border border-amber-900/20 p-6 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {step === 'SUCCESS' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <KeyRound className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2
                id="forgot-password-title"
                className="text-foreground text-lg font-semibold tracking-tight"
              >
                {step === 'REQUEST' && 'Reset Your Password'}
                {step === 'RESET' && 'Set New Password'}
                {step === 'SUCCESS' && 'Password Updated'}
              </h2>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {step === 'REQUEST' && 'Secure self-service credentials recovery'}
                {step === 'RESET' && 'Define a secure, high-entropy password'}
                {step === 'SUCCESS' && 'Your account security has been verified'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-10 w-10 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="border-destructive/20 bg-destructive/10 text-destructive rounded-lg border p-3 text-xs font-medium"
          >
            {error}
          </div>
        )}

        {/* STEP 1: Request Reset */}
        {step === 'REQUEST' && (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <p className="text-muted-foreground text-xs leading-relaxed">
              Enter your registered email address. We will dispatch a 1-hour cryptographic recovery
              link to help you restore access to your National Furniture & Interiors account.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="reset-email" className="text-xs font-medium">
                Registered Email
              </Label>
              <div className="relative">
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="patron@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  autoFocus
                  className="pl-9 text-sm"
                />
                <Mail className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                disabled={loading || !email.trim()}
                className="min-h-[44px] w-full bg-[#171717] py-2.5 font-medium text-amber-400 shadow-md transition-all hover:bg-[#262626]"
              >
                {loading ? 'Dispatching Link...' : 'Send Recovery Instructions'}
              </Button>
              <button
                type="button"
                onClick={() => setStep('RESET')}
                className="text-muted-foreground hover:text-foreground py-2 text-center text-xs underline-offset-4 hover:underline"
              >
                Already have a reset token? Proceed to reset
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Set New Password */}
        {step === 'RESET' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {infoMessage && (
              <div
                role="status"
                aria-live="polite"
                className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300"
              >
                {infoMessage}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="reset-token" className="text-xs font-medium">
                Reset Token
              </Label>
              <Input
                id="reset-token"
                type="text"
                placeholder="Paste the 64-char token received"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={loading}
                required
                className="font-mono text-xs"
              />
              <p className="text-muted-foreground text-[11px]">
                Check your inbox or console for the 1-hour secure reset token.
              </p>
            </div>

            {/* New Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-xs font-medium">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 10 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  required
                  aria-describedby="password-requirements"
                  className="pr-11 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                  className="text-muted-foreground hover:text-foreground absolute right-0 top-0 flex h-full w-11 items-center justify-center"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password Criteria Checklist */}
            <div
              id="password-requirements"
              role="region"
              aria-live="polite"
              className="border-border/60 bg-muted/30 space-y-1.5 rounded-xl border p-3"
            >
              <div className="text-foreground flex items-center gap-1.5 text-[11px] font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>Password Requirements</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <div
                  className={`flex items-center gap-1.5 ${checks.length ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
                >
                  {checks.length ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  <span>10+ characters</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${checks.uppercase ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
                >
                  {checks.uppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  <span>Uppercase letter</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${checks.lowercase ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
                >
                  {checks.lowercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  <span>Lowercase letter</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${checks.number ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
                >
                  {checks.number ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  <span>Numeric digit</span>
                </div>
                <div
                  className={`col-span-2 flex items-center gap-1.5 ${checks.special ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
                >
                  {checks.special ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  <span>Special character (!@#$%^&*)</span>
                </div>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-xs font-medium">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="pr-11 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  aria-label={
                    showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'
                  }
                  tabIndex={-1}
                  className="text-muted-foreground hover:text-foreground absolute right-0 top-0 flex h-full w-11 items-center justify-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-destructive text-[11px]">Passwords do not match.</p>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                disabled={loading || !token.trim() || !isPasswordValid || !passwordsMatch}
                className="min-h-[44px] w-full bg-[#171717] py-2.5 font-medium text-amber-400 shadow-md transition-all hover:bg-[#262626]"
              >
                {loading ? 'Securing Account...' : 'Set New Password'}
              </Button>
              <button
                type="button"
                onClick={() => setStep('REQUEST')}
                disabled={loading}
                className="text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 py-2 text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to email request
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Success Confirmation */}
        {step === 'SUCCESS' && (
          <div className="space-y-4 py-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Check className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-foreground text-base font-semibold">
                Password Successfully Updated
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Your credentials have been securely refreshed and all active previous sessions have
                been revoked. You may now sign in to your National Furniture & Interiors account.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleComplete}
              className="w-full bg-[#171717] py-2.5 font-medium text-amber-400 shadow-md hover:bg-[#262626]"
            >
              Sign In Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
