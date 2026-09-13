'use client';

import React, { useState } from 'react';

export interface DonutSegment {
  id: string;
  label: string;
  value: number; // in paise or count
  percentage: number;
  color: string;
  subtext?: string | undefined;
}

interface DonutBreakdownChartProps {
  segments: DonutSegment[];
  centerLabel?: string | undefined;
  centerValue?: string | undefined;
  formatValue?: ((val: number) => string) | undefined;
  loading?: boolean;
}

export function DonutBreakdownChart({
  segments,
  centerLabel = 'Total Volume',
  centerValue,
  formatValue,
  loading = false,
}: DonutBreakdownChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center bg-stone-50/50 rounded-xl border border-stone-200">
        <div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-[#C5A059] animate-spin mb-3" />
        <p className="text-xs text-stone-500 font-medium tracking-wide">Synthesizing distribution…</p>
      </div>
    );
  }

  // SVG Geometry for Donut
  const size = 200;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate cumulative offsets
  let accumulatedPercent = 0;

  const totalValue = segments.reduce((sum, s) => sum + s.value, 0);

  const formattedCenter = centerValue || (formatValue ? formatValue(totalValue) : String(totalValue));

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* SVG Donut */}
      <div className="relative w-48 h-48 flex-shrink-0 flex items-center justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full transform -rotate-90"
          role="img"
          aria-label="Distribution Donut Chart"
        >
          {segments.map((seg) => {
            const strokeDasharray = `${(seg.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
            accumulatedPercent += seg.percentage;
            const isHovered = hoveredId === seg.id;

            return (
              <circle
                key={seg.id}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredId(seg.id)}
                onMouseLeave={() => setHoveredId(null)}
              />
            );
          })}
        </svg>

        {/* Donut Center Hole Metrics */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 font-sans">
            {centerLabel}
          </span>
          <span className="text-base font-serif font-bold text-stone-900 mt-0.5 tracking-tight">
            {formattedCenter}
          </span>
        </div>
      </div>

      {/* Legend & Details */}
      <div className="flex-1 w-full space-y-2.5">
        {segments.map((seg) => {
          const isHovered = hoveredId === seg.id;

          return (
            <div
              key={seg.id}
              onMouseEnter={() => setHoveredId(seg.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer ${
                isHovered ? 'bg-stone-100 shadow-xs' : 'hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs"
                  style={{ backgroundColor: seg.color }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-900 truncate">{seg.label}</p>
                  {seg.subtext && (
                    <p className="text-[10px] text-stone-400 truncate">{seg.subtext}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 text-right">
                <span className="text-xs font-bold text-stone-900 font-sans">
                  {formatValue ? formatValue(seg.value) : seg.value}
                </span>
                <span className="text-[11px] font-mono font-semibold text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded min-w-[42px] text-center">
                  {seg.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
