'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button, Input } from '@/components/ui';
import { Shield, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, session, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to determine destination portal based on role per Spec Section 8 & 9
  const getPortalDestination = (role?: string | null) => {
    const normalized = (role || '').toUpperCase().trim();
    if (normalized === 'EMPLOYEE') {
      return '/employee/dashboard';
    }
    return '/dashboard';
  };

  // If already authenticated, redirect to appropriate portal
  useEffect(() => {
    if (!authLoading && session) {
      router.replace(getPortalDestination(session.company?.role));
    }
  }, [authLoading, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      const stored = typeof window !== 'undefined' ? localStorage.getItem('workforce_auth_session') : null;
      let targetPath = '/dashboard';
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          targetPath = getPortalDestination(parsed.company?.role);
        } catch {}
      }
      router.push(targetPath);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // While checking auth state, show spinner
  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F3FF]">
        <div className="h-8 w-8 rounded-full border-2 border-[#6C5CE7] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F3FF] p-4">
      <div className="w-full max-w-sm bg-white rounded-lg border border-[#E5E3F2] shadow-sm p-6 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-10 w-10 rounded bg-[#6C5CE7] flex items-center justify-center text-white shadow-xs">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#171A2B] tracking-tight">Workforce Platform</h1>
            <p className="text-xs text-[#687086]">Sign in to your company workspace</p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="p-3 rounded bg-[#FDF0F1] border border-[#FAC3C6] text-xs text-[#EF6B73] font-medium"
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-[#687086] mb-1">
              Work Email
            </label>
            <Input
              id="login-email"
              type="email"
              placeholder="operator@company.co.uk"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-semibold text-[#687086] mb-1">
              Password
            </label>
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#687086] hover:text-[#171A2B] focus:outline-none transition-colors flex items-center justify-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Sign In
          </Button>
        </form>

        <div className="pt-4 border-t border-[#F0EEF8] text-center">
          <p className="text-xs text-[#687086]">
            Need a company workspace?{' '}
            <Link href="/register" className="text-[#6C5CE7] font-medium hover:underline">
              Register company
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
