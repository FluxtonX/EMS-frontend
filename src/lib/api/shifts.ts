import {
  Shift,
  CreateShiftInput,
  UpdateShiftInput,
  EligibleEmployee,
} from '@/types/shift';
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

export async function fetchShiftsApi(params: {
  siteId?: string;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
} = {}): Promise<Shift[]> {
  const url = new URL(`${API_BASE_URL}/shifts`);
  if (params.siteId) url.searchParams.append('siteId', params.siteId);
  if (params.employeeId) url.searchParams.append('employeeId', params.employeeId);
  if (params.startDate) url.searchParams.append('startDate', params.startDate);
  if (params.endDate) url.searchParams.append('endDate', params.endDate);
  if (params.status && params.status !== 'all') url.searchParams.append('status', params.status);

  const cacheKey = `shifts:list:${url.searchParams.toString()}`;

  return apiCache.withCache(
    cacheKey,
    async () => {
      const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || 'Failed to fetch shifts.');
      }
      const json = await res.json();
      return json.data;
    },
    { ttlMs: 3 * 60 * 1000 }
  );
}

export async function fetchShiftByIdApi(id: string): Promise<Shift> {
  const cacheKey = `shifts:detail:${id}`;

  return apiCache.withCache(
    cacheKey,
    async () => {
      const res = await fetch(`${API_BASE_URL}/shifts/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || 'Failed to fetch shift.');
      }
      const json = await res.json();
      return json.data;
    },
    { ttlMs: 3 * 60 * 1000 }
  );
}

export async function createShiftApi(payload: CreateShiftInput): Promise<Shift> {
  const res = await fetch(`${API_BASE_URL}/shifts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to create shift.');
  }
  apiCache.invalidate('shifts');
  const json = await res.json();
  return json.data;
}

export async function updateShiftApi(id: string, payload: UpdateShiftInput): Promise<Shift> {
  const res = await fetch(`${API_BASE_URL}/shifts/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to update shift.');
  }
  apiCache.invalidate('shifts');
  const json = await res.json();
  return json.data;
}

export async function deleteShiftApi(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/shifts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to delete shift.');
  }
  apiCache.invalidate('shifts');
  const json = await res.json();
  return json.data;
}

export async function fetchEligibleEmployeesApi(params: {
  siteId: string;
  siteJobId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
}): Promise<EligibleEmployee[]> {
  const url = new URL(`${API_BASE_URL}/shifts/eligible-employees`);
  url.searchParams.append('siteId', params.siteId);
  url.searchParams.append('siteJobId', params.siteJobId);
  url.searchParams.append('shiftDate', params.shiftDate);
  url.searchParams.append('startTime', params.startTime);
  url.searchParams.append('endTime', params.endTime);

  const cacheKey = `shifts:eligible:${url.searchParams.toString()}`;

  return apiCache.withCache(
    cacheKey,
    async () => {
      const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || 'Failed to fetch eligible employees.');
      }
      const json = await res.json();
      return json.data;
    },
    { ttlMs: 3 * 60 * 1000 }
  );
}
