'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMyShifts, acknowledgeMyShift } from '@/lib/api/me';
import {
  CalendarDays,
  Building2,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { Button, Badge, TableSkeleton, EmptyState } from '@/components/ui';
import { toast } from '@/lib/toastStore';

export default function EmployeeShiftsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: shiftsData, isLoading } = useQuery({
    queryKey: ['my-shifts', statusFilter],
    queryFn: () => fetchMyShifts({ status: statusFilter }),
  });

  const ackMutation = useMutation({
    mutationFn: (shiftId: string) => acknowledgeMyShift(shiftId),
    onSuccess: () => {
      toast.success('Shift confirmed. Thank you!');
      queryClient.invalidateQueries({ queryKey: ['my-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['my-overview'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to acknowledge shift.');
    },
  });

  const shifts = shiftsData?.items || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-purple-50 text-[#6C5CE7] border border-purple-100">
              <CalendarDays className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Scheduled Shifts</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Review your upcoming operational roster, duty times, and confirm scheduled assignments.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/60 self-start sm:self-auto">
          {['all', 'scheduled', 'confirmed', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Shifts List */}
      {isLoading ? (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <TableSkeleton rows={5} cols={4} />
        </div>
      ) : shifts.length === 0 ? (
        <div className="bg-white rounded-xl p-8 border border-slate-200">
          <EmptyState
            icon={<CalendarDays className="h-8 w-8 text-[#6C5CE7]" />}
            title="No scheduled shifts found"
            description="You currently have no shifts scheduled under this filter. Rota updates appear automatically once published by operations."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {shifts.map((shift: any) => {
            const shiftDate = new Date(shift.shiftDate);
            const isToday =
              new Date().toISOString().split('T')[0] === shift.shiftDate;

            return (
              <div
                key={shift.id}
                className={`bg-white rounded-xl p-4 sm:p-5 border transition-all ${
                  isToday
                    ? 'border-purple-300 ring-1 ring-purple-200/60 shadow-sm'
                    : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Left: Date and Times */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#6C5CE7] border border-purple-100 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] uppercase font-bold tracking-wider leading-none">
                        {shiftDate.toLocaleDateString('en-GB', { month: 'short' })}
                      </span>
                      <span className="text-lg font-bold leading-tight">
                        {shiftDate.getDate()}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {shiftDate.toLocaleDateString('en-GB', { weekday: 'long' })}
                        </span>
                        {isToday && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                            TODAY
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-semibold text-purple-700 mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-500" />
                        <span>
                          {shift.startTime} — {shift.endTime}
                        </span>
                        {shift.breakMinutes > 0 && (
                          <span className="text-slate-400 font-normal">
                            ({shift.breakMinutes}m unpaid break)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium text-slate-900">
                            {shift.site?.name || 'Assigned Site'}
                          </span>
                        </div>
                        {shift.role?.name && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-slate-500">{shift.role.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status and Confirmation Action */}
                  <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <Badge
                      variant={
                        shift.status === 'confirmed'
                          ? 'success'
                          : shift.status === 'scheduled'
                          ? 'warning'
                          : 'neutral'
                      }
                      className="capitalize text-xs font-medium"
                    >
                      {shift.status}
                    </Badge>

                    {shift.status === 'scheduled' && (
                      <Button
                        size="sm"
                        onClick={() => ackMutation.mutate(shift.id)}
                        disabled={ackMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 shadow-xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {ackMutation.isPending ? 'Confirming...' : 'Acknowledge Rota'}
                      </Button>
                    )}
                  </div>
                </div>

                {shift.notes && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500 flex items-start gap-1.5">
                    <span className="font-semibold text-slate-700 shrink-0">Duty Notes:</span>
                    <span>{shift.notes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
