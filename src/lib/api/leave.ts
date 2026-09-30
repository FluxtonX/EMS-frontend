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

export type LeaveType = 'annual' | 'sick' | 'emergency' | 'unpaid' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  companyId: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  status: LeaveStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
  };
}

export interface LeaveStats {
  totalRequests: number;
  pending: number;
  approved: number;
  rejected: number;
  daysUsedThisYear: number;
}

export interface CreateLeavePayload {
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface ReviewLeavePayload {
  status: 'approved' | 'rejected';
  reviewNotes?: string;
}

export async function fetchLeaveRequestsApi(params: {
  employeeId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
} = {}): Promise<LeaveRequest[]> {
  const url = new URL(`${API_BASE_URL}/leave`);
  if (params.employeeId) url.searchParams.append('employeeId', params.employeeId);
  if (params.status && params.status !== 'all') url.searchParams.append('status', params.status);
  if (params.startDate) url.searchParams.append('startDate', params.startDate);
  if (params.endDate) url.searchParams.append('endDate', params.endDate);

  const res = await fetch(url.toString(), { headers: getAuthHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to fetch leave requests');
  }
  const json = await res.json();
  return json.data;
}

export async function createLeaveRequestApi(payload: CreateLeavePayload): Promise<LeaveRequest> {
  const res = await fetch(`${API_BASE_URL}/leave`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to create leave request');
  }
  const json = await res.json();
  return json.data;
}

export async function reviewLeaveRequestApi(id: string, payload: ReviewLeavePayload): Promise<LeaveRequest> {
  const res = await fetch(`${API_BASE_URL}/leave/${id}/review`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to review leave request');
  }
  const json = await res.json();
  return json.data;
}

export async function cancelLeaveRequestApi(id: string): Promise<LeaveRequest> {
  const res = await fetch(`${API_BASE_URL}/leave/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to cancel leave request');
  }
  const json = await res.json();
  return json.data;
}

export async function fetchLeaveStatsApi(employeeId: string): Promise<LeaveStats> {
  const res = await fetch(`${API_BASE_URL}/leave/employee/${employeeId}/stats`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to fetch leave stats');
  }
  const json = await res.json();
  return json.data;
}
