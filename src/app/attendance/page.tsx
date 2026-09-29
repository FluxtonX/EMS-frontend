'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Clock,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Coffee,
  LogOut,
  SlidersHorizontal,
  FileCheck2,
  Calendar,
  Building2,
  User,
  Plus,
  Loader2,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, VarianceFlag } from '@/types/attendance';
import { Site } from '@/types/site';
import { Employee } from '@/types/employee';
import {
  fetchAttendanceRecordsApi,
  clockInApi,
  startBreakApi,
  endBreakApi,
  clockOutApi,
  reconcileAttendanceApi,
} from '@/lib/api/attendance';
import { fetchSites } from '@/lib/api/sites';
import { fetchEmployees } from '@/lib/api/employees';

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [varianceFilter, setVarianceFilter] = useState<string>('all');

  // Modals
  const [isClockInOpen, setIsClockInOpen] = useState(false);
  const [reconcileRecord, setReconcileRecord] = useState<AttendanceRecord | null>(null);

  // Clock In Form State
  const [clockInForm, setClockInForm] = useState({
    employeeId: '',
    siteId: '',
    latitude: '',
    longitude: '',
    accuracy: '10',
  });
  const [clockInLoading, setClockInLoading] = useState(false);
  const [clockInError, setClockInError] = useState<string | null>(null);

  // Reconcile Form State
  const [reconcileForm, setReconcileForm] = useState({
    adjustedTotalHours: '',
    adjustedBreakMinutes: '',
    status: 'reconciled' as 'reconciled' | 'flagged' | 'rejected',
    varianceFlag: 'none' as VarianceFlag,
    supervisorNotes: '',
  });
  const [reconcileLoading, setReconcileLoading] = useState(false);
  const [reconcileError, setReconcileError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [attData, sitesData, empsData] = await Promise.all([
        fetchAttendanceRecordsApi({
          startDate: selectedDate,
          endDate: selectedDate,
          siteId: selectedSiteId === 'all' ? undefined : selectedSiteId,
          status: statusFilter === 'all' ? undefined : statusFilter,
          varianceFlag: varianceFilter === 'all' ? undefined : varianceFilter,
        }),
        fetchSites(),
        fetchEmployees({ status: 'active', limit: 100 }),
      ]);
      setRecords(attData);
      setSites(sitesData);
      setEmployees(empsData.items);
    } catch (err: any) {
      setError(err?.message || 'Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedSiteId, statusFilter, varianceFilter]);

  // Operational metrics
  const stats = useMemo(() => {
    const onDuty = records.filter((r) => r.status === 'clocked_in').length;
    const onBreak = records.filter((r) => r.status === 'on_break').length;
    const clockedOut = records.filter((r) => r.status === 'clocked_out' || r.status === 'reconciled').length;
    const variances = records.filter((r) => r.varianceFlag !== 'none' && r.status !== 'reconciled').length;
    return { onDuty, onBreak, clockedOut, variances };
  }, [records]);

  // GPS autofill
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setClockInForm((prev) => ({
            ...prev,
            latitude: pos.coords.latitude.toFixed(6),
            longitude: pos.coords.longitude.toFixed(6),
            accuracy: Math.round(pos.coords.accuracy).toString(),
          }));
        },
        () => {
          alert('Could not retrieve browser GPS location. Please enter manually.');
        }
      );
    }
  };

  // Clock In Submit
  const handleClockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClockInLoading(true);
    setClockInError(null);

    try {
      await clockInApi({
        employeeId: clockInForm.employeeId,
        siteId: clockInForm.siteId,
        latitude: clockInForm.latitude ? parseFloat(clockInForm.latitude) : undefined,
        longitude: clockInForm.longitude ? parseFloat(clockInForm.longitude) : undefined,
        accuracy: clockInForm.accuracy ? parseFloat(clockInForm.accuracy) : undefined,
      });

      setIsClockInOpen(false);
      setClockInForm({
        employeeId: '',
        siteId: '',
        latitude: '',
        longitude: '',
        accuracy: '10',
      });
      await loadData();
    } catch (err: any) {
      setClockInError(err?.message || 'Failed to clock in.');
    } finally {
      setClockInLoading(false);
    }
  };

  // Break toggles
  const handleStartBreak = async (id: string) => {
    try {
      await startBreakApi(id);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to start break.');
    }
  };

  const handleEndBreak = async (id: string) => {
    try {
      await endBreakApi(id);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to end break.');
    }
  };

  // Clock Out
  const handleClockOut = async (id: string) => {
    if (!confirm('Are you sure you want to clock out this officer?')) return;
    try {
      await clockOutApi(id, {});
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to clock out.');
    }
  };

  // Reconcile Drawer Open
  const openReconcile = (r: AttendanceRecord) => {
    setReconcileRecord(r);
    setReconcileForm({
      adjustedTotalHours: r.totalHours.toString(),
      adjustedBreakMinutes: r.breakMinutes.toString(),
      status: 'reconciled',
      varianceFlag: r.varianceFlag,
      supervisorNotes: r.supervisorNotes || '',
    });
    setReconcileError(null);
  };

  const handleReconcileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcileRecord) return;
    setReconcileLoading(true);
    setReconcileError(null);

    try {
      await reconcileAttendanceApi(reconcileRecord.id, {
        adjustedTotalHours: reconcileForm.adjustedTotalHours ? parseFloat(reconcileForm.adjustedTotalHours) : undefined,
        adjustedBreakMinutes: reconcileForm.adjustedBreakMinutes ? parseInt(reconcileForm.adjustedBreakMinutes) : undefined,
        status: reconcileForm.status,
        varianceFlag: reconcileForm.varianceFlag,
        supervisorNotes: reconcileForm.supervisorNotes.trim(),
      });

      setReconcileRecord(null);
      await loadData();
    } catch (err: any) {
      setReconcileError(err?.message || 'Failed to reconcile record.');
    } finally {
      setReconcileLoading(false);
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'clocked_in':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            On Duty
          </span>
        );
      case 'on_break':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Coffee className="h-3 w-3" />
            On Break
          </span>
        );
      case 'clocked_out':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Clocked Out
          </span>
        );
      case 'reconciled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <FileCheck2 className="h-3 w-3" />
            Reconciled
          </span>
        );
      case 'flagged':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="h-3 w-3" />
            Flagged
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            Rejected
          </span>
        );
    }
  };

  const getVarianceBadge = (variance: VarianceFlag) => {
    if (variance === 'none') return null;
    switch (variance) {
      case 'out_of_geofence':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <MapPin className="h-3 w-3" />
            Out of Geofence
          </span>
        );
      case 'late_arrival':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="h-3 w-3" />
            Late Arrival
          </span>
        );
      case 'early_departure':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            Early Departure
          </span>
        );
      case 'overtime':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            Overtime
          </span>
        );
      case 'unmatched_shift':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            Unscheduled
          </span>
        );
    }
  };

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#0F172A]">Attendance & Geofenced Time Tracking</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Geofence Radar
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Haversine GPS boundary verification, real-time duty state machine, and supervisor reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsClockInOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Record Clock-In
            </button>
          </div>
        </div>

        {/* Live Operational Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-lg border border-[#E2E8F0] shadow-sm">
            <div className="flex items-center justify-between text-[#64748B] text-xs">
              <span>On Duty Now</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-2xl font-bold text-[#0F172A] mt-1">{stats.onDuty}</p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-[#E2E8F0] shadow-sm">
            <div className="flex items-center justify-between text-[#64748B] text-xs">
              <span>On Break</span>
              <Coffee className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-[#0F172A] mt-1">{stats.onBreak}</p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-[#E2E8F0] shadow-sm">
            <div className="flex items-center justify-between text-[#64748B] text-xs">
              <span>Completed (Today)</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-[#0F172A] mt-1">{stats.clockedOut}</p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-[#E2E8F0] shadow-sm">
            <div className="flex items-center justify-between text-[#64748B] text-xs">
              <span>Pending Variances</span>
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            </div>
            <p className="text-2xl font-bold text-rose-600 mt-1">{stats.variances}</p>
          </div>
        </div>

        {/* Filters & Date Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#2563EB]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold text-[#0F172A] border border-[#E2E8F0] rounded px-2 py-1 outline-none focus:border-[#2563EB]"
            />
            <span className="text-xs text-[#64748B] hidden sm:inline">
              {new Date(selectedDate).toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-[#64748B]">
              <Building2 className="h-3.5 w-3.5" />
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="text-xs border border-[#E2E8F0] rounded px-2 py-1 outline-none focus:border-[#2563EB] bg-white text-[#0F172A]"
              >
                <option value="all">All Sites</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name} ({site.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 text-xs text-[#64748B]">
              <Filter className="h-3.5 w-3.5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-[#E2E8F0] rounded px-2 py-1 outline-none focus:border-[#2563EB] bg-white text-[#0F172A]"
              >
                <option value="all">All Statuses</option>
                <option value="clocked_in">On Duty</option>
                <option value="on_break">On Break</option>
                <option value="clocked_out">Clocked Out</option>
                <option value="reconciled">Reconciled</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>

            <div className="flex items-center gap-1 text-xs text-[#64748B]">
              <AlertTriangle className="h-3.5 w-3.5" />
              <select
                value={varianceFilter}
                onChange={(e) => setVarianceFilter(e.target.value)}
                className="text-xs border border-[#E2E8F0] rounded px-2 py-1 outline-none focus:border-[#2563EB] bg-white text-[#0F172A]"
              >
                <option value="all">All Variances</option>
                <option value="none">No Variance (Clean)</option>
                <option value="out_of_geofence">Out of Geofence</option>
                <option value="late_arrival">Late Arrival</option>
                <option value="early_departure">Early Departure</option>
                <option value="overtime">Overtime</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-[#E2E8F0]">
            <Loader2 className="h-6 w-6 text-[#2563EB] animate-spin mb-2" />
            <p className="text-xs text-[#64748B]">Loading attendance radar and timecards...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
            {error}
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-[#E2E8F0] text-center">
            <Clock className="h-10 w-10 text-[#94A3B8] mb-3" />
            <h3 className="text-sm font-semibold text-[#0F172A]">No attendance records found</h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm">
              No officers have clocked in for this selected date and filter combination.
            </p>
            <button
              onClick={() => setIsClockInOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Record First Clock-In
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold">
                  <tr>
                    <th className="px-4 py-3">Security Officer</th>
                    <th className="px-4 py-3">Deployment Site</th>
                    <th className="px-4 py-3">Clock In & Geofence</th>
                    <th className="px-4 py-3">Clock Out</th>
                    <th className="px-4 py-3">Break / Net Hours</th>
                    <th className="px-4 py-3">Status & Variance</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {records.map((r) => {
                    const clockInTimeStr = new Date(r.clockInTime).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const clockOutTimeStr = r.clockOutTime
                      ? new Date(r.clockOutTime).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—';

                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        {/* Officer */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-xs">
                              {r.employee?.firstName?.[0]}
                              {r.employee?.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-[#0F172A] leading-tight">
                                {r.employee?.firstName} {r.employee?.lastName}
                              </p>
                              <p className="text-[10px] text-[#64748B]">
                                {r.employee?.employeeNumber}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Site */}
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[#0F172A]">{r.site?.name}</p>
                          <p className="text-[10px] text-[#64748B]">{r.site?.code}</p>
                        </td>

                        {/* Clock In */}
                        <td className="px-4 py-3">
                          <p className="font-bold text-[#0F172A]">{clockInTimeStr}</p>
                          <div className="mt-0.5">
                            {r.clockInVerified ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                {r.clockInDistance !== undefined
                                  ? `${r.clockInDistance}m from site`
                                  : 'Verified Geofence'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 font-bold">
                                <AlertTriangle className="h-3 w-3 text-rose-600" />
                                {r.clockInDistance !== undefined
                                  ? `${r.clockInDistance}m (Breach)`
                                  : 'Outside Geofence'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Clock Out */}
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[#0F172A]">{clockOutTimeStr}</p>
                          {r.clockOutTime && (
                            <span className="text-[10px] text-[#64748B]">
                              {r.clockOutVerified ? 'Verified' : 'Out of Geofence'}
                            </span>
                          )}
                        </td>

                        {/* Hours */}
                        <td className="px-4 py-3">
                          <p className="font-bold text-[#0F172A]">{r.totalHours} hrs</p>
                          <p className="text-[10px] text-[#64748B]">
                            {r.breakMinutes}m unpaid break
                          </p>
                        </td>

                        {/* Status & Variance */}
                        <td className="px-4 py-3 space-y-1">
                          <div>{getStatusBadge(r.status)}</div>
                          <div>{getVarianceBadge(r.varianceFlag)}</div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            {r.status === 'clocked_in' && (
                              <>
                                <button
                                  onClick={() => handleStartBreak(r.id)}
                                  className="px-2 py-1 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                                >
                                  Break
                                </button>
                                <button
                                  onClick={() => handleClockOut(r.id)}
                                  className="px-2 py-1 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                >
                                  Clock Out
                                </button>
                              </>
                            )}

                            {r.status === 'on_break' && (
                              <button
                                onClick={() => handleEndBreak(r.id)}
                                className="px-2 py-1 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                              >
                                End Break
                              </button>
                            )}

                            <button
                              onClick={() => openReconcile(r)}
                              className="px-2 py-1 rounded text-[11px] font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 ml-1"
                            >
                              Reconcile
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CLOCK-IN SIMULATION MODAL */}
        {isClockInOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-[#E2E8F0]">
              <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Record Guard Clock-In</h3>
                  <p className="text-xs text-[#64748B]">Simulate mobile or kiosk geofence check-in.</p>
                </div>
                <button
                  onClick={() => setIsClockInOpen(false)}
                  className="text-[#64748B] hover:text-[#0F172A]"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleClockInSubmit} className="p-4 space-y-4 text-xs">
                {clockInError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded">
                    {clockInError}
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Select Officer *</label>
                  <select
                    value={clockInForm.employeeId}
                    onChange={(e) =>
                      setClockInForm({ ...clockInForm, employeeId: e.target.value })
                    }
                    required
                    className="w-full border border-[#CBD5E1] rounded px-2.5 py-1.5 outline-none focus:border-[#2563EB]"
                  >
                    <option value="">-- Choose Officer --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Deployment Site *</label>
                  <select
                    value={clockInForm.siteId}
                    onChange={(e) => setClockInForm({ ...clockInForm, siteId: e.target.value })}
                    required
                    className="w-full border border-[#CBD5E1] rounded px-2.5 py-1.5 outline-none focus:border-[#2563EB]"
                  >
                    <option value="">-- Choose Site --</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name} ({site.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* GPS Coordinates with Geofence Assistant */}
                <div className="border border-[#E2E8F0] p-3 rounded bg-[#F8FAFC] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0F172A]">GPS Geolocation</span>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2563EB] hover:underline"
                    >
                      <MapPin className="h-3 w-3" />
                      Get Browser Location
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-[#64748B]">Latitude</label>
                      <input
                        type="text"
                        placeholder="51.5074"
                        value={clockInForm.latitude}
                        onChange={(e) =>
                          setClockInForm({ ...clockInForm, latitude: e.target.value })
                        }
                        className="w-full border border-[#CBD5E1] rounded px-2 py-1 outline-none focus:border-[#2563EB]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#64748B]">Longitude</label>
                      <input
                        type="text"
                        placeholder="-0.1278"
                        value={clockInForm.longitude}
                        onChange={(e) =>
                          setClockInForm({ ...clockInForm, longitude: e.target.value })
                        }
                        className="w-full border border-[#CBD5E1] rounded px-2 py-1 outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-[#64748B]">
                    Calculated against site geofence radius (200m). Leave blank to simulate manual punch.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setIsClockInOpen(false)}
                    className="px-3 py-1.5 rounded border border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={clockInLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#2563EB] hover:bg-blue-700 text-white font-medium transition-colors shadow-sm disabled:opacity-50"
                  >
                    {clockInLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Confirm Clock-In
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RECONCILE DRAWER / MODAL */}
        {reconcileRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-[#E2E8F0]">
              <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Supervisor Reconciliation</h3>
                  <p className="text-xs text-[#64748B]">
                    Adjust hours and sign off on attendance variances.
                  </p>
                </div>
                <button
                  onClick={() => setReconcileRecord(null)}
                  className="text-[#64748B] hover:text-[#0F172A]"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleReconcileSubmit} className="p-4 space-y-4 text-xs">
                {reconcileError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded">
                    {reconcileError}
                  </div>
                )}

                {/* Audit summary */}
                <div className="bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0] space-y-1">
                  <p className="font-semibold text-[#0F172A]">
                    {reconcileRecord.employee?.firstName} {reconcileRecord.employee?.lastName} (
                    {reconcileRecord.employee?.employeeNumber})
                  </p>
                  <p className="text-[11px] text-[#64748B]">
                    Site: {reconcileRecord.site?.name} • In: {new Date(reconcileRecord.clockInTime).toLocaleTimeString('en-GB')}
                  </p>
                  <p className="text-[11px] text-[#64748B]">
                    Current Recorded Hours: <span className="font-bold text-[#0F172A]">{reconcileRecord.totalHours} hrs</span> (
                    {reconcileRecord.breakMinutes}m break)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-[#0F172A] mb-1">
                      Adjusted Total Net Hours *
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={reconcileForm.adjustedTotalHours}
                      onChange={(e) =>
                        setReconcileForm({ ...reconcileForm, adjustedTotalHours: e.target.value })
                      }
                      required
                      className="w-full border border-[#CBD5E1] rounded px-2.5 py-1.5 outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0F172A] mb-1">
                      Adjusted Break (Minutes)
                    </label>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={reconcileForm.adjustedBreakMinutes}
                      onChange={(e) =>
                        setReconcileForm({ ...reconcileForm, adjustedBreakMinutes: e.target.value })
                      }
                      className="w-full border border-[#CBD5E1] rounded px-2.5 py-1.5 outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-[#0F172A] mb-1">
                      Reconciled Status *
                    </label>
                    <select
                      value={reconcileForm.status}
                      onChange={(e) =>
                        setReconcileForm({
                          ...reconcileForm,
                          status: e.target.value as any,
                        })
                      }
                      className="w-full border border-[#CBD5E1] rounded px-2.5 py-1.5 outline-none focus:border-[#2563EB]"
                    >
                      <option value="reconciled">Reconciled (Approved)</option>
                      <option value="flagged">Flagged for Audit</option>
                      <option value="rejected">Rejected (Unpaid)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0F172A] mb-1">
                      Variance Resolution
                    </label>
                    <select
                      value={reconcileForm.varianceFlag}
                      onChange={(e) =>
                        setReconcileForm({
                          ...reconcileForm,
                          varianceFlag: e.target.value as VarianceFlag,
                        })
                      }
                      className="w-full border border-[#CBD5E1] rounded px-2.5 py-1.5 outline-none focus:border-[#2563EB]"
                    >
                      <option value="none">Resolved (No Variance)</option>
                      <option value="out_of_geofence">Out of Geofence (Approved exception)</option>
                      <option value="late_arrival">Late Arrival (Acknowledged)</option>
                      <option value="early_departure">Early Departure</option>
                      <option value="overtime">Authorized Overtime</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">
                    Supervisor Justification Notes *
                  </label>
                  <textarea
                    rows={3}
                    value={reconcileForm.supervisorNotes}
                    onChange={(e) =>
                      setReconcileForm({ ...reconcileForm, supervisorNotes: e.target.value })
                    }
                    required
                    placeholder="Enter detailed reason for manual override (e.g. guard stationed at perimeter gate, approved overtime)..."
                    className="w-full border border-[#CBD5E1] rounded px-2.5 py-1.5 outline-none focus:border-[#2563EB]"
                  />
                  <p className="text-[10px] text-[#64748B] mt-0.5">
                    This note is permanently recorded in the immutable audit trail.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setReconcileRecord(null)}
                    className="px-3 py-1.5 rounded border border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reconcileLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#2563EB] hover:bg-blue-700 text-white font-medium transition-colors shadow-sm disabled:opacity-50"
                  >
                    {reconcileLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save Reconciliation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
