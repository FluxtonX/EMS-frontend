'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Banknote,
  Calendar,
  Clock,
  CheckCircle2,
  Lock,
  Plus,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  ChevronRight,
  X,
  Printer,
  Building2,
  Info,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import {
  fetchPayRunsApi,
  fetchPayRunByIdApi,
  createPayRunApi,
  reviewPayRunApi,
  getPayRunExportUrl,
  PayRun,
  Payslip,
  PayRunStatus,
} from '@/lib/api/payroll';

export default function PayrollPage() {
  const [payRuns, setPayRuns] = useState<PayRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('2026-09-01');
  const [endDate, setEndDate] = useState<string>('2026-09-30');

  // Create Pay Run Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: 'September 2026 Monthly Workforce Payroll',
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    paymentDate: '2026-09-30',
    frequency: 'monthly',
    notes: 'Standard monthly scheduled security guard payroll',
  });
  const [creating, setCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Pay Run Detail Drawer State
  const [selectedPayRun, setSelectedPayRun] = useState<PayRun | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Single Payslip Modal State (Printable view)
  const [viewingPayslip, setViewingPayslip] = useState<Payslip | null>(null);

  // Status Action Loading
  const [reviewLoading, setReviewLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPayRunsApi({
        status: statusFilter,
        startDate,
        endDate,
      });
      setPayRuns(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load pay runs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, startDate, endDate]);

  // Aggregate KPI Metrics across Pay Runs
  const stats = payRuns.reduce(
    (acc, pr) => {
      acc.totalGross += pr.totalGross;
      acc.totalTax += pr.totalTax;
      acc.totalNi += pr.totalNi;
      acc.totalNet += pr.totalNet;
      acc.totalEmployees += pr.totalEmployees;
      if (pr.status === 'paid') acc.paidCount++;
      if (pr.status === 'pending_approval') acc.pendingCount++;
      return acc;
    },
    {
      totalGross: 0,
      totalTax: 0,
      totalNi: 0,
      totalNet: 0,
      totalEmployees: 0,
      paidCount: 0,
      pendingCount: 0,
    }
  );

  const handleOpenDetail = async (pr: PayRun) => {
    setDetailLoading(true);
    setSelectedPayRun(pr);
    try {
      const detailed = await fetchPayRunByIdApi(pr.id);
      setSelectedPayRun(detailed);
    } catch {
      // Keep existing
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const created = await createPayRunApi(createForm);
      setSuccessMsg(`Pay run "${created.name}" created with ${created.totalEmployees} employee payslips.`);
      setIsCreateOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to create pay run.');
    } finally {
      setCreating(false);
    }
  };

  const handleReview = async (id: string, newStatus: PayRunStatus) => {
    setReviewLoading(true);
    try {
      const updated = await reviewPayRunApi(id, { status: newStatus });
      if (selectedPayRun && selectedPayRun.id === id) {
        setSelectedPayRun({ ...selectedPayRun, status: updated.status });
      }
      setSuccessMsg(`Pay run transitioned to ${newStatus}.`);
      await loadData();
    } catch (err: any) {
      alert(err?.message || `Failed to update pay run status to ${newStatus}.`);
    } finally {
      setReviewLoading(false);
    }
  };

  const getStatusBadge = (status: PayRunStatus) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
      case 'pending_approval':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" />
            Pending Approval
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EDE9FE] text-[#6C5CE7] border border-[#D5D0FA]">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            Paid & Finalized
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Cancelled
          </span>
        );
    }
  };

  return (
    <AppShell>
      <PageContainer
        title="Payroll & Payslips Engine"
        subtitle={
          <div className="flex items-center gap-2">
            <span>UK HMRC compliant PAYE Income Tax, Class 1 National Insurance, BACS batch exports, and employee payslips.</span>
            
          </div>
        }
        breadcrumbs={[
          { label: 'Workforce Platform', href: '/dashboard' },
          { label: 'Payroll' },
        ]}
        primaryAction={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#6C5CE7] hover:bg-[#5846DB] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.05)] text-xs h-[38px] px-4 font-semibold"
          >
            Create Pay Run
          </Button>
        }
        secondaryActions={
          <Badge variant="info" size="sm" className="gap-1.5 bg-[#F5F3FF] text-[#6C5CE7] border-[#D5D0FA]">
            <Building2 className="h-3.5 w-3.5 text-[#6C5CE7]" />
            UK HMRC PAYE Ready
          </Badge>
        }
      >
        {successMsg && (
          <div className="my-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Live Operational Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-6 my-6">
          <div className="bg-white p-5 rounded-2xl border border-[#E5E3F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-[#687086] text-xs">
              <span className="font-semibold">Gross Wages</span>
              <Banknote className="h-4 w-4 text-[#6C5CE7]" />
            </div>
            <p className="text-2xl font-bold text-[#171A2B] mt-2.5">
              £{stats.totalGross.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-[#9096A9] mt-1">Total earned wages</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E3F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-[#687086] text-xs">
              <span className="font-semibold">PAYE Income Tax</span>
              <ShieldCheck className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-2.5">
              £{stats.totalTax.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-[#9096A9] mt-1">Withheld for HMRC</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E3F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-[#687086] text-xs">
              <span className="font-semibold">National Insurance</span>
              <CreditCard className="h-4 w-4 text-[#6C5CE7]" />
            </div>
            <p className="text-2xl font-bold text-[#6C5CE7] mt-2.5">
              £{stats.totalNi.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-[#9096A9] mt-1">Class 1 Employee NI</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E3F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-[#687086] text-xs">
              <span className="font-semibold">Total Net Pay</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 mt-2.5">
              £{stats.totalNet.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-[#9096A9] mt-1">Net bank disbursements</p>
          </div>
        </div>

        {/* Filters & Period Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E3F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)] my-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[#687086]">
              <Calendar className="h-3.5 w-3.5 text-[#6C5CE7]" />
              <span className="font-medium">Date Range:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs border border-[#E5E3F2] rounded-lg px-2.5 py-1.5 outline-none focus:border-[#6C5CE7] bg-[#FDFCFE] text-[#171A2B]"
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs border border-[#E5E3F2] rounded-lg px-2.5 py-1.5 outline-none focus:border-[#6C5CE7] bg-[#FDFCFE] text-[#171A2B]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'draft', 'pending_approval', 'approved', 'paid'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={[
                  'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-150',
                  statusFilter === st
                    ? 'bg-[#6C5CE7] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.05)]'
                    : 'bg-[#F9F8FF] text-[#687086] hover:bg-[#F0EEF8] hover:text-[#171A2B] border border-[#E5E3F2]',
                ].join(' ')}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-[#E5E3F2] my-6">
            <Loader2 className="h-6 w-6 text-[#6C5CE7] animate-spin mb-2" />
            <p className="text-xs text-[#687086]">Loading payroll runs and HMRC tax snapshots...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs my-6">
            {error}
          </div>
        ) : payRuns.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-[#E5E3F2] text-center my-6">
            <Banknote className="h-10 w-10 text-[#9096A9] mb-3" />
            <h3 className="text-sm font-semibold text-[#171A2B]">No payroll runs initiated yet</h3>
            <p className="text-xs text-[#687086] mt-1 max-w-sm">
              Create a pay run to calculate gross wages, PAYE taxes, NI deductions, and generate payslips.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#6C5CE7] hover:bg-[#5846DB] text-white rounded-xl text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
            >
              <Plus className="h-3.5 w-3.5" />
              Create First Pay Run
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E5E3F2] shadow-sm overflow-hidden my-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F3FF] border-b border-[#E5E3F2] text-[#687086] font-semibold">
                  <tr>
                    <th className="px-4 py-3.5">Payroll Run</th>
                    <th className="px-4 py-3.5">Pay Period & Pay Date</th>
                    <th className="px-4 py-3.5">Guards Paid</th>
                    <th className="px-4 py-3.5">Gross Wages</th>
                    <th className="px-4 py-3.5">Tax & NI Withheld</th>
                    <th className="px-4 py-3.5">Net Disbursement</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EEF8]">
                  {payRuns.map((pr) => (
                    <tr key={pr.id} className="hover:bg-[#F9F8FF] transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-[#171A2B]">{pr.name}</div>
                        <div className="text-[11px] text-[#9096A9] font-medium capitalize">
                          {pr.frequency} pay cycle
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-xs text-[#171A2B] font-medium">
                          {pr.periodStart} → {pr.periodEnd}
                        </div>
                        <div className="text-[11px] text-[#6C5CE7] font-semibold">
                          Pay Date: {pr.paymentDate}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-semibold text-[#171A2B]">{pr.totalEmployees} officers</span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-bold text-[#171A2B]">
                          £{pr.totalGross.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-amber-700 font-medium">
                          Tax: £{pr.totalTax.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] text-[#687086]">
                          NI: £{pr.totalNi.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-bold text-emerald-600 text-sm">
                          £{pr.totalNet.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">{getStatusBadge(pr.status)}</td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDetail(pr)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D5D0FA] bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#6C5CE7] text-xs font-semibold transition-colors shadow-xs"
                          >
                            Payslips <ChevronRight className="h-3 w-3" />
                          </button>
                          <a
                            href={getPayRunExportUrl(pr.id)}
                            download
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E3F2] bg-white hover:bg-[#F9F8FF] text-[#687086] text-xs font-medium transition-colors"
                            title="Export BACS CSV"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                          {pr.status === 'draft' && (
                            <button
                              onClick={() => handleReview(pr.id, 'pending_approval')}
                              disabled={reviewLoading}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-colors"
                            >
                              Submit
                            </button>
                          )}
                          {pr.status === 'pending_approval' && (
                            <button
                              onClick={() => handleReview(pr.id, 'approved')}
                              disabled={reviewLoading}
                              className="px-2.5 py-1.5 rounded-lg bg-[#6C5CE7] hover:bg-[#5846DB] text-white text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          {pr.status === 'approved' && (
                            <button
                              onClick={() => handleReview(pr.id, 'paid')}
                              disabled={reviewLoading}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Finalize (Paid)
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Pay Run Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E3F2] space-y-5">
              <div className="flex items-center justify-between border-b border-[#E5E3F2] pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#EDE9FE] flex items-center justify-center text-[#6C5CE7]">
                    <Banknote className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold text-[#171A2B]">Initiate New Payroll Run</h3>
                </div>
                <button onClick={() => setIsCreateOpen(false)} className="text-[#9096A9] hover:text-[#171A2B]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#687086] mb-1">Pay Run Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full text-xs border border-[#E5E3F2] rounded-xl px-3 py-2 outline-none focus:border-[#6C5CE7] bg-[#FDFCFE] text-[#171A2B]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#687086] mb-1">Period Start</label>
                    <input
                      type="date"
                      required
                      value={createForm.periodStart}
                      onChange={(e) => setCreateForm({ ...createForm, periodStart: e.target.value })}
                      className="w-full text-xs border border-[#E5E3F2] rounded-xl px-3 py-2 outline-none focus:border-[#6C5CE7] bg-[#FDFCFE] text-[#171A2B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#687086] mb-1">Period End</label>
                    <input
                      type="date"
                      required
                      value={createForm.periodEnd}
                      onChange={(e) => setCreateForm({ ...createForm, periodEnd: e.target.value })}
                      className="w-full text-xs border border-[#E5E3F2] rounded-xl px-3 py-2 outline-none focus:border-[#6C5CE7] bg-[#FDFCFE] text-[#171A2B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#687086] mb-1">Payment Date</label>
                    <input
                      type="date"
                      required
                      value={createForm.paymentDate}
                      onChange={(e) => setCreateForm({ ...createForm, paymentDate: e.target.value })}
                      className="w-full text-xs border border-[#E5E3F2] rounded-xl px-3 py-2 outline-none focus:border-[#6C5CE7] bg-[#FDFCFE] text-[#171A2B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#687086] mb-1">Frequency</label>
                    <select
                      value={createForm.frequency}
                      onChange={(e) => setCreateForm({ ...createForm, frequency: e.target.value })}
                      className="w-full text-xs border border-[#E5E3F2] rounded-xl px-3 py-2 outline-none focus:border-[#6C5CE7] bg-[#FDFCFE] text-[#171A2B]"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="bi_weekly">Bi-Weekly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#687086] mb-1">Internal Notes</label>
                  <textarea
                    rows={2}
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                    className="w-full text-xs border border-[#E5E3F2] rounded-xl p-3 outline-none focus:border-[#6C5CE7] bg-[#FDFCFE] text-[#171A2B]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E3F2]">
                  <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={creating}
                    className="bg-[#6C5CE7] hover:bg-[#5846DB] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] font-semibold"
                  >
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Run Payroll Calculations'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detailed Pay Run Drawer */}
        {selectedPayRun && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-[#E5E3F2] max-h-[90vh] flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E3F2] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#171A2B]">{selectedPayRun.name}</h3>
                    {getStatusBadge(selectedPayRun.status)}
                  </div>
                  <p className="text-xs text-[#687086] mt-0.5">
                    Period: {selectedPayRun.periodStart} to {selectedPayRun.periodEnd} · Payment Date: {selectedPayRun.paymentDate} · Total Net: £{selectedPayRun.totalNet.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPayRun(null)}
                  className="text-[#9096A9] hover:text-[#171A2B] p-1 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {detailLoading ? (
                  <div className="p-8 text-center text-xs text-[#687086]">
                    <Loader2 className="h-6 w-6 text-[#6C5CE7] animate-spin mx-auto mb-2" />
                    Loading employee payslips...
                  </div>
                ) : !selectedPayRun.payslips || selectedPayRun.payslips.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#687086]">
                    No payslips found in this pay run.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border border-[#E5E3F2] rounded-xl overflow-hidden">
                    <thead className="bg-[#F5F3FF] text-[#687086] font-semibold border-b border-[#E5E3F2]">
                      <tr>
                        <th className="px-3.5 py-2.5">Security Officer</th>
                        <th className="px-3.5 py-2.5">Hours (Reg / OT)</th>
                        <th className="px-3.5 py-2.5">Gross Wages</th>
                        <th className="px-3.5 py-2.5">PAYE Tax</th>
                        <th className="px-3.5 py-2.5">National Insurance</th>
                        <th className="px-3.5 py-2.5">Net Pay</th>
                        <th className="px-3.5 py-2.5 text-right">View Payslip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EEF8]">
                      {selectedPayRun.payslips.map((ps) => (
                        <tr key={ps.id} className="hover:bg-[#F9F8FF]">
                          <td className="px-3.5 py-2.5">
                            <div className="font-semibold text-[#171A2B]">
                              {ps.employee ? `${ps.employee.firstName} ${ps.employee.lastName}` : 'Workforce Guard'}
                            </div>
                            <div className="text-[11px] text-[#9096A9] font-mono">
                              {ps.employee?.employeeNumber || 'EMP-XXXXX'}
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <span className="font-medium text-[#171A2B]">{ps.regularHours}h reg</span>
                            {ps.overtimeHours > 0 && (
                              <span className="ml-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
                                +{ps.overtimeHours}h OT
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 font-bold text-[#171A2B]">£{ps.grossPay.toFixed(2)}</td>
                          <td className="px-3.5 py-2.5 text-amber-700 font-mono">£{ps.taxDeduction.toFixed(2)}</td>
                          <td className="px-3.5 py-2.5 text-[#6C5CE7] font-mono">£{ps.nationalInsurance.toFixed(2)}</td>
                          <td className="px-3.5 py-2.5 font-bold text-emerald-600 text-sm">£{ps.netPay.toFixed(2)}</td>
                          <td className="px-3.5 py-2.5 text-right">
                            <button
                              onClick={() => setViewingPayslip(ps)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#D5D0FA] hover:bg-[#EDE9FE] text-[#6C5CE7] text-[11px] font-semibold transition-colors"
                            >
                              Inspect <ChevronRight className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-[#E5E3F2] pt-4">
                <div className="flex items-center gap-2">
                  {selectedPayRun.status === 'pending_approval' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleReview(selectedPayRun.id, 'approved')}
                      disabled={reviewLoading}
                      className="bg-[#6C5CE7] hover:bg-[#5846DB] text-white font-semibold"
                    >
                      Approve Pay Run
                    </Button>
                  )}
                  {selectedPayRun.status === 'approved' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleReview(selectedPayRun.id, 'paid')}
                      disabled={reviewLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Finalize & Mark Paid
                    </Button>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedPayRun(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Individual Payslip Printable Modal */}
        {viewingPayslip && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E3F2] space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E3F2] pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#EDE9FE] flex items-center justify-center text-[#6C5CE7]">
                    <Banknote className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold text-[#171A2B]">HMRC Itemized Payslip</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="p-1.5 rounded-lg border border-[#E5E3F2] hover:bg-[#F5F3FF] text-[#687086] hover:text-[#6C5CE7]"
                    title="Print Payslip"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button onClick={() => setViewingPayslip(null)} className="text-[#9096A9] hover:text-[#171A2B]">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Printable Body */}
              <div className="p-4 bg-[#FAF9FE] border border-[#E5E3F2] rounded-xl space-y-4 text-xs">
                <div className="flex justify-between items-start border-b border-[#E5E3F2] pb-3">
                  <div>
                    <h4 className="font-bold text-[#171A2B] text-sm">
                      {viewingPayslip.employee
                        ? `${viewingPayslip.employee.firstName} ${viewingPayslip.employee.lastName}`
                        : 'Workforce Officer'}
                    </h4>
                    <p className="text-[#9096A9] font-mono text-[11px] mt-0.5">
                      Emp ID: {viewingPayslip.employee?.employeeNumber || 'EMP-XXXXX'}
                    </p>
                    <p className="text-[#687086] text-[11px]">{viewingPayslip.employee?.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#6C5CE7] text-xs">UK Security Workforce Ltd</span>
                    <p className="text-[#9096A9] text-[10px] mt-0.5">Payment Date: {viewingPayslip.paymentDate}</p>
                    <p className="text-[#9096A9] text-[10px]">
                      Period: {viewingPayslip.periodStart} → {viewingPayslip.periodEnd}
                    </p>
                  </div>
                </div>

                {/* Earnings Table */}
                <div>
                  <h5 className="font-semibold text-[#171A2B] mb-2 uppercase text-[10px] tracking-wider text-[#687086]">
                    Earnings Breakdown
                  </h5>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#687086]">Regular Hours ({viewingPayslip.regularHours}h)</span>
                      <span className="font-mono text-[#171A2B]">£{viewingPayslip.regularPay.toFixed(2)}</span>
                    </div>
                    {viewingPayslip.overtimeHours > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#687086]">Overtime Hours (1.5x · {viewingPayslip.overtimeHours}h)</span>
                        <span className="font-mono text-[#171A2B]">£{viewingPayslip.overtimePay.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold border-t border-[#E5E3F2] pt-1.5 text-[#171A2B]">
                      <span>Total Gross Pay</span>
                      <span className="font-mono">£{viewingPayslip.grossPay.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions Table */}
                <div>
                  <h5 className="font-semibold text-[#171A2B] mb-2 uppercase text-[10px] tracking-wider text-[#687086]">
                    HMRC Statutory Deductions
                  </h5>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#687086]">PAYE Income Tax (Basic 20%)</span>
                      <span className="font-mono text-amber-700">-£{viewingPayslip.taxDeduction.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#687086]">Class 1 National Insurance (8%)</span>
                      <span className="font-mono text-[#6C5CE7]">-£{viewingPayslip.nationalInsurance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-[#E5E3F2] pt-1.5 text-rose-700">
                      <span>Total Deductions</span>
                      <span className="font-mono">
                        -£{(viewingPayslip.taxDeduction + viewingPayslip.nationalInsurance).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Net Pay Banner */}
                <div className="p-3 bg-white border border-[#D5D0FA] rounded-xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="font-bold text-[#171A2B] text-sm">Net Pay Due</span>
                    <p className="text-[10px] text-[#9096A9]">Disbursed via BACS Direct Deposit</p>
                  </div>
                  <span className="text-xl font-bold text-emerald-600 font-mono">
                    £{viewingPayslip.netPay.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setViewingPayslip(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
