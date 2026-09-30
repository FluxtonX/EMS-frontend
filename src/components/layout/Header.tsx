'use client';

import React from 'react';
import Link from 'next/link';
import { useUIStore } from '@/lib/uiStore';
import { useAuth } from '@/lib/auth/AuthContext';
import { Menu, Shield, LogOut, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NotificationBell } from './NotificationBell';

export function Header() {
  const { toggleSidebar } = useUIStore();
  const { user, company, role, logout } = useAuth();

  const today = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const initials = user
    ? `${user.firstName[0] || ''}${user.lastName[0] || ''}`.toUpperCase()
    : 'OP';

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-[#E5E3F2] bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded text-[#687086] hover:text-[#171A2B] hover:bg-[#F5F3FF] md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F5F3FF] text-xs font-semibold text-[#171A2B] border border-[#E5E3F2]">
            <Shield className="h-3.5 w-3.5 text-[#6C5CE7]" />
            <span>{company?.name || 'Apex Security Services UK'}</span>
          </div>
          <span className="hidden sm:inline-block text-xs text-[#9096A9]">•</span>
          <span className="hidden sm:inline-block text-xs text-[#687086]">{today}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />

        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-[#E5E3F2]">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6C5CE7] text-xs font-medium text-white select-none shadow-xs">
              {initials}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-[#171A2B] leading-tight">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] text-[#687086] uppercase tracking-wider">
                {role || 'Operator'}
              </p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1 rounded text-[#9096A9] hover:text-[#EF6B73] hover:bg-[#FDF0F1] transition-colors ml-1"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 pl-2 border-l border-[#E5E3F2]">
            <Link href="/login">
              <Button variant="outline" size="xs" leftIcon={<LogIn className="h-3 w-3" />}>
                Sign In
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
