import { Site, JobType, SiteJob } from '@/types/site';

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

export async function fetchSites(): Promise<Site[]> {
  const res = await fetch(`${API_BASE_URL}/sites`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to fetch sites.');
  }
  const json = await res.json();
  return json.data;
}

export async function fetchSiteById(id: string): Promise<Site> {
  const res = await fetch(`${API_BASE_URL}/sites/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || `Failed to fetch site ${id}`);
  }
  const json = await res.json();
  return json.data;
}

export async function createSiteApi(data: any): Promise<Site> {
  const res = await fetch(`${API_BASE_URL}/sites`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to create site.');
  }
  const json = await res.json();
  return json.data;
}

export async function fetchJobTypes(): Promise<JobType[]> {
  const res = await fetch(`${API_BASE_URL}/job-types`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to fetch job roles.');
  }
  const json = await res.json();
  return json.data;
}

export async function createJobTypeApi(data: any): Promise<JobType> {
  const res = await fetch(`${API_BASE_URL}/job-types`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to create job role.');
  }
  const json = await res.json();
  return json.data;
}

export async function fetchSiteJobs(siteId: string): Promise<SiteJob[]> {
  const res = await fetch(`${API_BASE_URL}/sites/${siteId}/jobs`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to fetch site job rates.');
  }
  const json = await res.json();
  return json.data;
}

export async function addSiteJobApi(siteId: string, data: any): Promise<SiteJob> {
  const res = await fetch(`${API_BASE_URL}/sites/${siteId}/jobs`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to attach job role to site.');
  }
  const json = await res.json();
  return json.data;
}

export async function updateSiteJobApi(siteId: string, jobId: string, data: any): Promise<SiteJob> {
  const res = await fetch(`${API_BASE_URL}/sites/${siteId}/jobs/${jobId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to update job rates.');
  }
  const json = await res.json();
  return json.data;
}
