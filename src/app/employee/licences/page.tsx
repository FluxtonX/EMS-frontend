'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMyLicences } from '@/lib/api/me';
import {
  ShieldCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { Badge, TableSkeleton, EmptyState } from '@/components/ui';

export default function EmployeeLicencesPage() {
  const { data: licences = [], isLoading } = useQuery({
    queryKey: ['my-licences'],
    queryFn: fetchMyLicences,
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-purple-50 text-[#6C5CE7] border border-purple-100">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Licences & Compliance</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Active Security Industry Authority (SIA) licences and statutory qualifications on file.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <TableSkeleton rows={3} cols={3} />
        </div>
      ) : licences.length === 0 ? (
        <div className="bg-white rounded-xl p-8 border border-slate-200">
          <EmptyState
            icon={<Shield className="h-8 w-8 text-[#6C5CE7]" />}
            title="No SIA licences on file"
            description="Your company profile currently has no verified SIA licence details recorded. Please submit your 16-digit licence badge number to operations."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {licences.map((lic: any) => {
            const expiry = new Date(lic.expiryDate);
            const now = new Date();
            const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
            const isExpiringSoon = daysLeft <= 30 && daysLeft > 0;
            const isExpired = daysLeft <= 0;

            return (
              <div
                key={lic.id || lic.licenceNumber}
                className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6C5CE7] border border-purple-100 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-base flex items-center gap-2">
                        {lic.licenceType}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        Badge Number: <span className="font-semibold text-slate-800">{lic.licenceNumber}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Expiry Date: {expiry.toLocaleDateString('en-GB')}</span>
                        <span className="text-slate-300">·</span>
                        {isExpired ? (
                          <span className="text-rose-600 font-semibold">Expired</span>
                        ) : isExpiringSoon ? (
                          <span className="text-amber-600 font-semibold">{daysLeft} days remaining</span>
                        ) : (
                          <span className="text-emerald-600 font-medium">{daysLeft} days remaining</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="self-start sm:self-auto">
                    <Badge
                      variant={
                        lic.status === 'valid'
                          ? 'success'
                          : lic.status === 'expiring_soon'
                          ? 'warning'
                          : 'danger'
                      }
                      className="capitalize text-xs font-semibold px-2.5 py-1"
                    >
                      {lic.status?.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {isExpiringSoon && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Your licence is expiring soon. Please initiate your SIA renewal to avoid shift suspension.
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
