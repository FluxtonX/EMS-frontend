'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCheck,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  fetchNotificationsApi,
  fetchUnreadCountApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  NotificationItem,
} from '@/lib/api/notifications';

function formatRelativeTime(dateString: string): string {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  } catch {
    return 'Recent';
  }
}

function getNotificationIcon(type: string, priority: string) {
  if (type === 'licence_expiry' || type === 'compliance_alert') {
    return <ShieldAlert className={`h-4 w-4 ${priority === 'urgent' ? 'text-[#EF6B73]' : 'text-[#F59E0B]'}`} />;
  }
  if (type === 'shift_assigned' || type === 'shift_reminder') {
    return <Calendar className="h-4 w-4 text-[#6C5CE7]" />;
  }
  if (type === 'leave_decision') {
    return <CheckCircle2 className="h-4 w-4 text-[#10B981]" />;
  }
  return <Clock className="h-4 w-4 text-[#6C5CE7]" />;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: fetchUnreadCountApi,
    refetchInterval: 30000,
  });

  const { data: notifData, isLoading } = useQuery({
    queryKey: ['notifications-list', filter],
    queryFn: () => fetchNotificationsApi({ status: filter === 'unread' ? 'unread' : 'all', limit: 8 }),
    enabled: isOpen,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const items = notifData?.items || [];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative p-2 rounded-lg transition-all text-[#687086] hover:text-[#171A2B] hover:bg-[#F5F3FF] active:scale-95 ${
          isOpen ? 'bg-[#F5F3FF] text-[#6C5CE7]' : ''
        }`}
        aria-label="Notifications"
        title="View Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#6C5CE7] text-[10px] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.15)] ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications Menu"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#E5E3F2] bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between border-b border-[#E5E3F2] px-4 py-3 bg-[#FDFCFE]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#171A2B]">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#F5F3FF] text-[#6C5CE7] border border-[#E5E3F2] px-2 py-0.5 text-[11px] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="flex items-center gap-1 text-xs font-medium text-[#6C5CE7] hover:text-[#5846DB] transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex border-b border-[#E5E3F2] px-3 pt-2 gap-2 bg-white">
            <button
              onClick={() => setFilter('all')}
              className={`pb-2 px-2 text-xs font-medium border-b-2 transition-all ${
                filter === 'all'
                  ? 'border-[#6C5CE7] text-[#6C5CE7]'
                  : 'border-transparent text-[#687086] hover:text-[#171A2B]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`pb-2 px-2 text-xs font-medium border-b-2 transition-all ${
                filter === 'unread'
                  ? 'border-[#6C5CE7] text-[#6C5CE7]'
                  : 'border-transparent text-[#687086] hover:text-[#171A2B]'
              }`}
            >
              Unread {unreadCount > 0 ? `(${unreadCount})` : ''}
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-[#E5E3F2]/60">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#6C5CE7] border-t-transparent" />
                <p className="mt-2 text-xs text-[#9096A9]">Loading notifications...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F3FF] text-[#6C5CE7]">
                  <Check className="h-5 w-5" />
                </div>
                <p className="mt-2 text-xs font-semibold text-[#171A2B]">You're all caught up!</p>
                <p className="text-[11px] text-[#9096A9] mt-0.5">No notifications to review.</p>
              </div>
            ) : (
              items.map((item: NotificationItem) => (
                <div
                  key={item.id}
                  className={`p-3 transition-colors hover:bg-[#FDFCFE] flex gap-3 items-start relative ${
                    item.status === 'unread' ? 'bg-[#FAF9FF]' : ''
                  }`}
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F5F3FF] border border-[#E5E3F2]">
                    {getNotificationIcon(item.type, item.priority)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-[#171A2B] truncate">{item.title}</p>
                      <span className="text-[10px] text-[#9096A9] shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="mt-0.5 text-xs text-[#4B5563] line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="mt-2 flex items-center gap-3">
                      {item.actionUrl && (
                        <Link
                          href={item.actionUrl}
                          onClick={() => {
                            if (item.status === 'unread') markReadMutation.mutate(item.id);
                            setIsOpen(false);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6C5CE7] hover:text-[#5846DB] hover:underline"
                        >
                          <span>View Details</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}

                      {item.status === 'unread' && (
                        <button
                          onClick={() => markReadMutation.mutate(item.id)}
                          className="text-[11px] font-medium text-[#9096A9] hover:text-[#171A2B]"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>

                  {item.status === 'unread' && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#6C5CE7] shadow-xs mt-1" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Popover Footer */}
          <div className="border-t border-[#E5E3F2] p-2 bg-[#FDFCFE] text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-block w-full py-1.5 text-xs font-semibold text-[#6C5CE7] hover:text-[#5846DB] hover:bg-[#F5F3FF] rounded-lg transition-colors"
            >
              Open Full Notifications Center →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
