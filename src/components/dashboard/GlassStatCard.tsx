'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface GlassStatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  trend: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  accentColor?: 'emerald' | 'blue' | 'indigo' | 'amber';
  sparklineData?: number[];
}

export function GlassStatCard({
  title,
  value,
  subtitle,
  trend,
  trendDirection = 'up',
  icon: Icon,
  accentColor = 'blue',
  sparklineData = [12, 14, 15, 13, 16, 17, 18],
}: GlassStatCardProps) {
  const colorMap = {
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      trendBg: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      stroke: '#10B981',
      gradId: 'emeraldSparkGrad',
    },
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
      trendBg: 'bg-blue-50 text-blue-700 border border-blue-100',
      stroke: '#3B82F6',
      gradId: 'blueSparkGrad',
    },
    indigo: {
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      trendBg: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
      stroke: '#6366F1',
      gradId: 'indigoSparkGrad',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      trendBg: 'bg-amber-50 text-amber-700 border border-amber-100',
      stroke: '#F59E0B',
      gradId: 'amberSparkGrad',
    },
  }[accentColor];

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
    <div className="relative overflow-hidden rounded-2xl bg-white/80 p-5 shadow-[0_8px_24px_-4px_rgba(22,34,66,0.04)] backdrop-blur-xl border border-white/80 transition-all duration-300 hover:shadow-[0_12px_32px_-4px_rgba(22,34,66,0.08)] hover:-translate-y-0.5">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${colorMap.iconBg} shadow-2xs`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {/* Main Metric */}
      <div className="mt-2">
        <div className="text-3xl font-extrabold tracking-tight text-slate-900">
          {value}
        </div>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </div>

      {/* Trend + Sparkline */}
      <div className="mt-4 flex items-end justify-between pt-2">
        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${colorMap.trendBg} shadow-2xs`}>
          {trendDirection === 'down' ? (
            <TrendingDown className="h-3 w-3" />
          ) : (
            <TrendingUp className="h-3 w-3" />
          )}
          <span>{trend}</span>
        </div>

        {/* Tailored Colored Sparkline */}
        <div className="w-28 shrink-0">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10 overflow-visible">
            <defs>
              <linearGradient id={colorMap.gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colorMap.stroke} stopOpacity="0.25" />
                <stop offset="100%" stopColor={colorMap.stroke} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill={`url(#${colorMap.gradId})`} />
            <path
              d={pathD}
              fill="none"
              stroke={colorMap.stroke}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.length > 0 && (
              <circle
                cx={points[points.length - 1].split(',')[0]}
                cy={points[points.length - 1].split(',')[1]}
                r="3"
                fill={colorMap.stroke}
              />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
