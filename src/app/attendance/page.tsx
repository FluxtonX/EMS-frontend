'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import {
  Clock,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Coffee,
  FileCheck2,
  Calendar,
  Building2,
  User,
  Plus,
  Loader2,
  Filter,
  RefreshCw,
  UserX,
  UserCheck,
  CalendarDays,
  ListFilter,
  SlidersHorizontal,
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { AttendanceRecord, AttendanceStatus, VarianceFlag } from '@/types/attendance';
import { Site } from '@/types/site';
import { Employee } from '@/types/employee';
import { AttendanceMapModal } from '@/components/attendance/AttendanceMapModal';
import {
  fetchAttendanceRecordsApi,
  fetchDailyAttendanceSheetApi,
  DailyAttendanceSheetResponse,
  DailyAttendanceItem,
  clockInApi,
  startBreakApi,
  endBreakApi,
  clockOutApi,
  reconcileAttendanceApi,
} from '@/lib/api/attendance';
import { fetchSites } from '@/lib/api/sites';
import { fetchEmployees } from '@/lib/api/employees';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from '@/lib/toastStore';

export function formatGeofenceDistance(distanceMeters?: number | null): string {
  if (distanceMeters === undefined || distanceMeters === null) return '';
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m`;
  }
  const km = distanceMeters / 1000;
  if (km >= 100) {
    return `${Math.round(km).toLocaleString('en-GB')} km`;
  }
  return `${km.toFixed(1)} km`;
}

export default function AttendancePage() {
  const { session, isLoading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState<'register' | 'raw_punches'>('register');
  const [dailySheet, setDailySheet] = useState<DailyAttendanceSheetResponse | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent' | 'on_duty' | 'leave' | 'off'>('all');

  // Modals & Drawers
  const [isClockInOpen, setIsClockInOpen] = useState(false);
  const [reconcileRecord, setReconcileRecord] = useState<AttendanceRecord | null>(null);
  const [mapTargetRecord, setMapTargetRecord] = useState<AttendanceRecord | null>(null);

  // Clock In Form
  const [clockInForm, setClockInForm] = useState({
    employeeId: '',
    siteId: '',
    latitude: '',
    longitude: '',
    accuracy: '10',
  });
  const [clockInLoading, setClockInLoading] = useState(false);
  const [clockInError, setClockInError] = useState<string | null>(null);

  // Reconcile Form
  const [reconcileForm, setReconcileForm] = useState({
    adjustedTotalHours: '',
    adjustedBreakMinutes: '',
    status: 'reconciled' as 'reconciled' | 'flagged' | 'rejected',
    varianceFlag: 'none' as VarianceFlag,
    supervisorNotes: '',
  });
  const [reconcileLoading, setReconcileLoading] = useState(false);
  const [reconcileError, setReconcileError] = useState<string | null>(null);

  // Fetch static sites and active employees once
  useEffect(() => {
    if (!authLoading && session) {
      Promise.all([
        fetchSites(),
        fetchEmployees({ status: 'active', limit: 100 }),
      ])
        .then(([sitesData, empsData]) => {
          setSites(sitesData || []);
          setEmployees(empsData?.items || []);
        })
        .catch((err) => {
          console.error('Failed to load sites/employees metadata:', err);
        });
    }
  }, [authLoading, session]);

  // Load Data
  const loadData = async (silent = false) => {
    if (!silent && !dailySheet) setLoading(true);
    else setIsRefreshing(true);

    try {
      // 1. Fetch Daily Attendance Register (Present / Absent / Live)
      const sheet = await fetchDailyAttendanceSheetApi({
        date: selectedDate || undefined,
        siteId: selectedSiteId === 'all' ? undefined : selectedSiteId,
      });
      if (sheet && Array.isArray(sheet.items)) {
        setDailySheet(sheet);
        setError(null);
      }
    } catch (err: any) {
      console.warn('Daily attendance sheet fetch error:', err);
      if (!silent || !dailySheet) {
        setError(err?.message || 'Failed to load attendance register.');
      }
    }

    try {
      // 2. Also fetch punch logs
      const rawRecords = await fetchAttendanceRecordsApi({
        startDate: selectedDate || undefined,
        endDate: selectedDate || undefined,
        siteId: selectedSiteId === 'all' ? undefined : selectedSiteId,
      });
      setRecords(rawRecords || []);
    } catch (err: any) {
      console.warn('Raw attendance records fetch error:', err);
    } finally {
      if (!silent) setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && session) {
      loadData();

      const interval = setInterval(() => {
        loadData(true);
      }, 15000);

      const handleStorageUpdate = (e: StorageEvent) => {
        if (e.key === 'workforce_attendance_mutation') {
          loadData(true);
        }
      };
      window.addEventListener('storage', handleStorageUpdate);

      return () => {
        clearInterval(interval);
        window.removeEventListener('storage', handleStorageUpdate);
      };
    }
  }, [authLoading, session, selectedDate, selectedSiteId]);

  // Handle Clock In Submit
  const handleClockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clockInForm.employeeId || !clockInForm.siteId) {
      setClockInError('Please select both an employee and a site.');
      return;
    }
    setClockInLoading(true);
    setClockInError(null);

    try {
      await clockInApi({
        employeeId: clockInForm.employeeId,
        siteId: clockInForm.siteId,
        latitude: clockInForm.latitude ? parseFloat(clockInForm.latitude) : 51.5074,
        longitude: clockInForm.longitude ? parseFloat(clockInForm.longitude) : -0.1278,
        accuracy: clockInForm.accuracy ? parseFloat(clockInForm.accuracy) : 10,
      });

      setIsClockInOpen(false);
      setClockInForm({
        employeeId: '',
        siteId: '',
        latitude: '',
        longitude: '',
        accuracy: '10',
      });
      toast.success('Attendance punch logged successfully.');
      await loadData();
    } catch (err: any) {
      setClockInError(err?.message || 'Failed to record clock-in.');
    } finally {
      setClockInLoading(false);
    }
  };

  // Open Reconcile
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
      toast.success('Shift reconciled successfully.');
      await loadData();
    } catch (err: any) {
      setReconcileError(err?.message || 'Failed to reconcile record.');
    } finally {
      setReconcileLoading(false);
    }
  };

  // Filtered Roster Items
  const filteredRegisterItems = useMemo(() => {
    if (!dailySheet?.items) return [];
    if (statusFilter === 'all') return dailySheet.items;
    return dailySheet.items.filter((item) => item.status === statusFilter);
  }, [dailySheet, statusFilter]);

  const summary = dailySheet?.summary || {
    totalEmployees: employees.length,
    presentCount: 0,
    onDutyCount: 0,
    absentCount: 0,
    onLeaveCount: 0,
    offCount: 0,
  };

  return (
    <AppShell>
      <PageContainer
        title="Attendance & Daily Roster"
        subtitle="Comprehensive daily register tracking real-time presence, absences, and active site shifts."
        breadcrumbs={[
          { label: 'Workforce Platform', href: '/dashboard' },
          { label: 'Attendance' },
        ]}
        secondaryActions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#6C5CE7]' : ''}`} />}
            onClick={() => {
              loadData(true);
              toast.success('Attendance updated.');
            }}
          >
            Refresh
          </Button>
        }
        primaryAction={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsClockInOpen(true)}
          >
            Manual Clock-In
          </Button>
        }
      >
        {/* 4 Clean Executive Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
          {/* Present */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold uppercase tracking-wider">Present Today</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 font-mono mt-2">{summary.presentCount}</p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">Completed shifts</p>
          </div>

          {/* Absent */}
          <div className="bg-white p-5 rounded-2xl border border-rose-200/80 bg-rose-50/20 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold uppercase tracking-wider text-rose-800">Absent (No Check-in)</span>
              <UserX className="h-4 w-4 text-rose-600" />
            </div>
            <p className="text-2xl font-bold text-rose-600 font-mono mt-2">{summary.absentCount}</p>
            <p className="text-[11px] text-rose-700 font-medium mt-1">Scheduled or rostered missing</p>
          </div>

          {/* On Duty */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold uppercase tracking-wider">On Duty (Live)</span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
              </span>
            </div>
            <p className="text-2xl font-bold text-emerald-700 font-mono mt-2">{summary.onDutyCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Actively on site right now</p>
          </div>

          {/* On Leave */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold uppercase tracking-wider">Approved Leave</span>
              <CalendarDays className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-700 font-mono mt-2">{summary.onLeaveCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Authorized absence</p>
          </div>
        </div>

        {/* View Mode & Filter Controls */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-100">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('register')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'register'
                    ? 'bg-white text-[#6C5CE7] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daily Register (Present / Absent)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('raw_punches')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'raw_punches'
                    ? 'bg-white text-[#6C5CE7] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Raw Punch Radar ({records.length})
              </button>
            </div>

            {/* Date Picker & Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#6C5CE7]" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-semibold text-slate-900 outline-none bg-transparent"
                />
              </div>

              <button
                type="button"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  selectedDate === new Date().toISOString().split('T')[0]
                    ? 'bg-[#6C5CE7] text-white border-[#6C5CE7]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Today
              </button>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Building2 className="h-3.5 w-3.5 text-[#6C5CE7]" />
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none bg-slate-50 text-slate-800"
                >
                  <option value="all">All Sites</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Filter Tabs (When in Register mode) */}
          {viewMode === 'register' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Roster ({summary.totalEmployees})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('present')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === 'present'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Present ({summary.presentCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('absent')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === 'absent'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                Absent ({summary.absentCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('on_duty')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === 'on_duty'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                }`}
              >
                On Duty ({summary.onDutyCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('leave')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === 'leave'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                }`}
              >
                On Leave ({summary.onLeaveCount})
              </button>
            </div>
          )}
        </div>

        {/* Content Section */}
        {loading && !dailySheet ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="h-6 w-6 text-[#6C5CE7] animate-spin mb-2" />
            <p className="text-xs text-slate-500 font-medium">Loading attendance register...</p>
          </div>
        ) : error && !dailySheet ? (
          <div className="p-8 bg-white rounded-2xl border border-rose-200 text-center flex flex-col items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Attendance Data Unavailable</h3>
              <p className="text-xs text-rose-600 mt-1 max-w-md">{error}</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => loadData(false)}
              className="bg-[#6C5CE7] hover:bg-[#5846DB] text-white text-xs mt-2"
            >
              Retry Connection
            </Button>
          </div>
        ) : viewMode === 'register' ? (
          /* ========================================================================= */
          /* VIEW 1: DAILY ATTENDANCE REGISTER (PRESENT / ABSENT / ON DUTY)            */
          /* ========================================================================= */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#6C5CE7]" />
                Daily Attendance Register • {selectedDate}
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Showing {filteredRegisterItems.length} workforce entries
              </span>
            </div>

            {filteredRegisterItems.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No employees match the selected status filter for this date.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Assigned Site</th>
                      <th className="px-4 py-3">Attendance Status</th>
                      <th className="px-4 py-3">Clock In</th>
                      <th className="px-4 py-3">Clock Out</th>
                      <th className="px-4 py-3">Work Hours</th>
                      <th className="px-4 py-3">Overtime</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRegisterItems.map((item) => {
                      const clockInStr = item.clockInTime
                        ? new Date(item.clockInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                        : '—';
                      const clockOutStr = item.clockOutTime
                        ? new Date(item.clockOutTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                        : item.status === 'on_duty'
                        ? 'In Progress'
                        : '—';

                      return (
                        <tr key={item.employeeId} className="hover:bg-slate-50/70 transition-colors">
                          {/* Employee */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-purple-50 text-[#6C5CE7] border border-purple-100 flex items-center justify-center font-bold text-xs shrink-0">
                                {item.employee?.firstName?.[0]}
                                {item.employee?.lastName?.[0]}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-tight">
                                  {item.employee?.firstName} {item.employee?.lastName}
                                </p>
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  {item.employee?.employeeNumber}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Site */}
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-slate-800">
                              {item.site?.name || 'Unassigned Site'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {item.shift ? `${item.shift.startTime} - ${item.shift.endTime}` : 'Regular Shift'}
                            </p>
                          </td>

                          {/* Status Badge */}
                          <td className="px-4 py-3.5">
                            {item.status === 'present' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                Present
                              </span>
                            )}

                            {item.status === 'on_duty' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-[#6C5CE7] border border-purple-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#6C5CE7] animate-ping" />
                                On Duty (Live)
                              </span>
                            )}

                            {item.status === 'absent' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="h-3 w-3 text-rose-600" />
                                Absent (No Check-in)
                              </span>
                            )}

                            {item.status === 'leave' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <CalendarDays className="h-3 w-3 text-blue-600" />
                                On Leave
                              </span>
                            )}

                            {item.status === 'off' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                                Rest Day / Off
                              </span>
                            )}

                            {item.status === 'scheduled' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                Scheduled
                              </span>
                            )}
                          </td>

                          {/* Clock In */}
                          <td className="px-4 py-3.5 font-mono text-slate-700">
                            {clockInStr}
                          </td>

                          {/* Clock Out */}
                          <td className="px-4 py-3.5 font-mono text-slate-700">
                            {clockOutStr}
                          </td>

                          {/* Work Hours */}
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-slate-900 font-mono">
                              {item.totalHours > 0 ? `${item.totalHours} hrs` : '0 hrs'}
                            </span>
                          </td>

                          {/* Overtime */}
                          <td className="px-4 py-3.5">
                            {item.overtimeHours > 0 ? (
                              <span className="font-bold text-amber-700 font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                +{item.overtimeHours} hrs (OT)
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono">0 hrs</span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="px-4 py-3.5 text-right">
                            {item.status === 'absent' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setClockInForm((prev) => ({
                                    ...prev,
                                    employeeId: item.employeeId,
                                    siteId: item.site?.id || '',
                                  }));
                                  setIsClockInOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-[#6C5CE7] hover:text-white text-slate-700 rounded-lg transition-all"
                              >
                                <Plus className="h-3 w-3" />
                                Record Check-In
                              </button>
                            ) : (
                              <div className="inline-flex items-center gap-2 justify-end">
                                {item.attendanceRecordId && (() => {
                                  const rec = records.find((r) => r.id === item.attendanceRecordId) || ({
                                    id: item.attendanceRecordId,
                                    companyId: '',
                                    employeeId: item.employeeId,
                                    siteId: item.site?.id || '',
                                    clockInTime: item.clockInTime ? new Date(item.clockInTime) : new Date(),
                                    clockOutTime: item.clockOutTime ? new Date(item.clockOutTime) : undefined,
                                    clockInVerified: true,
                                    clockOutVerified: true,
                                    status: item.status === 'on_duty' ? 'clocked_in' : 'clocked_out',
                                    totalHours: item.totalHours,
                                    breakMinutes: item.breakMinutes,
                                    varianceFlag: item.varianceFlag as any,
                                    employee: item.employee as any,
                                    site: item.site as any,
                                  } as unknown as AttendanceRecord);

                                  return (
                                    <button
                                      type="button"
                                      onClick={() => setMapTargetRecord(rec)}
                                      title="View Live Satellite & Street Map"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-[#EDE9FE] hover:bg-[#D5D0FA] text-[#6C5CE7] border border-[#D5D0FA] transition-colors shadow-2xs"
                                    >
                                      <MapPin className="h-3 w-3 text-[#6C5CE7]" />
                                      View Map
                                    </button>
                                  );
                                })()}

                                {item.attendanceRecordId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const rec = records.find((r) => r.id === item.attendanceRecordId);
                                      if (rec) openReconcile(rec);
                                    }}
                                    className="text-[11px] font-semibold text-[#6C5CE7] hover:underline"
                                  >
                                    Reconcile
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: RAW PUNCH LOGS & GEOFENCE RADAR                                   */
          /* ========================================================================= */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#6C5CE7]" />
                Raw GPS Punch Logs ({records.length})
              </div>
              <span className="text-xs text-slate-500">Live operational audit trail</span>
            </div>

            {records.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No raw punches recorded for this date and site selection.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Officer</th>
                      <th className="px-4 py-3">Site</th>
                      <th className="px-4 py-3">Clock In & Geofence</th>
                      <th className="px-4 py-3">Clock Out</th>
                      <th className="px-4 py-3">Hours</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {r.employee?.firstName} {r.employee?.lastName}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{r.site?.name}</td>
                        <td className="px-4 py-3 font-mono">
                          {new Date(r.clockInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          {r.clockInVerified ? (
                            <span className="block text-[10px] text-emerald-600">Verified Geofence</span>
                          ) : (
                            <span className="block text-[10px] text-rose-600 font-semibold">Outside Perimeter</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">
                          {r.clockOutTime
                            ? new Date(r.clockOutTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                        <td className="px-4 py-3 font-bold font-mono text-slate-900">
                          {r.totalHours} hrs
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="neutral" className="capitalize text-xs font-medium">
                            {r.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => setMapTargetRecord(r)}
                              title="View Live Satellite & Street Map"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-[#EDE9FE] hover:bg-[#D5D0FA] text-[#6C5CE7] border border-[#D5D0FA] transition-colors shadow-2xs"
                            >
                              <MapPin className="h-3 w-3 text-[#6C5CE7]" />
                              View Map
                            </button>
                            <button
                              type="button"
                              onClick={() => openReconcile(r)}
                              className="text-[11px] font-semibold text-[#6C5CE7] hover:underline"
                            >
                              Reconcile
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal: Manual Clock In */}
        {isClockInOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-base">Record Attendance Check-In</h3>
                <button
                  type="button"
                  onClick={() => setIsClockInOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {clockInError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {clockInError}
                </div>
              )}

              <form onSubmit={handleClockInSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Employee</label>
                  <select
                    value={clockInForm.employeeId}
                    onChange={(e) => setClockInForm({ ...clockInForm, employeeId: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#6C5CE7]"
                    required
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Site</label>
                  <select
                    value={clockInForm.siteId}
                    onChange={(e) => setClockInForm({ ...clockInForm, siteId: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#6C5CE7]"
                    required
                  >
                    <option value="">-- Choose Deployment Site --</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name} ({site.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsClockInOpen(false)}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    isLoading={clockInLoading}
                  >
                    Save Check-In
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Reconcile Shift */}
        {reconcileRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-base">Reconcile Attendance Shift</h3>
                <button
                  type="button"
                  onClick={() => setReconcileRecord(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {reconcileError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {reconcileError}
                </div>
              )}

              <form onSubmit={handleReconcileSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Adjusted Total Net Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    value={reconcileForm.adjustedTotalHours}
                    onChange={(e) => setReconcileForm({ ...reconcileForm, adjustedTotalHours: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#6C5CE7]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Adjusted Break Minutes</label>
                  <input
                    type="number"
                    value={reconcileForm.adjustedBreakMinutes}
                    onChange={(e) => setReconcileForm({ ...reconcileForm, adjustedBreakMinutes: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#6C5CE7]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supervisor Audit Note</label>
                  <textarea
                    rows={2}
                    value={reconcileForm.supervisorNotes}
                    onChange={(e) => setReconcileForm({ ...reconcileForm, supervisorNotes: e.target.value })}
                    placeholder="Reason for variance adjustment..."
                    className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#6C5CE7]"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setReconcileRecord(null)}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    isLoading={reconcileLoading}
                  >
                    Confirm Reconciliation
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Live Multi-Layer Geofence Map Modal */}
        <AttendanceMapModal
          isOpen={!!mapTargetRecord}
          onClose={() => setMapTargetRecord(null)}
          record={mapTargetRecord}
          onReconcile={(rec) => {
            setMapTargetRecord(null);
            openReconcile(rec);
          }}
        />
      </PageContainer>
    </AppShell>
  );
}
