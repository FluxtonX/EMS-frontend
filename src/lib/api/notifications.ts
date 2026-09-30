const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    try {
      const session = localStorage.getItem('workforce_auth_session');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed.accessToken) headers['Authorization'] = `Bearer ${parsed.accessToken}`;
      }
    } catch { /* noop */ }
  }
  return headers;
}

export type NotificationType =
  | 'licence_expiry'
  | 'shift_assigned'
  | 'shift_reminder'
  | 'leave_decision'
  | 'account_event'
  | 'compliance_alert'
  | 'system';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface NotificationItem {
  id: string;
  companyId: string;
  userId?: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  actionUrl?: string;
  metadata?: Record<string, any>;
  emailSent: boolean;
  emailSentAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsListResponse {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
}

export const FALLBACK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    companyId: 'comp-1',
    title: 'SIA Door Supervision Licence Expiring Soon',
    message: 'Security Officer David Brown SIA licence (#1002-8849-1120-4491) expires in 14 days. Renewal verification required.',
    type: 'licence_expiry',
    priority: 'high',
    status: 'unread',
    actionUrl: '/compliance',
    metadata: { employeeName: 'David Brown', licenceNumber: '1002-8849-1120-4491', daysRemaining: 14 },
    emailSent: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'notif-2',
    companyId: 'comp-1',
    title: 'Upcoming Shift Reminder — Tomorrow 06:00',
    message: 'Shift assigned at Westfield London (Job: Static Guard) starting tomorrow 06:00 to 18:00.',
    type: 'shift_reminder',
    priority: 'normal',
    status: 'unread',
    actionUrl: '/shifts',
    metadata: { siteName: 'Westfield London', startTime: '06:00', endTime: '18:00' },
    emailSent: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
  },
  {
    id: 'notif-3',
    companyId: 'comp-1',
    title: 'Leave Request Approved',
    message: 'Annual leave request for Sarah Jenkins (3 working days: 14 Oct - 16 Oct) has been approved by Operations Manager.',
    type: 'leave_decision',
    priority: 'normal',
    status: 'read',
    actionUrl: '/leave',
    metadata: { employeeName: 'Sarah Jenkins', leaveType: 'annual', days: 3 },
    emailSent: true,
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: 'notif-4',
    companyId: 'comp-1',
    title: 'Compliance Alert: CCTV Operator Licence Expired',
    message: 'Employee Michael Roberts CCTV Licence (#0019-3382-7711-2041) expired yesterday. Shift allocation blocked.',
    type: 'compliance_alert',
    priority: 'urgent',
    status: 'unread',
    actionUrl: '/compliance',
    metadata: { employeeName: 'Michael Roberts', licenceNumber: '0019-3382-7711-2041' },
    emailSent: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
  },
];

export async function fetchNotificationsApi(params?: {
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<NotificationsListResponse> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.type && params.type !== 'all') query.set('type', params.type);
  if (params?.limit) query.set('limit', params.limit.toString());
  if (params?.offset) query.set('offset', params.offset.toString());

  try {
    const res = await fetch(`${API_BASE_URL}/notifications?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data || json;
    }
  } catch {
    // offline or backend issue fallback
  }

  // Fallback to local data
  let filtered = [...FALLBACK_NOTIFICATIONS];
  if (params?.status && params.status !== 'all') {
    filtered = filtered.filter((n) => n.status === params.status);
  }
  if (params?.type && params.type !== 'all') {
    filtered = filtered.filter((n) => n.type === params.type);
  }
  const unreadCount = FALLBACK_NOTIFICATIONS.filter((n) => n.status === 'unread').length;
  return { items: filtered, total: filtered.length, unreadCount };
}

export async function fetchUnreadCountApi(): Promise<number> {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data?.unreadCount ?? json.unreadCount ?? 0;
    }
  } catch {
    // fallback
  }
  return FALLBACK_NOTIFICATIONS.filter((n) => n.status === 'unread').length;
}

export async function markNotificationReadApi(id: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
  } catch {
    // fallback local
    const item = FALLBACK_NOTIFICATIONS.find((n) => n.id === id);
    if (item) item.status = 'read';
  }
}

export async function markAllNotificationsReadApi(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch {
    // fallback local
    FALLBACK_NOTIFICATIONS.forEach((n) => (n.status = 'read'));
  }
}

export async function deleteNotificationApi(id: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  } catch {
    // fallback local
    const idx = FALLBACK_NOTIFICATIONS.findIndex((n) => n.id === id);
    if (idx !== -1) FALLBACK_NOTIFICATIONS.splice(idx, 1);
  }
}

export async function scanLicencesApi(): Promise<{ scanned: number; alertsCreated: number }> {
  const res = await fetch(`${API_BASE_URL}/notifications/scan-licences`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Licence scan failed');
  }
  const json = await res.json();
  return json.data || json;
}
