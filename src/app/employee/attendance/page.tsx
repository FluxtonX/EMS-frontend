'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMyAttendance,
  fetchMyOverview,
  clockInMyAttendance,
  clockOutMyAttendance,
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
  Navigation,
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
  EmptyState,
} from '@/components/ui';
import { toast } from '@/lib/toastStore';

export default function EmployeeAttendancePage() {
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState('');
  const [gpsCoordinates, setGpsCoordinates] = useState<{
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  }>({});
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

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
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoordinates({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
          });
          setGpsError(null);
        },
        (err) => {
          setGpsError(err.message || 'GPS location not available');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // Fetch Attendance Records & Overview
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: fetchMyAttendance,
  });

  const { data: overview } = useQuery({
    queryKey: ['my-overview'],
    queryFn: fetchMyOverview,
  });

  // Clock In Mutation
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
      toast.success('Successfully clocked in. Duty commenced.');
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['my-overview'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to clock in.');
    },
  });

  // Clock Out Mutation
  const clockOutMutation = useMutation({
    mutationFn: () =>
      clockOutMyAttendance({
        latitude: gpsCoordinates.latitude,
        longitude: gpsCoordinates.longitude,
        accuracy: gpsCoordinates.accuracy,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      toast.success('Successfully clocked out. Shift recorded.');
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['my-overview'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to clock out.');
    },
  });

  const activePunch = attendanceData?.activePunch || overview?.activeClockIn;
  const isClockedIn = !!activePunch;
  const history = attendanceData?.history || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-purple-50 text-[#6C5CE7] border border-purple-100">
            <Clock className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Time & Attendance Punch</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Secure mobile-first GPS punch clock for site duty recording and timesheet verification.
            </p>
          </div>
        </div>

        {/* Location Refresh */}
        <button
          onClick={requestLocation}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs self-start sm:self-auto"
        >
          <Navigation className="w-3.5 h-3.5 text-[#6C5CE7]" />
          <span>Refresh GPS</span>
        </button>
      </div>

      {/* Main Punch Clock Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)] p-6 sm:p-8">
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isClockedIn ? 'Duty in Progress' : 'Currently Off Duty'}
            </span>
          </div>

          {/* Large Digital Clock Display */}
          <div className="font-mono text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-2">
            {currentTime || '00:00:00'}
          </div>

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

          {/* Big Punch Button */}
          {isClockedIn ? (
            <Button
              onClick={() => clockOutMutation.mutate()}
              disabled={clockOutMutation.isPending}
              className="w-full sm:w-64 h-14 bg-rose-600 hover:bg-rose-700 text-white font-bold text-base rounded-2xl shadow-md transition-transform active:scale-95"
            >
              {clockOutMutation.isPending ? 'Logging Clock Out...' : 'CLOCK OUT'}
            </Button>
          ) : (
            <Button
              onClick={() => clockInMutation.mutate()}
              disabled={clockInMutation.isPending || !overview?.currentAssignment}
              className="w-full sm:w-64 h-14 bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white font-bold text-base rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_12px_rgba(108,92,231,0.35)] transition-transform active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
            >
              {clockInMutation.isPending ? 'Verifying Geofence...' : 'CLOCK IN'}
            </Button>
          )}

          {isClockedIn && activePunch?.clockInTime && (
            <p className="text-xs text-slate-500 mt-3">
              Clocked in at{' '}
              <span className="font-semibold text-slate-800">
                {new Date(activePunch.clockInTime).toLocaleTimeString('en-GB')}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-[#6C5CE7]" />
            Recent Attendance Punch Logs
          </div>
          <span className="text-xs text-slate-500 font-mono">Last 30 records</span>
        </div>

        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={4} cols={5} />
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No past attendance punches found. Clock in to begin recording your timesheets.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <TableHead>Date</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
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
                      <TableCell className="text-xs text-slate-700 font-mono">
                        {inDate.toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 font-mono">
                        {record.clockOutTime
                          ? new Date(record.clockOutTime).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-purple-700 font-mono">
                        {record.totalHours > 0 ? `${record.totalHours} hrs` : 'In Progress'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === 'clocked_out' || record.status === 'reconciled'
                              ? 'success'
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
    </div>
  );
}
