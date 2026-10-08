import { apiCache } from '@/lib/cache/apiCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export interface AuditLog {
  id: string;
  companyId: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

import { getAuthHeaders } from './authHeaders';

export async function fetchAuditLogs(limit = 100): Promise<AuditLog[]> {
  const res = await fetch(`${API_BASE_URL}/audit?limit=${limit}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    // Also try companies/audit fallback
    const fallbackRes = await fetch(`${API_BASE_URL}/companies/audit`, {
      headers: getAuthHeaders(),
    });
    if (!fallbackRes.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || 'Failed to fetch authoritative audit logs.');
    }
    const fallbackJson = await fallbackRes.json();
    return Array.isArray(fallbackJson) ? fallbackJson : fallbackJson.data || [];
  }

  const json = await res.json();
  return Array.isArray(json) ? json : json.data || [];
}
