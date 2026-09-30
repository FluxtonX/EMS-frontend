import { EmployeeDocument, UploadDocumentPayload } from '@/types/document';

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

export async function uploadEmployeeDocumentApi(
  employeeId: string,
  payload: UploadDocumentPayload
): Promise<EmployeeDocument> {
  const res = await fetch(`${API_BASE_URL}/employees/${employeeId}/documents`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to upload document.');
  }
  const json = await res.json();
  return json.data || json;
}

export async function fetchEmployeeDocumentsApi(employeeId: string): Promise<EmployeeDocument[]> {
  const res = await fetch(`${API_BASE_URL}/employees/${employeeId}/documents`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to fetch employee documents.');
  }
  const json = await res.json();
  return json.data || json;
}

export async function fetchDocumentDownloadUrlApi(
  documentId: string
): Promise<{ downloadUrl: string; fileName: string; mimeType: string }> {
  const res = await fetch(`${API_BASE_URL}/documents/${documentId}/download`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to generate download URL.');
  }
  const json = await res.json();
  return json.data || json;
}

export async function verifyDocumentApi(
  documentId: string,
  isVerified: boolean
): Promise<EmployeeDocument> {
  const res = await fetch(`${API_BASE_URL}/documents/${documentId}/verify`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ isVerified }),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to verify document.');
  }
  const json = await res.json();
  return json.data || json;
}

export async function deleteDocumentApi(documentId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || errorJson?.message || 'Failed to delete document.');
  }
  return true;
}
