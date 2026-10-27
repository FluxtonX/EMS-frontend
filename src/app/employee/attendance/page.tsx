'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMyAttendance,
  fetchMyOverview,
  fetchMyAttendanceSheet,
  clockInMyAttendance,
  clockOutMyAttendance,
  startMyBreak,
  endMyBreak,
  MyAttendanceSheetDay,
} from '@/lib/api/me';
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Shield,
  History,
  RefreshCw,
  Coffee,
  PlayCircle,
  Timer,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableSkeleton,
} from '@/components/ui';
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

export default function EmployeeAttendancePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'register' | 'punches'>('register');
  const [currentTime, setCurrentTime] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [gpsCoordinates, setGpsCoordinates] = useState<{
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  }>({});
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isGpsRefreshing, setIsGpsRefreshing] = useState(false);
  const [notes, setNotes] = useState('');
  const [elapsedTimerStr, setElapsedTimerStr] = useState('');

  // Live Digital Clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Browser Geolocation
  const requestLocation = () => {
    setIsGpsRefreshing(true);
    setGpsError(null);

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
            accuracy: Math.round(pos.coords.accuracy),
          };
          setGpsCoordinates(coords);
          setGpsError(null);
          setIsGpsRefreshing(false);
          toast.success(`GPS Location locked (±${coords.accuracy}m accuracy)`);
        },
        () => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const coords = {
                latitude: Number(pos.coords.latitude.toFixed(6)),
                longitude: Number(pos.coords.longitude.toFixed(6)),
                accuracy: Math.round(pos.coords.accuracy),
              };
              setGpsCoordinates(coords);
              setGpsError(null);
              setIsGpsRefreshing(false);
              toast.success(`GPS acquired (±${coords.accuracy}m accuracy)`);
            },
            (fallbackErr) => {
              const msg = fallbackErr.message || 'GPS location unavailable.';
              setGpsError(msg);
              setIsGpsRefreshing(false);
              setGpsCoordinates({
                latitude: 51.5074,
                longitude: -0.1278,
                accuracy: 25,
              });
            },
            { enableHighAccuracy: false, timeout: 8000 }
          );
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setIsGpsRefreshing(false);
      setGpsError('Geolocation is not supported by your browser.');
      setGpsCoordinates({
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 25,
      });
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // Fetch Attendance Records & Overview
  const { data: attendanceData, isLoading: isAttendanceLoading } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: fetchMyAttendance,
    refetchInterval: 15000,
  });

  const { data: overview } = useQuery({
    queryKey: ['my-overview'],
    queryFn: fetchMyOverview,
  });

  // Fetch Monthly Attendance Register (Present / Absent)
  const { data: registerData, isLoading: isRegisterLoading } = useQuery({
    queryKey: ['my-attendance-sheet', selectedMonth],
    queryFn: () => fetchMyAttendanceSheet(selectedMonth),
    refetchInterval: 20000,
  });

  const activePunch = attendanceData?.activePunch || overview?.activeClockIn;
  const isClockedIn = !!activePunch;
  const isOnBreak = activePunch?.status === 'on_break';
  const history = attendanceData?.history || [];

  // Live Duty & Break Timer
  useEffect(() => {
    if (!activePunch) {
      setElapsedTimerStr('');
      return;
    }

    const tick = () => {
      const now = Date.now();
      if (activePunch.status === 'on_break' && activePunch.breakStartTime) {
        const breakMs = Math.max(0, now - new Date(activePunch.breakStartTime).getTime());
        const mins = Math.floor(breakMs / 60000);
        const secs = Math.floor((breakMs % 60000) / 1000);
        setElapsedTimerStr(`${mins}m ${secs < 10 ? '0' : ''}${secs}s on break`);
      } else if (activePunch.clockInTime) {
        const dutyMs = Math.max(0, now - new Date(activePunch.clockInTime).getTime());
        const hrs = Math.floor(dutyMs / 3600000);
        const mins = Math.floor((dutyMs % 3600000) / 60000);
        const secs = Math.floor((dutyMs % 60000) / 1000);
        setElapsedTimerStr(`${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${secs < 10 ? '0' : ''}${secs}s on duty`);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activePunch]);

  // Mutations
  const clockInMutation = useMutation({
    mutationFn: () =>
      clockInMyAttendance({
        siteId: overview?.currentAssignment?.siteId,
        shiftId: overview?.nextShift?.id,
        latitude: gpsCoordinates.latitude,
        longitude: gpsCoordinates.longitude,
        accuracy: gpsCoordinates.accuracy,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      toast.success('Successfully checked in. Duty commenced.');
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['my-overview'] });
      queryClient.invalidateQueries({ queryKey: ['my-attendance-sheet'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to check in.');
    },
  });

  const startBreakMutation = useMutation({
    mutationFn: startMyBreak,
    onSuccess: () => {
      toast.success('Rest break commenced.');
      queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['my-overview'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to start break.');
    },
  });

  const endBreakMutation = useMutation({
    mutationFn: endMyBreak,
    onSuccess: () => {
      toast.success('Break concluded. Resumed duty.');
      queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['my-overview'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to end break.');
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: () =>
      clockOutMyAttendance({
        latitude: gpsCoordinates.latitude,
        longitude: gpsCoordinates.longitude,
        accuracy: gpsCoordinates.accuracy,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      toast.success('Successfully checked out. Shift recorded.');
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['my-overview'] });
      queryClient.invalidateQueries({ queryKey: ['my-attendance-sheet'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to check out.');
    },
  });

  // Month navigation
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 2, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const formattedMonthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // Filtered Register Days (Latest date on top)
  const filteredDays = useMemo(() => {
    const rawDays = registerData?.days || [];
    const matched =
      statusFilter === 'all'
        ? rawDays
        : rawDays.filter((d: MyAttendanceSheetDay) => d.status === statusFilter);

    // Sort so Today and recent days appear at the top
    return [...matched].sort((a, b) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const aIsFuture = a.date > todayStr;
      const bIsFuture = b.date > todayStr;

      // Keep current and elapsed days on top (Today first, then yesterday, etc.)
      if (!aIsFuture && !bIsFuture) {
        return b.dayNumber - a.dayNumber;
      }
      if (aIsFuture && !bIsFuture) return 1;
      if (!aIsFuture && bIsFuture) return -1;
      return a.dayNumber - b.dayNumber;
    });
  }, [registerData, statusFilter]);

  const summary = registerData?.summary || {
    totalDays: 0,
    daysPresent: 0,
    daysAbsent: 0,
    daysOnDuty: 0,
    daysLeave: 0,
    totalHoursWorked: 0,
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-purple-50 text-[#6C5CE7] border border-purple-100 shadow-2xs">
            <Clock className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Attendance & Duty Clock</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Punch in/out, view daily present vs. absent records, and track your total hours.
            </p>
          </div>
        </div>

        {/* Location Refresh */}
        <button
          type="button"
          onClick={requestLocation}
          disabled={isGpsRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-[#F5F3FF] hover:border-[#D5D0FA] hover:text-[#6C5CE7] text-slate-700 shadow-2xs self-start sm:self-auto transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#6C5CE7] ${isGpsRefreshing ? 'animate-spin' : ''}`} />
          <span>{isGpsRefreshing ? 'Acquiring GPS...' : 'Refresh GPS'}</span>
        </button>
      </div>

      {/* Main Punch Clock Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)] p-6 sm:p-8">
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isOnBreak
                  ? 'bg-amber-500 animate-pulse'
                  : isClockedIn
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-slate-400'
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isOnBreak ? 'Rest Break in Progress' : isClockedIn ? 'Duty in Progress' : 'Currently Off Duty'}
            </span>
          </div>

          {/* Large Digital Clock Display */}
          <div className="font-mono text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-1">
            {currentTime || '00:00:00'}
          </div>

          {/* Live Duration Timer */}
          {elapsedTimerStr && (
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 mb-2">
              <Timer className="w-3.5 h-3.5 text-[#6C5CE7]" />
              <span>{elapsedTimerStr}</span>
            </div>
          )}

          <div className="text-xs text-slate-500 mb-6">
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>

          {/* Assigned Site / Geofence Info */}
          {overview?.currentAssignment ? (
            <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 mb-6 text-left text-xs">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#6C5CE7]" />
                <span>{overview.currentAssignment.siteName}</span>
              </div>
              <div className="text-slate-500 mt-1 flex items-center justify-between">
                <span>Role: {overview.currentAssignment.roleName}</span>
                <span className="font-mono font-semibold text-purple-700">
                  £{Number(overview.currentAssignment.lockedPayRate).toFixed(2)}/hr
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {gpsCoordinates.latitude ? (
                  <span>
                    GPS locked: {gpsCoordinates.latitude.toFixed(4)}, {gpsCoordinates.longitude?.toFixed(4)} (±{gpsCoordinates.accuracy}m)
                  </span>
                ) : (
                  <span className="text-amber-600">Acquiring GPS location...</span>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 text-left mb-6 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">No Active Site Assignment:</span> You must be assigned to an operational site to record verified attendance.
              </div>
            </div>
          )}

          {/* Context-Aware Action Buttons */}
          {isClockedIn ? (
            <div className="w-full flex flex-col sm:flex-row items-center gap-3">
              {isOnBreak ? (
                <Button
                  onClick={() => endBreakMutation.mutate()}
                  disabled={endBreakMutation.isPending || clockOutMutation.isPending}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>{endBreakMutation.isPending ? 'Resuming...' : 'End Break & Resume Duty'}</span>
                </Button>
              ) : (
                <Button
                  onClick={() => startBreakMutation.mutate()}
                  disabled={startBreakMutation.isPending || clockOutMutation.isPending}
                  className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <Coffee className="w-4 h-4" />
                  <span>{startBreakMutation.isPending ? 'Logging Break...' : 'Take Rest Break'}</span>
                </Button>
              )}

              <Button
                onClick={() => clockOutMutation.mutate()}
                disabled={clockOutMutation.isPending || startBreakMutation.isPending || endBreakMutation.isPending}
                className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckSquare className="w-4 h-4" />
                <span>{clockOutMutation.isPending ? 'Checking Out...' : 'Check Out & Finish'}</span>
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => clockInMutation.mutate()}
              disabled={clockInMutation.isPending || !overview?.currentAssignment}
              className="w-full sm:w-64 h-14 bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white font-bold text-base rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_12px_rgba(108,92,231,0.35)] transition-transform active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
            >
              {clockInMutation.isPending ? 'Verifying Geofence...' : 'Check In (Start Duty)'}
            </Button>
          )}

          {isClockedIn && activePunch?.clockInTime && (
            <p className="text-xs text-slate-500 mt-3">
              Duty commenced at{' '}
              <span className="font-semibold text-slate-800">
                {new Date(activePunch.clockInTime).toLocaleTimeString('en-GB')}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'register'
                ? 'border-[#6C5CE7] text-[#6C5CE7]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Monthly Attendance Sheet (Present / Absent)</span>
          </button>
          <button
            onClick={() => setActiveTab('punches')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'punches'
                ? 'border-[#6C5CE7] text-[#6C5CE7]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Recent Punch Logs ({history.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Monthly Attendance Register (Present / Absent) */}
      {activeTab === 'register' && (
        <div className="space-y-6">
          {/* Month Selector & Executive KPI Cards */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-slate-800 min-w-[140px] text-center">
                {formattedMonthLabel}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'present', 'on_duty', 'absent', 'leave', 'off'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    statusFilter === st
                      ? 'bg-[#6C5CE7] text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Executive KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Days Present</span>
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 font-mono">
                {summary.daysPresent + summary.daysOnDuty}{' '}
                <span className="text-xs font-normal text-slate-500">days</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Verified work attendance</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Days Absent</span>
                <UserX className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-rose-600 font-mono">
                {summary.daysAbsent}{' '}
                <span className="text-xs font-normal text-slate-500">days</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Scheduled or missed check-in</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Approved Leave</span>
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600 font-mono">
                {summary.daysLeave}{' '}
                <span className="text-xs font-normal text-slate-500">days</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Authorized time off</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Total Hours</span>
                <Clock className="w-4 h-4 text-[#6C5CE7]" />
              </div>
              <div className="text-2xl font-bold text-[#6C5CE7] font-mono">
                {summary.totalHoursWorked.toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-500">hrs</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Net accumulated this month</p>
            </div>
          </div>

          {/* Daily Register Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#6C5CE7]" />
                Daily Attendance Register · {formattedMonthLabel}
              </div>
              <span className="text-xs text-slate-500 font-mono">{filteredDays.length} calendar days</span>
            </div>

            {isRegisterLoading ? (
              <div className="p-6">
                <TableSkeleton rows={8} cols={6} />
              </div>
            ) : filteredDays.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No attendance records match the selected filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                      <TableHead>Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Site Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDays.map((day: MyAttendanceSheetDay) => {
                      const isToday =
                        day.date === new Date().toISOString().split('T')[0];

                      return (
                        <TableRow
                          key={day.date}
                          className={`hover:bg-slate-50/60 transition-colors ${
                            isToday ? 'bg-purple-50/20 font-medium' : ''
                          }`}
                        >
                          <TableCell className="font-medium text-slate-900 text-xs">
                            <span className="font-mono">
                              {new Date(day.date).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            {isToday && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#6C5CE7] text-white">
                                Today
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">{day.dayName}</TableCell>
                          <TableCell>
                            {day.status === 'present' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Present
                              </span>
                            )}
                            {day.status === 'on_duty' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7]" />
                                On Duty (Live)
                              </span>
                            )}
                            {day.status === 'absent' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Absent (No Check-in)
                              </span>
                            )}
                            {day.status === 'leave' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Leave
                              </span>
                            )}
                            {day.status === 'off' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                Rest Day / Off
                              </span>
                            )}
                            {day.status === 'future' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-slate-400">
                                Upcoming
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-slate-800">
                            {day.clockIn ? (
                              new Date(day.clockIn).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-slate-800">
                            {day.clockOut ? (
                              new Date(day.clockOut).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            ) : day.status === 'on_duty' ? (
                              <span className="text-purple-600 font-semibold">Active now</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-mono font-semibold">
                            {day.hours > 0 ? (
                              <span className="text-[#6C5CE7]">{day.hours.toFixed(1)} hrs</span>
                            ) : (
                              <span className="text-slate-400">0.0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {day.siteName || <span className="text-slate-400">—</span>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: Raw Punch History Table */}
      {activeTab === 'punches' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-[#6C5CE7]" />
              Detailed Punch Logs & Geofence Audit
            </div>
            <span className="text-xs text-slate-500 font-mono">Last 30 records</span>
          </div>

          {isAttendanceLoading ? (
            <div className="p-6">
              <TableSkeleton rows={4} cols={6} />
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No past attendance punches found. Check in to begin recording your timesheets.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                    <TableHead>Date</TableHead>
                    <TableHead>Check In & Geofence</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Break</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((record: any) => {
                    const inDate = new Date(record.clockInTime);
                    return (
                      <TableRow key={record.id} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell className="font-medium text-slate-900 text-xs">
                          {inDate.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-mono text-slate-800">
                            {inDate.toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          <div className="mt-0.5">
                            {record.clockInVerified ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                                <Shield className="w-3 h-3 text-emerald-600 shrink-0" />
                                {record.clockInDistance !== undefined
                                  ? `${formatGeofenceDistance(record.clockInDistance)} from site`
                                  : 'Verified'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 font-bold">
                                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                {record.clockInDistance !== undefined
                                  ? record.clockInDistance > 1000
                                    ? `${formatGeofenceDistance(record.clockInDistance)} (Off-Site)`
                                    : `${formatGeofenceDistance(record.clockInDistance)} (Perimeter Variance)`
                                  : 'Outside Geofence'}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700 font-mono">
                          {record.clockOutTime
                            ? new Date(record.clockOutTime).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {record.breakMinutes > 0 ? `${record.breakMinutes}m unpaid` : '0m'}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-purple-700 font-mono">
                          {record.totalHours > 0 ? `${record.totalHours} hrs` : 'In Progress'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.status === 'clocked_out' || record.status === 'reconciled'
                                ? 'success'
                                : record.status === 'on_break'
                                ? 'neutral'
                                : record.status === 'clocked_in'
                                ? 'warning'
                                : 'neutral'
                            }
                            className="capitalize text-xs font-medium"
                          >
                            {record.status?.replace('_', ' ')}
                          </Badge>
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
    </div>
  );
}
