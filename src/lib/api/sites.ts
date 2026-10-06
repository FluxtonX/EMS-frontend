import { Site, JobType, SiteJob } from '@/types/site';
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

export async function fetchSites(): Promise<Site[]> {
  return apiCache.withCache(
    'sites:list',
    async () => {
      const res = await fetch(`${API_BASE_URL}/sites`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || 'Failed to fetch sites.');
      }
      const json = await res.json();
      return json.data;
    },
    { ttlMs: 30 * 1000 }
  );
}

export async function fetchSiteById(id: string): Promise<Site> {
  return apiCache.withCache(
    `sites:detail:${id}`,
    async () => {
      const res = await fetch(`${API_BASE_URL}/sites/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || `Failed to fetch site ${id}`);
      }
      const json = await res.json();
      return json.data;
    },
    { ttlMs: 30 * 1000 }
  );
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
  apiCache.invalidate('sites');
  const json = await res.json();
  return json.data;
}

export async function fetchJobTypes(): Promise<JobType[]> {
  return apiCache.withCache(
    'job-types:list',
    async () => {
      const res = await fetch(`${API_BASE_URL}/job-types`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || 'Failed to fetch job roles.');
      }
      const json = await res.json();
      return json.data;
    },
    { ttlMs: 30 * 1000 }
  );
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
  apiCache.invalidate('job-types');
  const json = await res.json();
  return json.data;
}

export async function fetchSiteJobs(siteId: string): Promise<SiteJob[]> {
  return apiCache.withCache(
    `sites:jobs:${siteId}`,
    async () => {
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/jobs`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || 'Failed to fetch site job rates.');
      }
      const json = await res.json();
      return json.data;
    },
    { ttlMs: 30 * 1000 }
  );
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
  apiCache.invalidate(`sites:jobs:${siteId}`);
  apiCache.invalidate('sites:jobs:matrix');
  apiCache.invalidate('sites');
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
  apiCache.invalidate(`sites:jobs:${siteId}`);
  apiCache.invalidate('sites:jobs:matrix');
  apiCache.invalidate('sites');
  const json = await res.json();
  return json.data;
}

export async function deleteSiteJobApi(siteId: string, jobId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/sites/${siteId}/jobs/${jobId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to delete site job rate.');
  }
  apiCache.invalidate(`sites:jobs:${siteId}`);
  apiCache.invalidate('sites:jobs:matrix');
  apiCache.invalidate('sites');
  const json = await res.json();
  return json.data;
}

export async function fetchSiteJobsMatrixApi(): Promise<Array<SiteJob & { siteName?: string; siteCode?: string }>> {
  return apiCache.withCache(
    'sites:jobs:matrix',
    async () => {
      const res = await fetch(`${API_BASE_URL}/sites/jobs/matrix`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.error?.message || 'Failed to fetch sites and rates matrix.');
      }
      const json = await res.json();
      const raw = json.data || [];
      return raw.map((item: any) => ({
        ...item,
        siteName: item.site?.name || item.siteName || '',
        siteCode: item.site?.code || item.siteCode || '',
      }));
    },
    { ttlMs: 60 * 1000 }
  );
}

export async function updateJobTypeApi(id: string, data: Partial<JobType>): Promise<JobType> {
  const res = await fetch(`${API_BASE_URL}/job-types/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to update job role.');
  }
  apiCache.invalidate('job-types');
  apiCache.invalidate('sites:jobs:matrix');
  const json = await res.json();
  return json.data;
}

export async function deleteJobTypeApi(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/job-types/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || 'Failed to delete job role.');
  }
  apiCache.invalidate('job-types');
  apiCache.invalidate('sites:jobs:matrix');
  const json = await res.json();
  return json.data;
}

