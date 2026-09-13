'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type {
  User,
  UserAddress,
  UpdateOwnProfilePayload,
} from '@nfi/api-client';
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
} from 'lucide-react';

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
  const [mfaSetupData, setMfaSetupData] = useState<{ secret: string; otpAuthUrl: string } | null>(null);
  const [totpToken, setTotpToken] = useState('');
  const [mfaStatusMsg, setMfaStatusMsg] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

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
      const msg = err instanceof Error ? err.message : 'Please sign in to access your Atelier Patron Portal.';
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
        ? [...existingAddresses.map(a => ({ ...a, isDefault: false })), newAddress]
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
      setMfaStatusMsg(err instanceof Error ? err.message : 'Invalid 6-digit code. Please try again.');
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
      setInPageLoginError(err instanceof Error ? err.message : 'Sign in failed. Please verify credentials.');
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
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center py-24">
        <div className="w-12 h-12 rounded-full border-2 border-[#C5A880] border-t-transparent animate-spin mb-4" />
        <p className="text-sm tracking-widest text-[#0B0F17] uppercase font-serif">
          Opening Atelier Patron Dossier...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated / Session Expired Screen (Luxury Gate)
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] py-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-[#C5A880]/30 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C5A880] via-[#E8D4B8] to-[#C5A880]" />

          <div className="w-14 h-14 rounded-2xl bg-[#0B0F17] text-[#C5A880] flex items-center justify-center mx-auto mb-5 shadow-lg border border-[#C5A880]/40">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-serif font-semibold text-[#0B0F17] tracking-tight mb-2">
            Atelier Patron Portal
          </h2>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            Please sign in with your registered patron credentials or one-time mobile passcode to access your executive suite and order ledger.
          </p>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl mb-6 text-xs font-medium">
            <button
              onClick={() => setLoginMode('EMAIL')}
              className={`py-2 rounded-lg transition-all ${
                loginMode === 'EMAIL'
                  ? 'bg-white text-[#0B0F17] shadow-sm font-semibold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Email & Password
            </button>
            <button
              onClick={() => setLoginMode('PHONE')}
              className={`py-2 rounded-lg transition-all ${
                loginMode === 'PHONE'
                  ? 'bg-white text-[#0B0F17] shadow-sm font-semibold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Phone OTP
            </button>
          </div>

          {inPageLoginError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{inPageLoginError}</span>
            </div>
          )}

          <form onSubmit={handleInPageLogin} className="space-y-4 text-left">
            {loginMode === 'EMAIL' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Patron Email
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="pinnacledileep777@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    10-Digit Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      required
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder="9109059791"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={inPageLoginLoading}
                      className="px-3 py-2 bg-stone-900 text-white rounded-xl text-xs font-medium hover:bg-stone-800 transition-colors flex-shrink-0"
                    >
                      {otpSent ? 'Resend' : 'Send OTP'}
                    </button>
                  </div>
                </div>

                {otpSent && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                      One-Time Passcode (OTP)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={loginOtp}
                      onChange={(e) => setLoginOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50 text-center tracking-widest font-mono text-base"
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
              className="w-full py-3 bg-[#0B0F17] text-[#C5A880] border border-[#C5A880]/40 rounded-xl font-medium text-sm hover:bg-black transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {inPageLoginLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <span>Unlock Patron Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
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
      <section className="bg-[#0B0F17] text-white pt-12 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden border-b border-[#C5A880]/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,168,128,0.12),transparent_60%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Patron Identity Card */}
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#202736] to-[#0E131F] border-2 border-[#C5A880]/50 p-1 flex items-center justify-center shadow-2xl relative">
                <span className="text-2xl font-serif font-bold text-[#C5A880] tracking-wider">
                  {patronInitials}
                </span>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-[#0B0F17] rounded-full flex items-center justify-center" title="Active Patron" />
              </div>

              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white">
                    {patronName}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30">
                    <Sparkles className="w-3 h-3" />
                    Atelier Private Patron
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#C5A880]" />
                    {profile.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#C5A880]" />
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium border border-white/20 transition-colors shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Edit Dossier</span>
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 rounded-xl text-xs font-medium border border-rose-800/40 transition-colors shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Business & VIP Stat Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-[11px] font-medium tracking-wider uppercase text-gray-400">
                Atelier Commissions
              </p>
              <p className="text-xl font-bold font-serif text-white mt-1">2 Masterpieces</p>
              <span className="text-[11px] text-emerald-400 font-medium">1 Active in Workshop</span>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-[11px] font-medium tracking-wider uppercase text-gray-400">
                Interior Architecture
              </p>
              <p className="text-xl font-bold font-serif text-white mt-1">1 Turnkey Project</p>
              <span className="text-[11px] text-[#C5A880] font-medium">Phase 3: Fabrication</span>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-[11px] font-medium tracking-wider uppercase text-gray-400">
                B2B GST Invoicing
              </p>
              <p className="text-xl font-bold font-serif text-white mt-1">
                {profile.gstin ? 'Verified' : 'Ready to Enable'}
              </p>
              <span className="text-[11px] text-gray-300">ITC Benefit 18% Available</span>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-[11px] font-medium tracking-wider uppercase text-gray-400">
                Dedicated Concierge
              </p>
              <p className="text-xl font-bold font-serif text-white mt-1">HSR Flagship</p>
              <span className="text-[11px] text-gray-300">White-Glove Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Content & Navigation Tabs */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 pb-20">
        {saveSuccessMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-600 font-bold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5DFD5] p-1.5 flex flex-wrap gap-1 mb-8">
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
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#0B0F17] text-[#C5A880] shadow-md font-semibold'
                    : 'text-gray-600 hover:text-[#0B0F17] hover:bg-stone-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#C5A880]' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & BUSINESS DOSSIER */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Personal & Contact Dossier */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-[#E5DFD5] shadow-sm">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
                  <h3 className="text-base font-serif font-bold text-[#0B0F17] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#C5A880]" />
                    <span>Client Credentials</span>
                  </h3>
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="text-xs text-[#8C6D3F] hover:underline flex items-center gap-1 font-medium"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>

                <dl className="space-y-4 text-xs">
                  <div>
                    <dt className="text-gray-400 font-medium">Full Name</dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900">{patronName}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-medium">Primary Email</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">{profile.email}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-medium">Verified Phone</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {profile.phone || '9109059791'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-medium">Account Tier</dt>
                    <dd className="mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F5F0E8] text-[#8C6D3F] border border-[#C5A880]/30">
                        CUSTOMER · Private Client
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              {/* White-Glove Support Card */}
              <div className="bg-gradient-to-br from-[#0B0F17] to-[#1E2538] text-white rounded-2xl p-6 border border-[#C5A880]/40 shadow-lg">
                <div className="flex items-center gap-2 text-[#C5A880] mb-2 text-xs font-semibold uppercase tracking-wider">
                  <Award className="w-4 h-4" />
                  <span>Bengaluru Flagship Atelier</span>
                </div>
                <h4 className="text-base font-serif font-bold text-white mb-2">
                  Personal Concierge Assigned
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed mb-4">
                  For architectural blueprint reviews, custom wood finishes, or high-value commercial quotations, contact our atelier director directly.
                </p>
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-gray-400">24th Main Rd, HSR Layout</span>
                  <Link href="/contact" className="text-[#C5A880] font-medium hover:underline flex items-center gap-1">
                    <span>Contact Atelier</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Commercial B2B GST Invoicing & Quick Highlights */}
            <div className="lg:col-span-2 space-y-6">
              {/* Commercial B2B GST Invoicing Card */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5DFD5] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-serif font-bold text-[#0B0F17]">
                        Commercial & B2B Tax Invoicing
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        GST INVOICE
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Register your company details and GSTIN to receive valid B2B tax invoices with 18% Input Tax Credit (ITC) on all furniture & interior commissions.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-3.5 py-1.5 bg-[#0B0F17] text-[#C5A880] rounded-xl text-xs font-semibold hover:bg-black transition-colors"
                  >
                    Configure GSTIN
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-[11px] uppercase font-semibold tracking-wider text-gray-500">
                      Company / Firm Name
                    </span>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      {profile.companyName || 'Not configured (Individual Patron)'}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">Appears on official bills of lading</p>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-[11px] uppercase font-semibold tracking-wider text-gray-500">
                      Registered GSTIN Number
                    </span>
                    <p className="text-sm font-mono font-bold text-gray-900 mt-1">
                      {profile.gstin || 'Not registered'}
                    </p>
                    <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{profile.gstin ? 'Eligible for ITC (18%)' : 'Add to claim B2B credits'}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-[#FBF9F5] rounded-xl border border-[#C5A880]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#C5A880]/20 flex items-center justify-center text-[#8C6D3F] flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">
                        Automated Commercial Invoice Delivery
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Digital GST invoices are auto-generated upon dispatch and stored in your orders tab.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-semibold text-[#8C6D3F] hover:underline flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>View Invoices</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Active Workshop Commission Highlight */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5DFD5] shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <h3 className="text-base font-serif font-bold text-[#0B0F17] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#C5A880]" />
                    <span>Active Workshop Commission</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-[#8C6D3F] hover:underline font-semibold"
                  >
                    All Orders →
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-900">
                        #NFI-BLR-2026-8910
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        WORKSHOP FABRICATION
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mt-1">
                      Artisanal Solid Rosewood Bedstead & Floating Consoles
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Estimated White-Glove Installation: Oct 12, 2026 · Bengaluru Residence
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-gray-400 block">Total Investment</span>
                      <span className="text-base font-bold text-gray-900">₹2,39,000</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="px-4 py-2 bg-black text-[#C5A880] rounded-xl text-xs font-medium hover:bg-gray-800 transition-colors"
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5DFD5] shadow-sm">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#0B0F17]">
                  Atelier Orders & Masterpiece Commissions
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Track fabrication stages in our Bengaluru woodworking facility, view milestones, and download GST tax invoices.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F5F0E8] text-[#8C6D3F] border border-[#C5A880]/30">
                  {DEMO_ORDERS.length} Commissions on Record
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {DEMO_ORDERS.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-[#E5DFD5] shadow-sm overflow-hidden"
                >
                  {/* Order Top Strip */}
                  <div className="bg-stone-50 px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div>
                        <span className="text-gray-400 block">Order Ref</span>
                        <span className="font-mono font-bold text-gray-900">{order.orderNumber}</span>
                      </div>
                      <div className="border-l border-gray-200 pl-4">
                        <span className="text-gray-400 block">Date Commissioned</span>
                        <span className="font-medium text-gray-900">{order.date}</span>
                      </div>
                      <div className="border-l border-gray-200 pl-4">
                        <span className="text-gray-400 block">Total Investment</span>
                        <span className="font-bold text-gray-900">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          order.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>

                      {order.invoiceAvailable && (
                        <button
                          onClick={() => alert(`Downloading official GST Tax Invoice for ${order.orderNumber}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-[#C5A880]" />
                          <span>GST Invoice</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6">
                    <div className="divide-y divide-gray-100">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                            <p className="text-xs text-[#8C6D3F] mt-0.5">{item.wood}</p>
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
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2 font-medium">
                          <span>Progress: Wood Kiln-Drying & Joinery</span>
                          <span>Est. White-Glove Installation: {order.estimatedDelivery}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#C5A880] h-full w-3/5 rounded-full" />
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5DFD5] shadow-sm">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#0B0F17]">
                  Bespoke Interior & Architectural Projects
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Private client turnkey spatial developments managed by our Principal Architects & Master Craftsmen.
                </p>
              </div>
              <Link
                href="/design-services"
                className="px-4 py-2 bg-[#0B0F17] text-[#C5A880] rounded-xl text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5"
              >
                <span>Book New Spatial Consultation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {DEMO_PROJECTS.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-2xl border border-[#E5DFD5] shadow-sm p-6 sm:p-8"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C5A880]/20 text-[#8C6D3F] border border-[#C5A880]/30">
                        {project.type}
                      </span>
                      <span className="text-xs text-gray-400">· {project.location}</span>
                    </div>
                    <h4 className="text-xl font-serif font-bold text-gray-900 mt-2">
                      {project.name}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>{project.leadArchitect}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => alert('Consultation appointment confirmed with Lead Architect.')}
                      className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-medium hover:bg-stone-800 transition-colors"
                    >
                      Schedule Spatial Review
                    </button>
                  </div>
                </div>

                {/* Stages Tracker */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs font-medium mb-3">
                    <span className="text-gray-700">Project Development Milestone</span>
                    <span className="text-[#8C6D3F] font-bold">{project.progressPercent}% Complete</span>
                  </div>

                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-6">
                    <div
                      className="bg-gradient-to-r from-[#C5A880] to-[#917245] h-full rounded-full transition-all duration-500"
                      style={{ width: `${project.progressPercent}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                    {project.stages.map((stage, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex flex-col justify-between ${
                          stage.completed
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                            : idx === 3
                            ? 'bg-amber-50/60 border-amber-200 text-amber-900 font-semibold'
                            : 'bg-stone-50 border-gray-200 text-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          {stage.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          )}
                          <span className="text-[10px] uppercase font-bold tracking-wider">
                            {stage.completed ? 'Approved' : 'In Progress'}
                          </span>
                        </div>
                        <span className="text-xs leading-snug">{stage.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-stone-50 rounded-xl text-xs text-gray-600 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C5A880] flex-shrink-0" />
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5DFD5] shadow-sm">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#0B0F17]">
                  Delivery Sites & Project Locations
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Manage primary residential properties, luxury vacation estates, and corporate ateliers for white-glove installation.
                </p>
              </div>
              <button
                onClick={() => setIsAddingAddress(true)}
                className="px-4 py-2 bg-[#0B0F17] text-[#C5A880] rounded-xl text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Delivery Site</span>
              </button>
            </div>

            {/* Address Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.addresses && profile.addresses.length > 0 ? (
                profile.addresses.map((addr, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-[#E5DFD5] shadow-sm p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F5F0E8] text-[#8C6D3F] border border-[#C5A880]/30 uppercase tracking-wider">
                          {addr.label || 'Delivery Site'}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            Primary Address
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-gray-900">{addr.line1}</p>
                      {addr.line2 && <p className="text-xs text-gray-600 mt-0.5">{addr.line2}</p>}
                      <p className="text-xs text-gray-600 mt-1">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{addr.country}</p>
                    </div>

                    <div className="pt-4 mt-6 border-t border-gray-100 flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleDeleteAddress(idx)}
                        className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="md:col-span-2 bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                  <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <h4 className="text-sm font-serif font-bold text-gray-900 mb-1">
                    No Delivery Sites Registered
                  </h4>
                  <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
                    Add your residence or project location for seamless white-glove logistics and architectural site visits.
                  </p>
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="px-4 py-2 bg-[#0B0F17] text-[#C5A880] rounded-xl text-xs font-medium"
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
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5DFD5] shadow-sm">
              <div className="flex items-start justify-between pb-6 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-serif font-bold text-[#0B0F17]">
                      Two-Factor Authentication (TOTP)
                    </h3>
                    {profile.mfaEnabled ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ENABLED
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Protect high-ticket architectural commissions, custom order contracts, and commercial invoicing details with standard authenticator applications (Google Authenticator, Microsoft Authenticator, or 1Password).
                  </p>
                </div>

                {!profile.mfaEnabled && !mfaSetupData && (
                  <button
                    onClick={handleSetupMFA}
                    disabled={mfaLoading}
                    className="px-4 py-2 bg-[#0B0F17] text-[#C5A880] rounded-xl text-xs font-semibold hover:bg-black transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {mfaLoading ? 'Generating...' : 'Enable 2FA'}
                  </button>
                )}
              </div>

              {mfaStatusMsg && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>{mfaStatusMsg}</span>
                </div>
              )}

              {/* MFA Setup Box with QR Code */}
              {mfaSetupData && (
                <div className="mt-6 p-6 bg-stone-50 border border-stone-200 rounded-2xl">
                  <h4 className="text-sm font-serif font-bold text-gray-900 mb-2">
                    Scan Authenticator QR Code
                  </h4>
                  <p className="text-xs text-gray-500 mb-4">
                    Open Google Authenticator or your password manager and scan the barcode below:
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                      <QRCode value={mfaSetupData.otpAuthUrl} size={180} />
                    </div>

                    <div className="flex-1 space-y-3 text-xs">
                      <div>
                        <span className="text-gray-400 block mb-1">Manual Entry Secret:</span>
                        <code className="p-2 bg-white border border-gray-200 rounded-lg font-mono text-xs text-gray-900 select-all block">
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
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center font-mono tracking-widest"
                          />
                          <button
                            type="submit"
                            disabled={mfaLoading}
                            className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition-colors"
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
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5DFD5] shadow-sm">
              <h3 className="text-base font-serif font-bold text-[#0B0F17] mb-2">
                Session Hardening & Patron Access
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Your session is secured via cryptographically signed JWT tokens with automated background rotation and protected HTTP-only cookie guards.
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs text-gray-500">
                <span>Active Token Protocol: Bearer RS256 / HS256</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Secure Session
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. EDIT DOSSIER MODAL */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-[#C5A880]/30 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#0B0F17]">
                  Edit Patron & Commercial Dossier
                </h3>
                <p className="text-xs text-gray-500">
                  Update contact details and business invoicing credentials.
                </p>
              </div>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Verified Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="9109059791"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                />
              </div>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-[11px] font-bold text-[#8C6D3F] uppercase tracking-wider block mb-3">
                  B2B Commercial Tax Invoicing (GST)
                </span>
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Company / Firm Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={companyNameInput}
                      onChange={(e) => setCompanyNameInput(e.target.value)}
                      placeholder="e.g. Pinnacle Architecture & Interiors Pvt Ltd"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      15-Digit GSTIN Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={gstinInput}
                      onChange={(e) => setGstinInput(e.target.value.toUpperCase())}
                      placeholder="29ABCDE1234F1Z5"
                      maxLength={15}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 rounded-xl bg-[#0B0F17] text-[#C5A880] font-semibold hover:bg-black transition-colors disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-[#C5A880]/30 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#0B0F17]">
                  Add Delivery Site / Estate
                </h3>
                <p className="text-xs text-gray-500">
                  Register a destination for white-glove assembly and site inspections.
                </p>
              </div>
              <button
                onClick={() => setIsAddingAddress(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Site Label
                </label>
                <select
                  value={addressLabel}
                  onChange={(e) => setAddressLabel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50 bg-white"
                >
                  <option value="Primary Residence">Primary Residence</option>
                  <option value="Corporate Office">Corporate Office / Atelier</option>
                  <option value="Weekend Villa">Weekend Villa / Estate</option>
                  <option value="Project Site">Interior Project Site</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Address Line 1
                </label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Villa 402, 24th Main Road"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Opposite Purva Fairmont, HSR Layout"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    required
                    value={addressPincode}
                    onChange={(e) => setAddressPincode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    required
                    value={addressCountry}
                    onChange={(e) => setAddressCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50"
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
                <label htmlFor="defaultAddr" className="text-gray-700 font-medium">
                  Set as Primary Delivery Site
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="px-6 py-2.5 rounded-xl bg-[#0B0F17] text-[#C5A880] font-semibold hover:bg-black transition-colors disabled:opacity-50"
                >
                  {savingAddress ? 'Saving...' : 'Add Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
