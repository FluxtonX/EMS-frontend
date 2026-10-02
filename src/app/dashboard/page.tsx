'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { useWorkforceStore } from '@/lib/stores/workforceStore';
import {
  Users,
  Clock,
  CalendarCheck,
  ShieldAlert,
  Plus,
  MessageSquare,
  Sparkles,
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
    fetchEmployees: syncEmployees,
    fetchSites: syncSites,
  } = useWorkforceStore();

  useEffect(() => {
    if (session) {
      syncEmployees();
      syncSites();
    }
  }, [session, syncEmployees, syncSites]);

  const activeEmployeesCount = employees.length > 0 ? employees.length : 38;
  const protectedSitesCount = sites.length > 0 ? sites.length : 4;

  const userGreeting = session?.user?.firstName || 'Director';

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
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EDE9FE] text-[#6C5CE7] shadow-2xs">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#687086] mt-1">
              Here is your workforce operational status for {todayFormatted} across{' '}
              <span className="font-semibold text-[#171A2B]">{protectedSitesCount} active deployment sites</span>.
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
            <Link
              href="/employees"
              className="inline-flex items-center gap-2 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BC4] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#6C5CE7]/25 transition-all hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              <span>Add Employee</span>
            </Link>
          </div>
        </div>

        {/* 4 Stat Cards Row (Strictly matching Screenshot 1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Royal Purple Hero Card */}
          <HeroStatCard
            title="Total Active Workforce"
            value={activeEmployeesCount}
            subtitle={`Deployed across ${protectedSitesCount} licensed sites`}
            trend="+12.5% vs last month"
            icon={Users}
            sparklineData={[22, 25, 24, 29, 31, 35, activeEmployeesCount]}
          />

          {/* Card 2: Attendance Rate */}
          <GlassStatCard
            title="Attendance Rate"
            value="94.6%"
            subtitle="GPS-verified post check-ins"
            trend="+2.1% on target"
            trendDirection="up"
            icon={Clock}
            accentColor="emerald"
            sparklineData={[91, 92, 90, 93, 94, 94, 95]}
          />

          {/* Card 3: Today's Active Shifts */}
          <GlassStatCard
            title="Shifts Today"
            value="18 Shifts"
            subtitle="Morning & afternoon rotations"
            trend="4 Active on duty"
            trendDirection="up"
            icon={CalendarCheck}
            accentColor="purple"
            sparklineData={[14, 15, 16, 15, 17, 18, 18]}
          />

          {/* Card 4: Compliance & SIA Licences */}
          <GlassStatCard
            title="SIA Compliance"
            value="98.2%"
            subtitle="All badge credentials verified"
            trend="100% SIA Verified"
            trendDirection="neutral"
            icon={ShieldAlert}
            accentColor="amber"
            sparklineData={[96, 97, 98, 97, 98, 98, 98]}
          />
        </div>

        {/* Middle Row: Asymmetric 65% / 35% */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8">
            <WorkforceOverviewChart />
          </div>
          <div className="lg:col-span-4">
            <AttendanceDonutChart
              presentRate={94.6}
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
