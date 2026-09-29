'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  UserCheck,
  Calendar,
  Clock,
  FileCheck,
  CalendarOff,
  BarChart3,
  History,
  ShieldAlert,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/uiStore';

const navigationItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Employees', href: '/employees', icon: Users, badge: '247' },
  { label: 'Sites', href: '/sites', icon: Building2 },
  { label: 'Job Roles & Rates', href: '/jobs', icon: Briefcase },
  { label: 'Assignments', href: '/assignments', icon: UserCheck },
  { label: 'Shifts Schedule', href: '/shifts', icon: Calendar },
  { label: 'Attendance', href: '/attendance', icon: Clock },
  { label: 'Licences & Compliance', href: '/licences', icon: FileCheck, alert: true },
  { label: 'Leave Management', href: '/leave', icon: CalendarOff },
  { label: 'Operations Reports', href: '/reports', icon: BarChart3 },
  { label: 'Audit Trail', href: '/audit', icon: History },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[#E5E3F2] bg-white transition-all duration-200 ease-in-out md:static',
        isSidebarCollapsed ? 'w-16' : 'w-60',
        'shrink-0'
      )}
    >
      {/* Brand logo / header */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-[#E5E3F2]">
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-[#6C5CE7] flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-xs">
              W
            </div>
            <div>
              <span className="font-bold text-sm text-[#171A2B] tracking-tight">WORKFORCE</span>
              <span className="text-[10px] block text-[#687086] font-semibold -mt-1 tracking-wider uppercase">UK Operations</span>
            </div>
          </div>
        )}
        {isSidebarCollapsed && (
          <div className="mx-auto h-7 w-7 rounded bg-[#6C5CE7] flex items-center justify-center text-white font-bold text-sm shadow-xs">
            W
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex h-6 w-6 items-center justify-center rounded text-[#687086] hover:bg-[#F5F3FF] hover:text-[#171A2B] transition-colors"
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={cn('h-4 w-4 transition-transform duration-200', isSidebarCollapsed && 'rotate-180')}
          />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-colors select-none',
                isActive
                  ? 'bg-[#EDE9FE] text-[#6C5CE7] font-semibold'
                  : 'text-[#687086] hover:bg-[#F5F3FF] hover:text-[#171A2B]'
              )}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  isActive ? 'text-[#6C5CE7]' : 'text-[#687086] group-hover:text-[#171A2B]'
                )}
              />
              {!isSidebarCollapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!isSidebarCollapsed && item.badge && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#F5F3FF] text-[#687086] border border-[#E5E3F2]">
                  {item.badge}
                </span>
              )}
              {!isSidebarCollapsed && item.alert && (
                <span className="flex h-2 w-2 rounded-full bg-[#F4A261]" title="Compliance Alert" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer status */}
      {!isSidebarCollapsed && (
        <div className="p-3 border-t border-[#E5E3F2] bg-[#F5F3FF]">
          <div className="flex items-center gap-2 text-[11px] text-[#687086]">
            <ShieldAlert className="h-3.5 w-3.5 text-[#18B887]" />
            <span>SIA Compliance: 98.4%</span>
          </div>
        </div>
      )}
    </aside>
  );
}
