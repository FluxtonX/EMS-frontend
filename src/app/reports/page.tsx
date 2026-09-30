'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui';
import {
  BarChart3,
  Users,
  Clock,
  Calendar,
  CalendarOff,
  FileCheck,
  UserCheck,
  Download,
  Loader2,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  X,
} from 'lucide-react';
import { generateReportApi, downloadReportCSV, ReportType, ReportResult } from '@/lib/api/reports';

// ─── Report type definitions ─────────────────────────────────────────────────
const REPORT_TYPES: {
  type: ReportType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}[] = [
  {
    type: 'employees',
    label: 'Workforce Overview',
    description: 'All employees by status, start date, and employment type.',
    icon: Users,
    color: 'text-[#6C5CE7]',
    bgColor: 'bg-[#EDE9FE]',
  },
  {
    type: 'attendance',
    label: 'Attendance Log',
    description: 'Clock-in/out records, variance flags, and geofence verification.',
    icon: Clock,
    color: 'text-[#18B887]',
    bgColor: 'bg-[#E6F7F1]',
  },
  {
    type: 'hours',
    label: 'Hours Summary',
    description: 'Total hours and shifts per employee for the selected period.',
    icon: TrendingUp,
    color: 'text-[#F4A261]',
    bgColor: 'bg-[#FEF3E7]',
  },
  {
    type: 'absences',
    label: 'Leave & Absences',
    description: 'Approved leave, pending requests and absence days by type.',
    icon: CalendarOff,
    color: 'text-[#EF6B73]',
    bgColor: 'bg-[#FDF0F1]',
  },
  {
    type: 'shifts',
    label: 'Shift Schedule',
    description: 'Published shifts, open positions, and fulfilment rate.',
    icon: Calendar,
    color: 'text-[#4ECDC4]',
    bgColor: 'bg-[#E7F9F8]',
  },
  {
    type: 'licences',
    label: 'SIA Licence Compliance',
    description: 'Licence status across the workforce — valid, expiring, expired.',
    icon: FileCheck,
    color: 'text-[#A29BFE]',
    bgColor: 'bg-[#EDE9FE]',
  },
  {
    type: 'assignments',
    label: 'Site Assignments',
    description: 'Active and historical employee-to-site job assignments.',
    icon: UserCheck,
    color: 'text-[#74B9FF]',
    bgColor: 'bg-[#EBF5FF]',
  },
];

// ─── Shared styles ─────────────────────────────────────────────────────────────
const inputCls =
  'h-9 px-3 text-sm border border-[#E5E3F2] rounded-lg bg-white text-[#171A2B] ' +
  'focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/40 focus:border-[#6C5CE7] ' +
  'shadow-[inset_0_1px_3px_rgba(108,92,231,0.06)] transition-all';

