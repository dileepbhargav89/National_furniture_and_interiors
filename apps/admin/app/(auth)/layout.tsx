import * as React from 'react';
import Image from 'next/image';
import { AuthProvider } from '../../providers/auth-provider';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="relative min-h-screen w-full overflow-x-hidden bg-[#FAF9F6] lg:grid lg:grid-cols-2">
        {/* Left — Brand Showcase Panel */}
        <div
          className="bg-blueprint-grid relative hidden min-h-screen flex-col justify-between overflow-hidden p-8 text-white lg:flex lg:p-12"
          style={{
            backgroundColor: '#0E0B09',
            borderRight: '1px solid rgba(224, 112, 32, 0.22)',
          }}
        >
          {/* Multi-layered luxury depth gradients */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 25% 20%, #30170A 0%, #170E08 55%, #0A0705 100%)',
            }}
          />

          {/* Luminous breathing amber aurora glow behind the emblem */}
          <div
            className="animate-ambient-pulse pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(245, 160, 96, 0.32) 0%, rgba(224, 112, 32, 0.18) 45%, transparent 72%)',
            }}
          />

          {/* Secondary atmospheric rim glow */}
          <div
            className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(197, 160, 89, 0.15) 0%, transparent 70%)',
            }}
          />

          {/* Top accent line with gold gradient */}
          <div
            className="absolute left-0 right-0 top-0 h-[3px]"
            style={{
              background:
                'linear-gradient(90deg, #E07020 0%, #C5A059 50%, rgba(224, 112, 32, 0.15) 100%)',
            }}
          />

          {/* Header Brand Badge */}
          <div className="relative z-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#FDE8D0] shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              Est. 1998 · Bengaluru &amp; Hyderabad
            </div>
          </div>

          {/* Centre — Floating Glassmorphic Emblem Card & Command Label */}
          <div className="relative z-20 my-auto flex flex-col items-center justify-center text-center">
            {/* Elegant glassmorphic logo card */}
            <div
              className="group relative mb-8 flex items-center justify-center rounded-3xl p-8 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02]"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(254, 250, 245, 0.94) 100%)',
                border: '1.5px solid rgba(224, 112, 32, 0.35)',
                boxShadow:
                  '0 25px 65px -15px rgba(224, 112, 32, 0.35), 0 0 45px rgba(245, 160, 96, 0.20)',
              }}
            >
              <Image
                src="/nfi-logo.png"
                alt="National Furniture & Interiors Logo"
                width={320}
                height={320}
                priority
                className="h-auto w-56 object-contain drop-shadow-md transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            {/* Portal Titles */}
            <div className="space-y-2">
              <h2 className="flex items-center justify-center gap-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                <span style={{ color: '#F5A060' }}>✦</span>
                Executive Command Portal
              </h2>
              <p className="text-sm font-medium tracking-wide text-stone-300">
                National Furniture &amp; Interiors
              </p>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#C5A059]">
                Architectural Atelier · Turnkey CRM · ISO/IEC 27001
              </p>
            </div>
          </div>

          {/* Bottom Floating Architecture Trust Cards */}
          <div className="relative z-20 pt-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="animate-float flex flex-col items-center justify-center rounded-xl border border-amber-500/20 bg-white/[0.04] p-3 text-center backdrop-blur-md transition-colors hover:border-amber-500/40">
                <span className="text-xs font-bold text-[#F5A060]">40,000</span>
                <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                  Sq.Ft Atelier
                </span>
              </div>
              <div className="animate-float-delayed flex flex-col items-center justify-center rounded-xl border border-amber-500/20 bg-white/[0.04] p-3 text-center backdrop-blur-md transition-colors hover:border-amber-500/40">
                <span className="text-xs font-bold text-[#F5A060]">₹100Cr+</span>
                <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                  Turnkey Delivered
                </span>
              </div>
              <div className="animate-float flex flex-col items-center justify-center rounded-xl border border-amber-500/20 bg-white/[0.04] p-3 text-center backdrop-blur-md transition-colors hover:border-amber-500/40">
                <span className="text-xs font-bold text-[#F5A060]">25+ Years</span>
                <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                  Legacy Craft
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Elevated Authentication Form Panel */}
        <div
          className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-6 sm:p-8 lg:p-12"
          style={{ backgroundColor: '#FAF9F6' }}
        >
          {/* Subtle ambient light reflections safely contained inside overflow-hidden */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-amber-100/50 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-orange-100/40 blur-3xl" />

          <div className="relative z-10 w-full max-w-md">
            {/* Mobile/Tablet Brand Showcase Header (visible on screens below lg when left panel is hidden) */}
            <div className="mb-6 flex flex-col items-center text-center lg:hidden">
              <div className="group relative mb-3 flex items-center justify-center rounded-2xl bg-white p-3 shadow-xl ring-1 ring-amber-500/20">
                <Image
                  src="/nfi-logo.png"
                  alt="National Furniture & Interiors Logo"
                  width={140}
                  height={140}
                  className="h-9 w-auto object-contain"
                  priority
                />
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C7355]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                </span>
                Est. 1998 · Bengaluru &amp; Hyderabad
              </div>
            </div>

            <div className="rounded-3xl border border-stone-200/80 bg-white/95 p-8 shadow-2xl shadow-stone-900/5 backdrop-blur-xl transition-all duration-300 sm:p-10">
              {children}
            </div>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
