'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && session) {
      const role = (session.company?.role || '').toUpperCase().trim();
      if (role === 'EMPLOYEE') {
        router.replace('/employee/dashboard');
      }
    }
  }, [isLoading, session, router]);

  // If authenticated as Employee, block rendering Company Portal Shell and redirect
  const isEmployee = (session?.company?.role || '').toUpperCase().trim() === 'EMPLOYEE';
  if (isEmployee) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F5F3FF]">
        <div className="h-8 w-8 rounded-full border-2 border-[#6C5CE7] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F5F3FF]">
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
