import {
  Assignment,
  CreateAssignmentPayload,
  TransferAssignmentPayload,
  CloseAssignmentPayload,
} from '@/types/assignment';

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

export async function fetchEmployeeAssignments(employeeId: string): Promise<Assignment[]> {
  const res = await fetch(`${API_BASE_URL}/assignments/employee/${employeeId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to fetch assignments.');
  }
  const json = await res.json();
  return json.data;
}

export async function fetchActiveAssignment(employeeId: string): Promise<Assignment | null> {
  const res = await fetch(`${API_BASE_URL}/assignments/employee/${employeeId}/current`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to fetch active assignment.');
  }
  const json = await res.json();
  return json.data;
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
  const json = await res.json();
  return json.data;
}
