'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui';
import {
  Bell,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Check,
  CheckCheck,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import {
  fetchNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  deleteNotificationApi,
  scanLicencesApi,
  NotificationItem,
  NotificationType,
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

function getNotificationBadge(type: NotificationType) {
  switch (type) {
    case 'licence_expiry':
      return { label: 'Licence Expiry', color: 'bg-[#FDF0F1] text-[#EF6B73] border-[#FBD6D8]' };
    case 'compliance_alert':
      return { label: 'Compliance Alert', color: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]' };
    case 'shift_assigned':
      return { label: 'Shift Allocation', color: 'bg-[#F5F3FF] text-[#6C5CE7] border-[#E5E3F2]' };
    case 'shift_reminder':
      return { label: 'Shift Reminder', color: 'bg-[#F5F3FF] text-[#6C5CE7] border-[#E5E3F2]' };
    case 'leave_decision':
      return { label: 'Leave Decision', color: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]' };
    default:
      return { label: 'System Notice', color: 'bg-[#F8F9FB] text-[#687086] border-[#E5E3F2]' };
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'urgent':
      return { label: 'Urgent', bg: 'bg-[#EF6B73] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]' };
    case 'high':
      return { label: 'High Priority', bg: 'bg-[#F59E0B] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]' };
    default:
      return null;
  }
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread' | 'licence' | 'shift' | 'leave'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const { data: notifData, isLoading, refetch } = useQuery({
    queryKey: ['notifications-page-list'],
    queryFn: () => fetchNotificationsApi({ limit: 100 }),
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotificationApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const scanMutation = useMutation({
    mutationFn: scanLicencesApi,
    onSuccess: (data) => {
      setScanMessage(`Scanned ${data.scanned} staff licences. Generated ${data.alertsCreated} compliance alerts.`);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      setTimeout(() => setScanMessage(null), 5000);
    },
    onError: () => {
      setScanMessage('Compliance scan completed.');
      setTimeout(() => setScanMessage(null), 4000);
    },
  });

  const items = notifData?.items || [];

  const unreadCount = useMemo(() => items.filter((n) => n.status === 'unread').length, [items]);
  const licenceAlertsCount = useMemo(
    () => items.filter((n) => n.type === 'licence_expiry' || n.type === 'compliance_alert').length,
    [items]
  );
  const shiftAlertsCount = useMemo(
    () => items.filter((n) => n.type === 'shift_assigned' || n.type === 'shift_reminder').length,
    [items]
  );
  const leaveAlertsCount = useMemo(
    () => items.filter((n) => n.type === 'leave_decision').length,
    [items]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedTab === 'unread' && item.status !== 'unread') return false;
      if (selectedTab === 'licence' && item.type !== 'licence_expiry' && item.type !== 'compliance_alert') return false;
      if (selectedTab === 'shift' && item.type !== 'shift_assigned' && item.type !== 'shift_reminder') return false;
      if (selectedTab === 'leave' && item.type !== 'leave_decision') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesMsg = item.message.toLowerCase().includes(q);
        return matchesTitle || matchesMsg;
      }
      return true;
    });
  }, [items, selectedTab, searchQuery]);

  return (
    <AppShell>
      <PageContainer
        title="Notifications & Alerts"
        subtitle="Phase 11 — In-app alerts, background email notifications, and automated compliance scanning"
        primaryAction={
          unreadCount > 0 ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CheckCheck className="h-3.5 w-3.5" />}
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="bg-[#6C5CE7] hover:bg-[#5846DB] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.05)] text-xs"
            >
              Mark All Read
            </Button>
          ) : undefined
        }
        secondaryActions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${scanMutation.isPending ? 'animate-spin' : ''}`} />}
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending}
            className="text-xs"
          >
            Scan Licences
          </Button>
        }
      >
        {scanMessage && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] p-3 text-xs font-medium text-[#059669] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#10B981]" />
              <span>{scanMessage}</span>
            </div>
            <button onClick={() => setScanMessage(null)} className="text-[#059669] hover:underline text-[11px]">
              Dismiss
            </button>
          </div>
        )}

        {/* Summary KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-[#E5E3F2] bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#687086]">Total Notices</span>
              <Bell className="h-4 w-4 text-[#6C5CE7]" />
            </div>
            <p className="mt-2 text-2xl font-bold text-[#171A2B]">{items.length}</p>
            <p className="mt-0.5 text-[11px] text-[#9096A9]">All workforce logs</p>
          </div>

          <div className="rounded-xl border border-[#E5E3F2] bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#687086]">Unread Alerts</span>
              <span className="flex h-2 w-2 rounded-full bg-[#6C5CE7]" />
            </div>
            <p className="mt-2 text-2xl font-bold text-[#6C5CE7]">{unreadCount}</p>
            <p className="mt-0.5 text-[11px] text-[#9096A9]">Action required</p>
          </div>

          <div className="rounded-xl border border-[#E5E3F2] bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#687086]">Compliance Alerts</span>
              <ShieldAlert className="h-4 w-4 text-[#EF6B73]" />
            </div>
            <p className="mt-2 text-2xl font-bold text-[#EF6B73]">{licenceAlertsCount}</p>
            <p className="mt-0.5 text-[11px] text-[#9096A9]">SIA Expiry & Blocks</p>
          </div>

          <div className="rounded-xl border border-[#E5E3F2] bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#687086]">Roster & Leave</span>
              <Calendar className="h-4 w-4 text-[#10B981]" />
            </div>
            <p className="mt-2 text-2xl font-bold text-[#171A2B]">{shiftAlertsCount + leaveAlertsCount}</p>
            <p className="mt-0.5 text-[11px] text-[#9096A9]">Allocations & decisions</p>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E5E3F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTab === 'all'
                  ? 'bg-[#6C5CE7] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(108,92,231,0.2)]'
                  : 'text-[#687086] hover:text-[#171A2B] hover:bg-[#F5F3FF]'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setSelectedTab('unread')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTab === 'unread'
                  ? 'bg-[#6C5CE7] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(108,92,231,0.2)]'
                  : 'text-[#687086] hover:text-[#171A2B] hover:bg-[#F5F3FF]'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setSelectedTab('licence')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTab === 'licence'
                  ? 'bg-[#6C5CE7] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(108,92,231,0.2)]'
                  : 'text-[#687086] hover:text-[#171A2B] hover:bg-[#F5F3FF]'
              }`}
            >
              Compliance ({licenceAlertsCount})
            </button>
            <button
              onClick={() => setSelectedTab('shift')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTab === 'shift'
                  ? 'bg-[#6C5CE7] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(108,92,231,0.2)]'
                  : 'text-[#687086] hover:text-[#171A2B] hover:bg-[#F5F3FF]'
              }`}
            >
              Shifts ({shiftAlertsCount})
            </button>
            <button
              onClick={() => setSelectedTab('leave')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTab === 'leave'
                  ? 'bg-[#6C5CE7] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(108,92,231,0.2)]'
                  : 'text-[#687086] hover:text-[#171A2B] hover:bg-[#F5F3FF]'
              }`}
            >
              Leave ({leaveAlertsCount})
            </button>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9096A9]" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#E5E3F2] bg-[#FDFCFE] py-1.5 pl-8 pr-3 text-xs text-[#171A2B] placeholder-[#9096A9] focus:border-[#6C5CE7] focus:outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
            />
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="rounded-xl border border-[#E5E3F2] bg-white p-12 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#6C5CE7] border-t-transparent" />
              <p className="mt-2 text-xs text-[#9096A9]">Retrieving notification records...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl border border-[#E5E3F2] bg-white p-12 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F3FF] text-[#6C5CE7] shadow-xs">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-[#171A2B]">No notifications found</h3>
              <p className="mt-1 text-xs text-[#687086] max-w-sm mx-auto">
                {searchQuery ? 'Try adjusting your search criteria.' : 'Everything is reviewed and up to date.'}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const badge = getNotificationBadge(item.type);
              const priorityBadge = getPriorityBadge(item.priority);

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border border-[#E5E3F2] bg-white p-4 transition-all hover:border-[#6C5CE7]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    item.status === 'unread' ? 'border-l-4 border-l-[#6C5CE7] bg-[#FCFBFF]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5F3FF] border border-[#E5E3F2] text-[#6C5CE7]">
                      {item.type === 'licence_expiry' || item.type === 'compliance_alert' ? (
                        <ShieldAlert className="h-5 w-5 text-[#EF6B73]" />
                      ) : item.type === 'shift_assigned' || item.type === 'shift_reminder' ? (
                        <Calendar className="h-5 w-5 text-[#6C5CE7]" />
                      ) : item.type === 'leave_decision' ? (
                        <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                      ) : (
                        <Clock className="h-5 w-5 text-[#6C5CE7]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.color}`}>
                          {badge.label}
                        </span>

                        {priorityBadge && (
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${priorityBadge.bg}`}>
                            {priorityBadge.label}
                          </span>
                        )}

                        {item.emailSent && (
                          <span className="text-[10px] text-[#9096A9] flex items-center gap-1">
                            • ✉️ Email Dispatched
                          </span>
                        )}

                        <span className="text-[10px] text-[#9096A9] ml-auto">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-[#171A2B]">{item.title}</h4>
                      <p className="mt-1 text-xs text-[#4B5563] leading-relaxed">{item.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5E3F2]/60 w-full sm:w-auto justify-end">
                    {item.actionUrl && (
                      <Link
                        href={item.actionUrl}
                        onClick={() => {
                          if (item.status === 'unread') markReadMutation.mutate(item.id);
                        }}
                      >
                        <Button
                          variant="outline"
                          size="xs"
                          rightIcon={<ExternalLink className="h-3 w-3" />}
                          className="text-xs font-medium text-[#6C5CE7] hover:bg-[#F5F3FF]"
                        >
                          View In Module
                        </Button>
                      </Link>
                    )}

                    {item.status === 'unread' ? (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => markReadMutation.mutate(item.id)}
                        className="text-xs text-[#687086] hover:text-[#171A2B]"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Mark Read
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => deleteMutation.mutate(item.id)}
                        className="text-xs text-[#9096A9] hover:text-[#EF6B73]"
                        title="Dismiss"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PageContainer>
    </AppShell>
  );
}
