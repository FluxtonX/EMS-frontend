'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button, Input } from '@/components/ui';
import { Building2, ArrowRight, Lock, Eye, EyeOff, Phone, Shield } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register(formData);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-[#FAF8FF] via-[#F4F1FD] to-[#EAE6FB] flex items-center justify-center selection:bg-[#6C5CE7]/20 selection:text-[#6C5CE7]">
      {/* Full-Page Atmospheric Ambient Glows (matching Dashboard & Landing) */}
      <div className="absolute -top-24 right-0 w-[520px] h-[520px] bg-gradient-to-br from-emerald-400/20 via-teal-400/15 to-cyan-400/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -top-20 -left-20 w-[550px] h-[550px] bg-[#6C5CE7]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[450px] h-[450px] bg-purple-300/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: siginn.png Visual Showcase (No hard borders, seamless theme) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between py-4 pr-4">
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
          <div className="my-auto py-8 flex flex-col items-center">
            <div className="relative w-full max-w-md group">
              <img
                src="/siginn.png"
                alt="Workforce Operations Platform"
                className="w-full h-auto object-contain drop-shadow-[0_20px_40px_rgba(108,92,231,0.18)] transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>

            <div className="mt-8 text-left w-full max-w-md space-y-2.5">
              <h3 className="font-extrabold text-[#171A2B] text-xl tracking-tight">
                Launch Your Security Workspace
              </h3>
              <p className="text-xs text-[#687086] leading-relaxed font-medium">
                Create your organization in seconds. Add officers, dispatch patrols with GPS geofencing, and ensure 100% SIA compliance.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-[#171A2B] font-semibold">
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>14-Day Full Access Trial Included</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#6C5CE7]">
                  <span className="h-2 w-2 rounded-full bg-[#6C5CE7]" />
                  <span>Full Multi-Tenant Role Isolation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badge (No hard border) */}
          <div className="pt-4 flex items-center justify-between text-xs text-[#687086]">
            <span>© 2026 Workforce Security Ltd</span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Online
            </span>
          </div>
        </div>

        {/* Right Column: Register Form (Seamless Glassmorphism Card, No harsh border) */}
        <div className="lg:col-span-6 flex items-center justify-center">
          <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl border border-white/90 shadow-[0_20px_50px_rgba(108,92,231,0.08),inset_0_1px_0_rgba(255,255,255,1)] p-8 sm:p-10 space-y-6">
            <div className="flex lg:hidden flex-col items-center text-center space-y-2 mb-2">
              <div className="h-10 w-10 rounded-xl bg-[#6C5CE7] flex items-center justify-center text-white shadow-xs">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#171A2B] tracking-tight">Register Company Workspace</h1>
                <p className="text-xs text-[#687086]">Set up multi-tenant security operations</p>
              </div>
            </div>

            <div className="hidden lg:block space-y-1">
              <h1 className="text-2xl font-black text-[#171A2B] tracking-tight">Create Company Workspace</h1>
              <p className="text-xs text-[#687086]">Set up your organization and invite managers and officers</p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[#FDF0F1] border border-[#FAC3C6] text-xs text-[#EF6B73] font-medium">
                {error}
              </div>
            )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#687086] mb-1">Company Name</label>
            <Input
              name="companyName"
              placeholder="e.g. Apex Security Solutions Ltd"
              required
              value={formData.companyName}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#687086] mb-1">First Name</label>
              <Input
                name="firstName"
                placeholder="Marcus"
                required
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#687086] mb-1">Last Name</label>
              <Input
                name="lastName"
                placeholder="Vance"
                required
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#687086] mb-1">
              Work Email <span className="text-[#EF6B73]">*</span>
            </label>
            <Input
              type="email"
              name="email"
              placeholder="marcus@apex-security.co.uk"
              required
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#687086] mb-1">
              Phone Number <span className="text-[#EF6B73]">*</span>
            </label>
            <Input
              type="tel"
              name="phone"
              placeholder="+44 7911 123456"
              required
              value={formData.phone}
              onChange={handleChange}
              leftIcon={<Phone className="h-4 w-4 text-[#9096A9]" />}
            />
          </div>

          <div>
            <label htmlFor="register-password" className="block text-xs font-semibold text-[#687086] mb-1">
              Password (min 8 chars)
            </label>
            <Input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="••••••••"
              required
              minLength={8}
              value={formData.password}
              onChange={handleChange}
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
            className="w-full mt-2"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Create Company Workspace
          </Button>
        </form>

        <div className="pt-4 border-t border-[#F0EEF8] text-center">
          <p className="text-xs text-[#687086]">
            Already have an active account?{' '}
            <Link href="/login" className="text-[#6C5CE7] font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}
