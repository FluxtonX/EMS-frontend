'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, X, CalendarOff, ArrowRight } from 'lucide-react';

interface LeaveRequestItem {
  id: string;
  name: string;
  initials: string;
  role: string;
  type: string;
  dates: string;
  days: number;
  avatarBg: string;
}

const initialRequests: LeaveRequestItem[] = [
  {
    id: '1',
    name: 'Marcus Owen',
    initials: 'MO',
    role: 'Senior Security Officer',
    type: 'Annual Leave',
    dates: '12 Oct – 15 Oct',
    days: 4,
    avatarBg: 'bg-gradient-to-tr from-[#6C5CE7] to-[#806FF0]',
  },
  {
    id: '2',
    name: 'Jessica Chen',
    initials: 'JC',
    role: 'CCTV Surveillance Specialist',
    type: 'Medical Leave',
    dates: '14 Oct (1 day)',
    days: 1,
    avatarBg: 'bg-gradient-to-tr from-purple-600 to-pink-600',
  },
  {
    id: '3',
    name: 'David Kim',
    initials: 'DK',
    role: 'Patrol Dispatch Lead',
    type: 'Personal Time Off',
    dates: '18 Oct – 20 Oct',
    days: 3,
    avatarBg: 'bg-gradient-to-tr from-amber-500 to-orange-600',
  },
];

export function LeaveRequestsQueue() {
  const [requests, setRequests] = useState<LeaveRequestItem[]>(initialRequests);
  const [handledId, setHandledId] = useState<string | null>(null);

  const handleDecision = (id: string, decision: 'approved' | 'rejected') => {
    setHandledId(id);
    setTimeout(() => {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setHandledId(null);
    }, 400);
  };

  return (
    <div className="relative rounded-2xl bg-white/80 p-6 shadow-[0_8px_30px_-4px_rgba(22,34,66,0.04)] backdrop-blur-xl border border-white/80 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base font-bold text-slate-900">Leave Requests</h3>
          <span className="rounded-full bg-[#EDE9FE] px-2.5 py-0.5 text-xs font-bold text-[#6C5CE7] border border-[#D5D0FA]">
            {requests.length} Pending
          </span>
        </div>
        <Link
          href="/leave"
          className="text-xs font-semibold text-[#6C5CE7] hover:text-[#5A4ACD] flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100 mt-2">
        {requests.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            All leave requests have been reviewed.
          </div>
        ) : (
          requests.map((item) => (
            <div
              key={item.id}
              className={`py-3.5 flex items-center justify-between gap-3 transition-all duration-300 ${
                handledId === item.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              }`}
            >
              {/* Employee info */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.avatarBg} text-xs font-bold text-white shadow-xs ring-2 ring-white`}
                >
                  {item.initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                    <span className="text-[10px] text-slate-400 hidden sm:inline-block">•</span>
                    <span className="text-[11px] text-slate-500 truncate hidden sm:inline-block">
                      {item.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <CalendarOff className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-700">{item.type}</span> · {item.dates}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleDecision(item.id, 'approved')}
                  className="flex h-7 items-center gap-1 rounded-lg bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 transition-colors shadow-2xs"
                  title="Approve leave request"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Approve</span>
                </button>
                <button
                  onClick={() => handleDecision(item.id, 'rejected')}
                  className="flex h-7 items-center gap-1 rounded-lg bg-slate-50 px-2 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 transition-colors"
                  title="Reject leave request"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Reject</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
