'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { useWorkforceStore } from '@/lib/stores/workforceStore';

export function OperationsPipeline() {
  const { sites } = useWorkforceStore();
  const displaySites = sites.slice(0, 3);

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
          className="text-xs font-semibold text-[#6C5CE7] hover:text-[#5A4ACD] flex items-center gap-1 transition-colors"
        >
          Rota <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Roster Pipeline Bars */}
      <div className="mt-4 space-y-2.5">
        {/* Stage 1: Morning Rota */}
        <div className="flex items-center justify-between rounded-xl bg-[#6C5CE7] text-white px-4 py-2.5 shadow-xs transition-all hover:translate-x-0.5">
          <span className="text-xs font-bold tracking-tight">Morning Shift (06:00 – 14:00)</span>
          <span className="text-xs font-extrabold font-mono">{sites.length > 0 ? sites.length * 2 : 0}</span>
        </div>

        {/* Stage 2: Afternoon Rota */}
        <div className="flex items-center justify-between rounded-xl bg-[#806FF0] text-white px-4 py-2.5 shadow-xs transition-all hover:translate-x-0.5">
          <span className="text-xs font-bold tracking-tight">Afternoon Shift (14:00 – 22:00)</span>
          <span className="text-xs font-extrabold font-mono">{sites.length > 0 ? Math.ceil(sites.length * 1.5) : 0}</span>
        </div>

        {/* Stage 3: Night Patrol */}
        <div className="flex items-center justify-between rounded-xl bg-[#A78BFA] text-white px-4 py-2.5 shadow-xs transition-all hover:translate-x-0.5">
          <span className="text-xs font-bold tracking-tight">Night Patrol &amp; Static (22:00 – 06:00)</span>
          <span className="text-xs font-extrabold font-mono">{sites.length}</span>
        </div>
      </div>

      {/* Protected Key Sites List */}
      <div className="mt-5 pt-3.5 border-t border-slate-100">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Key Managed Deployments ({sites.length})
        </h4>
        <div className="space-y-2">
          {displaySites.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">
              No active site deployments registered.
            </div>
          ) : (
            displaySites.map((site) => (
              <div
                key={site.id}
                className="flex items-center justify-between rounded-xl bg-slate-50/70 px-3 py-2 border border-slate-100/80"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#6C5CE7] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{site.name}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                      <MapPin className="h-2.5 w-2.5" /> {typeof site.address === 'string' ? site.address : (site.address as any)?.city || (site.address as any)?.street || site.code || 'Registered Post'}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {site.configuredJobsCount || 1} Active Roles
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
