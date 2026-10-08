'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Building2,
  Briefcase,
  UserCheck,
  Calendar,
  Clock,
  FileSpreadsheet,
  Banknote,
  FileCheck,
  CalendarOff,
  BarChart3,
  Bell,
  History,
  ShieldAlert,
  ChevronLeft,
  X,
  ReceiptText,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/uiStore';
import { useWorkforceStore } from '@/lib/stores/workforceStore';
import { useQuery } from '@tanstack/react-query';
import { fetchUnreadChatCount } from '@/lib/api/chat';
import { useAuth } from '@/lib/auth/AuthContext';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number | null;
  alert?: boolean;
  dynamicBadge?: boolean;
  dynamicChatBadge?: boolean;
  roles?: string[];
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Chat Comms', href: '/chat', icon: MessageSquare, dynamicChatBadge: true },
      { label: 'Shifts & Rota', href: '/shifts', icon: Calendar },
      { label: 'Attendance', href: '/attendance', icon: Clock },
      { label: 'Timesheets', href: '/timesheets', icon: FileSpreadsheet, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
      { label: 'Leave', href: '/leave', icon: CalendarOff, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
    ],
  },
  {
    title: 'Workforce',
    items: [
      { label: 'Employees', href: '/employees', icon: Users, dynamicBadge: true },
      { label: 'Assignments', href: '/assignments', icon: UserCheck },
      { label: 'SIA Compliance', href: '/compliance', icon: FileCheck, alert: true, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
    ],
  },
  {
    title: 'Sites & Clients',
    items: [
      { label: 'Sites & Rates', href: '/sites', icon: Building2 },
      { label: 'Clients & Billing', href: '/clients', icon: ReceiptText, roles: ['OWNER', 'ADMIN'] },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Team Members', href: '/team', icon: UserCog, roles: ['OWNER', 'ADMIN'] },
      { label: 'Payroll', href: '/payroll', icon: Banknote, roles: ['OWNER', 'ADMIN'] },
      { label: 'Reports', href: '/reports', icon: BarChart3, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
      { label: 'Audit Log', href: '/audit', icon: History, roles: ['OWNER', 'ADMIN'] },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();
  const { session } = useAuth();
  const rawRole = (session?.company?.role || 'OWNER').toUpperCase().trim();
  const currentRole = rawRole === 'SUPERVISOR' ? 'OPERATOR' : rawRole;
  const overlayRef = useRef<HTMLDivElement>(null);

  // Synchronous workforce entity count from centralized store
  const totalEmployees = useWorkforceStore((s) => s.totalEmployees);
  const employeeCount = totalEmployees;

  // Real-time unread chat badge
  const { data: unreadChatCount } = useQuery({
    queryKey: ['chat-unread-count'],
    queryFn: fetchUnreadChatCount,
    refetchInterval: 10000,
  });

  // Close sidebar on outside click on mobile
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        !isSidebarCollapsed &&
        overlayRef.current &&
        overlayRef.current === e.target
      ) {
        toggleSidebar();
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isSidebarCollapsed, toggleSidebar]);

  // Close on route change on mobile
  useEffect(() => {
    if (window.innerWidth < 768 && !isSidebarCollapsed) {
      toggleSidebar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const sidebarContent = (
    <aside
      className={cn(
        'flex flex-col h-full border-r border-slate-200/80 bg-white/85 backdrop-blur-xl transition-all duration-200 ease-in-out shadow-[1px_0_10px_rgba(0,0,0,0.02)]',
        isSidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Brand header */}
      <div className="flex h-14 items-center justify-between px-3 border-b border-[#E5E3F2] shrink-0">
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-md bg-[#6C5CE7] flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-sm shrink-0">
              W
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm text-[#171A2B] tracking-tight block truncate">WORKFORCE</span>
              <span className="text-[10px] block text-[#687086] font-semibold tracking-widest uppercase -mt-0.5">
                UK Operations
              </span>
            </div>
          </div>
        )}
        {isSidebarCollapsed && (
          <div className="mx-auto h-7 w-7 rounded-md bg-[#6C5CE7] flex items-center justify-center text-white font-bold text-sm shadow-sm">
            W
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'hidden md:flex h-6 w-6 items-center justify-center rounded text-[#687086] hover:bg-[#F5F3FF] hover:text-[#6C5CE7] transition-colors shrink-0',
            isSidebarCollapsed && 'mx-auto'
          )}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={cn('h-4 w-4 transition-transform duration-200', isSidebarCollapsed && 'rotate-180')}
          />
        </button>
        {/* Mobile close */}
        <button
          onClick={toggleSidebar}
          className="md:hidden flex h-6 w-6 items-center justify-center rounded text-[#687086] hover:bg-[#F5F3FF] shrink-0"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-3 scrollbar-thin">
        {navigationGroups.map((group, gIdx) => {
          const visibleItems = group.items.filter((item) => !item.roles || item.roles.includes(currentRole));
          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} className="space-y-0.5">
              {!isSidebarCollapsed && group.title && (
                <div className="px-3 pb-1 pt-1 text-[10px] font-bold tracking-wider text-[#9096A9] uppercase">
                  {group.title}
                </div>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href));

                const badge =
                  item.dynamicBadge
                    ? employeeCount !== null
                      ? String(employeeCount)
                      : null
                    : item.dynamicChatBadge
                    ? unreadChatCount && unreadChatCount > 0
                      ? String(unreadChatCount)
                      : null
                    : item.badge != null
                    ? String(item.badge)
                    : null;

                const isChatBadge = item.dynamicChatBadge && unreadChatCount && unreadChatCount > 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 select-none',
                      isActive
                        ? 'sidebar-active-tab bg-[#EDE9FE] text-[#6C5CE7] font-semibold border border-[#D5D0FA]'
                        : 'text-[#687086] hover:bg-[#F5F3FF] hover:text-[#171A2B]'
                    )}
                    style={
                      isActive
                        ? {
                            boxShadow:
                              'inset 0 3px 6px rgba(108, 92, 231, 0.28), inset 0 1px 2px rgba(90, 74, 205, 0.38)',
                          }
                        : undefined
                    }
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    {/* Active left accent bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#6C5CE7]" />
                    )}

                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive ? 'text-[#6C5CE7]' : 'text-[#9096A9] group-hover:text-[#171A2B]'
                      )}
                    />

                    {!isSidebarCollapsed && (
                      <span className="flex-1 truncate">{item.label}</span>
                    )}

                    {!isSidebarCollapsed && badge && (
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight transition-colors',
                          isChatBadge
                            ? 'bg-[#6C5CE7] text-white shadow-xs animate-pulse'
                            : isActive
                            ? 'bg-[#6C5CE7]/15 text-[#6C5CE7]'
                            : 'bg-[#F5F3FF] text-[#687086] border border-[#E5E3F2]'
                        )}
                      >
                        {badge}
                      </span>
                    )}

                    {!isSidebarCollapsed && item.alert && (
                      <span
                        className="flex h-2 w-2 rounded-full bg-amber-400 shadow-sm"
                        title="Compliance Alert"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      {!isSidebarCollapsed && (
        <div className="p-3 border-t border-[#E5E3F2] bg-[#FAFAFA] shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9096A9]">Access Level</span>
            <span className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold tracking-tight uppercase border",
              currentRole === 'OWNER' || currentRole === 'ADMIN'
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : currentRole === 'MANAGER'
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            )}>
              {currentRole === 'OWNER' || currentRole === 'ADMIN' ? 'Owner Portal' : currentRole === 'MANAGER' ? 'Ops Manager' : 'Operator'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#687086]">
            <ShieldAlert className="h-3.5 w-3.5 text-[#18B887] shrink-0" />
            <span>SIA Compliance: 98.4%</span>
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar — always visible, static */}
      <div className="hidden md:flex h-full shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile sidebar — overlay drawer */}
      {!isSidebarCollapsed && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-hidden="true"
        >
          <div className="absolute inset-y-0 left-0 w-60 flex flex-col shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
