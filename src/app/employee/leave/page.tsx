'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMyLeave, createMyLeaveRequest } from '@/lib/api/me';
import {
  CalendarCheck,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import {
  Button,
  Input,
  Badge,
  Modal,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableSkeleton,
  EmptyState,
} from '@/components/ui';
import { toast } from '@/lib/toastStore';

export default function EmployeeLeavePage() {
  const queryClient = useQueryClient();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Form State
  const [durationMode, setDurationMode] = useState<'single' | 'range'>('single');
  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const { data: leaveData, isLoading } = useQuery({
    queryKey: ['my-leave'],
    queryFn: fetchMyLeave,
  });

  const requestMutation = useMutation({
    mutationFn: () => {
      const finalEndDate = durationMode === 'single' ? startDate : endDate;
      return createMyLeaveRequest({
        leaveType,
        startDate,
        endDate: finalEndDate,
        reason: reason || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Leave request submitted for managerial review.');
      setIsRequestModalOpen(false);
      setDurationMode('single');
      setLeaveType('annual');
      setStartDate('');
      setEndDate('');
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['my-leave'] });
      queryClient.invalidateQueries({ queryKey: ['my-overview'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to submit leave request.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) {
      toast.error('Please select the leave date.');
      return;
    }
    const finalEndDate = durationMode === 'single' ? startDate : endDate;
    if (!finalEndDate) {
      toast.error('End date is required.');
      return;
    }
    if (new Date(finalEndDate) < new Date(startDate)) {
      toast.error('End date cannot be earlier than start date.');
      return;
    }
    requestMutation.mutate();
  };

  const entitlement = leaveData?.entitlement;
  const requests = leaveData?.requests || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-purple-50 text-[#6C5CE7] border border-purple-100">
            <CalendarCheck className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave & Time Off</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Review your annual leave allowance and submit absence or holiday requests.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsRequestModalOpen(true)}
          className="bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Request Time Off
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Holiday Allowance
          </div>
          <div className="text-3xl font-extrabold text-[#6C5CE7]">
            {entitlement?.remainingDays ?? 28} <span className="text-sm font-normal text-slate-400">/ 28d</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Remaining annual leave</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Holidays Taken
          </div>
          <div className="text-3xl font-extrabold text-slate-800">
            {entitlement?.approvedDays ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Annual days taken this year</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Sickness & Absence
          </div>
          <div className="text-3xl font-extrabold text-amber-600">
            {(entitlement as any)?.absenceDaysThisYear ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Sick / unpaid (separate from allowance)</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Awaiting Review
          </div>
          <div className="text-3xl font-extrabold text-blue-600">
            {entitlement?.pendingDays ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Pending manager approval</div>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-bold text-slate-900 text-sm">
          My Absence & Holiday Requests
        </div>

        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={4} cols={4} />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<CalendarCheck className="h-8 w-8 text-[#6C5CE7]" />}
              title="No leave requests submitted"
              description="You have not submitted any leave requests yet. Click the button above to request time off."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Working Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r: any) => {
                  const isSingleDay = r.startDate === r.endDate;
                  const isWorkedAttendance =
                    r.reviewNotes &&
                    (r.reviewNotes.includes('check-in') ||
                      r.reviewNotes.includes('worked') ||
                      r.reviewNotes.includes('attendance'));

                  return (
                    <TableRow key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <TableCell className="font-semibold text-slate-900 text-xs capitalize">
                        {r.leaveType} Leave
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {isSingleDay ? (
                          <span className="inline-flex items-center gap-1.5 font-medium">
                            {new Date(r.startDate).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                            <span className="text-[10px] text-[#6C5CE7] font-semibold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                              Single Day
                            </span>
                          </span>
                        ) : (
                          <span>
                            {new Date(r.startDate).toLocaleDateString('en-GB')} →{' '}
                            {new Date(r.endDate).toLocaleDateString('en-GB')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-800 font-mono">
                        {r.totalDays} day{r.totalDays === 1 ? '' : 's'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 max-w-xs">
                        <div className="truncate">{r.reason || '—'}</div>
                        {r.reviewNotes && (
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate" title={r.reviewNotes}>
                            Note: {r.reviewNotes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          {r.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
                              <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Pending Approval
                            </span>
                          ) : r.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved (Confirmed)
                            </span>
                          ) : r.status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              Cancelled
                            </span>
                          )}

                          {isWorkedAttendance && (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Shift In Attendance
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Request Leave Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Request Time Off"
        description="Submit a single-day absence or multiple-day holiday request for managerial review."
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Leave Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7]"
            >
              <option value="annual">Annual Holiday (Statutory)</option>
              <option value="sick">Sick Leave</option>
              <option value="emergency">Emergency / Compassionate</option>
              <option value="unpaid">Unpaid Leave</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Duration Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Duration Selection <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setDurationMode('single');
                  if (startDate) setEndDate(startDate);
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  durationMode === 'single'
                    ? 'bg-white text-[#6C5CE7] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Single Day (1 Day)
              </button>
              <button
                type="button"
                onClick={() => setDurationMode('range')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  durationMode === 'range'
                    ? 'bg-white text-[#6C5CE7] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Multiple Days (Range)
              </button>
            </div>
          </div>

          {durationMode === 'single' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Leave Date <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setEndDate(e.target.value);
                }}
                required
                className="text-sm"
              />
              {startDate && (
                <p className="text-[11px] text-[#6C5CE7] font-medium mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Requesting 1 day leave on {new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  From Date <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (!endDate || endDate < e.target.value) setEndDate(e.target.value);
                  }}
                  required
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  To Date <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  required
                  className="text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason / Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Personal appointment, doctor visit, holiday"
              className="text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsRequestModalOpen(false)}
              disabled={requestMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={requestMutation.isPending}
              className="bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white shadow-sm"
            >
              {requestMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
