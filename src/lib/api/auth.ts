import { AuthSession } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = json?.error?.message || json?.message || 'A network error occurred. Please try again.';
    const errorCode = json?.error?.code || 'UNKNOWN_ERROR';
    const errorDetails = json?.error?.details || null;
    throw new ApiError(errorMsg, errorCode, errorDetails, res.status);
  }
  return json.data !== undefined ? json.data : json;
}

export async function loginApi(payload: { email: string; password: string }): Promise<AuthSession> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthSession>(res);
}

export async function registerApi(payload: {
  companyName: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<AuthSession> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthSession>(res);
}

export async function getMeApi(accessToken: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return handleResponse<any>(res);
}
