import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AuthProvider } from '../../providers/auth-provider';
import { ShieldCheck, Award, Sparkles, Building2 } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="container relative grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
        {/* Left Side: Luxury NFI Brand & Atelier Showcase */}
        <div className="relative hidden h-full flex-col justify-between overflow-hidden bg-[#0f0e0c] p-12 text-white lg:flex dark:border-r">
          {/* Ambient Luxury Lighting & Grain Effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_20%_-10%,rgba(197,160,89,0.22),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_80%_110%,rgba(140,115,85,0.18),transparent_60%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(15,14,12,0.6)_0%,rgba(15,14,12,0.95)_100%)]" />

          {/* Top Brand Bar */}
          <div className="relative z-20 flex items-center justify-between">
            <Link
              href="/"
              className="group flex items-center gap-3 transition-transform hover:scale-[1.02]"
            >
              <div className="rounded-xl border border-amber-500/20 bg-white/95 p-2 shadow-xl backdrop-blur-sm">
                <Image
                  src="/nfi-logo.png"
                  alt="National Furniture & Interiors"
                  width={150}
                  height={38}
                  sizes="(max-width: 1024px) 140px, 150px"
                  className="h-7 w-auto object-contain"
                  priority
                />
              </div>
            </Link>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-medium text-amber-300 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>Est. 1998 · Bengaluru</span>
            </div>
          </div>

          {/* Center Brand Statement & Atelier Pillars */}
          <div className="relative z-20 my-auto max-w-lg space-y-8 py-12">
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400/90">
                Master Woodcraft & Turnkey Interiors
              </span>
              <h1 className="font-serif text-3xl leading-snug tracking-tight text-white sm:text-4xl">
                Bespoke luxury crafted for discerning spaces.
              </h1>
              <p className="text-sm leading-relaxed text-zinc-300">
                Handcrafted solid wood joinery, architectural paneling, and bespoke interior
                execution manufactured in our Bengaluru atelier.
              </p>
            </div>

            {/* Atelier Heritage Metrics */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
                <div className="text-lg font-bold text-amber-400">40k sq.ft</div>
                <div className="mt-0.5 text-[11px] text-zinc-400">Manufacturing Atelier</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
                <div className="text-lg font-bold text-amber-400">2,500+</div>
                <div className="mt-0.5 text-[11px] text-zinc-400">Spaces Curated</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
                <div className="text-lg font-bold text-amber-400">25+ Yrs</div>
                <div className="mt-0.5 text-[11px] text-zinc-400">Master Heritage</div>
              </div>
            </div>
          </div>

          {/* Bottom Testimonial & Trust Markers */}
          <div className="relative z-20 space-y-4">
            <blockquote className="space-y-2 rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
              <p className="text-xs italic leading-relaxed text-zinc-300">
                &ldquo;National Furniture transformed our Bengaluru penthouse into a timeless
                sanctuary. The joinery precision and bespoke teak work are truly unmatched.&rdquo;
              </p>
              <footer className="text-[11px] font-medium text-amber-400/90">
                — Anand R., Prestige Golfshire Estate
              </footer>
            </blockquote>

            <div className="flex items-center gap-4 text-[11px] text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-amber-400" />
                <span>Certified Teak & Oak</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-amber-400" />
                <span>Architectural Grade</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                <span>10-Year Warranty</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form Container */}
        <div className="flex min-h-screen flex-col justify-center px-4 py-12 sm:px-6 lg:p-12">
          {/* Mobile Brand Header */}
          <div className="mb-8 flex flex-col items-center gap-2 text-center lg:hidden">
            <Link
              href="/"
              className="inline-block rounded-xl border border-amber-500/20 bg-white p-2 shadow-md"
            >
              <Image
                src="/nfi-logo.png"
                alt="National Furniture & Interiors"
                width={140}
                height={36}
                sizes="140px"
                className="h-7 w-auto object-contain"
                priority
              />
            </Link>
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
              ✦ Est. 1998 · Bengaluru Atelier
            </span>
          </div>

          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[440px]">
            {children}
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
