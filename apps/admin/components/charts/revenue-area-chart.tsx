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
      return `₹${(rupees / 100000).toFixed(2)} L`;
    }
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(rupees);
  };

  // Dimensions
  const width = 800;
  const height = 300;
  const padding = { top: 30, right: 30, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { maxVal, points, totalPath, designPath, onlinePath, totalArea, designArea } = useMemo(() => {
    if (!data || data.length === 0) {
      return { maxVal: 0, points: [], totalPath: '', designPath: '', onlinePath: '', totalArea: '', designArea: '' };
    }

    const max = Math.max(...data.map((d) => d.totalRevenue), 10000000); // at least ₹1L
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
      <div className="w-full h-72 flex flex-col items-center justify-center bg-stone-50/50 rounded-xl border border-stone-200">
        <div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-[#C5A059] animate-spin mb-3" />
        <p className="text-xs text-stone-500 font-medium tracking-wide">Synthesizing revenue trajectory…</p>
      </div>
    );
  }

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <div className="relative w-full overflow-hidden select-none">
      {/* Interactive Tooltip Card */}
      {activePoint && (
        <div
          className="absolute z-20 pointer-events-none transition-all duration-75 bg-[#171717] text-white p-3 rounded-lg shadow-xl border border-stone-700 text-xs w-52"
          style={{
            left: Math.min(Math.max(activePoint.x - 104, 10), width - 220),
            top: 10,
          }}
        >
          <div className="flex items-center justify-between border-b border-stone-700 pb-1.5 mb-1.5 font-medium">
            <span className="text-stone-300 font-serif">{activePoint.d.label}</span>
            <span className="text-[10px] text-[#C5A059] bg-[#C5A059]/10 px-1.5 py-0.5 rounded font-bold">
              {activePoint.d.orderCount} bookings
            </span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-stone-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
                Total Bookings:
              </span>
              <span className="font-bold text-white">{formatLakhs(activePoint.d.totalRevenue)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#8C7355]" />
                Design Projects:
              </span>
              <span className="text-stone-200 font-medium">{formatLakhs(activePoint.d.designProjectsRevenue)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-stone-500" />
                Bespoke Retail:
              </span>
              <span className="text-stone-200 font-medium">{formatLakhs(activePoint.d.onlineOrdersRevenue)}</span>
            </div>
          </div>
        </div>
      )}

      {/* SVG Chart */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label="Revenue and Pipeline Trajectory Chart"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="totalGoldGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C5A059" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#C5A059" stopOpacity="0.0" />
          </linearGradient>

          <linearGradient id="designGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8C7355" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#8C7355" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding.top + chartHeight - ratio * chartHeight;
          const val = ratio * maxVal;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#EAE6DF"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-stone-400 font-sans"
              >
                {formatLakhs(val)}
              </text>
            </g>
          );
        })}

        {/* Area Gradient Fills */}
        {totalArea && <path d={totalArea} fill="url(#totalGoldGradient)" />}
        {designArea && <path d={designArea} fill="url(#designGradient)" />}

        {/* Spline Lines */}
        {designPath && (
          <path
            d={designPath}
            fill="none"
            stroke="#8C7355"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
        )}
        {onlinePath && (
          <path
            d={onlinePath}
            fill="none"
            stroke="#A8A29E"
            strokeWidth="1.5"
          />
        )}
        {totalPath && (
          <path
            d={totalPath}
            fill="none"
            stroke="#C5A059"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}

        {/* Vertical Crosshair Line when hovering */}
        {activePoint && (
          <line
            x1={activePoint.x}
            y1={padding.top}
            x2={activePoint.x}
            y2={padding.top + chartHeight}
            stroke="#171717"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
        )}

        {/* Data Interactive Points & X-Axis Labels */}
        {points.map((pt, i) => (
          <g key={i}>
            {/* Hitbox for touch and hover */}
            <rect
              x={pt.x - 20}
              y={padding.top}
              width={40}
              height={chartHeight + 30}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(i)}
            />

            {/* Total point dot */}
            <circle
              cx={pt.x}
              cy={pt.yTotal}
              r={hoverIndex === i ? 6 : 3.5}
              fill="#FFFFFF"
              stroke="#C5A059"
              strokeWidth={hoverIndex === i ? 3 : 2}
              className="transition-all duration-150"
            />

            {/* X-axis date label */}
            <text
              x={pt.x}
              y={padding.top + chartHeight + 20}
              textAnchor="middle"
              className={`text-[10px] transition-colors ${
                hoverIndex === i ? 'fill-black font-bold' : 'fill-stone-500'
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
