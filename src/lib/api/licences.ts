import {
  EmployeeLicence,
  ComplianceSummary,
  CreateLicencePayload,
  UpdateLicencePayload,
} from '@/types/licence';
import { apiCache } from '@/lib/cache/apiCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

import { getAuthHeaders } from './authHeaders';

export async function fetchComplianceSummaryApi(): Promise<ComplianceSummary> {
  return apiCache.withCache(
    'licences:compliance-summary',
    async () => {
      const res = await fetch(`${API_BASE_URL}/licences/compliance-summary`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to fetch compliance summary.');
      }
      const json = await res.json();
      return json.data || json;
    },
    { ttlMs: 5 * 60 * 1000 }
  );
}

export async function fetchLicencesApi(params: {
  status?: string;
  employeeId?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ items: EmployeeLicence[]; total: number; page: number; totalPages: number }> {
  const url = new URL(`${API_BASE_URL}/licences`);
  if (params.status && params.status !== 'all') url.searchParams.append('status', params.status);
  if (params.employeeId) url.searchParams.append('employeeId', params.employeeId);
  if (params.search) url.searchParams.append('search', params.search);
  if (params.page) url.searchParams.append('page', params.page.toString());
  if (params.limit) url.searchParams.append('limit', params.limit.toString());

  const cacheKey = `licences:list:${url.searchParams.toString()}`;

  return apiCache.withCache(
    cacheKey,
    async () => {
      const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to fetch licences.');
      }
      const json = await res.json();
      return json.data || json;
    },
    { ttlMs: 5 * 60 * 1000 }
  );
}

export async function fetchEmployeeLicencesApi(employeeId: string): Promise<EmployeeLicence[]> {
  const cacheKey = `licences:employee:${employeeId}`;

  return apiCache.withCache(
    cacheKey,
    async () => {
      const res = await fetch(`${API_BASE_URL}/employees/${employeeId}/licences`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to fetch employee licences.');
      }
      const json = await res.json();
      return json.data || json;
    },
    { ttlMs: 5 * 60 * 1000 }
  );
}

export async function createEmployeeLicenceApi(
  employeeId: string,
  payload: CreateLicencePayload
): Promise<EmployeeLicence> {
  const res = await fetch(`${API_BASE_URL}/employees/${employeeId}/licences`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to create licence.');
  }
  apiCache.invalidate('licences');
  const json = await res.json();
  return json.data || json;
}

export async function updateLicenceApi(
  id: string,
  payload: UpdateLicencePayload
): Promise<EmployeeLicence> {
  const res = await fetch(`${API_BASE_URL}/licences/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to update licence.');
  }
  apiCache.invalidate('licences');
  const json = await res.json();
  return json.data || json;
}

export async function verifyLicenceApi(
  id: string,
  status: string
): Promise<EmployeeLicence> {
  const res = await fetch(`${API_BASE_URL}/licences/${id}/verify`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to verify licence.');
  }
  apiCache.invalidate('licences');
  const json = await res.json();
  return json.data || json;
}

export async function deleteLicenceApi(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/licences/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to delete licence.');
  }
  apiCache.invalidate('licences');
  return true;
}
