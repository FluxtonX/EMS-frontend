'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  FileSpreadsheet,
  Calendar,
  Clock,
  CheckCircle2,
  Lock,
  Plus,
  Loader2,
  DollarSign,
  AlertCircle,
  FileCheck2,
  ChevronRight,
  X,
  Edit3,
  Building2,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  fetchTimesheetsApi,
  fetchTimesheetByIdApi,
  generateTimesheetsApi,
  adjustTimesheetEntryApi,
  reviewTimesheetApi,
  Timesheet,
  TimesheetEntry,
  TimesheetStatus,
} from '@/lib/api/timesheets';

export default function TimesheetsPage() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodStart, setPeriodStart] = useState<string>('2026-09-01');
  const [periodEnd, setPeriodEnd] = useState<string>('2026-09-30');

  // Generator Modal State
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [genStart, setGenStart] = useState('2026-09-22');
  const [genEnd, setGenEnd] = useState('2026-09-28');
  const [generating, setGenerating] = useState(false);
  const [genSuccessMsg, setGenSuccessMsg] = useState<string | null>(null);

  // Detail Drawer State
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Adjustment Modal State
  const [adjustingEntry, setAdjustingEntry] = useState<TimesheetEntry | null>(null);
  const [adjustMinutes, setAdjustMinutes] = useState<number>(30);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Reviewing State
  const [reviewLoading, setReviewLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTimesheetsApi({
        status: statusFilter,
        periodStart,
        periodEnd,
      });
      setTimesheets(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load timesheets records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, periodStart, periodEnd]);

  // Aggregate KPI Metrics
  const stats = timesheets.reduce(
    (acc, ts) => {
      acc.totalHours += ts.totalHours;
      acc.regularHours += ts.regularHours;
      acc.overtimeHours += ts.overtimeHours;
      acc.totalGrossPay += ts.grossPay;
      if (ts.status === 'locked') acc.lockedCount++;
      if (ts.status === 'approved') acc.approvedCount++;
      return acc;
    },
    {
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      totalGrossPay: 0,
      lockedCount: 0,
      approvedCount: 0,
    }
  );

  const handleOpenDetail = async (ts: Timesheet) => {
    setDetailLoading(true);
    setSelectedTimesheet(ts);
    try {
      const detailed = await fetchTimesheetByIdApi(ts.id);
      setSelectedTimesheet(detailed);
    } catch {
      // Keep existing
    } finally {
      setDetailLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setGenSuccessMsg(null);
    try {
      const res = await generateTimesheetsApi({
        periodStart: genStart,
        periodEnd: genEnd,
      });
      setGenSuccessMsg(`Generated ${res.generated} timesheets successfully.`);
      setIsGenerateOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to generate timesheets.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTimesheet || !adjustingEntry) return;
    if (!adjustReason.trim()) {
      setAdjustError('A mandatory supervisor justification reason is required for compliance audit.');
      return;
    }

    setAdjustLoading(true);
    setAdjustError(null);
    try {
      await adjustTimesheetEntryApi(selectedTimesheet.id, adjustingEntry.id, {
        adjustmentMinutes: adjustMinutes,
        adjustmentReason: adjustReason.trim(),
      });
      setAdjustingEntry(null);
      setAdjustReason('');
      setAdjustMinutes(30);

      // Refresh detail
      const refreshed = await fetchTimesheetByIdApi(selectedTimesheet.id);
      setSelectedTimesheet(refreshed);
      await loadData();
    } catch (err: any) {
      setAdjustError(err?.message || 'Failed to adjust timesheet entry.');
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleReviewTimesheet = async (id: string, newStatus: TimesheetStatus) => {
    setReviewLoading(true);
    try {
      const updated = await reviewTimesheetApi(id, {
        status: newStatus,
        notes: `Reviewed and transitioned to ${newStatus} by supervisor.`,
      });
      if (selectedTimesheet && selectedTimesheet.id === id) {
        setSelectedTimesheet({ ...selectedTimesheet, status: updated.status });
      }
      await loadData();
    } catch (err: any) {
      alert(err?.message || `Failed to transition timesheet to ${newStatus}.`);
    } finally {
      setReviewLoading(false);
    }
  };

  const getStatusBadge = (status: TimesheetStatus) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EDE9FE] text-[#6C5CE7] border border-[#D5D0FA]">
            <Clock className="h-3 w-3" />
            Submitted
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </span>
        );
      case 'locked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white border border-slate-700 shadow-xs">
            <Lock className="h-3 w-3" />
            Locked (Payroll)
          </span>
        );
    }
  };

  return (
    <AppShell>
      <PageContainer
        title="Timesheets & Payroll Reconciliation"
        subtitle={
          <div className="flex items-center gap-2">
            <span>Verified work hour calculations, unpaid break deductions, overtime thresholds, and payroll rate locking.</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#EDE9FE] text-[#6C5CE7] border border-[#D5D0FA]">
              Phase 12
            </span>
          </div>
        }
        breadcrumbs={[
          { label: 'Workforce Platform', href: '/dashboard' },
          { label: 'Timesheets' },
        ]}
        primaryAction={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Sparkles className="h-4 w-4" />}
            onClick={() => setIsGenerateOpen(true)}
            className="bg-[#6C5CE7] hover:bg-[#5846DB] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.05)] text-xs h-[38px] px-4 font-semibold"
          >
            Generate Timesheets
          </Button>
        }
        secondaryActions={
          <Badge variant="info" size="sm" className="gap-1.5 bg-[#F5F3FF] text-[#6C5CE7] border-[#D5D0FA]">
            <Info className="h-3.5 w-3.5 text-[#6C5CE7]" />
            UK 40h Overtime Standard
          </Badge>
        }
      >
        {genSuccessMsg && (
          <div className="my-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{genSuccessMsg}</span>
            </div>
            <button onClick={() => setGenSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Live Operational Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-6 my-6">
          <div className="bg-white p-5 rounded-2xl border border-[#E5E3F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-[#687086] text-xs">
              <span className="font-semibold">Total Net Hours</span>
              <Clock className="h-4 w-4 text-[#6C5CE7]" />
            </div>
            <p className="text-2xl font-bold text-[#171A2B] mt-2.5">
              {stats.totalHours.toFixed(1)} <span className="text-sm font-normal text-[#9096A9]">hrs</span>
            </p>
            <p className="text-[11px] text-[#9096A9] mt-1">Net of unpaid breaks</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E3F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-[#687086] text-xs">
              <span className="font-semibold">Regular Hours</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 mt-2.5">
              {stats.regularHours.toFixed(1)} <span className="text-sm font-normal text-[#9096A9]">hrs</span>
            </p>
            <p className="text-[11px] text-[#9096A9] mt-1">Standard rate (≤ 40h)</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E3F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-[#687086] text-xs">
              <span className="font-semibold">Overtime Hours</span>
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-2.5">
              {stats.overtimeHours.toFixed(1)} <span className="text-sm font-normal text-[#9096A9]">hrs</span>
            </p>
            <p className="text-[11px] text-[#9096A9] mt-1">1.5x Premium rate</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E3F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-[#687086] text-xs">
              <span className="font-semibold">Gross Payroll</span>
              <DollarSign className="h-4 w-4 text-[#6C5CE7]" />
            </div>
            <p className="text-2xl font-bold text-[#6C5CE7] mt-2.5">
              £{stats.totalGrossPay.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-[#9096A9] mt-1">{stats.lockedCount} finalized / locked</p>
          </div>
        </div>

        {/* Filters & Period Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E3F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)] my-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[#687086]">
              <Calendar className="h-3.5 w-3.5 text-[#6C5CE7]" />
              <span className="font-medium">Period:</span>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="text-xs border border-[#E5E3F2] rounded-lg px-2.5 py-1.5 outline-none focus:border-[#6C5CE7] bg-[#FDFCFE] text-[#171A2B]"
              />
              <span>to</span>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="text-xs border border-[#E5E3F2] rounded-lg px-2.5 py-1.5 outline-none focus:border-[#6C5CE7] bg-[#FDFCFE] text-[#171A2B]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(['all', 'draft', 'submitted', 'approved', 'locked'] as const).map((st) => (
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
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-[#E5E3F2] my-6">
            <Loader2 className="h-6 w-6 text-[#6C5CE7] animate-spin mb-2" />
            <p className="text-xs text-[#687086]">Loading verified payroll timesheets...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs my-6">
            {error}
          </div>
        ) : timesheets.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-[#E5E3F2] text-center my-6">
            <FileSpreadsheet className="h-10 w-10 text-[#9096A9] mb-3" />
            <h3 className="text-sm font-semibold text-[#171A2B]">No timesheets generated for this period</h3>
            <p className="text-xs text-[#687086] mt-1 max-w-sm">
              Generate timesheets from attendance records using the button above to calculate hours and rates.
            </p>
            <button
              onClick={() => setIsGenerateOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#6C5CE7] hover:bg-[#5846DB] text-white rounded-xl text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Generate Timesheets Now
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E5E3F2] shadow-sm overflow-hidden my-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F3FF] border-b border-[#E5E3F2] text-[#687086] font-semibold">
                  <tr>
                    <th className="px-4 py-3.5">Security Officer</th>
                    <th className="px-4 py-3.5">Pay Period</th>
                    <th className="px-4 py-3.5">Net Hours</th>
                    <th className="px-4 py-3.5">Regular / OT</th>
                    <th className="px-4 py-3.5">Gross Pay</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EEF8]">
                  {timesheets.map((ts) => (
                    <tr key={ts.id} className="hover:bg-[#F9F8FF] transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-[#171A2B]">
                          {ts.employee ? `${ts.employee.firstName} ${ts.employee.lastName}` : 'Workforce Officer'}
                        </div>
                        <div className="text-[11px] text-[#9096A9] font-mono">
                          {ts.employee?.employeeNumber || 'EMP-UNKNOWN'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-xs text-[#171A2B] font-medium">
                          {ts.periodStart} → {ts.periodEnd}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-bold text-[#171A2B]">{ts.totalHours.toFixed(1)} hrs</span>
                        <div className="text-[11px] text-[#9096A9]">{ts.breakMinutes}m unpaid breaks</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-emerald-700 font-medium">{ts.regularHours.toFixed(1)}h reg</span>
                          {ts.overtimeHours > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              +{ts.overtimeHours.toFixed(1)}h OT
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-bold text-[#6C5CE7] text-sm">
                          £{ts.grossPay.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">{getStatusBadge(ts.status)}</td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDetail(ts)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D5D0FA] bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#6C5CE7] text-xs font-semibold transition-colors shadow-xs"
                          >
                            Breakdown <ChevronRight className="h-3 w-3" />
                          </button>
                          {ts.status === 'submitted' && (
                            <button
                              onClick={() => handleReviewTimesheet(ts.id, 'approved')}
                              disabled={reviewLoading}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          {ts.status === 'approved' && (
                            <button
                              onClick={() => handleReviewTimesheet(ts.id, 'locked')}
                              disabled={reviewLoading}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-colors flex items-center gap-1"
                            >
                              <Lock className="h-3 w-3" /> Lock
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

        {/* Generate Timesheets Modal */}
        {isGenerateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E3F2] space-y-5">
              <div className="flex items-center justify-between border-b border-[#E5E3F2] pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#EDE9FE] flex items-center justify-center text-[#6C5CE7]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold text-[#171A2B]">Generate Period Timesheets</h3>
                </div>
                <button onClick={() => setIsGenerateOpen(false)} className="text-[#9096A9] hover:text-[#171A2B]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleGenerate} className="space-y-4">
                <p className="text-xs text-[#687086] leading-relaxed">
                  Aggregates all reconciled GPS geofenced attendance logs within the selected period, calculates net hours after unpaid break deductions, and snapshots immutable pay rates.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-[#687086] mb-1">Period Start</label>
                  <input
                    type="date"
                    required
                    value={genStart}
                    onChange={(e) => setGenStart(e.target.value)}
                    className="w-full text-xs border border-[#E5E3F2] rounded-xl px-3 py-2 outline-none focus:border-[#6C5CE7] bg-[#FDFCFE] text-[#171A2B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#687086] mb-1">Period End</label>
                  <input
                    type="date"
                    required
                    value={genEnd}
                    onChange={(e) => setGenEnd(e.target.value)}
                    className="w-full text-xs border border-[#E5E3F2] rounded-xl px-3 py-2 outline-none focus:border-[#6C5CE7] bg-[#FDFCFE] text-[#171A2B]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E3F2]">
                  <Button variant="outline" size="sm" type="button" onClick={() => setIsGenerateOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={generating}
                    className="bg-[#6C5CE7] hover:bg-[#5846DB] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] font-semibold"
                  >
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Run Batch Calculation'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detailed Timesheet Breakdown Drawer / Modal */}
        {selectedTimesheet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-[#E5E3F2] max-h-[90vh] flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E3F2] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#171A2B]">
                      {selectedTimesheet.employee
                        ? `${selectedTimesheet.employee.firstName} ${selectedTimesheet.employee.lastName}`
                        : 'Workforce Officer'}{' '}
                      — Timesheet Breakdown
                    </h3>
                    {getStatusBadge(selectedTimesheet.status)}
                  </div>
                  <p className="text-xs text-[#687086] mt-0.5">
                    Pay Period: {selectedTimesheet.periodStart} to {selectedTimesheet.periodEnd} · Total Net:{' '}
                    <span className="font-semibold text-[#171A2B]">{selectedTimesheet.totalHours} hrs</span> · Gross Pay:{' '}
                    <span className="font-semibold text-[#6C5CE7]">£{selectedTimesheet.grossPay.toFixed(2)}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTimesheet(null)}
                  className="text-[#9096A9] hover:text-[#171A2B] p-1 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {selectedTimesheet.notes && (
                <div className="p-3 bg-[#F5F3FF] border border-[#D5D0FA] rounded-xl text-xs text-[#171A2B]">
                  <span className="font-semibold text-[#6C5CE7]">Supervisor Notes:</span> {selectedTimesheet.notes}
                </div>
              )}

              <div className="flex-1 overflow-y-auto">
                {detailLoading ? (
                  <div className="p-8 text-center text-xs text-[#687086]">
                    <Loader2 className="h-6 w-6 text-[#6C5CE7] animate-spin mx-auto mb-2" />
                    Loading shift itemization...
                  </div>
                ) : !selectedTimesheet.entries || selectedTimesheet.entries.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#687086]">
                    No line entries attached to this timesheet.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border border-[#E5E3F2] rounded-xl overflow-hidden">
                    <thead className="bg-[#F5F3FF] text-[#687086] font-semibold border-b border-[#E5E3F2]">
                      <tr>
                        <th className="px-3.5 py-2.5">Date</th>
                        <th className="px-3.5 py-2.5">Site / Location</th>
                        <th className="px-3.5 py-2.5">Clock In / Out</th>
                        <th className="px-3.5 py-2.5">Unpaid Break</th>
                        <th className="px-3.5 py-2.5">Gross / Net</th>
                        <th className="px-3.5 py-2.5">Rate (£/hr)</th>
                        <th className="px-3.5 py-2.5">Pay</th>
                        <th className="px-3.5 py-2.5 text-right">Adjustment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EEF8]">
                      {selectedTimesheet.entries.map((ent) => (
                        <tr key={ent.id} className="hover:bg-[#F9F8FF]">
                          <td className="px-3.5 py-2.5 font-medium text-[#171A2B]">{ent.entryDate}</td>
                          <td className="px-3.5 py-2.5 text-[#687086]">{ent.siteName || 'Canary Wharf Tower'}</td>
                          <td className="px-3.5 py-2.5 font-mono text-[11px]">
                            {new Date(ent.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} →{' '}
                            {new Date(ent.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-3.5 py-2.5 text-[#687086]">{ent.breakMinutes}m</td>
                          <td className="px-3.5 py-2.5">
                            <span className="font-semibold text-[#171A2B]">{ent.netHours}h</span>
                            <span className="text-[10px] text-[#9096A9] ml-1">({ent.grossHours}h gross)</span>
                          </td>
                          <td className="px-3.5 py-2.5 font-mono">
                            £{ent.payRate.toFixed(2)}
                            {ent.isOvertime && (
                              <span className="ml-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
                                1.5x OT
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 font-bold text-[#6C5CE7]">£{ent.totalPay.toFixed(2)}</td>
                          <td className="px-3.5 py-2.5 text-right">
                            {selectedTimesheet.status !== 'locked' ? (
                              <button
                                onClick={() => setAdjustingEntry(ent)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#D5D0FA] hover:bg-[#EDE9FE] text-[#6C5CE7] text-[11px] font-medium transition-colors"
                              >
                                <Edit3 className="h-3 w-3" />
                                {ent.adjustmentMinutes !== 0 ? `${ent.adjustmentMinutes}m adj` : 'Adjust'}
                              </button>
                            ) : (
                              <span className="text-[11px] text-[#9096A9]">Locked</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-[#E5E3F2] pt-4">
                <div className="flex items-center gap-2">
                  {selectedTimesheet.status === 'submitted' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleReviewTimesheet(selectedTimesheet.id, 'approved')}
                      disabled={reviewLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      Approve for Payroll
                    </Button>
                  )}
                  {selectedTimesheet.status === 'approved' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleReviewTimesheet(selectedTimesheet.id, 'locked')}
                      disabled={reviewLoading}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-1.5"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Lock Timesheet
                    </Button>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedTimesheet(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Supervisor Adjustment Modal */}
        {adjustingEntry && selectedTimesheet && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E3F2] space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E3F2] pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#EDE9FE] flex items-center justify-center text-[#6C5CE7]">
                    <Edit3 className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold text-[#171A2B]">Supervisor Adjustment</h3>
                </div>
                <button onClick={() => setAdjustingEntry(null)} className="text-[#9096A9] hover:text-[#171A2B]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAdjustment} className="space-y-4">
                <div className="p-3 bg-[#F5F3FF] border border-[#D5D0FA] rounded-xl text-xs space-y-1">
                  <p className="font-semibold text-[#171A2B]">Shift Date: {adjustingEntry.entryDate}</p>
                  <p className="text-[#687086]">
                    Current Net Hours: <span className="font-medium text-[#171A2B]">{adjustingEntry.netHours} hrs</span> · Pay Rate: £{adjustingEntry.payRate}/hr
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#687086] mb-1">
                    Adjustment (+/- Minutes)
                  </label>
                  <input
                    type="number"
                    step="15"
                    value={adjustMinutes}
                    onChange={(e) => setAdjustMinutes(parseInt(e.target.value) || 0)}
                    className="w-full text-xs border border-[#E5E3F2] rounded-xl px-3 py-2 outline-none focus:border-[#6C5CE7] bg-[#FDFCFE] text-[#171A2B]"
                    placeholder="e.g. 30 or -15"
                  />
                  <p className="text-[11px] text-[#9096A9] mt-1">
                    Positive adds minutes (e.g. approved handover overtime). Negative deducts minutes.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#687086] mb-1">
                    Mandatory Justification Reason <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="Provide specific reason for security compliance audit (e.g., Authorized incident reporting overtime)..."
                    className="w-full text-xs border border-[#E5E3F2] rounded-xl p-3 outline-none focus:border-[#6C5CE7] bg-[#FDFCFE] text-[#171A2B]"
                  />
                </div>

                {adjustError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                    {adjustError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E3F2]">
                  <Button variant="outline" size="sm" type="button" onClick={() => setAdjustingEntry(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={adjustLoading}
                    className="bg-[#6C5CE7] hover:bg-[#5846DB] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] font-semibold"
                  >
                    {adjustLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save & Log Audit'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
