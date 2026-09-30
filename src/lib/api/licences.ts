import {
  EmployeeLicence,
  ComplianceSummary,
  CreateLicencePayload,
  UpdateLicencePayload,
} from '@/types/licence';

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

export async function fetchComplianceSummaryApi(): Promise<ComplianceSummary> {
  const res = await fetch(`${API_BASE_URL}/licences/compliance-summary`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to fetch compliance summary.');
  }
  const json = await res.json();
  return json.data || json;
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

  const res = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to fetch licences.');
  }
  const json = await res.json();
  return json.data || json;
}

export async function fetchEmployeeLicencesApi(employeeId: string): Promise<EmployeeLicence[]> {
  const res = await fetch(`${API_BASE_URL}/employees/${employeeId}/licences`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to fetch employee licences.');
  }
  const json = await res.json();
  return json.data || json;
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
  return true;
}