// ─── Summary card ─────────────────────────────────────────────────────────────
function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[#F5F3FF] border border-[#E5E3F2] rounded-xl px-4 py-3 shadow-[inset_0_2px_4px_rgba(108,92,231,0.08)]">
      <div className="text-[10px] font-semibold text-[#9096A9] uppercase tracking-widest">{label}</div>
      <div className="text-xl font-bold text-[#6C5CE7] mt-1">{value}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedDef = REPORT_TYPES.find((r) => r.type === selectedType);

  const handleGenerate = async () => {
    if (!selectedType) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await generateReportApi({
        type: selectedType,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedType) return;
    setExporting(true);
    try {
      await downloadReportCSV({
        type: selectedType,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const clearReport = () => {
    setResult(null);
    setError(null);
    setSelectedType(null);
  };

  // Column headers from first row
  const columns = result && result.rows.length > 0 ? Object.keys(result.rows[0]) : [];

  return (
    <AppShell>
      <PageContainer
        title="Operations Reports"
        subtitle="Generate, filter, and export workforce data reports"
      >
        {/* Report type selector */}
        {!result && (
          <div className="space-y-8 my-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 my-4">
              {REPORT_TYPES.map((rt) => {
                const Icon = rt.icon;
                const isSelected = selectedType === rt.type;
                return (
                  <button
                    key={rt.type}
                    onClick={() => setSelectedType(isSelected ? null : rt.type)}
                    className={[
                      'group text-left p-5 rounded-2xl border transition-all duration-150',
                      isSelected
                        ? 'border-[#6C5CE7] bg-[#EDE9FE] shadow-[inset_0_2px_6px_rgba(108,92,231,0.16)] ring-2 ring-[#6C5CE7]/30'
                        : 'border-[#E5E3F2] bg-white hover:border-[#D5D0FA] hover:bg-[#F9F8FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(108,92,231,0.06)]',
                    ].join(' ')}
                  >
                    <div className={`h-10 w-10 rounded-xl ${rt.bgColor} flex items-center justify-center mb-3.5 shadow-xs`}>
                      <Icon className={`h-5 w-5 ${rt.color}`} />
                    </div>
                    <div className={`text-sm font-semibold mb-1.5 ${isSelected ? 'text-[#6C5CE7]' : 'text-[#171A2B]'}`}>
                      {rt.label}
                    </div>
                    <div className="text-xs text-[#687086] leading-relaxed">{rt.description}</div>
                    {isSelected && (
                      <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#6C5CE7]">
                        Selected <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Filters + actions */}
            {selectedType && (
              <div className="bg-white border border-[#D5D0FA] rounded-2xl p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_12px_rgba(108,92,231,0.08)] my-8 ring-1 ring-[#6C5CE7]/20">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E5E3F2]">
                  {selectedDef && (
                    <>
                      <div className={`h-9 w-9 rounded-xl ${selectedDef.bgColor} flex items-center justify-center shrink-0 shadow-xs`}>
                        <selectedDef.icon className={`h-4.5 w-4.5 ${selectedDef.color}`} />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-[#171A2B]">{selectedDef.label}</span>
                        <span className="text-xs text-[#9096A9] ml-2">— specify parameters and export</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-end gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-[#687086] mb-1.5">Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#687086] mb-1.5">End Date</label>
                    <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)}
                      className={inputCls} />
                  </div>
                  <Button
                    variant="primary" size="sm"
                    leftIcon={loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart3 className="w-3.5 h-3.5" />}
                    onClick={handleGenerate}
                    disabled={loading}
                    className="bg-[#6C5CE7] hover:bg-[#5846DB] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.05)] text-xs h-[38px] px-4"
                  >
                    Generate Report
                  </Button>
                  <Button variant="outline" size="sm"
                    leftIcon={exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    onClick={handleExport}
                    disabled={exporting}
                    className="text-xs border-[#E5E3F2] hover:bg-[#F5F3FF] hover:border-[#6C5CE7] h-[38px] px-4"
                  >
                    Export CSV
                  </Button>
                </div>

                {error && (
                  <div className="mt-5 flex items-center gap-2 px-4 py-3 bg-[#FDF0F1] border border-[#FAC3C6] rounded-xl text-xs font-medium text-[#C93B43] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <AlertCircle className="w-4 h-4 shrink-0 text-[#EF6B73]" />{error}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Result header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#171A2B]">
                  {REPORT_TYPES.find((r) => r.type === result.type)?.label} Report
                </h2>
                <p className="text-xs text-[#9096A9] mt-0.5">
                  Generated {new Date(result.generatedAt).toLocaleString('en-GB')}
                  {result.filters.startDate && ` · From ${result.filters.startDate}`}
                  {result.filters.endDate && ` to ${result.filters.endDate}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm"
                  leftIcon={exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  onClick={handleExport}
                  disabled={exporting}
                >
                  Export CSV
                </Button>
                <button onClick={clearReport}
                  className="p-2 rounded-lg hover:bg-[#F5F3FF] text-[#9096A9] hover:text-[#6C5CE7] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Summary KPIs */}
            {Object.keys(result.summary).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 my-6">
                {Object.entries(result.summary).map(([k, v]) => (
                  <SummaryCard
                    key={k}
                    label={k.replace(/_/g, ' ')}
                    value={typeof v === 'number' ? v.toLocaleString() : v}
                  />
                ))}
              </div>
            )}

            {/* Data table */}
            {result.rows.length === 0 ? (
              <div className="bg-white border border-[#E5E3F2] rounded-2xl p-12 text-center shadow-[0_1px_4px_rgba(108,92,231,0.07)] my-6">
                <BarChart3 className="w-10 h-10 text-[#D5D0FA] mx-auto mb-3" />
                <p className="text-sm font-medium text-[#171A2B]">No data for this period</p>
                <p className="text-xs text-[#9096A9] mt-1">Try adjusting the date range filters.</p>
              </div>
            ) : (
              <div className="bg-white border border-[#E5E3F2] rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(108,92,231,0.07)] my-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-[#171A2B]">
                    <thead>
                      <tr className="bg-[#FAFAFA] border-b border-[#E5E3F2]">
                        {columns.map((col) => (
                          <th key={col}
                            className="text-left text-[10px] font-semibold text-[#9096A9] uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                            {col.replace(/([A-Z])/g, ' $1').trim()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EEF8]">
                      {result.rows.slice(0, 200).map((row, i) => (
                        <tr key={i} className="hover:bg-[#F9F8FF] transition-colors">
                          {columns.map((col) => (
                            <td key={col} className="px-4 py-2.5 whitespace-nowrap text-[#171A2B]">
                              {row[col] === '' || row[col] == null
                                ? <span className="text-[#D5D0FA]">—</span>
                                : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {result.rows.length > 200 && (
                  <div className="px-4 py-3 border-t border-[#E5E3F2] bg-[#FAFAFA] text-xs text-[#687086]">
                    Showing first 200 of {result.rows.length} rows — export CSV for full data
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty state — nothing selected */}
        {!selectedType && !result && (
          <div className="text-center py-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#EDE9FE] mb-3">
              <BarChart3 className="h-6 w-6 text-[#6C5CE7]" />
            </div>
            <p className="text-sm font-medium text-[#171A2B]">Select a report type above to get started</p>
            <p className="text-xs text-[#9096A9] mt-1">All reports are scoped to your company and RBAC role.</p>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
