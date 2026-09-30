'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge, Button } from '@/components/ui';
import {
  UserCheck,
  ShieldCheck,
  Building,
  AlertTriangle,
  CalendarClock,
  Users,
  Clock,
  MapPin,
  ArrowRight,
  Info,
  Plus,
} from 'lucide-react';
import { fetchEmployees } from '@/lib/api/employees';
import { fetchSites } from '@/lib/api/sites';
import { fetchShiftsApi } from '@/lib/api/shifts';
import {
  mockEmployees,
  mockSites,
  mockShifts,
  getTodayDateString,
} from '@/lib/mockData';

export default function DashboardPage() {
  const { session, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!authLoading && !session) {
      router.replace('/login');
    }
  }, [authLoading, session, router]);

  // Fetch real data
  const { data: employeesData } = useQuery({
    queryKey: ['dashboard-employees'],
    queryFn: () => fetchEmployees({ page: 1, limit: 100 }),
    enabled: !!session,
  });

  const { data: sitesData = [] } = useQuery({
    queryKey: ['dashboard-sites'],
    queryFn: fetchSites,
    enabled: !!session,
  });

  const todayStr = getTodayDateString();
  const { data: shiftsData = [] } = useQuery({
    queryKey: ['dashboard-shifts', todayStr],
    queryFn: () => fetchShiftsApi({ startDate: todayStr, endDate: todayStr }),
    enabled: !!session,
  });

  // Determine whether real data exists or we use static fallback
  const realEmployeesCount = employeesData?.total ?? 0;
  const realSitesCount = sitesData.length;
  const realShiftsCount = shiftsData.length;

  const hasRealData = realEmployeesCount > 0 || realSitesCount > 0 || realShiftsCount > 0;

  const activeEmployeesCount = hasRealData ? realEmployeesCount : mockEmployees.length;
  const protectedSitesCount = hasRealData ? realSitesCount : mockSites.length;
  const todayShiftsCount = hasRealData ? realShiftsCount : mockShifts.length;
  const expiringLicencesCount = hasRealData
    ? (employeesData?.items || []).filter((e) => e.licence?.status === 'expiring_soon').length
    : mockEmployees.filter((e) => e.licence?.status === 'expiring_soon').length;

  const displayShifts = (shiftsData.length > 0 ? shiftsData : mockShifts).slice(0, 4);

  // While auth state is loading, show spinner
  if (authLoading || !session) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F3FF]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-[#6C5CE7] border-t-transparent animate-spin" />
          <p className="text-xs text-[#687086] font-medium">Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <PageContainer
        title="Command Dashboard"
        subtitle={`Welcome back, ${session.user ? `${session.user.firstName} ${session.user.lastName}`.trim() : 'Operator'} — ${session.company?.name || 'Workforce Platform'}`}
        breadcrumbs={[{ label: 'Workforce Platform', href: '/' }, { label: 'Dashboard' }]}
        primaryAction={
          <Link href="/employees">
            <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Add Employee
            </Button>
          </Link>
        }
      >
        {/* Operational Overview Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Active Employees',
              value: activeEmployeesCount,
              sub: hasRealData ? 'Live from database' : 'Sample workforce officers',
              icon: <UserCheck className="h-4 w-4 text-[#6C5CE7]" />,
            },
            {
              label: 'Protected Sites',
              value: protectedSitesCount,
              sub: hasRealData ? 'Managed locations' : 'Sample client deployments',
              icon: <Building className="h-4 w-4 text-[#687086]" />,
            },
            {
              label: "Today's Shifts",
              value: todayShiftsCount,
              sub: hasRealData ? 'Scheduled today' : 'Sample active rota',
              icon: <CalendarClock className="h-4 w-4 text-[#18B887]" />,
            },
            {
              label: 'Expiring Licences',
              value: expiringLicencesCount,
              sub: 'Action within 30 days',
              icon: <AlertTriangle className="h-4 w-4 text-[#F4A261]" />,
            },
          ].map((metric) => (
            <div key={metric.label} className="p-4 rounded-lg border border-[#E5E3F2] bg-white shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#687086] uppercase tracking-wider">
                  {metric.label}
                </span>
                {metric.icon}
              </div>
              <p className="mt-2 text-2xl font-bold text-[#171A2B]">{metric.value}</p>
              <span className="text-[11px] text-[#687086]">{metric.sub}</span>
            </div>
          ))}
        </div>

        {/* Live Operational Deployments (Today's Shifts Snapshot) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-[#171A2B]">Today&apos;s Deployments &amp; Active Shifts</h2>
              <p className="text-xs text-[#687086]">
                {hasRealData ? 'Live shifts scheduled for today' : 'Sample deployment rota across managed client sites'}
              </p>
            </div>
            <Link href="/shifts" className="text-xs font-semibold text-[#6C5CE7] hover:underline flex items-center gap-1">
              View full schedule <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayShifts.map((shift) => (
              <div
                key={shift.id}
                className="p-4 rounded-lg border border-[#E5E3F2] bg-white shadow-2xs hover:border-[#6C5CE7] transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <Badge
                    variant={
                      shift.status === 'in_progress'
                        ? 'info'
                        : shift.status === 'completed'
                        ? 'success'
                        : 'neutral'
                    }
                    size="sm"
                    dot
                  >
                    {shift.status === 'in_progress' ? 'On Duty' : shift.status}
                  </Badge>
                  <span className="font-mono text-[11px] font-semibold text-[#687086] flex items-center gap-1">
                    <Clock className="h-3 w-3 text-[#6C5CE7]" />
                    {shift.startTime} - {shift.endTime}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#171A2B] truncate">
                    {shift.site?.name || 'Assigned Site'}
                  </h4>
                  <p className="text-[11px] text-[#687086] flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-[#687086] shrink-0" />
                    {shift.site?.address?.city || 'London, UK'}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#F0EEF8] flex items-center justify-between text-xs">
                  <span className="text-[#687086]">Officer:</span>
                  <span className="font-medium text-[#171A2B]">
                    {shift.employee
                      ? `${shift.employee.firstName} ${shift.employee.lastName}`
                      : 'Unassigned'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Employees',
              description: 'Manage workforce profiles, SIA licences, and assignments.',
              href: '/employees',
              icon: <Users className="h-5 w-5 text-[#6C5CE7]" />,
              badge: null,
            },
            {
              title: 'Sites',
              description: 'Physical deployment locations, security protocols and billing rates.',
              href: '/sites',
              icon: <Building className="h-5 w-5 text-[#687086]" />,
              badge: null,
            },
            {
              title: 'Shifts',
              description: 'Roster scheduling, eligibility matching, and shift coverage.',
              href: '/shifts',
              icon: <CalendarClock className="h-5 w-5 text-[#18B887]" />,
              badge: null,
            },
            {
              title: 'Attendance',
              description: 'GPS verified clock-ins, break logging, and reconciliation.',
              href: '/attendance',
              icon: <ShieldCheck className="h-5 w-5 text-[#6C5CE7]" />,
              badge: <Badge variant="info" size="sm">Live</Badge>,
            },
          ].map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group p-5 rounded-lg border border-[#E5E3F2] bg-white hover:border-[#6C5CE7] hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-9 w-9 rounded bg-[#F5F3FF] border border-[#E5E3F2] flex items-center justify-center">
                  {card.icon}
                </div>
                {card.badge}
              </div>
              <h3 className="text-sm font-semibold text-[#171A2B] mb-1 group-hover:text-[#6C5CE7] transition-colors">
                {card.title}
              </h3>
              <p className="text-xs text-[#687086] leading-relaxed">{card.description}</p>
            </Link>
          ))}
        </div>
      </PageContainer>
    </AppShell>
  );
}
