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
  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const { data: leaveData, isLoading } = useQuery({
    queryKey: ['my-leave'],
    queryFn: fetchMyLeave,
  });

  const requestMutation = useMutation({
    mutationFn: () =>
      createMyLeaveRequest({
        leaveType,
        startDate,
        endDate,
        reason: reason || undefined,
      }),
    onSuccess: () => {
      toast.success('Leave request submitted for managerial review.');
      setIsRequestModalOpen(false);
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
    if (!startDate || !endDate) {
      toast.error('Start and end dates are required.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Remaining Days
          </div>
          <div className="text-3xl font-extrabold text-[#6C5CE7]">
            {entitlement?.remainingDays ?? 28}
          </div>
          <div className="text-xs text-slate-400 mt-1">Available for booking</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Approved Taken
          </div>
          <div className="text-3xl font-extrabold text-slate-800">
            {entitlement?.approvedDays ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Days taken this year</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Awaiting Review
          </div>
          <div className="text-3xl font-extrabold text-amber-600">
            {entitlement?.pendingDays ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Pending approval</div>
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
                {requests.map((r: any) => (
                  <TableRow key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <TableCell className="font-semibold text-slate-900 text-xs capitalize">
                      {r.leaveType} Leave
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      {new Date(r.startDate).toLocaleDateString('en-GB')} →{' '}
                      {new Date(r.endDate).toLocaleDateString('en-GB')}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-800 font-mono">
                      {r.totalDays} days
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                      {r.reason || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === 'approved'
                            ? 'success'
                            : r.status === 'pending'
                            ? 'warning'
                            : 'danger'
                        }
                        className="capitalize text-xs font-medium"
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
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
        description="Submit a holiday or absence request for company management review."
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                From Date <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason / Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Annual family vacation, personal appointment"
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
