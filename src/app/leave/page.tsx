'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Loader2,
  Filter,
  X,
  Check,
  Ban,
} from 'lucide-react';
import { Button } from '@/components/ui';
import {
  fetchLeaveRequestsApi,
  createLeaveRequestApi,
  reviewLeaveRequestApi,
  cancelLeaveRequestApi,
  LeaveRequest,
  LeaveType,
  LeaveStatus,
  CreateLeavePayload,
} from '@/lib/api/leave';
import { fetchEmployees } from '@/lib/api/employees';
import { Employee } from '@/types/employee';
import { useAuth } from '@/lib/auth/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: 'Annual', sick: 'Sick', emergency: 'Emergency', unpaid: 'Unpaid', other: 'Other',
};

const STATUS_CONFIG: Record<LeaveStatus, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
    icon: <Clock className="w-3 h-3" />,
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-50 text-green-700 border border-green-200',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-700 border border-red-200',
    icon: <XCircle className="w-3 h-3" />,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-[#F5F3FF] text-[#687086] border border-[#E5E3F2]',
    icon: <Ban className="w-3 h-3" />,
  },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: LeaveStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${cfg.className}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

// ─── Shared input class ───────────────────────────────────────────────────────
const inputCls =
  'w-full h-9 px-3 text-sm border border-[#E5E3F2] rounded-lg bg-white text-[#171A2B] ' +
  'focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/40 focus:border-[#6C5CE7] ' +
  'shadow-[inset_0_1px_3px_rgba(108,92,231,0.06)] transition-all';

