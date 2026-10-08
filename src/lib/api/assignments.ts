import {
  Assignment,
  CreateAssignmentPayload,
  TransferAssignmentPayload,
  CloseAssignmentPayload,
} from '@/types/assignment';
import { apiCache } from '@/lib/cache/apiCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

import { getAuthHeaders } from './authHeaders';

export async function fetchEmployeeAssignments(employeeId: string): Promise<Assignment[]> {
  const cacheKey = `assignments:employee:${employeeId}`;

  return apiCache.withCache(
    cacheKey,
    async () => {
      const res = await fetch(`${API_BASE_URL}/assignments/employee/${employeeId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || 'Failed to fetch assignments.');
      }
      const json = await res.json();
      return json.data;
    },
    { ttlMs: 5 * 60 * 1000 }
  );
}

export async function fetchActiveAssignment(employeeId: string): Promise<Assignment | null> {
  const cacheKey = `assignments:active:${employeeId}`;

  return apiCache.withCache(
    cacheKey,
    async () => {
      const res = await fetch(`${API_BASE_URL}/assignments/employee/${employeeId}/current`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || 'Failed to fetch active assignment.');
      }
      const json = await res.json();
      return json.data;
    },
    { ttlMs: 5 * 60 * 1000 }
  );
}

export async function createAssignmentApi(payload: CreateAssignmentPayload): Promise<Assignment> {
  const res = await fetch(`${API_BASE_URL}/assignments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to create assignment.');
  }
  apiCache.invalidate('assignments');
  const json = await res.json();
  return json.data;
}

export async function transferEmployeeApi(
  employeeId: string,
  payload: TransferAssignmentPayload
): Promise<{ previousAssignment: Assignment; newAssignment: Assignment }> {
  const res = await fetch(`${API_BASE_URL}/assignments/employee/${employeeId}/transfer`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to transfer employee.');
  }
  apiCache.invalidate('assignments');
  const json = await res.json();
  return json.data;
}

export async function closeAssignmentApi(
  assignmentId: string,
  payload: CloseAssignmentPayload
): Promise<Assignment> {
  const res = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/close`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to close assignment.');
  }
  apiCache.invalidate('assignments');
  const json = await res.json();
  return json.data;
}

export async function fetchCompanyAssignments(params?: {
  siteId?: string;
  status?: string;
}): Promise<Assignment[]> {
  const query = new URLSearchParams();
  if (params?.siteId && params.siteId !== 'all') query.set('siteId', params.siteId);
  if (params?.status && params.status !== 'all') query.set('status', params.status);

  const res = await fetch(`${API_BASE_URL}/assignments?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to fetch workforce assignments.');
  }
  const json = await res.json();
  return json.data || json;
}

