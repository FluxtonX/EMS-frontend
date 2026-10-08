'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, X, CalendarOff, ArrowRight, Loader2 } from 'lucide-react';
import { fetchLeaveRequestsApi, reviewLeaveRequestApi, LeaveRequest } from '@/lib/api/leave';

export function LeaveRequestsQueue() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [handledId, setHandledId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadLeaveRequests() {
      try {
        const data = await fetchLeaveRequestsApi({ status: 'pending' });
        if (isMounted && Array.isArray(data)) {
          setRequests(data);
        }
      } catch {
        if (isMounted) setRequests([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadLeaveRequests();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDecision = async (id: string, decision: 'approved' | 'rejected') => {
    setHandledId(id);
    try {
      await reviewLeaveRequestApi(id, { status: decision });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // Ignore mutation error gracefully
    } finally {
      setHandledId(null);
    }
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
        {loading ? (
          <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-[#6C5CE7]" />
            <span>Loading pending requests...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No pending leave requests in the queue.
          </div>
        ) : (
          requests.map((item) => {
            const empName = item.employee
              ? `${item.employee.firstName} ${item.employee.lastName}`
              : 'Employee';
            const initials = item.employee
              ? `${item.employee.firstName[0] || ''}${item.employee.lastName[0] || ''}`.toUpperCase()
              : 'OP';

            return (
              <div
                key={item.id}
                className={`py-3.5 flex items-center justify-between gap-3 transition-all duration-300 ${
                  handledId === item.id ? 'opacity-50 pointer-events-none' : 'opacity-100'
                }`}
              >
                {/* Employee info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6C5CE7] to-[#806FF0] text-xs font-bold text-white shadow-xs ring-2 ring-white">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 truncate">{empName}</p>
                      <span className="text-[10px] text-slate-400 hidden sm:inline-block">•</span>
                      <span className="text-[11px] text-slate-500 capitalize truncate hidden sm:inline-block">
                        {item.leaveType} leave
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <CalendarOff className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-700 capitalize">{item.leaveType}</span> · {item.startDate} – {item.endDate} ({item.totalDays} day{item.totalDays > 1 ? 's' : ''})
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDecision(item.id, 'rejected')}
                    disabled={handledId === item.id}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors shadow-2xs"
                    title="Reject leave request"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDecision(item.id, 'approved')}
                    disabled={handledId === item.id}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6C5CE7] hover:bg-[#5A4ACD] text-white shadow-xs transition-transform hover:scale-105"
                    title="Approve leave request"
                  >
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
