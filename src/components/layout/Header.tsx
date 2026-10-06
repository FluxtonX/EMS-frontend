'use client';

import React from 'react';
import Link from 'next/link';
import { useUIStore } from '@/lib/uiStore';
import { useAuth } from '@/lib/auth/AuthContext';
import { Menu, Shield, LogOut, LogIn, Search, MessageSquare, Crown, Briefcase, Radio } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NotificationBell } from './NotificationBell';
import { useQuery } from '@tanstack/react-query';
import { fetchUnreadChatCount } from '@/lib/api/chat';

export function Header() {
  const [mounted, setMounted] = React.useState(false);
  const { toggleSidebar } = useUIStore();
  const { user, company, role, logout } = useAuth();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const today = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'OP'
    : 'OP';

  const normalizedRole = (role || 'OWNER').toUpperCase().trim();
  const portalTier = React.useMemo(() => {
    if (normalizedRole === 'OWNER' || normalizedRole === 'ADMIN') {
      return {
        label: 'Owner Portal',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-200/80 shadow-purple-500/10',
        icon: Crown,
      };
    }
    if (normalizedRole === 'MANAGER') {
      return {
        label: 'Operations Manager',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200/80 shadow-emerald-500/10',
        icon: Briefcase,
      };
    }
    if (normalizedRole === 'OPERATOR' || normalizedRole === 'SUPERVISOR') {
      return {
        label: 'Dispatch Operator',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200/80 shadow-amber-500/10',
        icon: Radio,
      };
    }
    return {
      label: 'Officer Portal',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200/80 shadow-blue-500/10',
      icon: Shield,
    };
  }, [normalizedRole]);

  // Live unread chat count
  const { data: unreadChatCount } = useQuery({
    queryKey: ['chat-unread-count'],
    queryFn: fetchUnreadChatCount,
    refetchInterval: 10000,
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-xl px-4 md:px-6 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
      {/* Left section: mobile hamburger + company / greeting */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 md:hidden transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F5F3FF] text-xs font-semibold text-[#171A2B] border border-[#E5E3F2] shadow-2xs">
            <Shield className="h-3.5 w-3.5 text-[#6C5CE7]" />
            <span className="font-semibold tracking-tight">{mounted && company?.name ? company.name : 'Apex Security Operations'}</span>
          </div>

          {/* Dynamic Visual Portal Tier Badge */}
          {mounted && (
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold tracking-wide uppercase border shadow-2xs transition-all ${portalTier.badgeClass}`}>
              <portalTier.icon className="h-3 w-3 shrink-0" />
              <span>{portalTier.label}</span>
            </div>
          )}

          <span className="hidden sm:inline-block text-xs font-medium text-[#9096A9]">•</span>
          <span suppressHydrationWarning className="hidden sm:inline-block text-xs font-medium text-[#687086]">{today}</span>
        </div>
      </div>

      {/* Middle search bar (Desktop) */}
      <div className="hidden md:flex items-center max-w-sm w-full mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9096A9]" />
          <input
            type="text"
            placeholder="Search employees, shifts, sites..."
            className="w-full pl-9 pr-12 py-1.5 text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-[#E5E3F2] rounded-xl text-[#171A2B] placeholder-[#9096A9] transition-all outline-none focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7]"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold text-[#9096A9] bg-white border border-[#E5E3F2] rounded shadow-2xs pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right actions: Chat, Notifications, Add Employee, User Profile */}
      <div className="flex items-center gap-2.5">
        {/* Quick Chat Shortcut Icon */}
        <Link
          href="/chat"
          className="relative p-2 rounded-xl text-[#687086] hover:text-[#6C5CE7] hover:bg-[#F5F3FF] transition-colors"
          title="Open Real-Time Chat"
        >
          <MessageSquare className="h-4 w-4" />
          {unreadChatCount && unreadChatCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#6C5CE7] px-1 text-[9px] font-bold text-white shadow-xs animate-bounce">
              {unreadChatCount}
            </span>
          ) : null}
        </Link>

        {/* Notifications */}
        <NotificationBell />

        {/* User Profile */}
        {mounted && user ? (
          <div className="flex items-center gap-2.5 pl-2 border-l border-[#E5E3F2]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6C5CE7] text-xs font-bold text-white shadow-xs ring-2 ring-white">
              {initials}
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-semibold text-[#171A2B] leading-tight">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] text-[#6C5CE7] font-semibold uppercase tracking-wider">
                {portalTier.label}
              </p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-0.5"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : mounted ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <Link href="/login">
              <Button variant="outline" size="xs" leftIcon={<LogIn className="h-3 w-3" />}>
                Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <div className="h-8 w-20 rounded-lg bg-slate-100/60" />
        )}
      </div>
    </header>
  );
}
