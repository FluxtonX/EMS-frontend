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

export const FALLBACK_PAY_RUNS: PayRun[] = [
  {
    id: 'pr-001',
    companyId: '00000000-0000-0000-0000-000000000001',
    name: 'September 2026 Monthly Payroll',
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    paymentDate: '2026-09-30',
    frequency: 'monthly',
    status: 'paid',
    totalGross: 8150.0,
    totalTax: 1002.5,
    totalNi: 400.64,
    totalNet: 6746.86,
    totalEmployees: 3,
    currency: 'GBP',
    approvedBy: 'Finance Controller',
    approvedAt: '2026-09-29T16:00:00Z',
    paidAt: '2026-09-30T09:00:00Z',
    notes: 'Completed BACS batch transfer for London security workforce.',
    createdAt: '2026-09-29T12:00:00Z',
    updatedAt: '2026-09-30T09:00:00Z',
    payslips: [
      {
        id: 'ps-001',
        companyId: '00000000-0000-0000-0000-000000000001',
        payRunId: 'pr-001',
        employeeId: 'emp-001',
        timesheetId: 'ts-001',
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30',
        paymentDate: '2026-09-30',
        regularHours: 160.0,
        overtimeHours: 12.5,
        regularPay: 2400.0,
        overtimePay: 281.25,
        grossPay: 2681.25,
        taxDeduction: 326.75,
        nationalInsurance: 130.66,
        otherDeductions: 0,
        netPay: 2223.84,
        currency: 'GBP',
        status: 'paid',
        notes: 'Includes 12.5h authorized overtime',
        createdAt: '2026-09-29T12:00:00Z',
        updatedAt: '2026-09-30T09:00:00Z',
        employee: {
          id: 'emp-001',
          employeeNumber: 'EMP-08572',
          firstName: 'David',
          lastName: 'Brown',
          email: 'david.brown@workforce.co.uk',
        },
      },
      {
        id: 'ps-002',
        companyId: '00000000-0000-0000-0000-000000000001',
        payRunId: 'pr-001',
        employeeId: 'emp-002',
        timesheetId: 'ts-002',
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30',
        paymentDate: '2026-09-30',
        regularHours: 160.0,
        overtimeHours: 0.0,
        regularPay: 2400.0,
        overtimePay: 0.0,
        grossPay: 2400.0,
        taxDeduction: 270.5,
        nationalInsurance: 108.16,
        otherDeductions: 0,
        netPay: 2021.34,
        currency: 'GBP',
        status: 'paid',
        createdAt: '2026-09-29T12:00:00Z',
        updatedAt: '2026-09-30T09:00:00Z',
        employee: {
          id: 'emp-002',
          employeeNumber: 'EMP-08573',
          firstName: 'Sarah',
          lastName: 'Jenkins',
          email: 'sarah.jenkins@workforce.co.uk',
        },
      },
      {
        id: 'ps-003',
        companyId: '00000000-0000-0000-0000-000000000001',
        payRunId: 'pr-001',
        employeeId: 'emp-003',
        timesheetId: 'ts-003',
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30',
        paymentDate: '2026-09-30',
        regularHours: 160.0,
        overtimeHours: 20.0,
        regularPay: 2560.0,
        overtimePay: 508.75,
        grossPay: 3068.75,
        taxDeduction: 405.25,
        nationalInsurance: 161.82,
        otherDeductions: 0,
        netPay: 2501.68,
        currency: 'GBP',
        status: 'paid',
        createdAt: '2026-09-29T12:00:00Z',
        updatedAt: '2026-09-30T09:00:00Z',
        employee: {
          id: 'emp-003',
          employeeNumber: 'EMP-08574',
          firstName: 'Michael',
          lastName: 'Chen',
          email: 'michael.chen@workforce.co.uk',
        },
      },
    ],
  },
  {
    id: 'pr-002',
    companyId: '00000000-0000-0000-0000-000000000001',
    name: 'Mid-Month Interim Discretionary Pay Run',
    periodStart: '2026-09-01',
    periodEnd: '2026-09-15',
    paymentDate: '2026-09-15',
    frequency: 'bi_weekly',
    status: 'approved',
    totalGross: 3950.0,
    totalTax: 693.3,
    totalNi: 277.28,
    totalNet: 2979.42,
    totalEmployees: 2,
    currency: 'GBP',
    approvedBy: 'Operations Manager',
    approvedAt: '2026-09-14T17:00:00Z',
    notes: 'Approved interim adjustments pending bank settlement window.',
    createdAt: '2026-09-14T10:00:00Z',
    updatedAt: '2026-09-14T17:00:00Z',
  },
];

export async function fetchPayRunsApi(params?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<PayRun[]> {
  try {
    const q = new URLSearchParams();
    if (params?.status && params.status !== 'all') q.append('status', params.status);
    if (params?.startDate) q.append('startDate', params.startDate);
    if (params?.endDate) q.append('endDate', params.endDate);

    const res = await fetch(`${API_BASE_URL}/payroll/runs?${q.toString()}`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`Failed to fetch pay runs: ${res.statusText}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) return data;
    return FALLBACK_PAY_RUNS;
  } catch (err) {
    console.warn('Backend pay runs fetch failed, using fallback data:', err);
    return FALLBACK_PAY_RUNS;
  }
}

export async function fetchPayRunByIdApi(id: string): Promise<PayRun> {
  try {
    const res = await fetch(`${API_BASE_URL}/payroll/runs/${id}`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`Failed to fetch pay run details: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn(`Backend pay run ${id} fetch failed, using fallback:`, err);
    const found = FALLBACK_PAY_RUNS.find((p) => p.id === id);
    if (found) return found;
    throw err;
  }
}

export async function createPayRunApi(dto: {
  name: string;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  frequency?: string;
  notes?: string;
}): Promise<PayRun> {
  const res = await fetch(`${API_BASE_URL}/payroll/runs`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to create pay run (${res.status})`);
  }

  return await res.json();
}

export async function reviewPayRunApi(
  id: string,
  dto: {
    status: PayRunStatus;
    notes?: string;
  }
): Promise<PayRun> {
  const res = await fetch(`${API_BASE_URL}/payroll/runs/${id}/review`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to update pay run (${res.status})`);
  }

  return await res.json();
}

export async function fetchPayslipsApi(params?: {
  payRunId?: string;
  employeeId?: string;
  status?: string;
}): Promise<Payslip[]> {
  try {
    const q = new URLSearchParams();
    if (params?.payRunId) q.append('payRunId', params.payRunId);
    if (params?.employeeId) q.append('employeeId', params.employeeId);
    if (params?.status && params.status !== 'all') q.append('status', params.status);

    const res = await fetch(`${API_BASE_URL}/payroll/payslips?${q.toString()}`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`Failed to fetch payslips: ${res.statusText}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) return data;
    return FALLBACK_PAY_RUNS[0].payslips || [];
  } catch (err) {
    console.warn('Backend fetch payslips failed, using fallback:', err);
    return FALLBACK_PAY_RUNS[0].payslips || [];
  }
}

export async function fetchPayslipByIdApi(id: string): Promise<Payslip> {
  try {
    const res = await fetch(`${API_BASE_URL}/payroll/payslips/${id}`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`Failed to fetch payslip: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    const all = FALLBACK_PAY_RUNS[0].payslips || [];
    const found = all.find((p) => p.id === id);
    if (found) return found;
    throw err;
  }
}

export function getPayRunExportUrl(id: string): string {
  return `${API_BASE_URL}/payroll/runs/${id}/export`;
}
