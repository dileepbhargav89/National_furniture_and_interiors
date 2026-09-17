'use client';

import React, { useState, useMemo } from 'react';
import { RevenueTimeseriesPoint } from '@nfi/api-client';

interface RevenueAreaChartProps {
  data: RevenueTimeseriesPoint[];
  loading?: boolean;
}

export function RevenueAreaChart({ data, loading = false }: RevenueAreaChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const formatLakhs = (paise: number) => {
    const rupees = paise / 100;
    if (rupees >= 10000000) {
      return `₹${(rupees / 10000000).toFixed(2)} Cr`;
    }
    if (rupees >= 100000) {
      return `₹${(rupees / 100000).toFixed(1)} L`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(rupees);
  };

  // Compact dimensions: 190px height for optimal screen fit
  const width = 800;
  const height = 190;
  const padding = { top: 16, right: 20, bottom: 28, left: 55 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { maxVal, points, totalPath, designPath, onlinePath, totalArea, designArea } =
    useMemo(() => {
      if (!data || data.length === 0) {
        return {
          maxVal: 0,
          points: [],
          totalPath: '',
          designPath: '',
          onlinePath: '',
          totalArea: '',
          designArea: '',
        };
      }

      const max = Math.max(...data.map((d) => d.totalRevenue), 10000000);
      const stepX = chartWidth / (data.length - 1 || 1);

      const coords = data.map((d, i) => {
        const x = padding.left + i * stepX;
        const yTotal = padding.top + chartHeight - (d.totalRevenue / max) * chartHeight;
        const yDesign = padding.top + chartHeight - (d.designProjectsRevenue / max) * chartHeight;
        const yOnline = padding.top + chartHeight - (d.onlineOrdersRevenue / max) * chartHeight;
        return { x, yTotal, yDesign, yOnline, d };
      });

      const createPath = (key: 'yTotal' | 'yDesign' | 'yOnline') => {
        if (coords.length === 0) return '';
        let path = `M ${coords[0]!.x} ${coords[0]![key]}`;
        for (let i = 1; i < coords.length; i++) {
          const prev = coords[i - 1]!;
          const curr = coords[i]!;
          const cpx1 = prev.x + (curr.x - prev.x) / 2;
          const cpy1 = prev[key];
          const cpx2 = prev.x + (curr.x - prev.x) / 2;
          const cpy2 = curr[key];
          path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr[key]}`;
        }
        return path;
      };

      const tPath = createPath('yTotal');
      const dPath = createPath('yDesign');
      const oPath = createPath('yOnline');

      const bottomY = padding.top + chartHeight;
      const tArea = `${tPath} L ${coords[coords.length - 1]!.x} ${bottomY} L ${coords[0]!.x} ${bottomY} Z`;
      const dArea = `${dPath} L ${coords[coords.length - 1]!.x} ${bottomY} L ${coords[0]!.x} ${bottomY} Z`;

      return {
        maxVal: max,
        points: coords,
        totalPath: tPath,
        designPath: dPath,
        onlinePath: oPath,
        totalArea: tArea,
        designArea: dArea,
      };
    }, [data, chartHeight, chartWidth, padding.left, padding.top]);

  if (loading) {
    return (
      <div className="flex h-44 w-full animate-pulse flex-col items-center justify-center rounded-xl border border-[#EDE4D8] bg-[#FDF8F2]">
        <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-[#DDD0BE] border-t-[#E07020]" />
        <p className="text-[11px] font-medium text-[#7A5C45]">Synthesizing revenue trajectory…</p>
      </div>
    );
  }

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <div className="relative w-full select-none overflow-hidden">
      {/* Interactive Tooltip Card in Deep Walnut */}
      {activePoint && (
        <div
          className="pointer-events-none absolute z-20 w-52 rounded-lg border border-[#E07020]/40 bg-[#3D1A08]/95 p-2.5 text-xs text-[#FDF8F2] shadow-xl backdrop-blur-md transition-all duration-75"
          style={{
            left: Math.min(Math.max(activePoint.x - 100, 10), width - 220),
            top: 5,
          }}
        >
          <div className="mb-1.5 flex items-center justify-between border-b border-[#5C2D10] pb-1">
            <span className="font-serif text-[11px] font-bold text-[#FDF8F2]">
              {activePoint.d.label}
            </span>
            <span className="py-0.2 rounded border border-[#E07020]/30 bg-[#E07020]/15 px-1.5 text-[9px] font-bold text-[#E07020]">
              {activePoint.d.orderCount} Deals
            </span>
          </div>

          <div className="space-y-1 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[#C9A080]">
                <span className="h-2 w-2 rounded-full bg-[#E07020]" />
                Total Bookings:
              </span>
              <span className="font-mono font-bold text-white">
                {formatLakhs(activePoint.d.totalRevenue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[#C9A080]">
                <span className="h-2 w-2 rounded-full bg-[#A88B77]" />
                Design Projects:
              </span>
              <span className="font-mono text-[#F5EDE0]">
                {formatLakhs(activePoint.d.designProjectsRevenue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[#C9A080]">
                <span className="h-2 w-2 rounded-full bg-stone-400" />
                Bespoke Retail:
              </span>
              <span className="font-mono text-[#F5EDE0]">
                {formatLakhs(activePoint.d.onlineOrdersRevenue)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SVG Chart with Harmonious Warm Palette */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="Revenue Trajectory Chart"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="nfiOrangeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E07020" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#E07020" stopOpacity="0.0" />
          </linearGradient>

          <linearGradient id="nfiBrownGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5C2D10" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#5C2D10" stopOpacity="0.0" />
          </linearGradient>

          <filter id="terracottaGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow
              dx="0"
              dy="1"
              stdDeviation="1.5"
              floodColor="#E07020"
              floodOpacity="0.25"
            />
          </filter>
        </defs>

        {/* Horizontal Grid lines */}
        {[0, 0.33, 0.66, 1].map((ratio, i) => {
          const y = padding.top + chartHeight - ratio * chartHeight;
          const val = ratio * maxVal;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#EDE4D8"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={y + 3.5}
                textAnchor="end"
                className="fill-[#7A5C45] font-mono text-[9px]"
              >
                {formatLakhs(val)}
              </text>
            </g>
          );
        })}

        {/* Area Gradient Fills */}
        {totalArea && <path d={totalArea} fill="url(#nfiOrangeGradient)" />}
        {designArea && <path d={designArea} fill="url(#nfiBrownGradient)" />}

        {/* Spline Lines */}
        {designPath && (
          <path
            d={designPath}
            fill="none"
            stroke="#5C2D10"
            strokeWidth="1.75"
            strokeDasharray="3 2"
          />
        )}
        {onlinePath && <path d={onlinePath} fill="none" stroke="#A88B77" strokeWidth="1.25" />}
        {totalPath && (
          <path
            d={totalPath}
            fill="none"
            stroke="#E07020"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#terracottaGlow)"
          />
        )}

        {/* Vertical Crosshair Line on hover */}
        {activePoint && (
          <line
            x1={activePoint.x}
            y1={padding.top}
            x2={activePoint.x}
            y2={padding.top + chartHeight}
            stroke="#3D1A08"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        )}

        {/* Interactive Points & X-Axis Labels */}
        {points.map((pt, i) => (
          <g key={i}>
            {/* Hitbox */}
            <rect
              x={pt.x - 20}
              y={padding.top}
              width={40}
              height={chartHeight + 25}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(i)}
            />

            {/* Point dot */}
            <circle
              cx={pt.x}
              cy={pt.yTotal}
              r={hoverIndex === i ? 5 : 3}
              fill="#FFFFFF"
              stroke="#E07020"
              strokeWidth={hoverIndex === i ? 2.5 : 1.5}
              className="transition-all duration-150"
            />

            {/* X-axis date label */}
            <text
              x={pt.x}
              y={padding.top + chartHeight + 16}
              textAnchor="middle"
              className={`text-[9px] transition-colors ${
                hoverIndex === i ? 'fill-[#1C0D04] font-bold' : 'fill-[#7A5C45]'
              }`}
            >
              {pt.d.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
