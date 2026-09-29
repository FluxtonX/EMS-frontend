'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button, Input } from '@/components/ui';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, session, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!authLoading && session) {
      router.replace('/');
    }
  }, [authLoading, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // While checking auth state, show spinner
  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="w-full max-w-sm bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-10 w-10 rounded bg-[#2563EB] flex items-center justify-center text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#0F172A] tracking-tight">Workforce Platform</h1>
            <p className="text-xs text-[#64748B]">Sign in to your company workspace</p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="p-3 rounded bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#DC2626] font-medium"
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-[#475569] mb-1">
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
            <label htmlFor="login-password" className="block text-xs font-semibold text-[#475569] mb-1">
              Password
            </label>
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
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

        <div className="pt-4 border-t border-[#F1F5F9] text-center">
          <p className="text-xs text-[#64748B]">
            Need a company workspace?{' '}
            <Link href="/register" className="text-[#2563EB] font-medium hover:underline">
              Register company
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