// ─── New Leave Request Modal ──────────────────────────────────────────────────
function NewLeaveModal({
  employees,
  onClose,
  onSubmit,
}: {
  employees: Employee[];
  onClose: () => void;
  onSubmit: (payload: CreateLeavePayload) => Promise<void>;
}) {
  const [form, setForm] = useState<CreateLeavePayload>({
    employeeId: '', leaveType: 'annual', startDate: '', endDate: '', reason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.employeeId) return setError('Please select an employee');
    if (!form.startDate || !form.endDate) return setError('Please select dates');
    if (form.endDate < form.startDate) return setError('End date must be after start date');
    setSubmitting(true);
    try {
      await onSubmit({ ...form, reason: form.reason || undefined });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-[#E5E3F2]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E3F2]">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-[#6C5CE7] flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-white" />
            </div>
            <h2 className="text-sm font-semibold text-[#171A2B]">New Leave Request</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-[#F5F3FF] text-[#9096A9] hover:text-[#6C5CE7] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#FDF0F1] border border-[#FAC3C6] rounded-lg text-xs text-[#C93B43]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#687086] mb-1.5">Employee</label>
            <select
              required value={form.employeeId}
              onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
              className={inputCls}
            >
              <option value="">Select employee…</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#687086] mb-1.5">Leave Type</label>
            <select
              value={form.leaveType}
              onChange={(e) => setForm((f) => ({ ...f, leaveType: e.target.value as LeaveType }))}
              className={inputCls}
            >
              {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#687086] mb-1.5">Start Date</label>
              <input type="date" required value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#687086] mb-1.5">End Date</label>
              <input type="date" required value={form.endDate} min={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#687086] mb-1.5">
              Reason <span className="text-[#9096A9] font-normal">(optional)</span>
            </label>
            <textarea rows={3} value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="Brief reason for leave…"
              className="w-full px-3 py-2 text-sm border border-[#E5E3F2] rounded-lg bg-white text-[#171A2B] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/40 focus:border-[#6C5CE7] shadow-[inset_0_1px_3px_rgba(108,92,231,0.06)] resize-none transition-all" />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#F5F3FF]">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#687086] hover:text-[#171A2B] transition-colors">
              Cancel
            </button>
            <Button type="submit" size="sm" isLoading={submitting} variant="primary">
              Submit Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Review Modal ─────────────────────────────────────────────────────────────
function ReviewModal({
  leave, onClose, onReview,
}: {
  leave: LeaveRequest;
  onClose: () => void;
  onReview: (id: string, status: 'approved' | 'rejected', notes?: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReview = async (status: 'approved' | 'rejected') => {
    setError(null);
    setSubmitting(true);
    try {
      await onReview(leave.id, status, notes || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const employeeName = leave.employee
    ? `${leave.employee.firstName} ${leave.employee.lastName}`
    : leave.employeeId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-[#E5E3F2]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E3F2]">
          <h2 className="text-sm font-semibold text-[#171A2B]">Review Leave Request</h2>
          <button onClick={onClose}
            className="p-1 rounded-md hover:bg-[#F5F3FF] text-[#9096A9] hover:text-[#6C5CE7] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#FDF0F1] border border-[#FAC3C6] rounded-lg text-xs text-[#C93B43]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
            </div>
          )}

          <div className="bg-[#F5F3FF] rounded-lg p-4 space-y-2.5 text-xs border border-[#E5E3F2]">
            {[
              { label: 'Employee', value: employeeName },
              { label: 'Type', value: LEAVE_TYPE_LABELS[leave.leaveType] },
              { label: 'Dates', value: `${formatDate(leave.startDate)} – ${formatDate(leave.endDate)}` },
              { label: 'Working Days', value: String(leave.totalDays) },
              ...(leave.reason ? [{ label: 'Reason', value: leave.reason }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-[#687086]">{label}</span>
                <span className="font-medium text-[#171A2B] text-right max-w-[200px]">{value}</span>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#687086] mb-1.5">
              Notes <span className="text-[#9096A9] font-normal">(optional)</span>
            </label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note for the employee…"
              className="w-full px-3 py-2 text-sm border border-[#E5E3F2] rounded-lg bg-white text-[#171A2B] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/40 focus:border-[#6C5CE7] shadow-[inset_0_1px_3px_rgba(108,92,231,0.06)] resize-none transition-all" />
          </div>

          <div className="flex gap-2 pt-2 border-t border-[#F5F3FF]">
            <button onClick={() => handleReview('rejected')} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 border border-[#FAC3C6] text-[#C93B43] hover:bg-[#FDF0F1] active:shadow-[inset_0_2px_4px_rgba(201,59,67,0.12)] text-sm font-medium rounded-lg transition-all disabled:opacity-60">
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
            <button onClick={() => handleReview('approved')} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-[#6C5CE7] hover:bg-[#806FF0] active:bg-[#5A4ACD] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.18)] text-white text-sm font-medium rounded-lg transition-all disabled:opacity-60 shadow-sm">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LeavePage() {
  const { session, isLoading: authLoading } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [reviewingLeave, setReviewingLeave] = useState<LeaveRequest | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [leaveData, empData] = await Promise.allSettled([
        fetchLeaveRequestsApi(),
        fetchEmployees({ page: 1, limit: 200 }),
      ]);
      const leave = leaveData.status === 'fulfilled' ? leaveData.value : [];
      const empResponse = empData.status === 'fulfilled' ? empData.value : null;
      const emps: Employee[] = empResponse?.items ?? [];

      setRequests(Array.isArray(leave) ? leave : []);
      setEmployees(emps);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && session) {
      loadData();
    }
  }, [authLoading, session]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (typeFilter !== 'all' && r.leaveType !== typeFilter) return false;
      return true;
    });
  }, [requests, statusFilter, typeFilter]);

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  }), [requests]);

  const handleCreate = async (payload: CreateLeavePayload) => {
    const created = await createLeaveRequestApi(payload);
    setRequests((prev) => [created, ...prev]);
    showToast('Leave request submitted');
  };

  const handleReview = async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    const updated = await reviewLeaveRequestApi(id, { status, reviewNotes: notes });
    setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
    showToast(`Leave request ${status}`);
  };

  const handleCancel = async (id: string) => {
    try {
      const updated = await cancelLeaveRequestApi(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      showToast('Leave request cancelled');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const selectCls =
    'h-8 px-2.5 text-xs border border-[#E5E3F2] rounded-lg bg-white text-[#171A2B] ' +
    'focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/40 focus:border-[#6C5CE7] transition-all';

  return (
    <AppShell>
      <PageContainer
        title="Leave Management"
        subtitle={`${stats.total} total requests`}
        primaryAction={
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsNewModalOpen(true)}>
            New Request
          </Button>
        }
      >
        {/* Toast */}
        {toastMessage && (
          <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
            toastMessage.type === 'success' ? 'bg-[#171A2B] text-white' : 'bg-[#C93B43] text-white'
          }`}>
            {toastMessage.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 text-[#18B887]" />
              : <XCircle className="w-4 h-4" />}
            {toastMessage.text}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, bg: 'bg-[#F5F3FF] border-[#E5E3F2]', color: 'text-[#171A2B]' },
            { label: 'Pending', value: stats.pending, bg: 'bg-amber-50 border-amber-200', color: 'text-amber-700' },
            { label: 'Approved', value: stats.approved, bg: 'bg-green-50 border-green-200', color: 'text-green-700' },
            { label: 'Rejected', value: stats.rejected, bg: 'bg-red-50 border-red-200', color: 'text-red-700' },
          ].map(({ label, value, bg, color }) => (
            <div key={label} className={`rounded-xl border p-4 ${bg} shadow-[0_1px_3px_rgba(108,92,231,0.07)]`}>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-[#687086] mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[#687086]">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectCls}>
            <option value="all">All types</option>
            {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#E5E3F2] rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(108,92,231,0.07)]">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-[#6C5CE7]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar className="w-10 h-10 text-[#D5D0FA] mb-3" />
              <p className="text-sm font-medium text-[#171A2B]">No leave requests</p>
              <p className="text-xs text-[#687086] mt-1">
                {statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'No requests match the current filters'
                  : 'Submit the first leave request to get started'}
              </p>
              {statusFilter === 'all' && typeFilter === 'all' && (
                <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="mt-4" onClick={() => setIsNewModalOpen(true)}>
                  New Request
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E3F2] bg-[#FAFAFA]">
                  {['Employee', 'Type', 'Dates', 'Days', 'Status', 'Reason', ''].map((h) => (
                    <th key={h} className="text-left text-[10px] font-semibold text-[#9096A9] uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EEF8]">
                {filtered.map((req) => {
                  const name = req.employee
                    ? `${req.employee.firstName} ${req.employee.lastName}`
                    : req.employeeId;
                  return (
                    <tr key={req.id} className="hover:bg-[#F9F8FF] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#EDE9FE] flex items-center justify-center text-xs font-semibold text-[#6C5CE7] shrink-0">
                            {name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-[#171A2B]">{name}</div>
                            {req.employee?.employeeNumber && (
                              <div className="text-xs text-[#9096A9]">{req.employee.employeeNumber}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#171A2B]">{LEAVE_TYPE_LABELS[req.leaveType]}</td>
                      <td className="px-4 py-3 text-xs text-[#687086] whitespace-nowrap">
                        {formatDate(req.startDate)} → {formatDate(req.endDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-[#171A2B]">{req.totalDays}d</span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                      <td className="px-4 py-3 max-w-[180px]">
                        {req.reason
                          ? <span className="text-xs text-[#687086] truncate block" title={req.reason}>{req.reason}</span>
                          : <span className="text-xs text-[#D5D0FA]">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {req.status === 'pending' && (
                            <button onClick={() => setReviewingLeave(req)}
                              className="px-2.5 py-1 text-xs font-medium text-[#6C5CE7] hover:bg-[#EDE9FE] active:shadow-[inset_0_2px_4px_rgba(108,92,231,0.2)] rounded-md transition-all border border-[#D5D0FA]">
                              Review
                            </button>
                          )}
                          {(req.status === 'pending' || req.status === 'approved') && (
                            <button onClick={() => handleCancel(req.id)}
                              className="px-2.5 py-1 text-xs font-medium text-[#9096A9] hover:bg-[#F5F3FF] rounded-md transition-colors">
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modals */}
        {isNewModalOpen && (
          <NewLeaveModal employees={employees} onClose={() => setIsNewModalOpen(false)} onSubmit={handleCreate} />
        )}
        {reviewingLeave && (
          <ReviewModal leave={reviewingLeave} onClose={() => setReviewingLeave(null)} onReview={handleReview} />
        )}
      </PageContainer>
    </AppShell>
  );
}
