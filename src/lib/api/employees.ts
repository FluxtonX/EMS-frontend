import { Employee, PaginatedEmployeesResponse } from '@/types/employee';
import { apiCache } from '@/lib/cache/apiCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

import { getAuthHeaders } from './authHeaders';

export async function fetchEmployees(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  token?: string;
}): Promise<PaginatedEmployeesResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.search) query.set('search', params.search);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const cacheKey = `employees:list:${query.toString()}`;

  return apiCache.withCache(
    cacheKey,
    async () => {
      const res = await fetch(`${API_BASE_URL}/employees?${query.toString()}`, {
        headers: getAuthHeaders(params.token),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || 'Failed to fetch employees.');
      }

      const json = await res.json();
      return json.data;
    },
    { ttlMs: 30 * 1000 }
  );
}

export async function fetchEmployeeById(id: string, token?: string): Promise<Employee> {
  const cacheKey = `employees:detail:${id}`;

  return apiCache.withCache(
    cacheKey,
    async () => {
      const res = await fetch(`${API_BASE_URL}/employees/${id}`, {
        headers: getAuthHeaders(token),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || `Failed to fetch employee ${id}`);
      }

      const json = await res.json();
      return json.data;
    },
    { ttlMs: 30 * 1000 }
  );
}

export async function createEmployeeApi(data: any, token?: string): Promise<Employee> {
  const res = await fetch(`${API_BASE_URL}/employees`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to create employee record.');
  }

  apiCache.invalidate('employees');
  const json = await res.json();
  return json.data;
}

export async function updateEmployeeApi(id: string, data: any, token?: string): Promise<Employee> {
  const res = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to update employee record.');
  }

  apiCache.invalidate('employees');
  const json = await res.json();
  return json.data;
}

export async function onboardEmployeeApi(data: any, token?: string): Promise<{
  message: string;
  employee: Employee;
  licence?: any;
  assignment?: any;
  invitation?: any;
}> {
  const res = await fetch(`${API_BASE_URL}/employees/onboard`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.message || errorJson?.error?.message || 'Failed to onboard employee.');
  }

  apiCache.invalidate('employees');
  const json = await res.json();
  return json.data || json;
}

export async function resendEmployeeInviteApi(id: string, token?: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/employees/${id}/resend-invite`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.message || errorJson?.error?.message || 'Failed to resend invitation.');
  }

  apiCache.invalidate('employees');
  const json = await res.json();
  return json.data || json;
}

