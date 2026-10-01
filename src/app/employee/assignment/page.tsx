'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMyAssignment } from '@/lib/api/me';
import {
  Briefcase,
  Building2,
  Calendar,
  Lock,
  History,
  ShieldCheck,
  MapPin,
  Clock,
} from 'lucide-react';
import { Badge, TableSkeleton, EmptyState } from '@/components/ui';

export default function EmployeeAssignmentPage() {
  const { data: assignmentData, isLoading } = useQuery({
    queryKey: ['my-assignment'],
    queryFn: fetchMyAssignment,
  });

  const current = assignmentData?.current;
  const history = assignmentData?.history || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-purple-50 text-[#6C5CE7] border border-purple-100">
            <Briefcase className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workforce Site Deployment</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Your active operational site placement and historical assignment record with locked compensation rates.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <TableSkeleton rows={4} cols={3} />
        </div>
      ) : (
        <>
          {/* Active Deployment Card */}
          <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Operational Deployment
              </span>
              <Badge variant="success" className="font-semibold text-xs">
                CURRENTLY DEPLOYED
              </Badge>
            </div>

            {current ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {current.siteJob?.site?.name || 'Assigned Site'}
                    </h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {current.siteJob?.site?.address?.line1}, {current.siteJob?.site?.address?.city}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold self-start sm:self-auto">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <span className="font-mono">£{Number(current.payRate).toFixed(2)}/hr</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-lg text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Designated Role</span>
                    <span className="text-slate-900 font-semibold mt-0.5 block">
                      {current.siteJob?.jobType?.name || 'Security Personnel'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Effective Start Date</span>
                    <span className="text-slate-900 font-semibold mt-0.5 block">
                      {new Date(current.startDate).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Assignment Type</span>
                    <span className="text-slate-900 font-semibold mt-0.5 block">
                      {current.endDate ? `Ends ${new Date(current.endDate).toLocaleDateString('en-GB')}` : 'Permanent Ongoing'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-lg text-xs text-purple-900 flex items-start gap-2">
                  <Lock className="w-4 h-4 text-[#6C5CE7] shrink-0 mt-0.5" />
                  <span>
                    <strong>Rate Protection:</strong> Your agreed hourly pay rate is permanently locked for this site deployment in accordance with company workforce guidelines.
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                You are currently in the unassigned workforce pool. Contact your operations manager for shift deployments.
              </div>
            )}
          </div>

          {/* Historical Assignments Timeline */}
          <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <History className="w-4 h-4 text-[#6C5CE7]" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Deployment History ({history.length})
              </span>
            </div>

            {history.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No previous deployments on record.
              </div>
            ) : (
              <div className="relative border-l-2 border-purple-200 ml-3 space-y-4 my-2">
                {history.map((item: any) => (
                  <div key={item.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-slate-300 bg-white" />
                    <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900">
                          {item.siteJob?.site?.name || 'Client Site'}
                        </div>
                        <Badge variant="neutral" className="capitalize text-[10px]">
                          {item.status}
                        </Badge>
                      </div>
                      <div className="text-slate-500 mt-1 flex items-center justify-between">
                        <span>{item.siteJob?.jobType?.name}</span>
                        <span className="font-mono font-semibold text-slate-700">
                          £{Number(item.payRate).toFixed(2)}/hr
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {new Date(item.startDate).toLocaleDateString('en-GB')}{' '}
                        {item.endDate ? `→ ${new Date(item.endDate).toLocaleDateString('en-GB')}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
