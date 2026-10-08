import { apiCache } from '@/lib/cache/apiCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

import { getAuthHeaders } from './authHeaders';

export type PayRunStatus = 'draft' | 'pending_approval' | 'approved' | 'paid' | 'cancelled';
export type PayFrequency = 'weekly' | 'bi_weekly' | 'monthly';
export type PayslipStatus = 'draft' | 'published' | 'paid';

export interface Payslip {
  id: string;
  companyId: string;
  payRunId: string;
  employeeId: string;
  timesheetId?: string;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  grossPay: number;
  taxDeduction: number;
  nationalInsurance: number;
  otherDeductions: number;
  netPay: number;
  currency: string;
  status: PayslipStatus;
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
}

export interface PayRun {
  id: string;
  companyId: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  frequency: PayFrequency;
  status: PayRunStatus;
  totalGross: number;
  totalTax: number;
  totalNi: number;
  totalNet: number;
  totalEmployees: number;
  currency: string;
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  payslips?: Payslip[];
}

export async function fetchPayRunsApi(params?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<PayRun[]> {
  const cacheKey = `payroll_runs_${params?.status || 'all'}_${params?.startDate || ''}_${params?.endDate || ''}`;
  return apiCache.withCache(cacheKey, async () => {
    const q = new URLSearchParams();
    if (params?.status && params.status !== 'all') q.append('status', params.status);
    if (params?.startDate) q.append('startDate', params.startDate);
    if (params?.endDate) q.append('endDate', params.endDate);

    const res = await fetch(`${API_BASE_URL}/payroll/runs?${q.toString()}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.message || `Failed to fetch pay runs: ${res.statusText}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : (data.data || []);
  }, { ttlMs: 30 * 1000 });
}

export async function fetchPayRunByIdApi(id: string): Promise<PayRun> {
  const cacheKey = `payroll_run_${id}`;
  return apiCache.withCache(cacheKey, async () => {
    const res = await fetch(`${API_BASE_URL}/payroll/runs/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.message || `Failed to fetch pay run details: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data || json;
  }, { ttlMs: 30 * 1000 });
}

export async function createPayRunApi(dto: {
  name: string;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  frequency?: string;
  notes?: string;
}): Promise<PayRun> {
  apiCache.invalidate('payroll');
  const res = await fetch(`${API_BASE_URL}/payroll/runs`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to create pay run (${res.status})`);
  }

  const result = await res.json();
  apiCache.invalidate('payroll');
  return result;
}

export async function reviewPayRunApi(
  id: string,
  dto: {
    status: PayRunStatus;
    notes?: string;
  }
): Promise<PayRun> {
  apiCache.invalidate('payroll');
  const res = await fetch(`${API_BASE_URL}/payroll/runs/${id}/review`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to update pay run (${res.status})`);
  }

  const result = await res.json();
  apiCache.invalidate('payroll');
  return result;
}

export async function fetchPayslipsApi(params?: {
  payRunId?: string;
  employeeId?: string;
  status?: string;
}): Promise<Payslip[]> {
  const cacheKey = `payroll_payslips_${params?.payRunId || ''}_${params?.employeeId || ''}_${params?.status || ''}`;
  return apiCache.withCache(cacheKey, async () => {
    const q = new URLSearchParams();
    if (params?.payRunId) q.append('payRunId', params.payRunId);
    if (params?.employeeId) q.append('employeeId', params.employeeId);
    if (params?.status && params.status !== 'all') q.append('status', params.status);

    const res = await fetch(`${API_BASE_URL}/payroll/payslips?${q.toString()}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.message || `Failed to fetch payslips: ${res.statusText}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : (data.data || []);
  }, { ttlMs: 30 * 1000 });
}

export async function fetchPayslipByIdApi(id: string): Promise<Payslip> {
  const cacheKey = `payroll_payslip_${id}`;
  return apiCache.withCache(cacheKey, async () => {
    const res = await fetch(`${API_BASE_URL}/payroll/payslips/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.message || `Failed to fetch payslip: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data || json;
  }, { ttlMs: 30 * 1000 });
}

export function getPayRunExportUrl(id: string): string {
  return `${API_BASE_URL}/payroll/runs/${id}/export`;
}
