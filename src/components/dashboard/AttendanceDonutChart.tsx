'use client';

import React from 'react';
import { Clock } from 'lucide-react';

interface AttendanceBreakdown {
  label: string;
  count: number;
  percentage: number;
  color: string;
  dotClass: string;
}

interface AttendanceDonutChartProps {
  presentRate?: number;
  totalOfficers?: number;
  breakdown?: AttendanceBreakdown[];
}

export function AttendanceDonutChart({
  presentRate = 94.6,
  totalOfficers = 38,
  breakdown = [
    { label: 'On Duty & Active', count: 29, percentage: 76, color: '#10B981', dotClass: 'bg-emerald-500' },
    { label: 'In Transit / En Route', count: 5, percentage: 14, color: '#6C5CE7', dotClass: 'bg-[#6C5CE7]' },
    { label: 'Approved Leave', count: 3, percentage: 7, color: '#F59E0B', dotClass: 'bg-amber-500' },
    { label: 'Unexcused / Absent', count: 1, percentage: 3, color: '#EF4444', dotClass: 'bg-rose-500' },
  ],
}: AttendanceDonutChartProps) {
  // SVG Donut calculation
  const size = 180;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Compute strokeDashoffset for each slice
  let accumulatedPercent = 0;

  return (
    <div className="relative rounded-2xl bg-white/80 p-6 shadow-[0_8px_30px_-4px_rgba(22,34,66,0.04)] backdrop-blur-xl border border-white/80 transition-all flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Attendance Today</h3>
          <p className="text-xs text-slate-500 mt-0.5">Real-time GPS clock-ins and post status</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#6C5CE7] border border-[#EDE9FE] shadow-2xs">
          <Clock className="h-4 w-4" />
        </div>
      </div>

      {/* Donut Graphic in Center */}
      <div className="relative my-4 flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Base track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {breakdown.map((item) => {
            const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
            accumulatedPercent += item.percentage;

            return (
              <circle
                key={item.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            );
          })}
        </svg>

        {/* Center Label */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black tracking-tight text-slate-900">
            {presentRate}%
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Present Today
          </span>
        </div>
      </div>

      {/* Breakdown Breakdown Rows */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        {breakdown.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${item.dotClass} shadow-2xs`} />
              <span className="font-medium text-slate-700">{item.label}</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="font-bold text-slate-900">{item.count}</span>
              <span className="text-slate-400 text-[11px]">({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
