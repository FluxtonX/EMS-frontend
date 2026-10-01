'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMyProfile, updateMyProfile } from '@/lib/api/me';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  ShieldCheck,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { Button, Input, Badge, TableSkeleton } from '@/components/ui';
import { toast } from '@/lib/toastStore';

export default function EmployeeProfilePage() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: fetchMyProfile,
  });

  // Form State
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRel, setEmergencyRel] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  useEffect(() => {
    if (profile) {
      setPhone(profile.phone || '');
      setLine1(profile.address?.line1 || '');
      setCity(profile.address?.city || '');
      setPostalCode(profile.address?.postalCode || '');
      setEmergencyName(profile.emergencyContact?.name || '');
      setEmergencyRel(profile.emergencyContact?.relationship || '');
      setEmergencyPhone(profile.emergencyContact?.phone || '');
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateMyProfile({
        phone: phone || undefined,
        address: {
          line1,
          city,
          postalCode,
        },
        emergencyContact: {
          name: emergencyName,
          relationship: emergencyRel,
          phone: emergencyPhone,
        },
      }),
    onSuccess: () => {
      toast.success('Your profile contact information has been updated.');
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      queryClient.invalidateQueries({ queryKey: ['my-overview'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update profile.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl border border-slate-200">
        <TableSkeleton rows={6} cols={2} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-purple-50 text-[#6C5CE7] border border-purple-100">
            <User className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Staff Profile</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              View your company employment records and keep your personal contact details current.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Official Employment Identity (Read-only) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Employment Identification
            </span>
            <Badge variant="success" className="font-semibold text-xs">
              {profile?.employmentStatus?.toUpperCase() || 'ACTIVE'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Full Legal Name</span>
              <span className="text-slate-900 font-semibold text-sm">
                {profile?.firstName} {profile?.lastName}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Employee Number</span>
              <span className="text-slate-900 font-mono font-bold text-sm">
                {profile?.employeeNumber}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Company Account Email</span>
              <span className="text-slate-900 font-medium">{profile?.email}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Date of Birth</span>
              <span className="text-slate-900 font-medium">
                {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB') : '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Start Date</span>
              <span className="text-slate-900 font-medium">
                {profile?.employmentStartDate
                  ? new Date(profile.employmentStartDate).toLocaleDateString('en-GB')
                  : '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Security Clearance</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified SIA Personnel
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Contact Information (Editable) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-4">
            Contact & Residential Address
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone Number</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+44 7123 456789"
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
              <Input
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                placeholder="10 High Street"
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City / Town</label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="London"
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Postal Code</label>
              <Input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="SW1A 1AA"
                className="text-sm font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Emergency Contact (Editable) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-4">
            Emergency Contact Information
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name</label>
              <Input
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
              <Input
                value={emergencyRel}
                onChange={(e) => setEmergencyRel(e.target.value)}
                placeholder="e.g. Spouse / Brother"
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Phone</label>
              <Input
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="+44 7999 888777"
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white shadow-sm flex items-center gap-2 px-6"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Saving Updates...' : 'Save Profile Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
