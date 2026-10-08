'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { useWorkforceStore } from '@/lib/stores/workforceStore';
import { fetchShiftsApi } from '@/lib/api/shifts';
import { fetchAttendanceRecordsApi } from '@/lib/api/attendance';
import {
  Users,
  Clock,
  CalendarCheck,
  ShieldAlert,
  Plus,
  MessageSquare,
} from 'lucide-react';
import { HeroStatCard } from '@/components/dashboard/HeroStatCard';
import { GlassStatCard } from '@/components/dashboard/GlassStatCard';
import { WorkforceOverviewChart } from '@/components/dashboard/WorkforceOverviewChart';
import { AttendanceDonutChart } from '@/components/dashboard/AttendanceDonutChart';
import { LeaveRequestsQueue } from '@/components/dashboard/LeaveRequestsQueue';
import { OperationsPipeline } from '@/components/dashboard/OperationsPipeline';

export default function DashboardPage() {
  const { session, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [todayShiftsCount, setTodayShiftsCount] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [activeOnDutyCount, setActiveOnDutyCount] = useState(0);

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!authLoading && !session) {
      router.replace('/login');
    }
  }, [authLoading, session, router]);

  // Synchronous entity store state
  const {
    employees,
    sites,
    complianceSummary,
    fetchEmployees: syncEmployees,
    fetchSites: syncSites,
    fetchLicences: syncLicences,
  } = useWorkforceStore();

  useEffect(() => {
    if (!authLoading && session) {
      syncEmployees();
      syncSites();
      syncLicences();

      const today = new Date().toISOString().split('T')[0];
      Promise.allSettled([
        fetchShiftsApi({ startDate: today, endDate: today }),
        fetchAttendanceRecordsApi({ startDate: today, endDate: today }),
      ]).then(([shiftsRes, attRes]) => {
        const shifts = shiftsRes.status === 'fulfilled' && Array.isArray(shiftsRes.value) ? shiftsRes.value : [];
        const atts = attRes.status === 'fulfilled' && Array.isArray(attRes.value) ? attRes.value : [];

        setTodayShiftsCount(shifts.length);

        const onDuty = atts.filter((r) => r.status === 'clocked_in' || r.status === 'on_break').length;
        setActiveOnDutyCount(onDuty);

        const checkedInCount = atts.filter((r) => r.status === 'clocked_in' || r.status === 'clocked_out' || r.status === 'reconciled').length;
        const totalTarget = shifts.length > 0 ? shifts.length : employees.length;
        const rate = totalTarget > 0 ? Math.min(100, Math.round((checkedInCount / totalTarget) * 100)) : 0;
        setAttendanceRate(rate);
      });
    }
  }, [authLoading, session, syncEmployees, syncSites, syncLicences, employees.length]);

  const activeEmployeesCount = employees.length;
  const protectedSitesCount = sites.length;

  const siaComplianceRate =
    complianceSummary.total > 0
      ? Math.round(((complianceSummary.valid + complianceSummary.expiringSoon) / complianceSummary.total) * 100)
      : (employees.length > 0 ? 100 : 0);

  const rawRole = (session?.company?.role || 'OWNER').toUpperCase().trim();
  const currentRole = rawRole === 'SUPERVISOR' ? 'OPERATOR' : rawRole;
  const isOperator = currentRole === 'OPERATOR';
  const isManager = currentRole === 'MANAGER';

  const userGreeting = session?.user?.firstName || (isOperator ? 'Operator' : isManager ? 'Operations Manager' : 'Director');

  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  if (authLoading || !session) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F3FF]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-[#6C5CE7] border-t-transparent animate-spin" />
          <p className="text-xs text-[#687086] font-medium">Verifying authorization…</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Top Executive Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#171A2B]">
                Good morning, {userGreeting}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#687086] mt-1">
              {isOperator ? (
                <>Real-time dispatch telemetry and officer tracking for {todayFormatted} across{' '}<span className="font-semibold text-[#171A2B]">{protectedSitesCount} active deployment sites</span>.</>
              ) : isManager ? (
                <>Operational scheduling and workforce allocations for {todayFormatted} across{' '}<span className="font-semibold text-[#171A2B]">{protectedSitesCount} active deployment sites</span>.</>
              ) : (
                <>Executive workforce status and operations overview for {todayFormatted} across{' '}<span className="font-semibold text-[#171A2B]">{protectedSitesCount} active deployment sites</span>.</>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-xl bg-white/80 px-3.5 py-2 text-xs font-semibold text-[#171A2B] shadow-xs border border-white/90 backdrop-blur-md hover:bg-[#F5F3FF] hover:text-[#6C5CE7] transition-all"
            >
              <MessageSquare className="h-4 w-4 text-[#6C5CE7]" />
              <span>Chat</span>
            </Link>
            {isOperator ? (
              <Link
                href="/attendance"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/25 transition-all hover:-translate-y-0.5"
              >
                <Clock className="h-4 w-4" />
                <span>Live Attendance</span>
              </Link>
            ) : isManager ? (
              <Link
                href="/shifts"
                className="inline-flex items-center gap-2 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#6C5CE7]/25 transition-all hover:-translate-y-0.5"
              >
                <CalendarCheck className="h-4 w-4" />
                <span>Shift Roster</span>
              </Link>
            ) : (
              <Link
                href="/employees?new=true"
                className="inline-flex items-center gap-2 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#6C5CE7]/25 transition-all hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" />
                <span>Add Employee</span>
              </Link>
            )}
          </div>
        </div>

        {/* 4 Stat Cards Row - Fully Dynamic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Active Workforce */}
          <HeroStatCard
            title="Total Active Workforce"
            value={activeEmployeesCount}
            subtitle={`Deployed across ${protectedSitesCount} licensed sites`}
            trend={`${activeEmployeesCount > 0 ? '+100%' : '0%'} live DB`}
            icon={Users}
            sparklineData={[0, Math.ceil(activeEmployeesCount * 0.3), Math.ceil(activeEmployeesCount * 0.6), activeEmployeesCount]}
          />

          {/* Card 2: Attendance Rate */}
          <GlassStatCard
            title="Attendance Rate"
            value={`${attendanceRate}%`}
            subtitle="GPS-verified post check-ins"
            trend={attendanceRate > 0 ? `${attendanceRate}% verified` : '0% check-ins'}
            trendDirection={attendanceRate > 0 ? 'up' : 'neutral'}
            icon={Clock}
            accentColor="emerald"
            sparklineData={[0, Math.ceil(attendanceRate * 0.5), attendanceRate]}
          />

          {/* Card 3: Today's Active Shifts */}
          <GlassStatCard
            title="Shifts Today"
            value={`${todayShiftsCount} Shifts`}
            subtitle="Morning & afternoon rotations"
            trend={`${activeOnDutyCount} Active on duty`}
            trendDirection={activeOnDutyCount > 0 ? 'up' : 'neutral'}
            icon={CalendarCheck}
            accentColor="purple"
            sparklineData={[0, Math.ceil(todayShiftsCount * 0.5), todayShiftsCount]}
          />

          {/* Card 4: Compliance & SIA Licences */}
          <GlassStatCard
            title="SIA Compliance"
            value={`${siaComplianceRate}%`}
            subtitle={`${complianceSummary.total} verified badges`}
            trend={`${complianceSummary.valid} Valid SIA`}
            trendDirection="neutral"
            icon={ShieldAlert}
            accentColor="amber"
            sparklineData={[0, Math.ceil(siaComplianceRate * 0.5), siaComplianceRate]}
          />
        </div>

        {/* Middle Row: Asymmetric 65% / 35% */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8">
            <WorkforceOverviewChart />
          </div>
          <div className="lg:col-span-4">
            <AttendanceDonutChart
              presentRate={attendanceRate}
              totalOfficers={activeEmployeesCount}
            />
          </div>
        </div>

        {/* Bottom Row: Leave Requests + Operations Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <LeaveRequestsQueue />
          </div>
          <div className="lg:col-span-5">
            <OperationsPipeline />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
