import { apiCache } from '@/lib/cache/apiCache';

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

export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'locked';

export interface TimesheetEntry {
  id: string;
  timesheetId: string;
  attendanceRecordId?: string;
  shiftId?: string;
  siteId?: string;
  siteName?: string;
  entryDate: string;
  clockIn: string;
  clockOut: string;
  breakMinutes: number;
  grossHours: number;
  netHours: number;
  payRate: number;
  totalPay: number;
  isOvertime: boolean;
  adjustmentMinutes: number;
  adjustmentReason?: string;
  adjustedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Timesheet {
  id: string;
  companyId: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  breakMinutes: number;
  grossPay: number;
  currency: string;
  status: TimesheetStatus;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  entries?: TimesheetEntry[];
}

export async function fetchTimesheetsApi(params?: {
  employeeId?: string;
  status?: string;
  periodStart?: string;
  periodEnd?: string;
}): Promise<Timesheet[]> {
  const q = new URLSearchParams();
  if (params?.employeeId) q.append('employeeId', params.employeeId);
  if (params?.status && params.status !== 'all') q.append('status', params.status);
  if (params?.periodStart) q.append('periodStart', params.periodStart);
  if (params?.periodEnd) q.append('periodEnd', params.periodEnd);

  const cacheKey = `timesheets:list:${q.toString()}`;

  return apiCache.withCache(
    cacheKey,
    async () => {
      const res = await fetch(`${API_BASE_URL}/timesheets?${q.toString()}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.message || `Failed to fetch timesheets: ${res.statusText}`);
      }

      const data = await res.json();
      return Array.isArray(data) ? data : (data.data || []);
    },
    { ttlMs: 30 * 1000 }
  );
}

export async function fetchTimesheetByIdApi(id: string): Promise<Timesheet> {
  const cacheKey = `timesheets:detail:${id}`;

  return apiCache.withCache(
    cacheKey,
    async () => {
      const res = await fetch(`${API_BASE_URL}/timesheets/${id}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.message || `Failed to fetch timesheet: ${res.statusText}`);
      }

      const json = await res.json();
      return json.data || json;
    },
    { ttlMs: 30 * 1000 }
  );
}

export async function generateTimesheetsApi(dto: {
  periodStart: string;
  periodEnd: string;
  employeeId?: string;
}): Promise<{ generated: number; timesheets: Timesheet[] }> {
  const res = await fetch(`${API_BASE_URL}/timesheets/generate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to generate timesheets (${res.status})`);
  }

  apiCache.invalidate('timesheets');
  return await res.json();
}

export async function adjustTimesheetEntryApi(
  timesheetId: string,
  entryId: string,
  dto: {
    adjustmentMinutes: number;
    adjustmentReason: string;
  }
): Promise<TimesheetEntry> {
  const res = await fetch(
    `${API_BASE_URL}/timesheets/${timesheetId}/entries/${entryId}/adjust`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(dto),
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Adjustment failed (${res.status})`);
  }

  apiCache.invalidate('timesheets');
  return await res.json();
}

export async function reviewTimesheetApi(
  id: string,
  dto: {
    status: TimesheetStatus;
    notes?: string;
  }
): Promise<Timesheet> {
  const res = await fetch(`${API_BASE_URL}/timesheets/${id}/review`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Timesheet review failed (${res.status})`);
  }

  apiCache.invalidate('timesheets');
  return await res.json();
}
