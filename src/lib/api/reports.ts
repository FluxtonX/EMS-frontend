import { apiCache } from '@/lib/cache/apiCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

import { getAuthHeaders } from './authHeaders';

export type ReportType =
  | 'employees'
  | 'attendance'
  | 'shifts'
  | 'hours'
  | 'absences'
  | 'licences'
  | 'assignments';

export interface ReportResult {
  type: ReportType;
  generatedAt: string;
  filters: {
    startDate?: string;
    endDate?: string;
    siteId?: string;
    employeeId?: string;
  };
  summary: Record<string, number | string>;
  rows: Record<string, any>[];
}

export interface GenerateReportPayload {
  type: ReportType;
  startDate?: string;
  endDate?: string;
  siteId?: string;
  employeeId?: string;
  format?: 'json' | 'csv';
}

export async function generateReportApi(payload: GenerateReportPayload): Promise<ReportResult> {
  const cacheKey = `reports:${JSON.stringify(payload)}`;

  return apiCache.withCache(
    cacheKey,
    async () => {
      const res = await fetch(`${API_BASE_URL}/reports/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || 'Failed to generate report');
      }
      const json = await res.json();
      return json.data;
    },
    { ttlMs: 3 * 60 * 1000 }
  );
}

export async function downloadReportCSV(payload: GenerateReportPayload): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/reports/generate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ...payload, format: 'csv' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to export report');
  }
  const blob = await res.blob();
  const filename = `${payload.type}-report-${new Date().toISOString().split('T')[0]}.csv`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
