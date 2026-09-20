'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User, UserAddress, UpdateOwnProfilePayload } from '@nfi/api-client';
import { UsersService } from '@nfi/api-client';
import { QRCode } from '@nfi/ui';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { authService } from '../../features/auth/services/auth.service';
import {
  User as UserIcon,
  ShieldCheck,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  Compass,
  FileText,
  Lock,
  LogOut,
  Edit3,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  Download,
  AlertCircle,
  Phone,
  Mail,
  RefreshCw,
  Award,
  Camera,
} from 'lucide-react';
import { ClientSiteStreamModal } from '@/components/projects/client-site-stream-modal';

type TabKey = 'overview' | 'orders' | 'projects' | 'addresses' | 'security';

interface AtelierOrder {
  id: string;
  orderNumber: string;
  date: string;
  items: { title: string; wood: string; qty: number; price: number }[];
  totalAmount: number;
  status: 'WORKSHOP_FABRICATION' | 'WOOD_SELECTION' | 'FINISHING' | 'DISPATCHED' | 'DELIVERED';
  estimatedDelivery: string;
  invoiceAvailable: boolean;
}

interface SpatialProject {
  id: string;
  name: string;
  type: string;
  location: string;
  leadArchitect: string;
  currentStage: string;
  progressPercent: number;
  stages: { name: string; completed: boolean }[];
  lastUpdate: string;
}

const DEMO_ORDERS: AtelierOrder[] = [
  {
    id: 'ord-101',
    orderNumber: 'NFI-BLR-2026-8910',
    date: 'Sep 04, 2026',
    items: [
      {
        title: 'Artisanal Solid Rosewood Bedstead (King)',
        wood: 'Kiln-Dried Malabar Rosewood',
        qty: 1,
        price: 185000,
      },
      {
        title: 'Hand-Carved Floating Bedside Consoles',
        wood: 'Matching Rosewood with Brass Inlays',
        qty: 2,
        price: 54000,
      },
    ],
    totalAmount: 239000,
    status: 'WORKSHOP_FABRICATION',
    estimatedDelivery: 'Oct 12, 2026',
    invoiceAvailable: true,
  },
  {
    id: 'ord-100',
    orderNumber: 'NFI-BLR-2026-8742',
    date: 'Aug 18, 2026',
    items: [
      {
        title: 'Bespoke Teakwood 8-Seater Dining Suite',
        wood: 'A-Grade Burma Teak with Matte Lacquer',
        qty: 1,
        price: 295000,
      },
    ],
    totalAmount: 295000,
    status: 'DELIVERED',
    estimatedDelivery: 'Aug 30, 2026',
    invoiceAvailable: true,
  },
];

