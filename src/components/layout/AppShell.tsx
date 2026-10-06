'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';

const OPERATOR_RESTRICTED = [
  '/team',
  '/jobs',
  '/payroll',
  '/clients',
  '/compliance',
  '/leave',
  '/reports',
  '/audit',
  '/timesheets',
];

const MANAGER_RESTRICTED = [
  '/team',
  '/payroll',
  '/clients',
  '/audit',
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!isLoading && session) {
      const role = (session.company?.role || '').toUpperCase().trim();
      if (role === 'EMPLOYEE') {
        router.replace('/employee/dashboard');
        return;
      }

      if (role === 'OPERATOR' || role === 'SUPERVISOR') {
        const isRestricted = OPERATOR_RESTRICTED.some(
          (p) => pathname === p || pathname.startsWith(`${p}/`)
        );
        if (isRestricted) {
          router.replace('/dashboard?error=unauthorized');
        }
      } else if (role === 'MANAGER') {
        const isRestricted = MANAGER_RESTRICTED.some(
          (p) => pathname === p || pathname.startsWith(`${p}/`)
        );
        if (isRestricted) {
          router.replace('/dashboard?error=unauthorized');
        }
      }
    }
  }, [isLoading, session, router, pathname]);

  // Loading state while session resolves
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAF8FF]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-full border-2 border-[#6C5CE7] border-t-transparent animate-spin shadow-sm" />
          <p className="text-xs font-semibold text-[#687086] tracking-wider uppercase">
            Verifying Session & Permissions...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAF8FF]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-[#6C5CE7] border-t-transparent animate-spin" />
          <p className="text-xs text-[#687086]">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // If authenticated as Employee, block rendering Company Portal Shell and redirect
  const role = (session.company?.role || '').toUpperCase().trim();
  const isEmployee = role === 'EMPLOYEE';
  if (isEmployee) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F5F3FF]">
        <div className="h-8 w-8 rounded-full border-2 border-[#6C5CE7] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Role restriction check for current page
  const isOperatorRestricted =
    (role === 'OPERATOR' || role === 'SUPERVISOR') &&
    OPERATOR_RESTRICTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const isManagerRestricted =
    role === 'MANAGER' &&
    MANAGER_RESTRICTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isOperatorRestricted || isManagerRestricted) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-transparent">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Header />
          <main className="flex-1 flex items-center justify-center p-6 bg-[#F8F9FC]">
            <div className="max-w-md w-full text-center bg-white rounded-2xl p-8 border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-[#171A2B] mb-2">Access Restricted</h2>
              <p className="text-xs text-[#687086] leading-relaxed mb-6">
                Your role ({session.company?.role}) does not have permission to view or manage this module.
                If you require access, please contact your workspace Owner.
              </p>
              <Button
                variant="primary"
                onClick={() => router.push('/dashboard')}
                className="w-full flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Dashboard
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-transparent">
      {/* Desktop Sidebar — rendered as static layout element */}
      <Sidebar />

      {/* Main content wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
