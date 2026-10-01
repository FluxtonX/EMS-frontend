'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, MapPin } from 'lucide-react';

interface DeploymentSite {
  name: string;
  location: string;
  officersOnDuty: number;
  status: 'optimal' | 'warning';
}

const sitesSummary: DeploymentSite[] = [
  { name: 'Canary Wharf Financial Tower', location: 'London E14', officersOnDuty: 8, status: 'optimal' },
  { name: 'Heathrow Logistics Cargo Hub', location: 'Hounslow TW6', officersOnDuty: 12, status: 'optimal' },
  { name: 'Mayfair Luxury Retail Plaza', location: 'London W1K', officersOnDuty: 9, status: 'optimal' },
];

export function OperationsPipeline() {
  return (
    <div className="relative rounded-2xl bg-white/80 p-6 shadow-[0_8px_30px_-4px_rgba(22,34,66,0.04)] backdrop-blur-xl border border-white/80 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Operations &amp; Shifts</h3>
          <p className="text-xs text-slate-500 mt-0.5">Live roster pipeline across operational posts</p>
        </div>
        <Link
          href="/shifts"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          Rota <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Roster Progress Bars */}
      <div className="mt-4 space-y-3.5">
        {/* Morning Shift */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700">Morning Shift (06:00 – 14:00)</span>
            <span className="font-bold text-emerald-600">100% Handed Over</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 w-full transition-all duration-500" />
          </div>
        </div>

        {/* Afternoon Shift */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700">Afternoon Shift (14:00 – 22:00)</span>
            <span className="font-bold text-blue-600">85% Active Deployment</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-blue-600 w-[85%] transition-all duration-500" />
          </div>
        </div>

        {/* Night Guard */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700">Night Patrol &amp; Static (22:00 – 06:00)</span>
            <span className="font-bold text-indigo-600">Roster Locked · 100% Ready</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-indigo-500 w-[45%] transition-all duration-500" />
          </div>
        </div>
      </div>

      {/* Protected Key Sites List */}
      <div className="mt-5 pt-3.5 border-t border-slate-100">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Key Managed Deployments
        </h4>
        <div className="space-y-2">
          {sitesSummary.map((site) => (
            <div
              key={site.name}
              className="flex items-center justify-between rounded-xl bg-slate-50/70 px-3 py-2 border border-slate-100/80"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{site.name}</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5" /> {site.location}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {site.officersOnDuty} On Duty
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