const DEMO_PROJECTS: SpatialProject[] = [
  {
    id: 'proj-1',
    name: 'HSR Layout Flagship Villa (Master Suite & Living Atelier)',
    type: 'Luxury Residential Turnkey Architecture',
    location: 'HSR Layout Sector 2, Bengaluru',
    leadArchitect: 'Ar. Ananya Sharma (Principal Architect)',
    currentStage: 'Custom Joinery & Millwork Fabrication',
    progressPercent: 70,
    stages: [
      { name: '1. Site Analysis & Architectural Renders', completed: true },
      { name: '2. 3D Spatial Renders & Material Palettes', completed: true },
      { name: '3. Atelier Joinery & Fabrication', completed: true },
      { name: '4. White-Glove On-Site Fitout', completed: false },
      { name: '5. Final Handover & Styling', completed: false },
    ],
    lastUpdate: 'Yesterday at 4:30 PM: Veneer samples and lighting scheme approved.',
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const { setToken, logout: storeLogout, user: authUser } = useAuthStore();

  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Business & Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullNameInput, setFullNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [companyNameInput, setCompanyNameInput] = useState('');
  const [gstinInput, setGstinInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Address Management State
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState('Primary Residence');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [addressCity, setAddressCity] = useState('Bengaluru');
  const [addressState, setAddressState] = useState('Karnataka');
  const [addressPincode, setAddressPincode] = useState('560102');
  const [addressCountry, setAddressCountry] = useState('India');
  const [addressIsDefault, setAddressIsDefault] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);

  // Security / MFA State
  const [mfaSetupData, setMfaSetupData] = useState<{ secret: string; otpAuthUrl: string } | null>(
    null,
  );
  const [totpToken, setTotpToken] = useState('');
  const [mfaStatusMsg, setMfaStatusMsg] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  // Turnkey Site Stream Modal State
  const [selectedProjectForStream, setSelectedProjectForStream] = useState<SpatialProject | null>(
    null,
  );

  // In-page Login State (if token expired / unauthenticated)
  const [loginMode, setLoginMode] = useState<'EMAIL' | 'PHONE'>('EMAIL');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPhone, setLoginPhone] = useState('9109059791');
  const [loginOtp, setLoginOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);
  const [inPageLoginLoading, setInPageLoginLoading] = useState(false);
  const [inPageLoginError, setInPageLoginError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await UsersService.getOwnProfile();
      const userData = res.data?.user || res.data;
      if (userData && (userData.id || userData._id)) {
        setProfile(userData);
        setFullNameInput(userData.fullName || '');
        setPhoneInput(userData.phone || '');
        setCompanyNameInput(userData.companyName || '');
        setGstinInput(userData.gstin || '');
        return;
      }
    } catch (err: unknown) {
      // If unauthorized or expired token, attempt silent token refresh once
      try {
        const refreshRes = await authService.refresh();
        if (refreshRes.success && refreshRes.data?.accessToken) {
          setToken(refreshRes.data.accessToken);
          const retryRes = await UsersService.getOwnProfile();
          const retryData = retryRes.data?.user || retryRes.data;
          if (retryData && (retryData.id || retryData._id)) {
            setProfile(retryData);
            setFullNameInput(retryData.fullName || '');
            setPhoneInput(retryData.phone || '');
            setCompanyNameInput(retryData.companyName || '');
            setGstinInput(retryData.gstin || '');
            return;
          }
        }
      } catch {
        // Silent refresh failed
      }
      const msg =
        err instanceof Error ? err.message : 'Please sign in to access your Atelier Patron Portal.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [setToken]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setSaveSuccessMsg(null);
    try {
      const payload: UpdateOwnProfilePayload = {
        fullName: fullNameInput.trim(),
        phone: phoneInput.trim() || null,
        companyName: companyNameInput.trim() || null,
        gstin: gstinInput.trim() || null,
      };
      const res = await UsersService.updateOwnProfile(payload);
      const updated = res.data?.user || res.data;
      if (updated) {
        setProfile(updated);
        setSaveSuccessMsg('Atelier Dossier & Commercial GST details successfully updated.');
        setIsEditingProfile(false);
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update profile details.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingAddress(true);
    try {
      const newAddress: UserAddress = {
        label: addressLabel.trim(),
        line1: addressLine1.trim(),
        line2: addressLine2.trim() || null,
        city: addressCity.trim(),
        state: addressState.trim(),
        pincode: addressPincode.trim(),
        country: addressCountry.trim(),
        isDefault: addressIsDefault,
      };

      const existingAddresses = profile.addresses || [];
      const updatedAddresses = addressIsDefault
        ? [...existingAddresses.map((a) => ({ ...a, isDefault: false })), newAddress]
        : [...existingAddresses, newAddress];

      const res = await UsersService.updateOwnProfile({
        addresses: updatedAddresses,
      });
      const updated = res.data?.user || res.data;
      if (updated) {
        setProfile(updated);
        setIsAddingAddress(false);
        setAddressLine1('');
        setAddressLine2('');
        setSaveSuccessMsg('Delivery destination successfully added.');
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save address.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (indexToDelete: number) => {
    if (!profile || !profile.addresses) return;
    if (!confirm('Are you sure you wish to remove this delivery site?')) return;
    try {
      const updatedAddresses = profile.addresses.filter((_, idx) => idx !== indexToDelete);
      const res = await UsersService.updateOwnProfile({
        addresses: updatedAddresses,
      });
      const updated = res.data?.user || res.data;
      if (updated) {
        setProfile(updated);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to remove address.');
    }
  };

  const handleSetupMFA = async () => {
    const userId = profile?.id || profile?._id;
    if (!userId) return;
    setMfaLoading(true);
    setMfaStatusMsg('');
    try {
      const res = await authService.setupMfa({ userId });
      if (res.data) {
        setMfaSetupData(res.data);
      }
    } catch (err: unknown) {
      setMfaStatusMsg(err instanceof Error ? err.message : 'Failed to initialize MFA.');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = profile?.id || profile?._id;
    if (!userId || !totpToken) return;
    setMfaLoading(true);
    try {
      await authService.verifyMfa({ userId, token: totpToken.trim() });
      setMfaStatusMsg('Two-Factor Authentication successfully secured.');
      setMfaSetupData(null);
      setTotpToken('');
      fetchProfile();
    } catch (err: unknown) {
      setMfaStatusMsg(
        err instanceof Error ? err.message : 'Invalid 6-digit code. Please try again.',
      );
    } finally {
      setMfaLoading(false);
    }
  };

  const handleInPageLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setInPageLoginLoading(true);
    setInPageLoginError(null);
    try {
      if (loginMode === 'EMAIL') {
        const res = await authService.login({
          email: loginEmail.trim(),
          password: loginPassword,
        });
        if (res.success && res.data?.accessToken) {
          setToken(res.data.accessToken);
          fetchProfile();
        }
      } else {
        // Phone OTP Verify
        const cleaned = loginPhone.replace(/[\s\-()]/g, '');
        const formatted = /^\d{10}$/.test(cleaned) ? `+91${cleaned}` : cleaned;
        const res = await authService.verifyOtp({
          phone: formatted,
          code: loginOtp.trim(),
        });
        if (res.success && res.data?.accessToken) {
          setToken(res.data.accessToken);
          fetchProfile();
        }
      }
    } catch (err: unknown) {
      setInPageLoginError(
        err instanceof Error ? err.message : 'Sign in failed. Please verify credentials.',
      );
    } finally {
      setInPageLoginLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setInPageLoginLoading(true);
    setInPageLoginError(null);
    try {
      const cleaned = loginPhone.replace(/[\s\-()]/g, '');
      const formatted = /^\d{10}$/.test(cleaned) ? `+91${cleaned}` : cleaned;
      const res = await authService.sendOtp({ phone: formatted });
      setOtpSent(true);
      const dataObj = res.data as Record<string, unknown> | undefined;
      if (typeof dataObj?.demoOtp === 'string') {
        setDemoOtpHint(dataObj.demoOtp);
        setLoginOtp(dataObj.demoOtp);
      } else {
        setDemoOtpHint('123456');
        setLoginOtp('123456');
      }
    } catch (err: unknown) {
      setInPageLoginError(err instanceof Error ? err.message : 'Failed to dispatch OTP.');
    } finally {
      setInPageLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore
    }
    storeLogout();
    router.push('/login');
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F6] py-24">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-[#C5A880] border-t-transparent" />
        <p className="font-serif text-sm uppercase tracking-widest text-[#0B0F17]">
          Opening Atelier Patron Dossier...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated / Session Expired Screen (Luxury Gate)
  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F6] px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#C5A880]/30 bg-white p-8 text-center shadow-xl">
          <div className="absolute left-0 right-0 top-0 h-1.5 bg-gradient-to-r from-[#C5A880] via-[#E8D4B8] to-[#C5A880]" />

          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#C5A880]/40 bg-[#0B0F17] text-[#C5A880] shadow-lg">
            <Lock className="h-6 w-6" />
          </div>

          <h2 className="mb-2 font-serif text-2xl font-semibold tracking-tight text-[#0B0F17]">
            Atelier Patron Portal
          </h2>
          <p className="mb-6 text-xs leading-relaxed text-gray-500">
            Please sign in with your registered patron credentials or one-time mobile passcode to
            access your executive suite and order ledger.
          </p>

          {/* Mode Switcher */}
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-stone-100 p-1 text-xs font-medium">
            <button
              onClick={() => setLoginMode('EMAIL')}
              className={`rounded-lg py-2 transition-all ${
                loginMode === 'EMAIL'
                  ? 'bg-white font-semibold text-[#0B0F17] shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Email & Password
            </button>
            <button
              onClick={() => setLoginMode('PHONE')}
              className={`rounded-lg py-2 transition-all ${
                loginMode === 'PHONE'
                  ? 'bg-white font-semibold text-[#0B0F17] shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Phone OTP
            </button>
          </div>

          {inPageLoginError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-left text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{inPageLoginError}</span>
            </div>
          )}

          <form onSubmit={handleInPageLogin} className="space-y-4 text-left">
            {loginMode === 'EMAIL' ? (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Patron Email
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="pinnacledileep777@gmail.com"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                    10-Digit Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      required
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder="9109059791"
                      className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={inPageLoginLoading}
                      className="flex-shrink-0 rounded-xl bg-stone-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-stone-800"
                    >
                      {otpSent ? 'Resend' : 'Send OTP'}
                    </button>
                  </div>
                </div>

                {otpSent && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                      One-Time Passcode (OTP)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={loginOtp}
                      onChange={(e) => setLoginOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-center font-mono text-base text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                    />
                    {demoOtpHint && (
                      <p className="mt-1 text-[11px] text-[#8C6D3F]">
                        Demo test code: <strong className="font-mono">{demoOtpHint}</strong>
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={inPageLoginLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#C5A880]/40 bg-[#0B0F17] py-3 text-sm font-medium text-[#C5A880] shadow-md transition-all hover:bg-black hover:shadow-lg disabled:opacity-50"
            >
              {inPageLoginLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <span>Unlock Patron Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-6 text-xs text-gray-500">
            <span>New client inquiry?</span>
            <Link href="/register" className="font-semibold text-[#8C6D3F] hover:underline">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Patron Display Variables
  const patronName = profile.fullName || authUser?.fullName || 'Valued Patron';
  const patronInitials = patronName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const patronId = profile.id || profile._id || 'NFI-CUST-866F';
  const patronCode = `NFI-${patronId.slice(-6).toUpperCase()}`;
  const memberSince = profile.createdAt ? new Date(profile.createdAt).getFullYear() : 2026;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0B0F17]">
      {/* 1. Hero Header Banner */}
      <section className="relative overflow-hidden border-b border-[#C5A880]/20 bg-[#0B0F17] px-4 pb-24 pt-12 text-white sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,168,128,0.12),transparent_60%)]" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {/* Patron Identity Card */}
            <div className="flex items-center gap-5">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#C5A880]/50 bg-gradient-to-br from-[#202736] to-[#0E131F] p-1 shadow-2xl">
                <span className="font-serif text-2xl font-bold tracking-wider text-[#C5A880]">
                  {patronInitials}
                </span>
                <span
                  className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#0B0F17] bg-emerald-500"
                  title="Active Patron"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center gap-3">
                  <h1 className="font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {patronName}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#C5A880]/30 bg-[#C5A880]/20 px-2.5 py-0.5 text-xs font-semibold text-[#C5A880]">
                    <Sparkles className="h-3 w-3" />
                    Atelier Private Patron
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#C5A880]" />
                    {profile.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-[#C5A880]" />
                    {profile.phone || '+91 9109059791'}
                  </span>
                  <span className="text-gray-500">|</span>
                  <span className="font-mono text-gray-300">Patron ID: {patronCode}</span>
                  <span className="text-gray-500">|</span>
                  <span>Member Since {memberSince}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditingProfile(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-white/20"
              >
                <Edit3 className="h-3.5 w-3.5 text-[#C5A880]" />
                <span>Edit Dossier</span>
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-800/40 bg-rose-950/40 px-4 py-2 text-xs font-medium text-rose-200 shadow-sm transition-colors hover:bg-rose-900/60"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Business & VIP Stat Bar */}
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-8 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                Atelier Commissions
              </p>
              <p className="mt-1 font-serif text-xl font-bold text-white">2 Masterpieces</p>
              <span className="text-[11px] font-medium text-emerald-400">1 Active in Workshop</span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                Interior Architecture
              </p>
              <p className="mt-1 font-serif text-xl font-bold text-white">1 Turnkey Project</p>
              <span className="text-[11px] font-medium text-[#C5A880]">Phase 3: Fabrication</span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                B2B GST Invoicing
              </p>
              <p className="mt-1 font-serif text-xl font-bold text-white">
                {profile.gstin ? 'Verified' : 'Ready to Enable'}
              </p>
              <span className="text-[11px] text-gray-300">ITC Benefit 18% Available</span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                Dedicated Concierge
              </p>
              <p className="mt-1 font-serif text-xl font-bold text-white">HSR Flagship</p>
              <span className="text-[11px] text-gray-300">White-Glove Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Content & Navigation Tabs */}
      <main className="relative z-20 mx-auto -mt-10 max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        {saveSuccessMsg && (
          <div className="animate-in fade-in mb-6 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button
              onClick={() => setSaveSuccessMsg(null)}
              className="font-bold text-emerald-600 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8 flex flex-wrap gap-1 rounded-2xl border border-[#E5DFD5] bg-white p-1.5 shadow-sm">
          {[
            { key: 'overview', label: 'Overview & Business Dossier', icon: Building2 },
            { key: 'orders', label: 'Orders & Commissions', icon: Package },
            { key: 'projects', label: 'Turnkey Spatial Projects', icon: Compass },
            { key: 'addresses', label: 'Delivery Sites & Addresses', icon: MapPin },
            { key: 'security', label: 'Security & Two-Factor (MFA)', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabKey)}
                className={`flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#0B0F17] font-semibold text-[#C5A880] shadow-md'
                    : 'text-gray-600 hover:bg-stone-50 hover:text-[#0B0F17]'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-[#C5A880]' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & BUSINESS DOSSIER */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column: Personal & Contact Dossier */}
            <div className="space-y-6 lg:col-span-1">
              <div className="rounded-2xl border border-[#E5DFD5] bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#0B0F17]">
                    <Building2 className="h-4 w-4 text-[#C5A880]" />
                    <span>Client Credentials</span>
                  </h3>
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-1 text-xs font-medium text-[#8C6D3F] hover:underline"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                </div>

                <dl className="space-y-4 text-xs">
                  <div>
                    <dt className="font-medium text-gray-400">Full Name</dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900">{patronName}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-400">Primary Email</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">{profile.email}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-400">Verified Phone</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {profile.phone || '9109059791'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-400">Account Tier</dt>
                    <dd className="mt-1">
                      <span className="inline-flex items-center rounded-full border border-[#C5A880]/30 bg-[#F5F0E8] px-2.5 py-0.5 text-xs font-semibold text-[#8C6D3F]">
                        CUSTOMER · Private Client
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              {/* White-Glove Support Card */}
              <div className="rounded-2xl border border-[#C5A880]/40 bg-gradient-to-br from-[#0B0F17] to-[#1E2538] p-6 text-white shadow-lg">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C5A880]">
                  <Award className="h-4 w-4" />
                  <span>Bengaluru Flagship Atelier</span>
                </div>
                <h4 className="mb-2 font-serif text-base font-bold text-white">
                  Personal Concierge Assigned
                </h4>
                <p className="mb-4 text-xs leading-relaxed text-gray-300">
                  For architectural blueprint reviews, custom wood finishes, or high-value
                  commercial quotations, contact our atelier director directly.
                </p>
                <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                  <span className="text-gray-400">24th Main Rd, HSR Layout</span>
                  <Link
                    href="/contact"
                    className="flex items-center gap-1 font-medium text-[#C5A880] hover:underline"
                  >
                    <span>Contact Atelier</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Commercial B2B GST Invoicing & Quick Highlights */}
            <div className="space-y-6 lg:col-span-2">
              {/* Commercial B2B GST Invoicing Card */}
              <div className="relative overflow-hidden rounded-2xl border border-[#E5DFD5] bg-white p-6 shadow-sm sm:p-8">
                <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-amber-50 blur-2xl" />

                <div className="mb-6 flex items-start justify-between border-b border-gray-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-lg font-bold text-[#0B0F17]">
                        Commercial & B2B Tax Invoicing
                      </h3>
                      <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                        GST INVOICE
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Register your company details and GSTIN to receive valid B2B tax invoices with
                      18% Input Tax Credit (ITC) on all furniture & interior commissions.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="rounded-xl bg-[#0B0F17] px-3.5 py-1.5 text-xs font-semibold text-[#C5A880] transition-colors hover:bg-black"
                  >
                    Configure GSTIN
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Company / Firm Name
                    </span>
                    <p className="mt-1 text-sm font-bold text-gray-900">
                      {profile.companyName || 'Not configured (Individual Patron)'}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      Appears on official bills of lading
                    </p>
                  </div>

                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Registered GSTIN Number
                    </span>
                    <p className="mt-1 font-mono text-sm font-bold text-gray-900">
                      {profile.gstin || 'Not registered'}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>
                        {profile.gstin ? 'Eligible for ITC (18%)' : 'Add to claim B2B credits'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-[#C5A880]/30 bg-[#FBF9F5] p-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#C5A880]/20 text-[#8C6D3F]">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">
                        Automated Commercial Invoice Delivery
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Digital GST invoices are auto-generated upon dispatch and stored in your
                        orders tab.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-[#8C6D3F] hover:underline"
                  >
                    <span>View Invoices</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Active Workshop Commission Highlight */}
              <div className="rounded-2xl border border-[#E5DFD5] bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#0B0F17]">
                    <Clock className="h-4 w-4 text-[#C5A880]" />
                    <span>Active Workshop Commission</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-semibold text-[#8C6D3F] hover:underline"
                  >
                    All Orders →
                  </button>
                </div>

                <div className="flex flex-col justify-between gap-4 rounded-xl border border-stone-200 bg-stone-50 p-4 md:flex-row md:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-900">
                        #NFI-BLR-2026-8910
                      </span>
                      <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                        WORKSHOP FABRICATION
                      </span>
                    </div>
                    <h4 className="mt-1 text-sm font-semibold text-gray-900">
                      Artisanal Solid Rosewood Bedstead & Floating Consoles
                    </h4>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Estimated White-Glove Installation: Oct 12, 2026 · Bengaluru Residence
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="block text-xs text-gray-400">Total Investment</span>
                      <span className="text-base font-bold text-gray-900">₹2,39,000</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="rounded-xl bg-black px-4 py-2 text-xs font-medium text-[#C5A880] transition-colors hover:bg-gray-800"
                    >
                      Track Order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ATELIER ORDERS & COMMISSIONS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E5DFD5] bg-white p-6 shadow-sm sm:flex-row sm:items-center">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#0B0F17]">
                  Atelier Orders & Masterpiece Commissions
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Track fabrication stages in our Bengaluru woodworking facility, view milestones,
                  and download GST tax invoices.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-[#C5A880]/30 bg-[#F5F0E8] px-3 py-1 text-xs font-semibold text-[#8C6D3F]">
                  {DEMO_ORDERS.length} Commissions on Record
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {DEMO_ORDERS.map((order) => (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-[#E5DFD5] bg-white shadow-sm"
                >
                  {/* Order Top Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-stone-50 px-6 py-4">
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div>
                        <span className="block text-gray-400">Order Ref</span>
                        <span className="font-mono font-bold text-gray-900">
                          {order.orderNumber}
                        </span>
                      </div>
                      <div className="border-l border-gray-200 pl-4">
                        <span className="block text-gray-400">Date Commissioned</span>
                        <span className="font-medium text-gray-900">{order.date}</span>
                      </div>
                      <div className="border-l border-gray-200 pl-4">
                        <span className="block text-gray-400">Total Investment</span>
                        <span className="font-bold text-gray-900">
                          ₹{order.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          order.status === 'DELIVERED'
                            ? 'border border-emerald-200 bg-emerald-100 text-emerald-800'
                            : 'border border-amber-200 bg-amber-100 text-amber-800'
                        }`}
                      >
                        {(order.status || 'PROCESSING').replace(/_/g, ' ')}
                      </span>

                      {order.invoiceAvailable && (
                        <button
                          onClick={() =>
                            alert(`Downloading official GST Tax Invoice for ${order.orderNumber}`)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <Download className="h-3.5 w-3.5 text-[#C5A880]" />
                          <span>GST Invoice</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6">
                    <div className="divide-y divide-gray-100">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                        >
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                            <p className="mt-0.5 text-xs text-[#8C6D3F]">{item.wood}</p>
                            <span className="text-xs text-gray-400">Qty: {item.qty}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-gray-900">
                              ₹{item.price.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Progress Bar for Active Workshop orders */}
                    {order.status !== 'DELIVERED' && (
                      <div className="mt-6 border-t border-gray-100 pt-6">
                        <div className="mb-2 flex items-center justify-between text-xs font-medium text-gray-500">
                          <span>Progress: Wood Kiln-Drying & Joinery</span>
                          <span>Est. White-Glove Installation: {order.estimatedDelivery}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full w-3/5 rounded-full bg-[#C5A880]" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TURNKEY SPATIAL PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E5DFD5] bg-white p-6 shadow-sm sm:flex-row sm:items-center">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#0B0F17]">
                  Bespoke Interior & Architectural Projects
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Private client turnkey spatial developments managed by our Principal Architects &
                  Master Craftsmen.
                </p>
              </div>
              <Link
                href="/design-services"
                className="flex items-center gap-1.5 rounded-xl bg-[#0B0F17] px-4 py-2 text-xs font-semibold text-[#C5A880] transition-colors hover:bg-black"
              >
                <span>Book New Spatial Consultation</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {DEMO_PROJECTS.map((project) => (
              <div
                key={project.id}
                className="rounded-2xl border border-[#E5DFD5] bg-white p-6 shadow-sm sm:p-8"
              >
                <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-6 lg:flex-row lg:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-[#C5A880]/30 bg-[#C5A880]/20 px-2.5 py-0.5 text-xs font-bold text-[#8C6D3F]">
                        {project.type}
                      </span>
                      <span className="text-xs text-gray-400">· {project.location}</span>
                    </div>
                    <h4 className="mt-2 font-serif text-xl font-bold text-gray-900">
                      {project.name}
                    </h4>
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                      <UserIcon className="h-3.5 w-3.5 text-[#C5A880]" />
                      <span>{project.leadArchitect}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setSelectedProjectForStream(project)}
                      className="flex items-center gap-1.5 rounded-xl bg-[#C5A880] px-4 py-2 text-xs font-bold text-black shadow-md shadow-[#C5A880]/20 transition-colors hover:bg-[#b5956a]"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>📸 Live Site Stream</span>
                    </button>
                    <button
                      onClick={() =>
                        alert('Consultation appointment confirmed with Lead Architect.')
                      }
                      className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-stone-800"
                    >
                      Schedule Spatial Review
                    </button>
                  </div>
                </div>

                {/* Stages Tracker */}
                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between text-xs font-medium">
                    <span className="text-gray-700">Project Development Milestone</span>
                    <span className="font-bold text-[#8C6D3F]">
                      {project.progressPercent}% Complete
                    </span>
                  </div>

                  <div className="mb-6 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#C5A880] to-[#917245] transition-all duration-500"
                      style={{ width: `${project.progressPercent}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-5">
                    {project.stages.map((stage, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col justify-between rounded-xl border p-3 ${
                          stage.completed
                            ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900'
                            : idx === 3
                              ? 'border-amber-200 bg-amber-50/60 font-semibold text-amber-900'
                              : 'border-gray-200 bg-stone-50 text-gray-400'
                        }`}
                      >
                        <div className="mb-2 flex items-center gap-1.5">
                          {stage.completed ? (
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                          ) : (
                            <Clock className="h-4 w-4 flex-shrink-0 text-amber-600" />
                          )}
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {stage.completed ? 'Approved' : 'In Progress'}
                          </span>
                        </div>
                        <span className="text-xs leading-snug">{stage.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-stone-50 p-3 text-xs text-gray-600">
                    <Sparkles className="h-4 w-4 flex-shrink-0 text-[#C5A880]" />
                    <span>{project.lastUpdate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: DELIVERY SITES & ADDRESSES */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E5DFD5] bg-white p-6 shadow-sm sm:flex-row sm:items-center">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#0B0F17]">
                  Delivery Sites & Project Locations
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Manage primary residential properties, luxury vacation estates, and corporate
                  ateliers for white-glove installation.
                </p>
              </div>
              <button
                onClick={() => setIsAddingAddress(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[#0B0F17] px-4 py-2 text-xs font-semibold text-[#C5A880] transition-colors hover:bg-black"
              >
                <Plus className="h-4 w-4" />
                <span>Add Delivery Site</span>
              </button>
            </div>

            {/* Address Cards Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {profile.addresses && profile.addresses.length > 0 ? (
                profile.addresses.map((addr, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-2xl border border-[#E5DFD5] bg-white p-6 shadow-sm"
                  >
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="rounded-full border border-[#C5A880]/30 bg-[#F5F0E8] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[#8C6D3F]">
                          {addr.label || 'Delivery Site'}
                        </span>
                        {addr.isDefault && (
                          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            Primary Address
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-gray-900">{addr.line1}</p>
                      {addr.line2 && <p className="mt-0.5 text-xs text-gray-600">{addr.line2}</p>}
                      <p className="mt-1 text-xs text-gray-600">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">{addr.country}</p>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                      <button
                        onClick={() => handleDeleteAddress(idx)}
                        className="flex items-center gap-1 text-xs font-medium text-rose-600 transition-colors hover:text-rose-800"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center md:col-span-2">
                  <MapPin className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                  <h4 className="mb-1 font-serif text-sm font-bold text-gray-900">
                    No Delivery Sites Registered
                  </h4>
                  <p className="mx-auto mb-4 max-w-sm text-xs text-gray-500">
                    Add your residence or project location for seamless white-glove logistics and
                    architectural site visits.
                  </p>
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="rounded-xl bg-[#0B0F17] px-4 py-2 text-xs font-medium text-[#C5A880]"
                  >
                    Add First Address
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: SECURITY & TWO-FACTOR AUTHENTICATION */}
        {activeTab === 'security' && (
          <div className="max-w-3xl space-y-6">
            <div className="rounded-2xl border border-[#E5DFD5] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-start justify-between border-b border-gray-100 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg font-bold text-[#0B0F17]">
                      Two-Factor Authentication (TOTP)
                    </h3>
                    {profile.mfaEnabled ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                        ENABLED
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    Protect high-ticket architectural commissions, custom order contracts, and
                    commercial invoicing details with standard authenticator applications (Google
                    Authenticator, Microsoft Authenticator, or 1Password).
                  </p>
                </div>

                {!profile.mfaEnabled && !mfaSetupData && (
                  <button
                    onClick={handleSetupMFA}
                    disabled={mfaLoading}
                    className="whitespace-nowrap rounded-xl bg-[#0B0F17] px-4 py-2 text-xs font-semibold text-[#C5A880] transition-colors hover:bg-black disabled:opacity-50"
                  >
                    {mfaLoading ? 'Generating...' : 'Enable 2FA'}
                  </button>
                )}
              </div>

              {mfaStatusMsg && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span>{mfaStatusMsg}</span>
                </div>
              )}

              {/* MFA Setup Box with QR Code */}
              {mfaSetupData && (
                <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-6">
                  <h4 className="mb-2 font-serif text-sm font-bold text-gray-900">
                    Scan Authenticator QR Code
                  </h4>
                  <p className="mb-4 text-xs text-gray-500">
                    Open Google Authenticator or your password manager and scan the barcode below:
                  </p>

                  <div className="flex flex-col items-center gap-6 sm:flex-row">
                    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                      <QRCode value={mfaSetupData.otpAuthUrl} size={180} />
                    </div>

                    <div className="flex-1 space-y-3 text-xs">
                      <div>
                        <span className="mb-1 block text-gray-400">Manual Entry Secret:</span>
                        <code className="block select-all rounded-lg border border-gray-200 bg-white p-2 font-mono text-xs text-gray-900">
                          {mfaSetupData.secret}
                        </code>
                      </div>

                      <form onSubmit={handleVerifyMFA} className="space-y-2 pt-2">
                        <label className="block text-xs font-semibold text-gray-700">
                          Enter 6-digit Code from Authenticator
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={totpToken}
                            onChange={(e) => setTotpToken(e.target.value)}
                            placeholder="123456"
                            className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-center font-mono text-sm tracking-widest"
                          />
                          <button
                            type="submit"
                            disabled={mfaLoading}
                            className="rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-stone-800"
                          >
                            Verify & Activate
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Session Security Card */}
            <div className="rounded-2xl border border-[#E5DFD5] bg-white p-6 shadow-sm sm:p-8">
              <h3 className="mb-2 font-serif text-base font-bold text-[#0B0F17]">
                Session Hardening & Patron Access
              </h3>
              <p className="mb-4 text-xs leading-relaxed text-gray-500">
                Your session is secured via cryptographically signed JWT tokens with automated
                background rotation and protected HTTP-only cookie guards.
              </p>
              <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-500">
                <span>Active Token Protocol: Bearer RS256 / HS256</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-600">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Secure Session
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. EDIT DOSSIER MODAL */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in-95 w-full max-w-lg rounded-3xl border border-[#C5A880]/30 bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#0B0F17]">
                  Edit Patron & Commercial Dossier
                </h3>
                <p className="text-xs text-gray-500">
                  Update contact details and business invoicing credentials.
                </p>
              </div>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold uppercase tracking-wider text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold uppercase tracking-wider text-gray-700">
                  Verified Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="9109059791"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                />
              </div>

              <div className="border-t border-gray-100 pt-2">
                <span className="mb-3 block text-[11px] font-bold uppercase tracking-wider text-[#8C6D3F]">
                  B2B Commercial Tax Invoicing (GST)
                </span>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">
                      Company / Firm Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={companyNameInput}
                      onChange={(e) => setCompanyNameInput(e.target.value)}
                      placeholder="e.g. Pinnacle Architecture & Interiors Pvt Ltd"
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-gray-700">
                      15-Digit GSTIN Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={gstinInput}
                      onChange={(e) => setGstinInput(e.target.value.toUpperCase())}
                      placeholder="29ABCDE1234F1Z5"
                      maxLength={15}
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-xl bg-[#0B0F17] px-6 py-2.5 font-semibold text-[#C5A880] transition-colors hover:bg-black disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Dossier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. ADD DELIVERY SITE MODAL */}
      {isAddingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in-95 w-full max-w-lg rounded-3xl border border-[#C5A880]/30 bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#0B0F17]">
                  Add Delivery Site / Estate
                </h3>
                <p className="text-xs text-gray-500">
                  Register a destination for white-glove assembly and site inspections.
                </p>
              </div>
              <button
                onClick={() => setIsAddingAddress(false)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold uppercase tracking-wider text-gray-700">
                  Site Label
                </label>
                <select
                  value={addressLabel}
                  onChange={(e) => setAddressLabel(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                >
                  <option value="Primary Residence">Primary Residence</option>
                  <option value="Corporate Office">Corporate Office / Atelier</option>
                  <option value="Weekend Villa">Weekend Villa / Estate</option>
                  <option value="Project Site">Interior Project Site</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold uppercase tracking-wider text-gray-700">
                  Address Line 1
                </label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Villa 402, 24th Main Road"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold uppercase tracking-wider text-gray-700">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Opposite Purva Fairmont, HSR Layout"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold uppercase tracking-wider text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold uppercase tracking-wider text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold uppercase tracking-wider text-gray-700">
                    Pincode
                  </label>
                  <input
                    type="text"
                    required
                    value={addressPincode}
                    onChange={(e) => setAddressPincode(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold uppercase tracking-wider text-gray-700">
                    Country
                  </label>
                  <input
                    type="text"
                    required
                    value={addressCountry}
                    onChange={(e) => setAddressCountry(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="defaultAddr"
                  checked={addressIsDefault}
                  onChange={(e) => setAddressIsDefault(e.target.checked)}
                  className="rounded text-[#C5A880] focus:ring-[#C5A880]"
                />
                <label htmlFor="defaultAddr" className="font-medium text-gray-700">
                  Set as Primary Delivery Site
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="rounded-xl bg-[#0B0F17] px-6 py-2.5 font-semibold text-[#C5A880] transition-colors hover:bg-black disabled:opacity-50"
                >
                  {savingAddress ? 'Saving...' : 'Add Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Turnkey Live Site Photo Stream & Inspection Modal */}
      {selectedProjectForStream && (
        <ClientSiteStreamModal
          isOpen={true}
          onClose={() => setSelectedProjectForStream(null)}
          projectTitle={selectedProjectForStream.name}
          projectLocation={selectedProjectForStream.location}
          currentPhase={selectedProjectForStream.currentStage}
          progressPercent={selectedProjectForStream.progressPercent}
        />
      )}
    </div>
  );
}
