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

interface QuickAccount {
  label: string;
  name: string;
  email: string;
  role: string;
  category: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER';
  badgeStyle: string;
}

const QUICK_ACCOUNTS: QuickAccount[] = [
  // 2 Super Admins
  {
    label: 'Super Admin 1',
    name: 'Chief Super Admin',
    email: 'superadmin@nationalinteriors.com',
    role: 'SUPER_ADMIN',
    category: 'SUPER_ADMIN',
    badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    label: 'Super Admin 2',
    name: 'Managing Director',
    email: 'director@nationalinteriors.com',
    role: 'SUPER_ADMIN',
    category: 'SUPER_ADMIN',
    badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  // 3 Admins
  {
    label: 'Admin 1',
    name: 'Aarav Deshmukh',
    email: 'admin1@nationalinteriors.com',
    role: 'ADMIN',
    category: 'ADMIN',
    badgeStyle: 'bg-stone-100 text-stone-900 border-stone-300',
  },
  {
    label: 'Admin 2',
    name: 'Priya Sharma',
    email: 'admin2@nationalinteriors.com',
    role: 'ADMIN',
    category: 'ADMIN',
    badgeStyle: 'bg-stone-100 text-stone-900 border-stone-300',
  },
  {
    label: 'Admin 3',
    name: 'Rohan Iyer',
    email: 'admin3@nationalinteriors.com',
    role: 'ADMIN',
    category: 'ADMIN',
    badgeStyle: 'bg-stone-100 text-stone-900 border-stone-300',
  },
  // Operation-wise Managers
  {
    label: 'Sales Mgr',
    name: 'Vikram Mehta',
    email: 'sales.manager@nationalinteriors.com',
    role: 'SALES_MANAGER',
    category: 'MANAGER',
    badgeStyle: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  {
    label: 'Design Mgr',
    name: 'Ananya Roy',
    email: 'design.manager@nationalinteriors.com',
    role: 'DESIGN_MANAGER',
    category: 'MANAGER',
    badgeStyle: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  {
    label: 'Catalog Mgr',
    name: 'Kavita Sundaram',
    email: 'catalog.manager@nationalinteriors.com',
    role: 'CATALOG_MANAGER',
    category: 'MANAGER',
    badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    label: 'Order Mgr',
    name: 'Sameer Patel',
    email: 'order.manager@nationalinteriors.com',
    role: 'ORDER_MANAGER',
    category: 'MANAGER',
    badgeStyle: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  {
    label: 'CMS Mgr',
    name: 'Neha Kapoor',
    email: 'cms.manager@nationalinteriors.com',
    role: 'CMS_MANAGER',
    category: 'MANAGER',
    badgeStyle: 'bg-rose-50 text-rose-800 border-rose-200',
  },
];

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
        .join('')
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
  const [selectedRole, setSelectedRole] = useState<string | null>('superadmin@nationalinteriors.com');
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(authValidation.loginSchema),
    defaultValues: {
      email: 'superadmin@nationalinteriors.com',
      password: 'Password123!',
    },
  });

  const selectAccount = (acc: QuickAccount) => {
    setSelectedRole(acc.email);
    setValue('email', acc.email, { shouldValidate: true });
    setValue('password', 'Password123!', { shouldValidate: true });
    setError(null);
  };

  const handleSuccessfulAuth = async (token: string, fallbackEmail?: string) => {
    const claims = parseJwtClaims(token);
    const email = claims?.email || fallbackEmail || 'admin@nationalinteriors.com';
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
          if (mounted) setError(err instanceof Error ? err.message : 'Failed to initialize MFA setup');
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
      setError(err instanceof Error ? err.message : 'Invalid MFA code. (Development bypass: 123456)');
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
              <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border p-4 bg-muted/50">
                <p className="text-sm font-medium text-center">Scan QR Code with your Authenticator App</p>
                {qrCodeUrl ? (
                  <div className="bg-white p-2 rounded-md shadow-sm">
                    <QRCode value={qrCodeUrl} size={180} />
                  </div>
                ) : (
                  <div className="h-[180px] w-[180px] animate-pulse bg-muted rounded-md flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Loading QR...</span>
                  </div>
                )}
                <p className="text-xs text-center text-muted-foreground">
                  Enter the 6-digit code below (or dev backup: <span className="font-mono font-bold">123456</span>)
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
            <Button disabled={loading} type="submit" className="w-full bg-[#171717] hover:bg-[#2e2e2e] text-white">
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
      {/* Quick Role Credentials Panel */}
      <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3.5 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-stone-800 tracking-wide uppercase text-[11px]">
            Quick Role Switcher
          </span>
          <span className="text-[10px] text-stone-500 font-mono">Password: Password123!</span>
        </div>

        {/* Super Admins */}
        <div className="mb-2">
          <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Super Admins (Universal Access • 2 Provisioned)
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_ACCOUNTS.filter((a) => a.category === 'SUPER_ADMIN').map((acc) => (
              <button
                key={acc.email}
                type="button"
                role="button"
                aria-pressed={selectedRole === acc.email}
                onClick={() => selectAccount(acc)}
                className={`text-left p-2.5 rounded-lg border text-[11px] min-h-[44px] transition-all flex flex-col justify-center focus:outline-hidden focus:ring-2 focus:ring-amber-500 ${
                  selectedRole === acc.email
                    ? 'border-amber-600 bg-amber-50 font-semibold shadow-xs ring-1 ring-amber-500'
                    : 'border-stone-200 bg-white hover:bg-amber-50/50 hover:border-amber-300'
                }`}
              >
                <div className="font-medium truncate text-stone-900">{acc.label}</div>
                <div className="text-[10px] text-stone-500 truncate">{acc.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Admins */}
        <div className="mb-2">
          <div className="text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-500"></span>
            Platform Admins (Full Authority • 3 Provisioned)
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {QUICK_ACCOUNTS.filter((a) => a.category === 'ADMIN').map((acc) => (
              <button
                key={acc.email}
                type="button"
                role="button"
                aria-pressed={selectedRole === acc.email}
                onClick={() => selectAccount(acc)}
                className={`text-left p-2.5 rounded-lg border text-[11px] min-h-[44px] transition-all flex flex-col justify-center focus:outline-hidden focus:ring-2 focus:ring-stone-600 ${
                  selectedRole === acc.email
                    ? 'border-stone-900 bg-stone-100 font-semibold shadow-xs ring-1 ring-stone-800'
                    : 'border-stone-200 bg-white hover:bg-stone-100/50 hover:border-stone-300'
                }`}
              >
                <div className="font-medium truncate text-stone-900">{acc.label}</div>
                <div className="text-[10px] text-stone-500 truncate">{acc.name.split(' ')[0]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Operation Managers */}
        <div>
          <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Operation Managers (Scoped Access • 5 Provisioned)
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_ACCOUNTS.filter((a) => a.category === 'MANAGER').map((acc) => (
              <button
                key={acc.email}
                type="button"
                role="button"
                aria-pressed={selectedRole === acc.email}
                onClick={() => selectAccount(acc)}
                className={`text-left p-2.5 rounded-lg border text-[11px] min-h-[44px] transition-all flex flex-col justify-center focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                  selectedRole === acc.email
                    ? 'border-blue-600 bg-blue-50 font-semibold shadow-xs ring-1 ring-blue-500'
                    : 'border-stone-200 bg-white hover:bg-blue-50/50 hover:border-blue-300'
                }`}
              >
                <div className="font-medium truncate text-stone-900">{acc.label}</div>
                <div className="text-[10px] text-stone-500 truncate">{acc.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Authentication Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium" role="alert">
              {error}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="email">Executive / Staff Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@nationalinteriors.com"
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
                className="text-[11px] font-medium text-stone-500 hover:text-stone-900 transition-colors focus:outline-hidden focus:underline flex items-center gap-1 cursor-pointer select-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                    Hide
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
            {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
          </div>

          <Button
            disabled={loading}
            type="submit"
            className="w-full bg-[#171717] hover:bg-[#2e2e2e] text-white font-medium min-h-[44px] transition-all shadow-sm focus:ring-2 focus:ring-amber-500"
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
