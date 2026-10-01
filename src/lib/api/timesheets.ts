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

export const FALLBACK_TIMESHEETS: Timesheet[] = [
  {
    id: 'ts-001',
    companyId: '00000000-0000-0000-0000-000000000001',
    employeeId: 'emp-001',
    periodStart: '2026-09-22',
    periodEnd: '2026-09-28',
    totalHours: 42.5,
    regularHours: 40.0,
    overtimeHours: 2.5,
    breakMinutes: 250,
    grossPay: 662.5,
    currency: 'GBP',
    status: 'submitted',
    notes: 'Includes 2.5h overtime during emergency weekend deployment at Canary Wharf Tower.',
    createdAt: '2026-09-29T08:00:00Z',
    updatedAt: '2026-09-29T08:00:00Z',
    employee: {
      id: 'emp-001',
      employeeNumber: 'EMP-08572',
      firstName: 'David',
      lastName: 'Brown',
      email: 'david.brown@workforce.co.uk',
    },
    entries: [
      {
        id: 'entry-101',
        timesheetId: 'ts-001',
        siteId: 'site-001',
        siteName: 'Canary Wharf Tower A',
        entryDate: '2026-09-22',
        clockIn: '2026-09-22T08:00:00Z',
        clockOut: '2026-09-22T17:00:00Z',
        breakMinutes: 60,
        grossHours: 9.0,
        netHours: 8.0,
        payRate: 15.0,
        totalPay: 120.0,
        isOvertime: false,
        adjustmentMinutes: 0,
      },
      {
        id: 'entry-102',
        timesheetId: 'ts-001',
        siteId: 'site-001',
        siteName: 'Canary Wharf Tower A',
        entryDate: '2026-09-23',
        clockIn: '2026-09-23T08:00:00Z',
        clockOut: '2026-09-23T17:00:00Z',
        breakMinutes: 60,
        grossHours: 9.0,
        netHours: 8.0,
        payRate: 15.0,
        totalPay: 120.0,
        isOvertime: false,
        adjustmentMinutes: 0,
      },
      {
        id: 'entry-103',
        timesheetId: 'ts-001',
        siteId: 'site-001',
        siteName: 'Canary Wharf Tower A',
        entryDate: '2026-09-24',
        clockIn: '2026-09-24T08:00:00Z',
        clockOut: '2026-09-24T17:00:00Z',
        breakMinutes: 60,
        grossHours: 9.0,
        netHours: 8.0,
        payRate: 15.0,
        totalPay: 120.0,
        isOvertime: false,
        adjustmentMinutes: 0,
      },
      {
        id: 'entry-104',
        timesheetId: 'ts-001',
        siteId: 'site-001',
        siteName: 'Canary Wharf Tower A',
        entryDate: '2026-09-25',
        clockIn: '2026-09-25T08:00:00Z',
        clockOut: '2026-09-25T17:00:00Z',
        breakMinutes: 60,
        grossHours: 9.0,
        netHours: 8.0,
        payRate: 15.0,
        totalPay: 120.0,
        isOvertime: false,
        adjustmentMinutes: 0,
      },
      {
        id: 'entry-105',
        timesheetId: 'ts-001',
        siteId: 'site-001',
        siteName: 'Canary Wharf Tower A',
        entryDate: '2026-09-26',
        clockIn: '2026-09-26T08:00:00Z',
        clockOut: '2026-09-26T19:00:00Z', // 11h gross - 1h break = 10.5h net
        breakMinutes: 50,
        grossHours: 11.0,
        netHours: 10.5,
        payRate: 15.0,
        totalPay: 182.5, // 8h regular * 15 + 2.5h overtime * 22.5
        isOvertime: true,
        adjustmentMinutes: 30,
        adjustmentReason: 'Authorized perimeter sweep overtime by Site Supervisor',
        adjustedBy: 'Ops Supervisor',
      },
    ],
  },
  {
    id: 'ts-002',
    companyId: '00000000-0000-0000-0000-000000000001',
    employeeId: 'emp-002',
    periodStart: '2026-09-22',
    periodEnd: '2026-09-28',
    totalHours: 37.5,
    regularHours: 37.5,
    overtimeHours: 0.0,
    breakMinutes: 240,
    grossPay: 562.5,
    currency: 'GBP',
    status: 'approved',
    approvedBy: 'Operations Manager',
    approvedAt: '2026-09-29T10:15:00Z',
    notes: 'Regular scheduled shifts verified with geofence logs.',
    createdAt: '2026-09-29T08:10:00Z',
    updatedAt: '2026-09-29T10:15:00Z',
    employee: {
      id: 'emp-002',
      employeeNumber: 'EMP-08573',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'sarah.jenkins@workforce.co.uk',
    },
    entries: [
      {
        id: 'entry-201',
        timesheetId: 'ts-002',
        siteId: 'site-002',
        siteName: 'Mayfair Retail Complex',
        entryDate: '2026-09-22',
        clockIn: '2026-09-22T09:00:00Z',
        clockOut: '2026-09-22T17:00:00Z',
        breakMinutes: 45,
        grossHours: 8.0,
        netHours: 7.25,
        payRate: 15.0,
        totalPay: 108.75,
        isOvertime: false,
        adjustmentMinutes: 0,
      },
      {
        id: 'entry-202',
        timesheetId: 'ts-002',
        siteId: 'site-002',
        siteName: 'Mayfair Retail Complex',
        entryDate: '2026-09-23',
        clockIn: '2026-09-23T09:00:00Z',
        clockOut: '2026-09-23T17:30:00Z',
        breakMinutes: 45,
        grossHours: 8.5,
        netHours: 7.75,
        payRate: 15.0,
        totalPay: 116.25,
        isOvertime: false,
        adjustmentMinutes: 0,
      },
    ],
  },
  {
    id: 'ts-003',
    companyId: '00000000-0000-0000-0000-000000000001',
    employeeId: 'emp-003',
    periodStart: '2026-09-15',
    periodEnd: '2026-09-21',
    totalHours: 40.0,
    regularHours: 40.0,
    overtimeHours: 0.0,
    breakMinutes: 300,
    grossPay: 640.0,
    currency: 'GBP',
    status: 'locked',
    approvedBy: 'Finance Controller',
    approvedAt: '2026-09-22T14:00:00Z',
    notes: 'Finalized for UK BACS payroll export batch #2026-W38.',
    createdAt: '2026-09-22T08:00:00Z',
    updatedAt: '2026-09-22T14:00:00Z',
    employee: {
      id: 'emp-003',
      employeeNumber: 'EMP-08574',
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael.chen@workforce.co.uk',
    },
  },
];

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
      try {
        const res = await fetch(`${API_BASE_URL}/timesheets?${q.toString()}`, {
          headers: getAuthHeaders(),
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch timesheets: ${res.statusText}`);
        }

        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
        return FALLBACK_TIMESHEETS;
      } catch (err) {
        console.warn('Backend timesheets fetch failed, using fallback data:', err);
        return FALLBACK_TIMESHEETS;
      }
    },
    { ttlMs: 5 * 60 * 1000 }
  );
}

export async function fetchTimesheetByIdApi(id: string): Promise<Timesheet> {
  const cacheKey = `timesheets:detail:${id}`;

  return apiCache.withCache(
    cacheKey,
    async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/timesheets/${id}`, {
          headers: getAuthHeaders(),
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch timesheet: ${res.statusText}`);
        }

        return await res.json();
      } catch (err) {
        console.warn(`Backend fetch timesheet ${id} failed, using fallback:`, err);
        const fallback = FALLBACK_TIMESHEETS.find((ts) => ts.id === id);
        if (fallback) return fallback;
        throw err;
      }
    },
    { ttlMs: 5 * 60 * 1000 }
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
