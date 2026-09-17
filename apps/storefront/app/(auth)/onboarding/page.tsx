'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { OnboardingService, VerifyOnboardingTokenResponse } from '@nfi/api-client';
import { useAuthStore } from '../../../features/auth/store/auth.store';
import {
  ShieldCheck,
  Check,
  X,
  Eye,
  EyeOff,
  Sparkles,
  Building,
  Phone,
  User as UserIcon,
  Lock,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

function OnboardingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token') || '';
  const setToken = useAuthStore((state) => state.setToken);

  // States
  const [verifying, setVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<VerifyOnboardingTokenResponse | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Submission States
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activatedSuccess, setActivatedSuccess] = useState(false);

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setVerificationError(
        'No invitation token was provided in the link. Please check your invitation email.',
      );
      return;
    }

    let isMounted = true;
    OnboardingService.verifyToken(token)
      .then((res) => {
        if (!isMounted) return;
        if (res.data && res.data.valid) {
          setTokenData(res.data);
          if (res.data.fullName) setFullName(res.data.fullName);
          if (res.data.phone) setPhone(res.data.phone);
          if (res.data.companyName) setCompanyName(res.data.companyName);
          if (res.data.gstin) setGstin(res.data.gstin);
        } else {
          setVerificationError('This invitation link is invalid or has expired.');
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setVerificationError(
          err instanceof Error
            ? err.message
            : 'Unable to verify invitation link. It may have expired or already been activated.',
        );
      })
      .finally(() => {
        if (isMounted) setVerifying(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Password Rules
  const passwordRules = [
    { label: 'At least 10 characters', test: (v: string) => v.length >= 10 },
    { label: 'One uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
    { label: 'One lowercase letter', test: (v: string) => /[a-z]/.test(v) },
    { label: 'One number', test: (v: string) => /\d/.test(v) },
    { label: 'One special character', test: (v: string) => /[^a-zA-Z0-9\s]/.test(v) },
  ];

  const allRulesPassed = passwordRules.every((r) => r.test(password));
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!token) {
      setSubmitError('Missing invitation token.');
      return;
    }

    if (!fullName.trim()) {
      setSubmitError('Please provide your full name.');
      return;
    }

    if (!allRulesPassed) {
      setSubmitError('Please ensure your password satisfies all security requirements.');
      return;
    }

    if (!passwordsMatch) {
      setSubmitError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setSubmitError('Please agree to the Terms of Service & Privacy Policy to continue.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await OnboardingService.completeOnboarding({
        token,
        fullName: fullName.trim(),
        phone: phone.trim() ? phone.trim() : null,
        password,
        companyName: companyName.trim() ? companyName.trim() : null,
        gstin: gstin.trim() ? gstin.trim() : null,
      });

      if (res.data) {
        setActivatedSuccess(true);
        // Instant auto-login if session was issued
        if (res.data.session?.accessToken) {
          setToken(res.data.session.accessToken, {
            id: res.data.user.id,
            email: res.data.user.email,
            fullName: res.data.user.fullName,
            role: res.data.user.userType,
          });
        }
        // Redirect after brief celebration
        setTimeout(() => {
          router.push('/');
        }, 2200);
      }
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to activate account. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Verifying State
  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-stone-300 border-t-amber-600" />
        <p className="text-sm font-medium text-stone-700">Verifying White-Glove Invitation…</p>
        <p className="text-xs text-stone-500">Establishing secure encrypted connection</p>
      </div>
    );
  }

  // 2. Error State
  if (verificationError || !tokenData) {
    return (
      <div className="flex flex-col items-center justify-center space-y-5 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-stone-900">Invitation Link Inactive</h2>
          <p className="mt-2 text-xs leading-relaxed text-stone-600">
            {verificationError || 'This onboarding invitation could not be verified.'}
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-xs text-stone-600">
          <p>Invitations expire after 14 days or after initial activation.</p>
          <p className="mt-1">
            Need assistance? Contact our concierge team or request a new invitation from your
            administrator.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2.5 pt-2">
          <Link
            href="/login"
            className="w-full rounded-md bg-stone-900 py-2.5 text-xs font-semibold text-white transition hover:bg-stone-800"
          >
            Go to Patron Sign In
          </Link>
          <Link
            href="/contact"
            className="text-xs text-amber-800 hover:text-amber-900 hover:underline"
          >
            Contact National Interiors Concierge
          </Link>
        </div>
      </div>
    );
  }

  // 3. Success State
  if (activatedSuccess) {
    return (
      <div className="animate-fadeIn flex flex-col items-center justify-center space-y-5 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Sparkles className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-stone-900">
            Welcome to National Furniture & Interiors
          </h2>
          <p className="mt-2 text-xs text-stone-600">
            Your patron dossier is verified and your account is active. Redirecting you to your
            exclusive portal…
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
          <Check className="h-4 w-4" />
          <span>Authenticated session established</span>
        </div>
      </div>
    );
  }

  // 4. Onboarding Form
  return (
    <div className="-mx-2 space-y-6 sm:-mx-8 sm:w-[420px]">
      {/* Header */}
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/60 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
          <span>VIP Patron & Trade Invitation</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Complete Your Profile</h1>
        <p className="text-xs text-stone-500">
          Review your details and establish your private credentials to access custom furniture
          collections.
        </p>
      </div>

      {submitError && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Verified Email Banner (Locked) */}
        <div className="flex items-center justify-between rounded-lg border border-amber-200/80 bg-amber-50/50 p-3.5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Verified Patron Email
            </span>
            <p className="mt-0.5 text-xs font-semibold text-stone-900">{tokenData.email}</p>
          </div>
          <div className="flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
            <Check className="h-3 w-3 text-emerald-600" />
            <span>Verified</span>
          </div>
        </div>

        {/* Full Name */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-stone-700" htmlFor="fullName">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
              <UserIcon className="h-4 w-4" />
            </span>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Vikramaditya Singhania"
              className="w-full rounded-md border border-stone-300 py-2 pl-9 pr-3 text-xs placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-stone-700" htmlFor="phone">
            Phone Number (for white-glove delivery coordination)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
              <Phone className="h-4 w-4" />
            </span>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-md border border-stone-300 py-2 pl-9 pr-3 text-xs placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
            />
          </div>
        </div>

        {/* Firm / Company & GSTIN */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-stone-700" htmlFor="companyName">
              Studio / Firm (Optional)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                <Building className="h-4 w-4" />
              </span>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Design Studio"
                className="w-full rounded-md border border-stone-300 py-2 pl-9 pr-3 text-xs placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-stone-700" htmlFor="gstin">
              GSTIN (B2B Tax Credit)
            </label>
            <input
              id="gstin"
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              placeholder="29AAAAA0000A1Z5"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-xs placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1 border-t border-stone-200 pt-2">
          <label className="block text-xs font-medium text-stone-700" htmlFor="password">
            Create Security Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
              <Lock className="h-4 w-4" />
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a strong password"
              className="w-full rounded-md border border-stone-300 py-2 pl-9 pr-10 text-xs placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-700"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Real-time Password Rules */}
          {password.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-md border border-stone-200/80 bg-stone-50 p-2.5 text-[11px]">
              {passwordRules.map((rule, idx) => {
                const passed = rule.test(password);
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-1.5 ${
                      passed ? 'font-medium text-emerald-700' : 'text-stone-400'
                    }`}
                  >
                    {passed ? (
                      <Check className="h-3 w-3 shrink-0 text-emerald-600" />
                    ) : (
                      <X className="h-3 w-3 shrink-0 opacity-40" />
                    )}
                    <span>{rule.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-stone-700" htmlFor="confirmPassword">
            Confirm Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
              <Lock className="h-4 w-4" />
            </span>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full rounded-md border border-stone-300 py-2 pl-9 pr-10 text-xs placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-700"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-[11px] text-rose-600">Passwords do not match.</p>
          )}
        </div>

        {/* Terms agreement */}
        <div className="flex items-start gap-2.5 pt-2">
          <input
            id="agreeTerms"
            type="checkbox"
            required
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
          />
          <label htmlFor="agreeTerms" className="text-[11px] leading-tight text-stone-600">
            I agree to the National Furniture & Interiors{' '}
            <Link href="/terms" className="text-amber-800 underline hover:text-amber-900">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-amber-800 underline hover:text-amber-900">
              Privacy Policy
            </Link>
            .
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !allRulesPassed || !passwordsMatch || !agreeTerms}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-stone-900 py-2.5 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <span>Activating Account…</span>
          ) : (
            <>
              <span>Accept Onboarding & Activate Account</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-amber-600" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
