import { apiCache } from '@/lib/cache/apiCache';

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

export async function fetchMyOverview() {
  const res = await fetch(`${API_BASE_URL}/me/overview`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to fetch employee dashboard data.');
  }
  const json = await res.json();
  return json.data || json;
}

export async function fetchMyProfile() {
  const res = await fetch(`${API_BASE_URL}/me/profile`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to fetch employee profile.');
  }
  const json = await res.json();
  return json.data || json;
}

export async function updateMyProfile(payload: {
  phone?: string;
  address?: { line1?: string; line2?: string; city?: string; postalCode?: string; country?: string };
  emergencyContact?: { name?: string; relationship?: string; phone?: string };
}) {
  const res = await fetch(`${API_BASE_URL}/me/profile`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to update profile.');
  }
  const json = await res.json();
  return json.data || json;
}

export async function fetchMyCompany() {
  const res = await fetch(`${API_BASE_URL}/me/company`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to fetch company information.');
  }
  const json = await res.json();
  return json.data || json;
}

export async function fetchMyAssignment() {
  const res = await fetch(`${API_BASE_URL}/me/assignment`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to fetch assignment details.');
  }
  const json = await res.json();
  return json.data || json;
}

export async function fetchMyShifts(params?: { status?: string; from?: string; to?: string }) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);

  const res = await fetch(`${API_BASE_URL}/me/shifts?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to fetch scheduled shifts.');
  }
  const json = await res.json();
  return json.data || json;
}

export async function acknowledgeMyShift(shiftId: string) {
  const res = await fetch(`${API_BASE_URL}/me/shifts/${shiftId}/acknowledge`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to acknowledge shift.');
  }
  const json = await res.json();
  return json.data || json;
}

export async function fetchMyAttendance() {
  const res = await fetch(`${API_BASE_URL}/me/attendance`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to fetch attendance records.');
  }
  const json = await res.json();
  return json.data || json;
}

export async function clockInMyAttendance(payload: {
  siteId?: string;
  shiftId?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  notes?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/me/attendance/clock-in`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Clock-in failed.');
  }
  const json = await res.json();
  return json.data || json;
}

export async function clockOutMyAttendance(payload?: {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  notes?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/me/attendance/clock-out`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Clock-out failed.');
  }
  const json = await res.json();
  return json.data || json;
}

export async function fetchMyLicences() {
  const res = await fetch(`${API_BASE_URL}/me/licences`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to fetch licences.');
  }
  const json = await res.json();
  return json.data || json;
}

export async function fetchMyLeave() {
  const res = await fetch(`${API_BASE_URL}/me/leave`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to fetch leave entitlement.');
  }
  const json = await res.json();
  return json.data || json;
}

export async function createMyLeaveRequest(payload: {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/me/leave`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to submit leave request.');
  }
  const json = await res.json();
  return json.data || json;
}
