'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button, Input } from '@/components/ui';
import { Building2, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';

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
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F3FF] p-4">
      <div className="w-full max-w-md bg-white rounded-lg border border-[#E5E3F2] shadow-sm p-6 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-10 w-10 rounded bg-[#6C5CE7] flex items-center justify-center text-white shadow-xs">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#171A2B] tracking-tight">Register Company Workspace</h1>
            <p className="text-xs text-[#687086]">Set up multi-tenant security operations</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded bg-[#FDF0F1] border border-[#FAC3C6] text-xs text-[#EF6B73] font-medium">
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
            <label className="block text-xs font-semibold text-[#687086] mb-1">Work Email</label>
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
  );
}
