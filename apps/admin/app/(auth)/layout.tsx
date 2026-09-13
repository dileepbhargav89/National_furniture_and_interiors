import * as React from 'react';
import Image from 'next/image';
import { AuthProvider } from '../../providers/auth-provider';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">

        {/* Left — Brand Showcase Panel */}
        <div
          className="relative hidden h-full flex-col p-10 text-white lg:flex overflow-hidden"
          style={{
            backgroundColor: 'var(--nfi-brown-dark)',
            borderRight: '1px solid rgba(224,112,32,0.18)',
          }}
        >
          {/* Rich dark-wood gradient background */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(145deg, #4A1E0A 0%, #2A1005 45%, #140803 100%)' }}
          />

          {/* Subtle orange ambient glow bottom-right */}
          <div
            className="absolute bottom-0 right-0 w-96 h-96 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(224,112,32,0.15) 0%, transparent 70%)',
              transform: 'translate(25%, 25%)',
            }}
          />

          {/* Top corner accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ background: 'linear-gradient(90deg, var(--nfi-orange) 0%, rgba(224,112,32,0.2) 100%)' }}
          />

          {/* Brand header */}
          <div className="relative z-20 mb-8">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: 'var(--nfi-orange)' }}
              />
              <span
                className="text-[11px] uppercase tracking-[0.25em] font-bold"
                style={{ color: 'rgba(245,220,190,0.6)' }}
              >
                Est. 1998 · Bengaluru
              </span>
            </div>
          </div>

          {/* Centre — High-Definition Original Logo */}
          <div className="relative z-20 flex flex-1 flex-col items-center justify-center">
            {/* Elegant card for logo */}
            <div
              className="relative flex items-center justify-center rounded-[2rem] p-8 mb-8 shadow-2xl bg-white"
              style={{
                border: '1px solid rgba(224,112,32,0.25)',
                boxShadow: '0 0 60px rgba(224,112,32,0.15), 0 25px 60px rgba(0,0,0,0.35)',
              }}
            >
              <Image
                src="/nfi-logo.png"
                alt="National Furniture & Interiors Logo"
                width={320}
                height={320}
                priority
                className="w-56 h-auto object-contain"
              />
            </div>

            {/* Portal label */}
            <div className="text-center">
              <h2
                className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2 mb-2"
              >
                <span style={{ color: 'var(--nfi-orange)' }}>✦</span>
                Executive Command Portal
              </h2>
              <p className="text-sm font-medium" style={{ color: 'rgba(245,220,190,0.7)' }}>
                National Furniture &amp; Interiors
              </p>
              <p className="text-[11px] mt-1.5 uppercase tracking-widest font-mono" style={{ color: 'rgba(245,220,190,0.4)' }}>
                Secure · Role-Based · ISO/IEC 27001
              </p>
            </div>
          </div>

          {/* Bottom trust badges */}
          <div className="relative z-20 mt-8">
            <div className="flex items-center gap-4 flex-wrap">
              {[
                { label: '40,000 sq.ft Studio' },
                { label: 'Bengaluru & Hyderabad' },
                { label: '25+ Years Heritage' },
              ].map((b) => (
                <div
                  key={b.label}
                  className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'rgba(245,220,190,0.5)' }}
                >
                  <span
                    className="w-1 h-1 rounded-full"
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
          className="lg:p-8 flex items-center justify-center min-h-screen"
          style={{ backgroundColor: 'var(--nfi-cream)' }}
        >
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[480px] max-w-lg p-6">
            {children}
          </div>
        </div>

      </div>
    </AuthProvider>
  );
}
