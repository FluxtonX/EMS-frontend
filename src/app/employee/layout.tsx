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
    <div className="h-screen w-full flex flex-col overflow-hidden bg-transparent text-[#171A2B] antialiased">
      {/* Top Header */}
      <header className="h-14 shrink-0 bg-white/85 backdrop-blur-xl border-b border-[#E5E3F2] px-4 sm:px-6 flex items-center justify-between z-40 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-[#687086] hover:bg-[#F5F3FF] hover:text-[#6C5CE7] transition-colors md:hidden"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#6C5CE7] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              W
            </span>
            <span className="font-bold text-[#171A2B] text-sm tracking-tight hidden sm:inline">
              {overview?.company?.name || 'Workforce'}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F5F3FF] text-[#6C5CE7] border border-[#E5E3F2] shadow-[inset_0_1px_2px_rgba(108,92,231,0.12)]">
              Staff Self-Service
            </span>
          </div>
        </div>

        {/* Right Header Status & Profile */}
        <div className="flex items-center gap-3">
          {/* Live Clock-In Badge */}
          {isClockedIn ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">On Duty</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F5F3FF] border border-[#E5E3F2] text-[#687086] text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9096A9]" />
              <span className="hidden sm:inline">Off Duty</span>
            </div>
          )}

          {/* Employee Name */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#E5E3F2]">
            <div className="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#6C5CE7] font-bold text-xs flex items-center justify-center border border-[#D5D0FA] shadow-xs">
              {overview?.employee?.firstName ? overview.employee.firstName[0] : 'E'}
              {overview?.employee?.lastName ? overview.employee.lastName[0] : ''}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-[#171A2B] leading-tight">
                {overview?.employee?.firstName} {overview?.employee?.lastName}
              </div>
              <div className="text-[10px] text-[#687086] font-mono">
                {overview?.employee?.employeeNumber || 'STAFF'}
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-1.5 text-[#687086] hover:text-[#171A2B] rounded-lg hover:bg-[#F5F3FF] transition-colors border border-transparent hover:border-[#E5E3F2]"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Desktop Sidebar — Separately Scrollable */}
        <aside className="hidden md:flex flex-col w-60 border-r border-[#E5E3F2] bg-white/85 backdrop-blur-xl shrink-0 h-full overflow-hidden shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
          <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1.5 scrollbar-thin">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 select-none ${
                    active
                      ? 'sidebar-active-tab bg-[#EDE9FE] text-[#6C5CE7] font-semibold border border-[#D5D0FA]'
                      : 'text-[#687086] hover:bg-[#F5F3FF] hover:text-[#171A2B]'
                  }`}
                  style={
                    active
                      ? {
                          boxShadow:
                            'inset 0 3px 6px rgba(108, 92, 231, 0.28), inset 0 1px 2px rgba(90, 74, 205, 0.38)',
                        }
                      : undefined
                  }
                >
                  {/* Active left accent bar */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#6C5CE7]" />
                  )}

                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      active ? 'text-[#6C5CE7]' : 'text-[#9096A9] group-hover:text-[#171A2B]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Assignment Widget in Sidebar */}
          {overview?.currentAssignment && (
            <div
              className="m-3 p-3 rounded-xl bg-[#F5F3FF] border border-[#E5E3F2] text-xs shrink-0"
              style={{ boxShadow: 'inset 0 1px 3px rgba(108, 92, 231, 0.08)' }}
            >
              <div className="font-semibold text-[#6C5CE7] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#6C5CE7]" />
                <span>Assigned Site</span>
              </div>
              <div className="font-bold text-[#171A2B] mt-1 truncate">
                {overview.currentAssignment.siteName}
              </div>
              <div className="text-[#687086] text-[11px] truncate">
                {overview.currentAssignment.roleName}
              </div>
              <div className="mt-2 pt-2 border-t border-[#E5E3F2] font-mono font-semibold text-[#6C5CE7] text-[11px]">
                £{Number(overview.currentAssignment.lockedPayRate).toFixed(2)}/hr
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Slide-out Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-[#171A2B]/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl p-4 flex flex-col z-10 border-r border-[#E5E3F2]">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E3F2] mb-3">
                <div className="font-bold text-[#171A2B] text-sm">Employee Portal</div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-[#687086] hover:bg-[#F5F3FF]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                        active
                          ? 'bg-[#EDE9FE] text-[#6C5CE7] font-semibold border border-[#D5D0FA]'
                          : 'text-[#687086] hover:bg-[#F5F3FF] hover:text-[#171A2B]'
                      }`}
                      style={
                        active
                          ? {
                              boxShadow:
                                'inset 0 3px 6px rgba(108, 92, 231, 0.28), inset 0 1px 2px rgba(90, 74, 205, 0.38)',
                            }
                          : undefined
                      }
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#6C5CE7]" />
                      )}
                      <Icon className={`w-4 h-4 ${active ? 'text-[#6C5CE7]' : 'text-[#9096A9]'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Viewport — Separately Scrollable */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-[#E5E3F2] px-2 py-1.5 flex items-center justify-around shadow-lg">
        {bottomNavItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                active ? 'text-[#6C5CE7] font-bold' : 'text-[#687086] hover:text-[#171A2B]'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${active ? 'text-[#6C5CE7]' : 'text-[#9096A9]'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
