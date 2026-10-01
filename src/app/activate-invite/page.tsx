'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, User, Phone, CheckCircle, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '@/components/ui';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function ActivateInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [inviteDetails, setInviteDetails] = useState<{
    email: string;
    role: string;
    companyName: string;
    targetType: string;
  } | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setFetchError('No activation token found in link. Please check your invitation email.');
      setIsLoadingDetails(false);
      return;
    }

    async function fetchDetails() {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/invitations/details?token=${encodeURIComponent(token!)}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Invalid or expired invitation token.');
        }
        const data = await res.json();
        setInviteDetails(data);
      } catch (err: any) {
        setFetchError(err.message || 'Failed to verify invitation link.');
      } finally {
        setIsLoadingDetails(false);
      }
    }

    fetchDetails();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/invitations/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          firstName,
          lastName,
          phone: phone || undefined,
          password,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to activate account.');
      }

      const authData = await res.json();
      
      // Store session in localStorage for AuthContext
      if (typeof window !== 'undefined') {
        localStorage.setItem('workforce_auth_session', JSON.stringify(authData));
      }

      setIsSuccess(true);

      // Determine redirect path
      const role = (authData.company?.role || '').toUpperCase();
      const targetUrl = role === 'EMPLOYEE' ? '/employee/dashboard' : '/dashboard';

      setTimeout(() => {
        router.push(targetUrl);
      }, 1500);
    } catch (err: any) {
      setSubmitError(err.message || 'Account activation failed.');
      setIsSubmitting(false);
    }
  };

  if (isLoadingDetails) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F3FF]">
        <div className="h-8 w-8 rounded-full border-2 border-[#6C5CE7] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F3FF] p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#E5E3F2] shadow-sm p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-[#171A2B]">Invitation Link Invalid</h2>
          <p className="text-sm text-[#687086]">{fetchError}</p>
          <div className="pt-4">
            <Link href="/login">
              <Button variant="primary" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F3FF] p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#E5E3F2] shadow-sm p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-[#171A2B]">Account Activated!</h2>
          <p className="text-sm text-[#687086]">
            Welcome to {inviteDetails?.companyName}. Redirecting to your workspace...
          </p>
          <div className="h-6 flex items-center justify-center">
            <div className="h-4 w-4 rounded-full border-2 border-[#6C5CE7] border-t-transparent animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F3FF] p-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E5E3F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_16px_rgba(108,92,231,0.06)] p-7 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="h-10 w-10 rounded-xl bg-[#6C5CE7] flex items-center justify-center text-white mx-auto shadow-sm">
            <Shield className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold text-[#171A2B] tracking-tight">Activate Your Account</h1>
          <p className="text-xs text-[#687086]">
            You have been invited to join <span className="font-semibold text-[#171A2B]">{inviteDetails?.companyName}</span>
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EDE9FE] text-[#6C5CE7] text-xs font-semibold">
            Role: {inviteDetails?.role}
          </div>
        </div>

        {submitError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#687086]">Email Address</label>
            <input
              type="email"
              disabled
              value={inviteDetails?.email || ''}
              className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-[#E5E3F2] text-xs text-gray-500 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#687086]">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full h-10 px-3 rounded-lg border border-[#E5E3F2] text-xs text-[#171A2B] focus:outline-none focus:border-[#6C5CE7]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#687086]">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full h-10 px-3 rounded-lg border border-[#E5E3F2] text-xs text-[#171A2B] focus:outline-none focus:border-[#6C5CE7]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#687086]">Phone Number (Optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+44 7911 123456"
              className="w-full h-10 px-3 rounded-lg border border-[#E5E3F2] text-xs text-[#171A2B] focus:outline-none focus:border-[#6C5CE7]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#687086]">Create Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full h-10 px-3 pr-9 rounded-lg border border-[#E5E3F2] text-xs text-[#171A2B] focus:outline-none focus:border-[#6C5CE7]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#687086]">Confirm Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full h-10 px-3 rounded-lg border border-[#E5E3F2] text-xs text-[#171A2B] focus:outline-none focus:border-[#6C5CE7]"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Activate Account & Log In
          </Button>
        </form>

        <div className="text-center">
          <Link href="/login" className="text-xs text-[#6C5CE7] hover:underline">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ActivateInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F3FF]">
          <div className="h-8 w-8 rounded-full border-2 border-[#6C5CE7] border-t-transparent animate-spin" />
        </div>
      }
    >
      <ActivateInviteContent />
    </Suspense>
  );
}
