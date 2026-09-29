import { Employee, PaginatedEmployeesResponse } from '@/types/employee';

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

  const res = await fetch(`${API_BASE_URL}/employees?${query.toString()}`, {
    headers: getAuthHeaders(params.token),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to fetch employees.');
  }

  const json = await res.json();
  return json.data;
}

export async function fetchEmployeeById(id: string, token?: string): Promise<Employee> {
  const res = await fetch(`${API_BASE_URL}/employees/${id}`, {
    headers: getAuthHeaders(token),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || `Failed to fetch employee ${id}`);
  }

  const json = await res.json();
  return json.data;
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

  const json = await res.json();
  return json.data;
}
