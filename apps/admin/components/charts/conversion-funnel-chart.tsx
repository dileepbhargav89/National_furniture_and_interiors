'use client';

import React from 'react';
import { ArrowDownRight, Users, CheckCircle2 } from 'lucide-react';

export interface FunnelStageItem {
  id: string;
  name: string;
  count: number;
  conversionRate: number; // e.g. 72%
  dropoffRate?: number | undefined; // e.g. 28%
  subtext?: string | undefined;
}

interface ConversionFunnelChartProps {
  stages?: FunnelStageItem[] | undefined;
  loading?: boolean;
}

const defaultStages: FunnelStageItem[] = [
  { id: '1', name: '1. Discovery & Web Inquiries', count: 142, conversionRate: 100, subtext: 'Inbound digital showcase & catalog discovery' },
  { id: '2', name: '2. Qualified Consultations', count: 98, conversionRate: 69.0, dropoffRate: 31.0, subtext: 'Triage with Senior Architects' },
  { id: '3', name: '3. Flagship Studio Walkthroughs', count: 64, conversionRate: 45.1, dropoffRate: 34.7, subtext: '100ft Rd Studio experience & tactile review' },
  { id: '4', name: '4. 3D Spatial Proposals Sent', count: 46, conversionRate: 32.4, dropoffRate: 28.1, subtext: 'CAD / VR models & BOQ tender' },
  { id: '5', name: '5. Closed Won & Production Orders', count: 32, conversionRate: 22.5, dropoffRate: 30.4, subtext: 'Signed contracts & artisan workshop builds' },
];

export function ConversionFunnelChart({ stages = defaultStages, loading = false }: ConversionFunnelChartProps) {
  if (loading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center bg-stone-50/50 rounded-xl border border-stone-200">
        <div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-[#C5A059] animate-spin mb-3" />
        <p className="text-xs text-stone-500 font-medium tracking-wide">Calculating acquisition funnel…</p>
      </div>
    );
  }

  const maxCount = stages[0]?.count || 100;

  return (
    <div className="space-y-4">
      {stages.map((st, idx) => {
        const widthPercent = Math.max(12, Math.round((st.count / maxCount) * 100));
        const isWon = idx === stages.length - 1;

        return (
          <div key={st.id} className="relative group">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-900 tracking-wide font-sans">{st.name}</span>
                {st.subtext && (
                  <span className="text-[11px] text-stone-400 hidden sm:inline">• {st.subtext}</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                  {st.count} patrons
                </span>
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                    isWon
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-[#C5A059]/10 text-[#8C7355]'
                  }`}
                >
                  {st.conversionRate.toFixed(1)}% of top
                </span>
              </div>
            </div>

            {/* Stepped Progress Bar with Gold Accent Fill */}
            <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden flex items-center p-0.5 border border-stone-200">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isWon
                    ? 'bg-gradient-to-r from-[#C5A059] to-emerald-600 shadow-sm'
                    : 'bg-gradient-to-r from-[#171717] via-[#8C7355] to-[#C5A059]'
                }`}
                style={{ width: `${widthPercent}%` }}
              />
            </div>

            {/* Drop-off Indicator between stages */}
            {st.dropoffRate !== undefined && (
              <div className="flex items-center gap-1 text-[10px] text-rose-500 font-medium mt-1 pl-1">
                <ArrowDownRight className="w-3 h-3" />
                <span>{st.dropoffRate.toFixed(1)}% drop-off from previous checkpoint</span>
              </div>
            )}
          </div>
        );
      })}

      {/* Funnel Bottom Summary */}
      <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-[#8C7355]" />
          <span>Total Funnel Throughput: <strong>{maxCount} Leads</strong></span>
        </span>
        <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>End-to-End Win Rate: <strong>{stages[stages.length - 1]?.conversionRate.toFixed(1)}%</strong></span>
        </span>
      </div>
    </div>
  );
}
