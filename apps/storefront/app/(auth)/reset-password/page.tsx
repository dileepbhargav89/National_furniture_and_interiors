'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Label } from '@nfi/ui';
import { authService } from '../../../features/auth/services/auth.service';
import { Check, X, Eye, EyeOff, ShieldCheck, CheckCircle2, ArrowLeft, Lock } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlToken = searchParams?.get('token') || '';

  const [token, setToken] = useState(urlToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (urlToken) {
      setToken(urlToken);
    }
  }, [urlToken]);

  // Real-time password validation checks
  const checks = {
    length: newPassword.length >= 10,
    lowercase: /[a-z]/.test(newPassword),
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };
  const isPasswordValid = Object.values(checks).every(Boolean);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please provide your reset token.');
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
        setSuccess(true);
      } else {
        setError('Password reset failed. The token may be invalid or expired.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-foreground text-2xl font-bold tracking-tight">
            Password Reset Successful
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your password has been updated securely and previous login sessions have been
            invalidated. You can now sign in using your new credentials.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => router.push('/login')}
          className="w-full bg-[#171717] py-2.5 font-medium text-amber-400 shadow-md hover:bg-[#262626]"
        >
          Proceed to Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Set New Password</h1>
        <p className="text-muted-foreground text-sm">
          Enter your recovery token and define a strong, new password for your account.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="border-destructive/20 bg-destructive/10 text-destructive rounded-lg border p-3 text-xs font-medium"
        >
          {error}
        </div>
      )}

      {!urlToken && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
          Need a recovery token?{' '}
          <Link
            href="/login"
            className="font-semibold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200"
          >
            Request a password reset link here
          </Link>
          .
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Token field */}
        <div className="space-y-1.5">
          <Label htmlFor="token" className="text-xs font-medium">
            Reset Token
          </Label>
          <Input
            id="token"
            type="text"
            placeholder="Enter or paste recovery token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={loading}
            required
            className="font-mono text-xs"
          />
        </div>

        {/* New Password */}
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
              aria-describedby="reset-password-rules"
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

        {/* Password Requirements Checklist */}
        <div
          id="reset-password-rules"
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

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password" className="text-xs font-medium">
            Confirm New Password
          </Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter new password"
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
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-destructive text-[11px]">Passwords do not match.</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading || !token.trim() || !isPasswordValid || !passwordsMatch}
          className="min-h-[44px] w-full bg-[#171717] py-2.5 font-medium text-amber-400 shadow-md transition-all hover:bg-[#262626]"
        >
          {loading ? 'Resetting Password...' : 'Save New Password'}
        </Button>
      </form>

      <div className="pt-2 text-center">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <p className="text-muted-foreground text-sm">Loading password recovery...</p>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
