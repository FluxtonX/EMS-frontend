import {
  AttendanceRecord,
  ClockInPayload,
  ClockOutPayload,
  ReconcilePayload,
} from '@/types/attendance';
import { apiCache } from '@/lib/cache/apiCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function getAuthHeaders(token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (typeof window !== 'undefined') {
    try {
      const session = localStorage.getItem('workforce_auth_session');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed.accessToken) {
          headers['Authorization'] = `Bearer ${parsed.accessToken}`;
        }
      }
    } catch {
      // Fallback
    }
  }
  return headers;
}

export async function fetchAttendanceRecordsApi(params: {
  employeeId?: string;
  siteId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  varianceFlag?: string;
} = {}): Promise<AttendanceRecord[]> {
  const url = new URL(`${API_BASE_URL}/attendance`);
  if (params.employeeId) url.searchParams.append('employeeId', params.employeeId);
  if (params.siteId) url.searchParams.append('siteId', params.siteId);
  if (params.startDate) url.searchParams.append('startDate', params.startDate);
  if (params.endDate) url.searchParams.append('endDate', params.endDate);
  if (params.status && params.status !== 'all') url.searchParams.append('status', params.status);
  if (params.varianceFlag && params.varianceFlag !== 'all')
    url.searchParams.append('varianceFlag', params.varianceFlag);

  const cacheKey = `attendance:records:${url.searchParams.toString()}`;

  return apiCache.withCache(
    cacheKey,
    async () => {
      const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || 'Failed to fetch attendance records.');
      }
      const json = await res.json();
      return json.data;
    },
    { ttlMs: 2 * 60 * 1000 }
  );
}

export async function clockInApi(payload: ClockInPayload): Promise<AttendanceRecord> {
  const res = await fetch(`${API_BASE_URL}/attendance/clock-in`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to clock in.');
  }
  apiCache.invalidate('attendance');
  const json = await res.json();
  return json.data;
}

export async function startBreakApi(id: string): Promise<AttendanceRecord> {
  const res = await fetch(`${API_BASE_URL}/attendance/${id}/break/start`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to start break.');
  }
  apiCache.invalidate('attendance');
  const json = await res.json();
  return json.data;
}

export async function endBreakApi(id: string): Promise<AttendanceRecord> {
  const res = await fetch(`${API_BASE_URL}/attendance/${id}/break/end`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to end break.');
  }
  apiCache.invalidate('attendance');
  const json = await res.json();
  return json.data;
}

export async function clockOutApi(id: string, payload: ClockOutPayload): Promise<AttendanceRecord> {
  const res = await fetch(`${API_BASE_URL}/attendance/${id}/clock-out`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to clock out.');
  }
  apiCache.invalidate('attendance');
  const json = await res.json();
  return json.data;
}

export async function reconcileAttendanceApi(
  id: string,
  payload: ReconcilePayload
): Promise<AttendanceRecord> {
  const res = await fetch(`${API_BASE_URL}/attendance/${id}/reconcile`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to reconcile attendance.');
  }
  apiCache.invalidate('attendance');
  const json = await res.json();
  return json.data;
}
