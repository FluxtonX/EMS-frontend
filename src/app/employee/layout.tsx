'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  Briefcase,
  ShieldCheck,
  CalendarCheck,
  User,
  LogOut,
  Building2,
  ChevronRight,
  Menu,
  X,
  Bell,
  MessageSquare,
} from 'lucide-react';
import { fetchMyOverview } from '@/lib/api/me';
import { useQuery } from '@tanstack/react-query';

export default function EmployeePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch overview for high-level status banner
  const { data: overview, isLoading } = useQuery({
    queryKey: ['my-overview'],
    queryFn: fetchMyOverview,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const handleLogout = () => {
    try {
      localStorage.removeItem('workforce_auth_session');
      localStorage.removeItem('workforce_user');
      document.cookie = 'workforce_auth_token=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'workforce_auth_role=; path=/; max-age=0; SameSite=Lax';
    } catch {
      // ignore
    }
    router.push('/login');
  };

  const navItems = [
    { label: 'Dashboard', href: '/employee', icon: LayoutDashboard },
    { label: 'Dispatch Chat', href: '/employee/chat', icon: MessageSquare },
    { label: 'My Shifts & Rota', href: '/employee/shifts', icon: CalendarDays },
    { label: 'Clock In & Punch', href: '/employee/attendance', icon: Clock },
    { label: 'My Assignment', href: '/employee/assignment', icon: Briefcase },
    { label: 'Licences & SIA', href: '/employee/licences', icon: ShieldCheck },
    { label: 'Leave & Time Off', href: '/employee/leave', icon: CalendarCheck },
    { label: 'My Profile', href: '/employee/profile', icon: User },
  ];

  const bottomNavItems = [
    { label: 'Home', href: '/employee', icon: LayoutDashboard },
    { label: 'Shifts', href: '/employee/shifts', icon: CalendarDays },
    { label: 'Clock In', href: '/employee/attendance', icon: Clock },
    { label: 'Leave', href: '/employee/leave', icon: CalendarCheck },
    { label: 'Profile', href: '/employee/profile', icon: User },
  ];

  const isActive = (href: string) => {
    if (href === '/employee') {
      return pathname === '/employee' || pathname === '/employee/dashboard';
    }
    return pathname.startsWith(href);
  };

  const isClockedIn = !!overview?.activeClockIn;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#6C5CE7] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                W
              </span>
              <span className="font-bold text-slate-900 text-sm tracking-tight hidden sm:inline">
                {overview?.company?.name || 'Workforce'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-[#6C5CE7] border border-purple-100">
                Staff Self-Service
              </span>
            </div>
          </div>

          {/* Right Header Status & Profile */}
          <div className="flex items-center gap-3">
            {/* Live Clock-In Badge */}
            {isClockedIn ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">On Duty</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span className="hidden sm:inline">Off Duty</span>
              </div>
            )}

            {/* Employee Name */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-[#6C5CE7] font-bold text-xs flex items-center justify-center border border-purple-200 shadow-xs">
                {overview?.employee?.firstName ? overview.employee.firstName[0] : 'E'}
                {overview?.employee?.lastName ? overview.employee.lastName[0] : ''}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-slate-900 leading-tight">
                  {overview?.employee?.firstName} {overview?.employee?.lastName}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {overview?.employee?.employeeNumber || 'STAFF'}
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-60 border-r border-slate-200/80 bg-white p-4 shrink-0">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#6C5CE7] text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Assignment Widget in Sidebar */}
          {overview?.currentAssignment && (
            <div className="mt-auto p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-xs">
              <div className="font-semibold text-purple-900 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#6C5CE7]" />
                <span>Assigned Site</span>
              </div>
              <div className="font-bold text-slate-900 mt-1 truncate">
                {overview.currentAssignment.siteName}
              </div>
              <div className="text-slate-500 text-[11px] truncate">
                {overview.currentAssignment.roleName}
              </div>
              <div className="mt-2 pt-2 border-t border-purple-200/60 font-mono font-semibold text-purple-700 text-[11px]">
                £{Number(overview.currentAssignment.lockedPayRate).toFixed(2)}/hr
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Slide-out Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl p-4 flex flex-col z-10">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <div className="font-bold text-slate-900 text-sm">Employee Portal</div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-[#6C5CE7] text-white font-semibold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {bottomNavItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                active ? 'text-[#6C5CE7] font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${active ? 'text-[#6C5CE7]' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
