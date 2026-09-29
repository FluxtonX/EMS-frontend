'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button, Input } from '@/components/ui';
import { Building2, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="w-full max-w-md bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-10 w-10 rounded bg-[#2563EB] flex items-center justify-center text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#0F172A] tracking-tight">Register Company Workspace</h1>
            <p className="text-xs text-[#64748B]">Set up multi-tenant security operations</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#DC2626] font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">Company Name</label>
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
              <label className="block text-xs font-semibold text-[#475569] mb-1">First Name</label>
              <Input
                name="firstName"
                placeholder="Marcus"
                required
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">Last Name</label>
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
            <label className="block text-xs font-semibold text-[#475569] mb-1">Work Email</label>
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
            <label className="block text-xs font-semibold text-[#475569] mb-1">Password (min 8 chars)</label>
            <Input
              type="password"
              name="password"
              placeholder="••••••••"
              required
              minLength={8}
              value={formData.password}
              onChange={handleChange}
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

        <div className="pt-4 border-t border-[#F1F5F9] text-center">
          <p className="text-xs text-[#64748B]">
            Already have an active account?{' '}
            <Link href="/login" className="text-[#2563EB] font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
