'use client';

import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

interface MonthlyDataPoint {
  month: string;
  onSite: number;
  standby: number;
  efficiency: number;
}

const defaultData: MonthlyDataPoint[] = [
  { month: 'Jan', onSite: 28, standby: 8, efficiency: 89 },
  { month: 'Feb', onSite: 31, standby: 9, efficiency: 91 },
  { month: 'Mar', onSite: 30, standby: 10, efficiency: 90 },
  { month: 'Apr', onSite: 35, standby: 12, efficiency: 93 },
  { month: 'May', onSite: 34, standby: 11, efficiency: 92 },
  { month: 'Jun', onSite: 39, standby: 13, efficiency: 95 },
  { month: 'Jul', onSite: 42, standby: 15, efficiency: 96 },
  { month: 'Aug', onSite: 40, standby: 14, efficiency: 94 },
  { month: 'Sep', onSite: 44, standby: 16, efficiency: 97 },
  { month: 'Oct', onSite: 48, standby: 17, efficiency: 98 },
  { month: 'Nov', onSite: 46, standby: 15, efficiency: 95 },
  { month: 'Dec', onSite: 50, standby: 18, efficiency: 99 },
];

export function WorkforceOverviewChart() {
  const [activeRange, setActiveRange] = useState<'12M' | '6M' | '30D'>('12M');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const displayData =
    activeRange === '6M'
      ? defaultData.slice(6)
      : activeRange === '30D'
      ? defaultData.slice(8)
      : defaultData;

  const svgWidth = 640;
  const svgHeight = 220;
  const paddingX = 35;
  const paddingY = 25;
  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingY * 2;

  // Max value calculation
  const maxVal = 55;
  const minVal = 0;

  // Generate smooth spline SVG path
  const getCoordinates = (val: number, index: number) => {
    const x = paddingX + (index / (displayData.length - 1)) * graphWidth;
    const y = svgHeight - paddingY - (val / maxVal) * graphHeight;
    return { x, y };
  };

  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  };

  const onSitePoints = displayData.map((d, i) => getCoordinates(d.onSite, i));
  const standbyPoints = displayData.map((d, i) => getCoordinates(d.standby, i));

  const onSiteLinePath = createSmoothPath(onSitePoints);
  const onSiteAreaPath = `${onSiteLinePath} L ${onSitePoints[onSitePoints.length - 1].x},${svgHeight - paddingY} L ${onSitePoints[0].x},${svgHeight - paddingY} Z`;

  const standbyLinePath = createSmoothPath(standbyPoints);
  const standbyAreaPath = `${standbyLinePath} L ${standbyPoints[standbyPoints.length - 1].x},${svgHeight - paddingY} L ${standbyPoints[0].x},${svgHeight - paddingY} Z`;

  // Target benchmark line at 92% (~ 46 officers)
  const targetY = svgHeight - paddingY - (46 / maxVal) * graphHeight;

  const activePoint = hoverIndex !== null ? displayData[hoverIndex] : null;
  const activeCoord = hoverIndex !== null ? onSitePoints[hoverIndex] : null;

  return (
    <div className="relative rounded-2xl bg-white/80 p-6 shadow-[0_8px_30px_-4px_rgba(22,34,66,0.04)] backdrop-blur-xl border border-white/80 transition-all">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Workforce Overview</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-100">
              <ArrowUpRight className="h-3 w-3" /> +14.2% Growth
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Deployment and attendance trajectory across all licensed client posts
          </p>
        </div>

        {/* Filters and Legend */}
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600 shadow-xs" />
              On-Site Security
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500 shadow-xs" />
              Standby / Patrol
            </span>
          </div>

          {/* Time range pills */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
            {(['12M', '6M', '30D'] as const).map((range) => (
              <button
                key={range}
                onClick={() => {
                  setActiveRange(range);
                  setHoverIndex(null);
                }}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  activeRange === range
                    ? 'bg-white text-blue-600 shadow-2xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Interactive Area Chart */}
      <div className="relative mt-4 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-56 select-none overflow-visible"
        >
          <defs>
            {/* Primary blue gradient */}
            <linearGradient id="onSiteAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </linearGradient>

            {/* Standby purple gradient */}
            <linearGradient id="standbyAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0, 15, 30, 45].map((gridVal) => {
            const y = svgHeight - paddingY - (gridVal / maxVal) * graphHeight;
            return (
              <g key={gridVal}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-slate-400 font-medium"
                >
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* Target Benchmark Dotted Line */}
          <line
            x1={paddingX}
            y1={targetY}
            x2={svgWidth - paddingX}
            y2={targetY}
            stroke="#94A3B8"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
          <text
            x={svgWidth - paddingX}
            y={targetY - 5}
            textAnchor="end"
            className="text-[9px] font-semibold fill-slate-500"
          >
            Target 92%
          </text>

          {/* Area Fills */}
          <path d={standbyAreaPath} fill="url(#standbyAreaGrad)" />
          <path d={onSiteAreaPath} fill="url(#onSiteAreaGrad)" />

          {/* Lines */}
          <path
            d={standbyLinePath}
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d={onSiteLinePath}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Hover Crosshair & Data Dots */}
          {hoverIndex !== null && activeCoord && (
            <g>
              <line
                x1={activeCoord.x}
                y1={paddingY}
                x2={activeCoord.x}
                y2={svgHeight - paddingY}
                stroke="#3B82F6"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={activeCoord.x}
                cy={activeCoord.y}
                r="5"
                fill="#3B82F6"
                stroke="#ffffff"
                strokeWidth="2"
                className="shadow-sm"
              />
              <circle
                cx={standbyPoints[hoverIndex].x}
                cy={standbyPoints[hoverIndex].y}
                r="4.5"
                fill="#8B5CF6"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}

          {/* X Axis Months & Hover Transparent Interaction Bars */}
          {displayData.map((d, i) => {
            const x = paddingX + (i / (displayData.length - 1)) * graphWidth;
            return (
              <g key={d.month}>
                <text
                  x={x}
                  y={svgHeight - 6}
                  textAnchor="middle"
                  className={`text-[10px] font-medium transition-colors ${
                    hoverIndex === i ? 'fill-blue-600 font-bold' : 'fill-slate-400'
                  }`}
                >
                  {d.month}
                </text>
                {/* Invisible hover trigger column */}
                <rect
                  x={x - (graphWidth / displayData.length) / 2}
                  y={0}
                  width={graphWidth / displayData.length}
                  height={svgHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoverIndex !== null && activePoint && activeCoord && (
          <div
            className="pointer-events-none absolute z-20 rounded-xl bg-slate-900/90 px-3 py-2 text-white shadow-xl backdrop-blur-md transition-all -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(activeCoord.x / svgWidth) * 100}%`,
              top: `${(activeCoord.y / svgHeight) * 100 - 10}%`,
            }}
          >
            <p className="text-[11px] font-bold text-slate-200">{activePoint.month} Snapshot</p>
            <div className="mt-1 space-y-0.5 text-[10px]">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1 text-blue-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> On-Site:
                </span>
                <span className="font-bold">{activePoint.onSite} officers</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1 text-purple-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400" /> Standby:
                </span>
                <span className="font-bold">{activePoint.standby} officers</span>
              </div>
              <div className="pt-1 mt-1 border-t border-slate-700 flex items-center justify-between gap-3 text-emerald-300 font-semibold">
                <span>Efficiency:</span>
                <span>{activePoint.efficiency}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
