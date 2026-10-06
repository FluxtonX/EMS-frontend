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

  const res = await fetch(`${API_BASE_URL}/notifications?${query.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.message || `Failed to fetch notifications (${res.status})`);
  }

  const json = await res.json();
  const data = json.data || json;
  return {
    items: data.items || (Array.isArray(data) ? data : []),
    total: data.total ?? (Array.isArray(data) ? data.length : 0),
    unreadCount: data.unreadCount ?? 0,
  };
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
    // network failure
  }
  return 0;
}

export async function markNotificationReadApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.message || 'Failed to mark notification as read');
  }
}

export async function markAllNotificationsReadApi(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.message || 'Failed to mark all notifications as read');
  }
}

export async function deleteNotificationApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/notifications/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.message || 'Failed to delete notification');
  }
}

export async function scanLicencesApi(): Promise<{ scanned: number; alertsCreated: number }> {
  const res = await fetch(`${API_BASE_URL}/notifications/scan-licences`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.message || 'Licence scan failed');
  }
  const json = await res.json();
  return json.data || json;
}
