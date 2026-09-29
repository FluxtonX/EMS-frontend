'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge } from '@/components/ui';
import {
  UserCheck,
  ShieldCheck,
  Building,
  AlertTriangle,
  CalendarClock,
  Users,
} from 'lucide-react';

export default function DashboardPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/login');
    }
  }, [isLoading, session, router]);

  // While auth state is loading, show nothing (avoid flash)
  if (isLoading || !session) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
          <p className="text-xs text-[#64748B] font-medium">Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <PageContainer
        title="Dashboard"
        subtitle={`Welcome back, ${session.user ? `${session.user.firstName} ${session.user.lastName}`.trim() : 'Operator'} — ${session.company?.name || 'Workforce Platform'}`}
        breadcrumbs={[{ label: 'Workforce Platform', href: '/' }, { label: 'Dashboard' }]}
      >
        {/* Operational Overview Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Active Employees',
              value: '—',
              sub: 'Live from database',
              icon: <UserCheck className="h-4 w-4 text-[#2563EB]" />,
            },
            {
              label: 'Protected Sites',
              value: '—',
              sub: 'Managed locations',
              icon: <Building className="h-4 w-4 text-[#64748B]" />,
            },
            {
              label: "Today's Shifts",
              value: '—',
              sub: 'Scheduled today',
              icon: <CalendarClock className="h-4 w-4 text-[#16A34A]" />,
            },
            {
              label: 'Expiring Licences',
              value: '—',
              sub: 'Action within 30 days',
              icon: <AlertTriangle className="h-4 w-4 text-[#D97706]" />,
            },
          ].map((metric) => (
            <div key={metric.label} className="p-4 rounded border border-[#E2E8F0] bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  {metric.label}
                </span>
                {metric.icon}
              </div>
              <p className="mt-2 text-2xl font-bold text-[#0F172A]">{metric.value}</p>
              <span className="text-[11px] text-[#64748B]">{metric.sub}</span>
            </div>
          ))}
        </div>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: 'Employees',
              description: 'Manage your workforce, employment records and assignments.',
              href: '/employees',
              icon: <Users className="h-5 w-5 text-[#2563EB]" />,
              badge: null,
            },
            {
              title: 'Sites',
              description: 'View and manage operational sites and locations.',
              href: '/sites',
              icon: <Building className="h-5 w-5 text-[#475569]" />,
              badge: null,
            },
            {
              title: 'Shifts',
              description: 'Schedule and monitor shifts across all sites.',
              href: '/shifts',
              icon: <CalendarClock className="h-5 w-5 text-[#16A34A]" />,
              badge: null,
            },
            {
              title: 'Attendance',
              description: 'Track clock-ins, clock-outs and attendance records.',
              href: '/attendance',
              icon: <ShieldCheck className="h-5 w-5 text-[#0284C7]" />,
              badge: <Badge variant="info" size="sm">Live</Badge>,
            },
          ].map((card) => (
            <a
              key={card.title}
              href={card.href}
              className="group p-5 rounded border border-[#E2E8F0] bg-white hover:border-[#2563EB] hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-9 w-9 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
                  {card.icon}
                </div>
                {card.badge}
              </div>
              <h3 className="text-sm font-semibold text-[#0F172A] mb-1 group-hover:text-[#2563EB] transition-colors">
                {card.title}
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">{card.description}</p>
            </a>
          ))}
        </div>
      </PageContainer>
    </AppShell>
  );
}
