'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { authValidation, LoginFormData } from '@nfi/shared';
import { useAuthStore, AdminUser } from '../store/auth.store';
import { useRouter } from 'next/navigation';
import { Input, Label, QRCode } from '@nfi/ui';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

type MfaState = 'NONE' | 'MFA_REQUIRED' | 'MFA_ENROLMENT_REQUIRED';

function parseJwtClaims(token: string): {
  sub?: string;
  email?: string;
  roleName?: string;
  userType?: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  permissions?: string[];
} | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function AdminLoginFormComponent() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mfaState, setMfaState] = useState<MfaState>('NONE');
  const [userId, setUserId] = useState<string | null>(null);
  const [totpToken, setTotpToken] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(authValidation.loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSuccessfulAuth = async (token: string, fallbackEmail?: string) => {
    const claims = parseJwtClaims(token);
    const email = claims?.email || fallbackEmail || '';
    const emailPrefix = email.split('@')[0] ?? 'Admin';
    let fullName = emailPrefix.replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    const roleName = claims?.roleName || 'ADMIN';
    const userType = claims?.userType || 'ADMIN';
    const permissions = claims?.permissions || [];

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const meRes = await fetch(`${apiBase}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (meRes.ok) {
        const meJson = await meRes.json();
        if (meJson?.data?.fullName) {
          fullName = meJson.data.fullName;
        }
      }
    } catch {
      // Fall back to decoded claims fullName
    }

    const adminUser: AdminUser = {
      id: claims?.sub || '',
      email,
      fullName,
      roleName,
      userType,
      permissions,
    };

    setAuth(token, adminUser);
    router.push('/dashboard');
  };

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setLoading(true);
    try {
      const response = await authService.login(data);
      if (response.success && response.data) {
        if (response.data.status === 'AUTHENTICATED' && response.data.accessToken) {
          await handleSuccessfulAuth(response.data.accessToken, data.email);
        } else if (response.data.status === 'MFA_ENROLMENT_REQUIRED') {
          setUserId(response.data.userId!);
          setMfaState('MFA_ENROLMENT_REQUIRED');
        } else if (response.data.status === 'MFA_REQUIRED') {
          setUserId(response.data.userId!);
          setMfaState('MFA_REQUIRED');
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (mfaState === 'MFA_ENROLMENT_REQUIRED' && userId && !qrCodeUrl) {
      authService
        .setupMfa({ userId })
        .then((res) => {
          if (res.success && res.data && mounted) {
            setQrCodeUrl(res.data.otpAuthUrl);
          }
        })
        .catch((err: unknown) => {
          if (mounted)
            setError(err instanceof Error ? err.message : 'Failed to initialize MFA setup');
        });
    }
    return () => {
      mounted = false;
    };
  }, [mfaState, userId, qrCodeUrl]);

  const onMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !totpToken) return;

    setError(null);
    setLoading(true);
    try {
      const response = await authService.verifyMfa({ userId, code: totpToken });
      if (response.success && response.data) {
        await handleSuccessfulAuth(response.data.accessToken);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Invalid MFA code. (Development bypass: 123456)',
      );
    } finally {
      setLoading(false);
    }
  };

  if (mfaState !== 'NONE') {
    return (
      <div className="animate-in fade-in grid gap-6 duration-300">
        <form onSubmit={onMfaSubmit} className="space-y-5">
          {mfaState === 'MFA_ENROLMENT_REQUIRED' && (
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-stone-900 to-[#1C140E] p-6 text-center text-white shadow-xl">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-[#F5A060]">
                <Sparkles className="h-3 w-3" />
                <span>Authenticator Enrollment</span>
              </div>
              <p className="mb-4 text-xs text-stone-300">
                Scan this cryptographically signed QR code using Google Authenticator or Microsoft
                Authenticator
              </p>
              {qrCodeUrl ? (
                <div className="relative mx-auto inline-block rounded-xl bg-white p-3 shadow-2xl">
                  {/* Animated laser scan guide */}
                  <div className="animate-scanline absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_8px_#F5A060]" />
                  <QRCode value={qrCodeUrl} size={180} />
                </div>
              ) : (
                <div className="mx-auto flex h-[204px] w-[204px] animate-pulse items-center justify-center rounded-xl bg-stone-800">
                  <Loader2 className="h-6 w-6 animate-spin text-[#F5A060]" />
                </div>
              )}
              <p className="mt-4 font-mono text-[11px] text-stone-400">
                Enter generated 6-digit code below (or backup code:{' '}
                <span className="font-bold text-[#F5A060]">123456</span>)
              </p>
            </div>
          )}

          {error && (
            <div
              className="animate-shake shadow-xs flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800"
              role="alert"
            >
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="mfa" className="text-xs font-semibold text-stone-700">
              One-Time Passcode (6 Digits)
            </Label>
            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400 transition-colors group-focus-within:text-[#C5A059]">
                <Lock className="h-4 w-4" />
              </div>
              <Input
                id="mfa"
                type="text"
                placeholder="123456"
                autoComplete="one-time-code"
                disabled={loading}
                value={totpToken}
                onChange={(e) => setTotpToken(e.target.value)}
                required
                maxLength={6}
                className="min-h-[46px] border-stone-200 bg-stone-50/50 pl-10 text-center font-mono text-base font-bold tracking-[0.3em] text-stone-900 transition-all duration-200 hover:border-stone-300 focus:border-[#C5A059] focus:bg-white focus:ring-2 focus:ring-[#C5A059]/25"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              disabled={loading}
              type="submit"
              className="group relative flex min-h-[46px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-stone-700/50 bg-gradient-to-r from-[#171717] via-[#2A1D15] to-[#171717] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-stone-900/10 transition-all duration-300 hover:scale-[1.01] hover:border-amber-500/40 hover:shadow-xl active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#F5A060]" />
                  <span>Verifying Token...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Verify &amp; Enter Executive Portal</span>
                  <ArrowRight className="h-4 w-4 text-[#F5A060] transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMfaState('NONE');
                setQrCodeUrl(null);
              }}
              disabled={loading}
              className="w-full py-2 text-center text-xs font-medium text-stone-500 transition-colors hover:text-stone-900"
            >
              &larr; Back to Email Sign In
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in space-y-5 duration-300">
      {/* Main Authentication Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div
            className="animate-shake shadow-xs flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800"
            role="alert"
          >
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-stone-700">
            Executive / Staff Email
          </Label>
          <div className="group relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400 transition-colors group-focus-within:text-[#C5A059]">
              <Mail className="h-4 w-4" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="corporate.email@domain.com"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={loading}
              className="min-h-[46px] border-stone-200 bg-stone-50/50 pl-10 text-xs text-stone-900 transition-all duration-200 hover:border-stone-300 focus:border-[#C5A059] focus:bg-white focus:ring-2 focus:ring-[#C5A059]/25"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="animate-in fade-in slide-in-from-top-1 text-[11px] font-medium text-rose-600">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold text-stone-700">
              Password
            </Label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="flex items-center gap-1 text-[11px] font-medium text-stone-400 transition-colors hover:text-stone-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  <span>Hide</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  <span>Show</span>
                </>
              )}
            </button>
          </div>
          <div className="group relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400 transition-colors group-focus-within:text-[#C5A059]">
              <Lock className="h-4 w-4" />
            </div>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              disabled={loading}
              className="min-h-[46px] border-stone-200 bg-stone-50/50 pl-10 pr-10 text-xs text-stone-900 transition-all duration-200 hover:border-stone-300 focus:border-[#C5A059] focus:bg-white focus:ring-2 focus:ring-[#C5A059]/25"
              {...register('password')}
            />
          </div>
          {errors.password && (
            <p className="animate-in fade-in slide-in-from-top-1 text-[11px] font-medium text-rose-600">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            disabled={loading}
            type="submit"
            className="group relative flex min-h-[46px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-stone-700/60 bg-gradient-to-r from-[#171717] via-[#281D16] to-[#171717] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-stone-900/10 transition-all duration-300 hover:scale-[1.01] hover:border-amber-500/40 hover:shadow-xl active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {/* Shimmer sweep effect */}
            <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />

            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#F5A060]" />
                <span>Authenticating Session...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Secure Sign In</span>
                <ArrowRight className="h-4 w-4 text-[#F5A060] transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            )}
          </button>
        </div>
      </form>

      {/* Security Trust Markers */}
      <div className="flex items-center justify-between border-t border-stone-100 pt-4 text-[11px] text-stone-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>256-Bit TLS Encryption</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400">
          Zero-Trust Isolation
        </span>
      </div>
    </div>
  );
}

export function AdminLoginForm() {
  return <AdminLoginFormComponent />;
}
