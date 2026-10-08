/**
 * Centralized Auth Header & API Response Utility
 * Ensures multi-tier token extraction (Cookies -> localStorage session -> token keys)
 * across ALL API modules to prevent 401 "Authentication token missing/expired" errors.
 */

export function getAuthHeaders(explicitToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  let token = explicitToken;

  if (!token && typeof window !== 'undefined') {
    try {
      // 1. Read from document.cookie
      const cookieMatch = document.cookie.match(/(?:^|; )workforce_auth_token=([^;]*)/);
      if (cookieMatch && cookieMatch[1]) {
        token = decodeURIComponent(cookieMatch[1]);
      }

      // 2. Read from localStorage workforce_auth_session
      if (!token) {
        const storedSession = localStorage.getItem('workforce_auth_session');
        if (storedSession) {
          const parsed = JSON.parse(storedSession);
          token = parsed.accessToken || parsed.token || parsed.access_token;
        }
      }

      // 3. Read from standalone token keys
      if (!token) {
        token =
          localStorage.getItem('workforce_auth_token') ||
          localStorage.getItem('accessToken') ||
          localStorage.getItem('jwt_token') ||
          undefined;
      }
    } catch {
      // Ignore browser storage reading errors
    }
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Handles HTTP response status checks and automatic 401 token expiry handling.
 */
export async function handleApiResponse<T = any>(res: Response, fallbackErrorMessage: string): Promise<T> {
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      // Clear invalid/expired token signals
      document.cookie = 'workforce_auth_token=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'workforce_auth_role=; path=/; max-age=0; SameSite=Lax';
    }
    const errorJson = await res.json().catch(() => ({}));
    const message = errorJson?.message || errorJson?.error?.message || 'Authentication token has expired or is invalid. Please log in again.';
    throw new Error(message);
  }

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    const message = errorJson?.message || errorJson?.error?.message || fallbackErrorMessage;
    throw new Error(message);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}
