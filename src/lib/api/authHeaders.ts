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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function attemptSilentTokenRefresh(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const stored = localStorage.getItem('workforce_auth_session');
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      if (!parsed?.refreshToken) return false;

      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: parsed.refreshToken }),
      });

      if (!refreshRes.ok) return false;

      const refreshData = await refreshRes.json();
      const tokens = refreshData.data || refreshData;
      if (tokens?.accessToken) {
        parsed.accessToken = tokens.accessToken;
        if (tokens.refreshToken) parsed.refreshToken = tokens.refreshToken;
        localStorage.setItem('workforce_auth_session', JSON.stringify(parsed));
        localStorage.setItem('workforce_auth_token', tokens.accessToken);
        document.cookie = `workforce_auth_token=${encodeURIComponent(tokens.accessToken)}; path=/; max-age=2592000; SameSite=Lax`;
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Handles HTTP response status checks and automatic 401 token expiry handling.
 */
export async function handleApiResponse<T = any>(res: Response, fallbackErrorMessage: string): Promise<T> {
  if (res.status === 401) {
    const refreshed = await attemptSilentTokenRefresh();
    if (!refreshed && typeof window !== 'undefined') {
      // Clear invalid/expired token signals only if refresh truly fails
      document.cookie = 'workforce_auth_token=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'workforce_auth_role=; path=/; max-age=0; SameSite=Lax';
    }
    const errorJson = await res.json().catch(() => ({}));
    const message = errorJson?.message || errorJson?.error?.message || 'Authentication token has expired or is invalid. Please log in again.';
    throw new Error(message);
  }

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    let message = errorJson?.message || errorJson?.error?.message || fallbackErrorMessage;
    if (typeof message === 'string' && message.startsWith('Cannot ')) {
      message = fallbackErrorMessage || 'Requested service endpoint is unavailable.';
    }
    throw new Error(message);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}
