'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthSession, User, Company } from '@/types/auth';
import { loginApi, registerApi, getMeApi } from '../api/auth';
import { toast } from '../toastStore';

interface AuthContextType {
  session: AuthSession | null;
  user: User | null;
  company: Company | null;
  role: string | null;
  permissions: string[];
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_STORAGE_KEY = 'workforce_auth_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed: AuthSession = JSON.parse(stored);
        setSession(parsed);
      }
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const authData = await loginApi({ email, password: pass });
      setSession(authData);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authData));
      toast.success('Logged in successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Login failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      const authData = await registerApi(payload);
      setSession(authData);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authData));
      toast.success('Company workspace created.');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    toast.info('Logged out.');
  };

  const hasPermission = (perm: string) => {
    if (!session || !session.permissions) return false;
    return session.permissions.includes(perm);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        company: session?.company || null,
        role: session?.company?.role || null,
        permissions: session?.permissions || [],
        isLoading,
        login,
        register,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
