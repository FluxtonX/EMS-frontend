'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMyEarnings } from '@/lib/api/me';
import {
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Building2,
  DollarSign,
  Receipt,
  Download,
  Info,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableSkeleton,
} from '@/components/ui';

export default function EmployeeEarningsPage() {
  const [activeTab, setActiveTab] = useState<'timesheets' | 'payslips' | 'unbilled'>('timesheets');
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  const { data: earningsData, isLoading, error } = useQuery({
    queryKey: ['my-earnings'],
    queryFn: fetchMyEarnings,
    staleTime: 30000,
  });

  const summary = earningsData?.summary || {
    contractedHourlyRate: 15.0,
    estimatedGrossWages: 0,
    pendingHours: 0,
    approvedGrossEarnings: 0,
    approvedTotalHours: 0,
    totalNetPaid: 0,
    totalGrossPaid: 0,
    outstandingApproved: 0,
  };

  const timesheets = earningsData?.timesheets || [];
  const payslips = earningsData?.payslips || [];
  const recentUnbilledShifts = earningsData?.recentUnbilledShifts || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-purple-50 text-[#6C5CE7] border border-purple-100 shadow-2xs">
            <Wallet className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Earnings & Income</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Verified timesheet gross pay, statutory UK PAYE deductions, and disbursed net income.
            </p>
          </div>
        </div>

        {/* Contracted Rate Badge */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 self-start sm:self-auto">
          <span className="text-xs text-slate-500 font-medium">Assigned Base Rate:</span>
          <span className="text-sm font-bold font-mono text-[#6C5CE7]">
            £{Number(summary.contractedHourlyRate).toFixed(2)}/hr
          </span>
        </div>
      </div>

      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estimated Wages */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Estimated Wages</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            £{Number(summary.estimatedGrossWages).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>{summary.pendingHours} hrs worked</span>
            <span className="text-slate-400">•</span>
            <span className="text-amber-600 font-medium">Pending sign-off</span>
          </div>
        </div>

        {/* Approved Gross */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved Gross</span>
            <CheckCircle2 className="w-4 h-4 text-[#6C5CE7]" />
          </div>
          <div className="text-2xl font-bold text-purple-700 font-mono">
            £{Number(summary.approvedGrossEarnings).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>{summary.approvedTotalHours} approved hrs</span>
            <span className="text-slate-400">•</span>
            <span className="text-[#6C5CE7] font-medium">Timesheets locked</span>
          </div>
        </div>

        {/* Paid Net Income */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Paid Net Income</span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            £{Number(summary.totalNetPaid).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Disbursed to bank</span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-600 font-medium">Post-tax net</span>
          </div>
        </div>

        {/* Outstanding Approved */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Outstanding Gross</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-700 font-mono">
            £{Number(summary.outstandingApproved).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-blue-600 font-medium">Awaiting next pay run</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('timesheets')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'timesheets'
              ? 'bg-[#6C5CE7] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Approved Timesheets ({timesheets.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payslips')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'payslips'
              ? 'bg-[#6C5CE7] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Payslips & Deductions ({payslips.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('unbilled')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'unbilled'
              ? 'bg-[#6C5CE7] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Recent Completed Shifts ({recentUnbilledShifts.length})
        </button>
      </div>

      {/* Tab 1: Timesheets */}
      {activeTab === 'timesheets' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#6C5CE7]" />
              Authorized Timesheet Statements
            </div>
            <span className="text-xs text-slate-500">Weekly & monthly periods</span>
          </div>

          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={4} cols={6} />
            </div>
          ) : timesheets.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No timesheets generated yet. Reconciled shifts will automatically appear here once authorized by site management.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                    <TableHead>Period</TableHead>
                    <TableHead>Regular Hours</TableHead>
                    <TableHead>Overtime Hours</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Gross Pay</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timesheets.map((ts: any) => (
                    <TableRow key={ts.id} className="hover:bg-slate-50/60 transition-colors">
                      <TableCell className="font-medium text-slate-900 text-xs">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{ts.periodStart} to {ts.periodEnd}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 font-mono">
                        {ts.regularHours} hrs
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 font-mono">
                        {ts.overtimeHours > 0 ? (
                          <span className="text-amber-700 font-semibold">{ts.overtimeHours} hrs (OT)</span>
                        ) : (
                          '0 hrs'
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-900 font-mono">
                        {ts.totalHours} hrs
                      </TableCell>
                      <TableCell className="text-xs font-bold text-purple-700 font-mono">
                        £{Number(ts.grossPay).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ts.status === 'approved' || ts.status === 'locked'
                              ? 'success'
                              : ts.status === 'draft'
                              ? 'warning'
                              : 'neutral'
                          }
                          className="capitalize text-xs font-medium"
                        >
                          {ts.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Payslips & Deductions */}
      {activeTab === 'payslips' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#6C5CE7]" />
              Published Payslip Records & UK Statutory Deductions
            </div>
            <span className="text-xs text-slate-500 font-mono">PAYE / NI / Pension</span>
          </div>

          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={4} cols={7} />
            </div>
          ) : payslips.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No payslips published yet. Payslips become accessible here once the payroll department processes and publishes a pay run.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Gross Pay</TableHead>
                    <TableHead>PAYE Tax</TableHead>
                    <TableHead>Nat. Insurance</TableHead>
                    <TableHead>Workplace Pension</TableHead>
                    <TableHead>Net Pay</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslips.map((p: any) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <TableCell className="font-medium text-slate-900 text-xs font-mono">
                        {p.paymentDate || new Date(p.createdAt).toISOString().split('T')[0]}
                      </TableCell>
                      <TableCell className="text-xs text-slate-800 font-mono font-semibold">
                        £{Number(p.grossPay).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs text-rose-700 font-mono">
                        -£{Number(p.taxDeduction).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs text-rose-700 font-mono">
                        -£{Number(p.nationalInsurance).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs text-blue-700 font-mono">
                        -£{Number(p.pensionEmployee).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-emerald-700 font-mono">
                        £{Number(p.netPay).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setSelectedPayslip(p)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6C5CE7] hover:text-[#5849c4] underline"
                        >
                          View Breakdown
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Recent Completed Shifts */}
      {activeTab === 'unbilled' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#6C5CE7]" />
              Completed Shifts Pending Timesheet Locking
            </div>
            <span className="text-xs text-slate-500 font-mono">Accruing gross pay</span>
          </div>

          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={4} cols={5} />
            </div>
          ) : recentUnbilledShifts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No recent unbilled shifts. All past shifts have been locked into timesheets.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                    <TableHead>Shift Date</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Net Hours</TableHead>
                    <TableHead>Estimated Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUnbilledShifts.map((a: any) => {
                    const inDate = new Date(a.clockInTime);
                    const estValue = Math.round((Number(a.totalHours) || 0) * summary.contractedHourlyRate * 100) / 100;
                    return (
                      <TableRow key={a.id} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell className="font-medium text-slate-900 text-xs">
                          {inDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-xs text-slate-700 font-mono">
                          {inDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="text-xs text-slate-700 font-mono">
                          {a.clockOutTime
                            ? new Date(a.clockOutTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-800 font-mono">
                          {a.totalHours} hrs
                        </TableCell>
                        <TableCell className="text-xs font-bold text-amber-700 font-mono">
                          ~£{estValue.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Statutory Guidance Note */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#6C5CE7] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800">UK Statutory Payroll Disclaimer:</span> Estimated wages represent work performed on site and are subject to manager verification before becoming finalized debt. Deductions strictly follow HMRC tax codes (e.g. 1257L), Class 1 National Insurance, and the 5% employee statutory workplace pension auto-enrolment baseline.
        </div>
      </div>

      {/* Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#6C5CE7]" />
                <h3 className="font-bold text-slate-900 text-base">Payslip Breakdown</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayslip(null)}
                className="text-xs text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Pay Date:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {selectedPayslip.paymentDate || new Date(selectedPayslip.createdAt).toLocaleDateString('en-GB')}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">HMRC Tax Code:</span>
                <span className="font-mono font-semibold text-slate-800">{selectedPayslip.taxCode || '1257L'}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 font-semibold">
                <span className="text-slate-700">Gross Pay:</span>
                <span className="font-mono text-purple-700 font-bold">£{Number(selectedPayslip.grossPay).toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 text-rose-700">
                <span>PAYE Income Tax:</span>
                <span className="font-mono">-£{Number(selectedPayslip.taxDeduction).toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 text-rose-700">
                <span>Class 1 National Insurance:</span>
                <span className="font-mono">-£{Number(selectedPayslip.nationalInsurance).toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 text-blue-700">
                <span>Workplace Pension (5% Employee):</span>
                <span className="font-mono">-£{Number(selectedPayslip.pensionEmployee).toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-500">
                <span>Employer Pension Contribution (3%):</span>
                <span className="font-mono text-slate-700">£{Number(selectedPayslip.pensionEmployer || 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between pt-2 text-sm font-bold text-slate-900">
                <span>Net Pay Disbursed:</span>
                <span className="font-mono text-emerald-700 text-base">£{Number(selectedPayslip.netPay).toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedPayslip(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
