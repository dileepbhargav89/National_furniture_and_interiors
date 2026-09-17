import * as React from 'react';
import Image from 'next/image';
import { AuthProvider } from '../../providers/auth-provider';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="container relative grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
        {/* Left — Brand Showcase Panel */}
        <div
          className="relative hidden h-full flex-col overflow-hidden p-10 text-white lg:flex"
          style={{
            backgroundColor: '#46220E',
            borderRight: '1px solid rgba(224,112,32,0.25)',
          }}
        >
          {/* Warm teak & amber heritage gradient — faded luxury tone relating to the NFI logo */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(150deg, #8A4B27 0%, #663519 45%, #46220E 100%)',
            }}
          />

          {/* Luminous faded amber ambient glow — radiates from center behind logo */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(245,160,96,0.28) 0%, rgba(224,112,32,0.16) 42%, transparent 72%)',
            }}
          />

          {/* Soft atmospheric fade overlay */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(224,112,32,0.04) 45%, rgba(0,0,0,0.12) 100%)',
            }}
          />

          {/* Top corner accent line */}
          <div
            className="absolute left-0 right-0 top-0 h-[3px]"
            style={{
              background:
                'linear-gradient(90deg, var(--nfi-orange) 0%, #F5A060 50%, rgba(224,112,32,0.2) 100%)',
            }}
          />

          {/* Brand header */}
          <div className="relative z-20 mb-8">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{
                backgroundColor: 'rgba(224,112,32,0.20)',
                border: '1px solid rgba(224,112,32,0.40)',
                color: '#FCE7D2',
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: 'var(--nfi-orange)' }}
              />
              Est. 1998 · Bengaluru
            </div>
          </div>

          {/* Centre — High-Definition Original Logo */}
          <div className="relative z-20 flex flex-1 flex-col items-center justify-center">
            {/* Elegant card for logo */}
            <div
              className="relative mb-7 flex items-center justify-center rounded-3xl bg-gradient-to-b from-white via-white to-[#FDF8F2] p-7 shadow-2xl"
              style={{
                border: '1.5px solid rgba(224,112,32,0.35)',
                boxShadow: '0 0 50px rgba(224,112,32,0.22), 0 20px 45px rgba(50,22,10,0.25)',
              }}
            >
              <Image
                src="/nfi-logo.png"
                alt="National Furniture & Interiors Logo"
                width={300}
                height={300}
                priority
                className="drop-shadow-xs h-auto w-52 object-contain"
              />
            </div>

            {/* Portal label */}
            <div className="text-center">
              <h2 className="mb-2 flex items-center justify-center gap-2 text-2xl font-bold tracking-tight text-white">
                <span style={{ color: '#F5A060' }}>✦</span>
                Executive Command Portal
              </h2>
              <p className="text-sm font-medium" style={{ color: 'rgba(253,248,242,0.88)' }}>
                National Furniture &amp; Interiors
              </p>
              <p
                className="mt-1.5 font-mono text-[11px] uppercase tracking-widest"
                style={{ color: 'rgba(245,210,180,0.65)' }}
              >
                Secure · Role-Based · ISO/IEC 27001
              </p>
            </div>
          </div>

          {/* Bottom trust badges */}
          <div className="relative z-20 mt-8">
            <div className="flex flex-wrap items-center gap-3">
              {[
                { label: '40,000 sq.ft Studio' },
                { label: 'Bengaluru & Hyderabad' },
                { label: '25+ Years Heritage' },
              ].map((b) => (
                <div
                  key={b.label}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    backgroundColor: 'rgba(253,248,242,0.10)',
                    border: '1px solid rgba(224,112,32,0.30)',
                    color: 'rgba(253,248,242,0.85)',
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--nfi-orange)' }}
                  />
                  {b.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Authentication Form Panel */}
        <div
          className="flex min-h-screen items-center justify-center lg:p-8"
          style={{ backgroundColor: 'var(--nfi-cream)' }}
        >
          <div className="mx-auto flex w-full max-w-lg flex-col justify-center space-y-6 p-6 sm:w-[480px]">
            {children}
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
