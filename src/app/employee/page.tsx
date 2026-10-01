'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMyOverview,
  clockInMyAttendance,
  clockOutMyAttendance,
  acknowledgeMyShift,
} from '@/lib/api/me';
import {
  Clock,
  Building2,
  Calendar,
  ShieldCheck,
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Lock,
  UserCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { toast } from '@/lib/toastStore';

export default function EmployeeDashboardPage() {
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [gpsCoordinates, setGpsCoordinates] = useState<{
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  }>({});
  const [gpsError, setGpsError] = useState<string | null>(null);

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

  // Request browser GPS position
  useEffect(() => {
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
  }, []);

  // Fetch Dashboard Overview
  const { data: overview, isLoading, refetch } = useQuery({
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
      }),
    onSuccess: () => {
      toast.success('Clocked in successfully. Have a safe shift!');
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
      }),
    onSuccess: () => {
      toast.success('Clocked out successfully. Shift recorded.');
      queryClient.invalidateQueries({ queryKey: ['my-overview'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to clock out.');
    },
  });

  // Acknowledge Shift Mutation
  const ackShiftMutation = useMutation({
    mutationFn: (shiftId: string) => acknowledgeMyShift(shiftId),
    onSuccess: () => {
      toast.success('Shift confirmed.');
      queryClient.invalidateQueries({ queryKey: ['my-overview'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to confirm shift.');
    },
  });

  const isClockedIn = !!overview?.activeClockIn;

  // Calculate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {getGreeting()},{' '}
            <span className="text-[#6C5CE7]">{overview?.employee?.firstName || 'Colleague'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span>·</span>
            <span className="font-mono">ID: {overview?.employee?.employeeNumber || 'STAFF'}</span>
          </p>
        </div>

        {/* Live Digital Clock Widget */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
          <Clock className="w-4 h-4 text-[#6C5CE7]" />
          <span className="font-mono font-bold text-slate-900 text-sm">{currentTime || '--:--:--'}</span>
        </div>
      </div>

      {/* Hero Attendance & Punch Clock Widget */}
      <div
        className={`rounded-2xl p-6 border transition-all ${
          isClockedIn
            ? 'bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border-emerald-200 shadow-sm'
            : 'bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 border-purple-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {isClockedIn ? 'Currently Clocked In' : 'Attendance Punch Clock'}
              </span>
            </div>

            {isClockedIn ? (
              <div className="mt-2">
                <div className="text-xl font-bold text-emerald-950">Active on Duty</div>
                <div className="text-xs text-emerald-700 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Clocked in at{' '}
                  <span className="font-semibold">
                    {new Date(overview.activeClockIn.clockInTime).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>{' '}
                  today
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <div className="text-xl font-bold text-slate-900">Ready to begin your shift?</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {gpsCoordinates.latitude ? (
                    <span className="text-emerald-600 font-medium">
                      GPS coordinates acquired (±{gpsCoordinates.accuracy}m accuracy)
                    </span>
                  ) : (
                    <span className="text-slate-400">Detecting your site location...</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            {isClockedIn ? (
              <Button
                onClick={() => clockOutMutation.mutate()}
                disabled={clockOutMutation.isPending}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm text-sm"
              >
                {clockOutMutation.isPending ? 'Clocking Out...' : 'Clock Out Now'}
              </Button>
            ) : (
              <Button
                onClick={() => clockInMutation.mutate()}
                disabled={clockInMutation.isPending || !overview?.currentAssignment}
                className="bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white font-semibold px-6 py-2.5 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_6px_rgba(108,92,231,0.3)] text-sm"
              >
                {clockInMutation.isPending
                  ? 'Verifying Location...'
                  : !overview?.currentAssignment
                  ? 'No Site Assigned'
                  : 'Clock In to Site'}
              </Button>
            )}
            <Link
              href="/employee/attendance"
              className="text-xs font-semibold text-[#6C5CE7] hover:text-[#5b4bc4] flex items-center gap-1"
            >
              Logs <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: 3 Clean High-Signal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CARD 1: NEXT SCHEDULED SHIFT */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#6C5CE7]" />
                Next Scheduled Shift
              </span>
              <Link
                href="/employee/shifts"
                className="text-[11px] text-[#6C5CE7] hover:underline font-semibold flex items-center gap-0.5"
              >
                Full Rota <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {overview?.nextShift ? (
              <div className="space-y-3">
                <div>
                  <div className="font-bold text-slate-900 text-base">
                    {new Date(overview.nextShift.shiftDate).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                  <div className="text-sm font-semibold text-purple-700 mt-0.5">
                    {overview.nextShift.startTime} — {overview.nextShift.endTime}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {overview.nextShift.siteName}
                  </div>
                  <div className="text-slate-500 mt-0.5 pl-5">{overview.nextShift.roleName}</div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                No upcoming shifts scheduled. Check your rota regularly.
              </div>
            )}
          </div>

          {overview?.nextShift?.status === 'scheduled' && (
            <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-500">Requires confirmation</span>
              <Button
                size="sm"
                onClick={() => ackShiftMutation.mutate(overview.nextShift.id)}
                disabled={ackShiftMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-3"
              >
                {ackShiftMutation.isPending ? 'Confirming...' : 'Acknowledge Shift'}
              </Button>
            </div>
          )}
        </div>

        {/* CARD 2: CURRENT SITE ASSIGNMENT */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#6C5CE7]" />
                Primary Deployment
              </span>
              <Link
                href="/employee/assignment"
                className="text-[11px] text-[#6C5CE7] hover:underline font-semibold flex items-center gap-0.5"
              >
                History <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {overview?.currentAssignment ? (
              <div className="space-y-3">
                <div>
                  <div className="font-bold text-slate-900 text-base">
                    {overview.currentAssignment.siteName}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {overview.currentAssignment.address?.line1},{' '}
                    {overview.currentAssignment.address?.city}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50/60 border border-purple-100 rounded-lg">
                  <div>
                    <span className="text-[11px] font-medium text-slate-500">Designated Role</span>
                    <div className="font-semibold text-slate-900 text-xs mt-0.5">
                      {overview.currentAssignment.roleName}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-medium text-slate-500">Agreed Rate</span>
                    <div className="font-mono font-bold text-purple-700 text-sm mt-0.5 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-purple-500" />£
                      {Number(overview.currentAssignment.lockedPayRate).toFixed(2)}/hr
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                You are currently in the unassigned pool. An operational manager will assign your site shortly.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3 text-xs text-slate-500 flex items-center justify-between">
            <span>Employment status</span>
            <Badge variant="success" className="font-medium text-xs">
              {overview?.employee?.employmentStatus?.toUpperCase() || 'ACTIVE'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Bottom Grid: SIA Licences & Leave Entitlement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SIA LICENCE STATUS */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#6C5CE7]" />
              SIA Security Licence
            </span>
            <Link
              href="/employee/licences"
              className="text-[11px] text-[#6C5CE7] hover:underline font-semibold flex items-center gap-0.5"
            >
              Details <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {overview?.licence ? (
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm">
                  {overview.licence.type}
                </div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  #{overview.licence.number}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Expires: {new Date(overview.licence.expiryDate).toLocaleDateString('en-GB')}
                </div>
              </div>
              <Badge
                variant={
                  overview.licence.status === 'valid'
                    ? 'success'
                    : overview.licence.status === 'expiring_soon'
                    ? 'warning'
                    : 'danger'
                }
                className="capitalize"
              >
                {overview.licence.status?.replace('_', ' ')}
              </Badge>
            </div>
          ) : (
            <div className="p-4 text-center rounded-lg bg-amber-50/60 border border-amber-200 text-xs text-amber-800">
              No SIA licence on file. Please contact management to submit your badge number.
            </div>
          )}
        </div>

        {/* LEAVE ENTITLEMENT SUMMARY */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-[#6C5CE7]" />
              Annual Leave Balance
            </span>
            <Link
              href="/employee/leave"
              className="text-[11px] text-[#6C5CE7] hover:underline font-semibold flex items-center gap-0.5"
            >
              Request <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <div>
              <div className="text-xl font-bold text-slate-900">
                {overview?.leaveSummary?.remainingDays ?? 28}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Days Left</div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">
                {overview?.leaveSummary?.approvedDays ?? 0}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Taken</div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">
                {overview?.leaveSummary?.annualEntitlementDays ?? 28}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Allowance</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
