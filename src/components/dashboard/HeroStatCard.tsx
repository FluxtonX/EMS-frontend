'use client';

import React from 'react';
import { LucideIcon, TrendingUp } from 'lucide-react';

interface HeroStatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  trend: string;
  icon: LucideIcon;
  sparklineData?: number[];
}

export function HeroStatCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  sparklineData = [24, 28, 26, 31, 29, 34, 38],
}: HeroStatCardProps) {
  // Normalize sparkline data for SVG path
  const min = Math.min(...sparklineData);
  const max = Math.max(...sparklineData);
  const range = max - min || 1;
  const width = 140;
  const height = 48;
  const points = sparklineData.map((d, i) => {
    const x = (i / (sparklineData.length - 1)) * width;
    const y = height - ((d - min) / range) * (height - 12) - 6;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7C6CEE] via-[#6C5CE7] to-[#4D3CB5] p-5 text-white shadow-[0_12px_32px_-8px_rgba(108,92,231,0.45)] ring-1 ring-white/25 transition-all duration-300 hover:shadow-[0_16px_38px_-6px_rgba(108,92,231,0.55)] hover:-translate-y-0.5">
      {/* Glossy radial highlight overlay */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-purple-300/10 blur-xl" />

      {/* Header */}
      <div className="relative flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#EDE9FE]">
          {title}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md shadow-xs ring-1 ring-white/30">
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="relative mt-2">
        <div className="text-3xl font-extrabold tracking-tight text-white drop-shadow-xs">
          {value}
        </div>
        <p className="mt-0.5 text-xs text-[#EDE9FE]/90">{subtitle}</p>
      </div>

      {/* Trend + Sparkline Row */}
      <div className="relative mt-4 flex items-end justify-between pt-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md ring-1 ring-white/30 shadow-2xs">
          <TrendingUp className="h-3 w-3 text-emerald-300" />
          <span>{trend}</span>
        </div>

        {/* Crisp White Sparkline */}
        <div className="w-28 shrink-0">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-10 overflow-visible"
          >
            <defs>
              <linearGradient id="heroSparklineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#heroSparklineGrad)" />
            <path
              d={pathD}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Last active point dot */}
            {points.length > 0 && (
              <circle
                cx={points[points.length - 1].split(',')[0]}
                cy={points[points.length - 1].split(',')[1]}
                r="3"
                fill="#ffffff"
                className="animate-pulse"
              />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
