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
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-[#FAF8FF] via-[#F4F1FD] to-[#EAE6FB] flex items-center justify-center selection:bg-[#6C5CE7]/20 selection:text-[#6C5CE7] py-4 sm:py-8">
      {/* Full-Page Atmospheric Ambient Glows (matching Dashboard & Landing) */}
      <div className="absolute -top-24 right-0 w-[520px] h-[520px] bg-gradient-to-br from-emerald-400/20 via-teal-400/15 to-cyan-400/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -top-20 -left-20 w-[550px] h-[550px] bg-[#6C5CE7]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[450px] h-[450px] bg-purple-300/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: siginn.png Visual Showcase (No hard borders, seamless theme) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between py-2 pr-4">
          {/* Brand Header */}
          <Link href="/" className="flex items-center gap-2.5 group w-fit">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C6CEE] via-[#6C5CE7] to-[#4D3CB5] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(108,92,231,0.35)] transition-transform duration-300 group-hover:scale-105">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-[#171A2B] tracking-tight block leading-tight">
                Workforce<span className="text-[#6C5CE7]">EMS</span>
              </span>
              <span className="text-[10px] text-[#687086] font-bold tracking-wider uppercase block">
                Security Operations
              </span>
            </div>
          </Link>

          {/* Center Image Showcase */}
          <div className="my-auto py-4 flex flex-col items-center">
            <div className="relative w-full max-w-[340px] group">
              <img
                src="/siginn.png"
                alt="Workforce Operations Platform"
                className="w-full h-auto object-contain drop-shadow-[0_20px_40px_rgba(108,92,231,0.18)] transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>

            <div className="mt-6 text-left w-full max-w-md space-y-2">
            
              <div className="pt-1.5 flex flex-wrap items-center gap-4 text-xs text-[#171A2B] font-semibold">
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>98.4% Live On-Post Verification</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#6C5CE7]">
                  <span className="h-2 w-2 rounded-full bg-[#6C5CE7]" />
                  <span>Automated 100% SIA Expiry Protection</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badge (No hard border) */}
          <div className="pt-2 flex items-center justify-between text-xs text-[#687086]">
            <span>© 2026 Workforce Security Ltd</span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Online
            </span>
          </div>
        </div>

        {/* Right Column: Sign In Form (Elevated Higher Up) */}
        <div className="lg:col-span-6 flex items-center justify-center -translate-y-2 sm:-translate-y-4 lg:-translate-y-8">
          <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl border border-white/90 shadow-[0_20px_50px_rgba(108,92,231,0.08),inset_0_1px_0_rgba(255,255,255,1)] p-8 sm:p-9 space-y-5">
          {/* Mobile Brand Header */}
          <div className="flex lg:hidden flex-col items-center text-center space-y-2 mb-2">
            <div className="h-10 w-10 rounded-xl bg-[#6C5CE7] flex items-center justify-center text-white shadow-xs">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#171A2B] tracking-tight">Workforce Platform</h1>
              <p className="text-xs text-[#687086]">Sign in to your company workspace</p>
            </div>
          </div>

          {/* Desktop Heading */}
          <div className="hidden lg:block space-y-1">
            <h1 className="text-2xl font-black text-[#171A2B] tracking-tight">Welcome Back</h1>
            <p className="text-xs text-[#687086]">Sign in to access your operations dashboard and team posts</p>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-[#FDF0F1] border border-[#FAC3C6] text-xs text-[#EF6B73] font-medium"
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
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="block text-xs font-semibold text-[#687086]">
                  Password
                </label>
              </div>
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
                    className="text-[#687086] hover:text-[#171A2B] focus:outline-none transition-colors flex items-center justify-center cursor-pointer"
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
              Sign In to Workspace
            </Button>
          </form>

          <div className="pt-4 border-t border-[#F0EEF8] text-center">
            <p className="text-xs text-[#687086]">
              Need a company workspace?{' '}
              <Link href="/register" className="text-[#6C5CE7] font-bold hover:underline">
                Register company
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
