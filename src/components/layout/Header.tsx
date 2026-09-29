'use client';

import React from 'react';
import Link from 'next/link';
import { useUIStore } from '@/lib/uiStore';
import { useAuth } from '@/lib/auth/AuthContext';
import { Menu, Bell, Shield, LogOut, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-[#E2E8F0] bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F1F5F9] text-xs font-semibold text-[#334155] border border-[#E2E8F0]">
            <Shield className="h-3.5 w-3.5 text-[#2563EB]" />
            <span>{company?.name || 'Apex Security Services UK'}</span>
          </div>
          <span className="hidden sm:inline-block text-xs text-[#94A3B8]">•</span>
          <span className="hidden sm:inline-block text-xs text-[#64748B]">{today}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative text-[#64748B] hover:text-[#0F172A]"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#DC2626]" />
        </Button>

        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-[#E2E8F0]">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2563EB] text-xs font-medium text-white select-none">
              {initials}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-[#0F172A] leading-tight">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] text-[#64748B] uppercase tracking-wider">
                {role || 'Operator'}
              </p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1 rounded text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors ml-1"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 pl-2 border-l border-[#E2E8F0]">
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
