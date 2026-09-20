'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { authValidation, LoginFormData } from '@nfi/shared';
import { useAuthStore, AdminUser } from '../store/auth.store';
import { useRouter } from 'next/navigation';
import { Button, Input, Label, QRCode } from '@nfi/ui';

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
      <div className="grid gap-6">
        <form onSubmit={onMfaSubmit}>
          <div className="grid gap-4">
            {mfaState === 'MFA_ENROLMENT_REQUIRED' && (
              <div className="bg-muted/50 flex flex-col items-center justify-center space-y-4 rounded-lg border p-4">
                <p className="text-center text-sm font-medium">
                  Scan QR Code with your Authenticator App
                </p>
                {qrCodeUrl ? (
                  <div className="rounded-md bg-white p-2 shadow-sm">
                    <QRCode value={qrCodeUrl} size={180} />
                  </div>
                ) : (
                  <div className="bg-muted flex h-[180px] w-[180px] animate-pulse items-center justify-center rounded-md">
                    <span className="text-muted-foreground text-xs">Loading QR...</span>
                  </div>
                )}
                <p className="text-muted-foreground text-center text-xs">
                  Enter the 6-digit code below (or dev backup:{' '}
                  <span className="font-mono font-bold">123456</span>)
                </p>
              </div>
            )}

            {error && <div className="text-destructive text-sm font-medium">{error}</div>}

            <div className="grid gap-2">
              <Label htmlFor="mfa">Authenticator / Master Code</Label>
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
              />
            </div>
            <Button
              disabled={loading}
              type="submit"
              className="w-full bg-[#171717] text-white hover:bg-[#2e2e2e]"
            >
              {loading ? 'Verifying...' : 'Complete Sign In'}
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setMfaState('NONE');
                setQrCodeUrl(null);
              }}
              disabled={loading}
            >
              Back to Login
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Main Authentication Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          {error && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="email">Executive / Staff Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="corporate.email@domain.com"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={loading}
              className="min-h-[44px]"
              {...register('email')}
            />
            {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="focus:outline-hidden flex cursor-pointer select-none items-center gap-1 text-[11px] font-medium text-stone-500 transition-colors hover:text-stone-900 focus:underline"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <>
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                    Hide
                  </>
                ) : (
                  <>
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Show
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                disabled={loading}
                className="min-h-[44px] pr-10"
                {...register('password')}
              />
            </div>
            {errors.password && (
              <p className="text-destructive text-xs">{errors.password.message}</p>
            )}
          </div>

          <Button
            disabled={loading}
            type="submit"
            className="min-h-[44px] w-full bg-[#171717] font-medium text-white shadow-sm transition-all hover:bg-[#2e2e2e] focus:ring-2 focus:ring-amber-500"
          >
            {loading ? 'Authenticating...' : 'Secure Sign In'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function AdminLoginForm() {
  return <AdminLoginFormComponent />;
}
