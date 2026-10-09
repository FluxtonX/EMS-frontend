'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { useWorkforceStore } from '@/lib/stores/workforceStore';
import {
  Button,
  Input,
  Badge,
  Modal,
  TableSkeleton,
  EmptyState,
} from '@/components/ui';
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  User,
  Info,
  Calendar,
  AlertCircle,
  Trash2,
  ExternalLink,
  ChevronRight,
  Eye,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import {
  fetchLicencesApi,
  fetchComplianceSummaryApi,
  createEmployeeLicenceApi,
  verifyLicenceApi,
  deleteLicenceApi,
} from '@/lib/api/licences';
import { fetchEmployees } from '@/lib/api/employees';
import { EmployeeLicence, LicenceStatus } from '@/types/licence';
import { useAuth } from '@/lib/auth/AuthContext';

export default function CompliancePage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState<EmployeeLicence | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Form state for creating a new licence
  const [formData, setFormData] = useState({
    employeeId: '',
    licenceType: 'SIA Door Supervisor',
    licenceNumber: '',
    expiryDate: '',
    documentUrl: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Central Workforce Store
  const {
    licences,
    complianceSummary: summary,
    isLicencesLoading,
    fetchLicences: syncLicences,
    createLicence: storeCreateLicence,
    verifyLicence: storeVerifyLicence,
    deleteLicence: storeDeleteLicence,
    employees: storeEmployees,
    fetchEmployees: syncEmployees,
  } = useWorkforceStore();

  const { session, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && session) {
      syncLicences();
      syncEmployees();
    }
  }, [authLoading, session, syncLicences, syncEmployees]);

  // Create licence mutation
  const createMutation = useMutation({
    mutationFn: (payload: { employeeId: string; data: any }) =>
      storeCreateLicence(payload.employeeId, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licences'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-summary'] });
      setIsAddModalOpen(false);
      setFormData({
        employeeId: '',
        licenceType: 'SIA Door Supervisor',
        licenceNumber: '',
        expiryDate: '',
        documentUrl: '',
      });
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err?.message || 'Failed to register licence.');
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, documentUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Verify licence mutation
  const verifyMutation = useMutation({
    mutationFn: (payload: { id: string; status: any }) =>
      storeVerifyLicence(payload.id, payload.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licences'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-summary'] });
      setVerifyTarget(null);
    },
  });

  // Delete licence mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => storeDeleteLicence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licences'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-summary'] });
    },
  });

  const displayLicences: EmployeeLicence[] = useMemo(() => {
    let list = licences;
    if (activeTab !== 'all') {
      list = list.filter((l) => l.status === activeTab);
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (l) =>
          l.licenceNumber.toLowerCase().includes(q) ||
          l.licenceType.toLowerCase().includes(q) ||
          `${l.employee?.firstName} ${l.employee?.lastName}`.toLowerCase().includes(q)
      );
    }
    return list;
  }, [licences, activeTab, searchTerm]);

  const availableEmployees = storeEmployees;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.employeeId) {
      setFormError('Please select a security officer.');
      return;
    }
    const cleanLicenceNumber = formData.licenceNumber.replace(/\D/g, '');
    if (!cleanLicenceNumber) {
      setFormError('Licence number is required.');
      return;
    }
    if (cleanLicenceNumber.length !== 16) {
      setFormError(`SIA Licence number must be exactly 16 digits (currently ${cleanLicenceNumber.length} digits).`);
      return;
    }
    if (!formData.expiryDate) {
      setFormError('Licence expiry date is required.');
      return;
    }

    createMutation.mutate({
      employeeId: formData.employeeId,
      data: {
        licenceType: formData.licenceType,
        licenceNumber: formData.licenceNumber.trim(),
        expiryDate: formData.expiryDate,
        documentUrl: formData.documentUrl || undefined,
      },
    });
  };

  const getStatusBadge = (status: LicenceStatus) => {
    switch (status) {
      case 'valid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Compliant
          </span>
        );
      case 'expiring_soon':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            Expiring Soon (30d)
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300">
            <XCircle className="h-3 w-3 text-rose-600" />
            Expired / Grounded
          </span>
        );
      case 'pending_verification':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#EDE9FE] text-[#6C5CE7] border border-[#D5D0FA]">
            <Clock className="h-3 w-3 text-[#6C5CE7]" />
            Awaiting Verification
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <XCircle className="h-3 w-3 text-red-600" />
            Rejected
          </span>
        );
    }
  };

  const getDaysRemainingText = (expiryDateStr: string) => {
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="text-rose-600 font-semibold text-[11px]">
          Expired {Math.abs(diffDays)}d ago
        </span>
      );
    }
    if (diffDays <= 30) {
      return (
        <span className="text-amber-700 font-semibold text-[11px]">
          Expires in {diffDays} days
        </span>
      );
    }
    return (
      <span className="text-[#687086] text-[11px]">
        {diffDays} days remaining
      </span>
    );
  };

  return (
    <AppShell>
      <PageContainer
        title="Licences & Workforce Compliance"
        subtitle={
          <div className="flex items-center gap-2">
            <span>SIA licence monitoring, expiry automated tracking, and private verification repository.</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EDE9FE] text-[#6C5CE7] border border-[#D5D0FA]">
              UK SIA Compliance
            </span>
          </div>
        }
        breadcrumbs={[
          { label: 'Workforce Platform', href: '/dashboard' },
          { label: 'Compliance' },
        ]}
        primaryAction={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setFormError(null);
              setIsAddModalOpen(true);
            }}
          >
            Add / Verify Licence
          </Button>
        }
      >

        {/* Operational Compliance Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div className="bg-white p-3.5 rounded-lg border border-[#E5E3F2] shadow-sm">
            <div className="flex items-center justify-between text-[#687086] text-xs">
              <span>Total Licences</span>
              <FileCheck2 className="h-3.5 w-3.5 text-[#6C5CE7]" />
            </div>
            <p className="text-2xl font-bold text-[#171A2B] mt-1">{summary.total}</p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-[#E5E3F2] shadow-sm">
            <div className="flex items-center justify-between text-[#687086] text-xs">
              <span>Fully Compliant</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.valid}</p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-[#E5E3F2] shadow-sm">
            <div className="flex items-center justify-between text-[#687086] text-xs">
              <span>Expiring Soon (30d)</span>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-1">{summary.expiringSoon}</p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-[#E5E3F2] shadow-sm">
            <div className="flex items-center justify-between text-[#687086] text-xs">
              <span>Expired (Breach)</span>
              <XCircle className="h-3.5 w-3.5 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-rose-600 mt-1">{summary.expired}</p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-[#E5E3F2] shadow-sm">
            <div className="flex items-center justify-between text-[#687086] text-xs">
              <span>Pending Review</span>
              <Clock className="h-3.5 w-3.5 text-[#6C5CE7]" />
            </div>
            <p className="text-2xl font-bold text-[#6C5CE7] mt-1">{summary.pendingVerification}</p>
          </div>
        </div>

        {/* Tab Filters & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E5E3F2] mb-5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Records' },
              { id: 'expiring_soon', label: 'Expiring Soon (30d)' },
              { id: 'expired', label: 'Expired' },
              { id: 'pending_verification', label: 'Pending Verification' },
              { id: 'valid', label: 'Compliant' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#6C5CE7] text-white shadow-xs'
                    : 'text-[#687086] hover:bg-[#F5F3FF] hover:text-[#171A2B]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72">
            <Input
              placeholder="Search by officer or licence number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-[#687086]" />}
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Table Content */}
        {isLicencesLoading && licences.length === 0 ? (
          <TableSkeleton rows={5} cols={6} />
        ) : displayLicences.length === 0 ? (
          <EmptyState
            title="No licence records found"
            description="No compliance records match your active search or tab filter."
            action={
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setIsAddModalOpen(true)}
              >
                Add SIA Licence
              </Button>
            }
          />
        ) : (
          <div className="bg-white rounded-lg border border-[#E5E3F2] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F3FF] border-b border-[#E5E3F2] text-[#687086] font-semibold">
                  <tr>
                    <th className="px-4 py-3">Security Officer</th>
                    <th className="px-4 py-3">Licence Category</th>
                    <th className="px-4 py-3">Licence Number</th>
                    <th className="px-4 py-3">SIA Badge Photo</th>
                    <th className="px-4 py-3">Expiry Date</th>
                    <th className="px-4 py-3">Compliance Status</th>
                    <th className="px-4 py-3">Audit Verification</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E3F2]">
                  {displayLicences.map((lic) => (
                    <tr key={lic.id} className="hover:bg-slate-50 transition-colors">
                      {/* Officer */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-[#EDE9FE] text-[#6C5CE7] flex items-center justify-center font-bold text-xs">
                            {lic.employee?.firstName?.[0] || 'G'}
                            {lic.employee?.lastName?.[0] || 'D'}
                          </div>
                          <div>
                            <p className="font-semibold text-[#171A2B] leading-tight">
                              {lic.employee?.firstName} {lic.employee?.lastName}
                            </p>
                            <p className="text-[10px] text-[#687086]">
                              {lic.employee?.employeeNumber || 'Guard'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[#171A2B]">{lic.licenceType}</span>
                      </td>

                      {/* Number */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-[#171A2B] bg-[#F5F3FF] px-2 py-0.5 rounded border border-[#E5E3F2]">
                          {lic.licenceNumber}
                        </span>
                      </td>

                      {/* SIA Badge Photo */}
                      <td className="px-4 py-3">
                        {lic.documentUrl ? (
                          <div className="flex items-center gap-2">
                            <div
                              onClick={() => setPreviewImageUrl(lic.documentUrl || null)}
                              className="relative group w-10 h-10 rounded-lg overflow-hidden border-2 border-purple-200 bg-slate-100 shrink-0 cursor-pointer shadow-xs hover:ring-2 hover:ring-[#6C5CE7] transition-all"
                              title="Click to view full licence photo"
                            >
                              <img
                                src={lic.documentUrl}
                                alt="SIA Badge"
                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye className="w-4 h-4" />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPreviewImageUrl(lic.documentUrl || null)}
                              className="text-[11px] text-[#6C5CE7] hover:underline font-semibold flex items-center gap-1"
                            >
                              <ImageIcon className="w-3 h-3" /> View
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No Photo</span>
                        )}
                      </td>

                      {/* Expiry */}
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#171A2B]">{lic.expiryDate}</p>
                        <div className="mt-0.5">{getDaysRemainingText(lic.expiryDate)}</div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">{getStatusBadge(lic.status)}</td>

                      {/* Verification */}
                      <td className="px-4 py-3">
                        {lic.verifiedAt ? (
                          <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Verified</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-medium">
                            Unverified
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setVerifyTarget(lic)}
                            className="px-2 py-1 rounded bg-[#EDE9FE] hover:bg-[#D5D0FA] text-[#6C5CE7] font-semibold text-[11px] transition-colors"
                          >
                            Verify / Audit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this licence record?')) {
                                deleteMutation.mutate(lic.id);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Licence"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Add New Licence */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Register SIA Licence"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={createMutation.isPending}
                onClick={handleCreateSubmit}
              >
                Register Licence
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#687086] mb-1">
                Select Security Officer *
              </label>
              <select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full h-9 rounded bg-white px-3 text-xs text-[#171A2B] border border-[#E5E3F2] focus:border-[#6C5CE7] outline-none"
                required
              >
                <option value="">-- Choose Employee --</option>
                {availableEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#687086] mb-1">
                Licence Type *
              </label>
              <select
                value={formData.licenceType}
                onChange={(e) => setFormData({ ...formData, licenceType: e.target.value })}
                className="w-full h-9 rounded bg-white px-3 text-xs text-[#171A2B] border border-[#E5E3F2] focus:border-[#6C5CE7] outline-none"
              >
                <option value="SIA Door Supervisor">SIA Door Supervisor</option>
                <option value="SIA Security Guard">SIA Security Guard</option>
                <option value="SIA CCTV Surveillance">SIA CCTV Surveillance</option>
                <option value="SIA Close Protection">SIA Close Protection</option>
                <option value="SIA Cash & Valuables in Transit">SIA Cash & Valuables in Transit</option>
                <option value="Other Security Licence">Other Security Licence</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#687086]">
                  16-Digit SIA Licence Number *
                </label>
                <span
                  className={`text-[11px] font-mono font-bold ${
                    formData.licenceNumber.length === 16 ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {formData.licenceNumber.length}/16 digits
                </span>
              </div>
              <Input
                placeholder="e.g. 1002938475610293"
                value={formData.licenceNumber}
                maxLength={16}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    licenceNumber: e.target.value.replace(/\D/g, '').slice(0, 16),
                  })
                }
                className={`h-9 text-xs font-mono tracking-wider ${
                  formData.licenceNumber.length > 0 && formData.licenceNumber.length < 16
                    ? 'border-amber-300 focus:border-amber-500'
                    : formData.licenceNumber.length === 16
                    ? 'border-emerald-400 focus:border-emerald-500'
                    : ''
                }`}
                required
              />
              {formData.licenceNumber.length > 0 && formData.licenceNumber.length < 16 && (
                <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Must be exactly 16 digits ({16 - formData.licenceNumber.length} more needed)
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#687086] mb-1">
                Expiry Date *
              </label>
              <Input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="h-9 text-xs"
                required
              />
              <p className="text-[10px] text-[#687086] mt-1">
                The compliance engine automatically marks licences expiring within 30 days as &quot;Expiring Soon&quot;.
              </p>
            </div>
          </form>
        </Modal>

        {/* Modal: Verify Licence Target */}
        {verifyTarget && (
          <Modal
            isOpen={true}
            onClose={() => setVerifyTarget(null)}
            title="SIA Licence Compliance Verification"
            footer={
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setVerifyTarget(null)}>
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={() =>
                    verifyMutation.mutate({ id: verifyTarget.id, status: 'rejected' })
                  }
                  disabled={verifyMutation.isPending}
                  className="px-3 py-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors"
                >
                  Reject Licence
                </button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={verifyMutation.isPending}
                  onClick={() =>
                    verifyMutation.mutate({ id: verifyTarget.id, status: 'valid' })
                  }
                >
                  Verify &amp; Approve
                </Button>
              </div>
            }
          >
            <div className="space-y-3 text-xs">
              {verifyTarget.documentUrl && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[#687086] font-semibold block">Uploaded SIA Licence Badge Photo:</span>
                    <button
                      type="button"
                      onClick={() => setPreviewImageUrl(verifyTarget.documentUrl || null)}
                      className="text-[11px] text-[#6C5CE7] hover:underline font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Enlarge Photo
                    </button>
                  </div>
                  <div
                    onClick={() => setPreviewImageUrl(verifyTarget.documentUrl || null)}
                    className="rounded-xl overflow-hidden border border-[#D5D0FA] bg-slate-950 flex items-center justify-center p-2 max-h-64 cursor-pointer group hover:ring-2 hover:ring-[#6C5CE7] transition-all"
                    title="Click to view full size"
                  >
                    <img
                      src={verifyTarget.documentUrl}
                      alt="SIA Licence Badge"
                      className="max-h-60 w-auto object-contain rounded transition-transform group-hover:scale-105"
                    />
                  </div>
                </div>
              )}
              <div className="p-3 bg-[#F5F3FF] rounded border border-[#D5D0FA] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#687086]">Security Officer:</span>
                  <span className="font-semibold text-[#171A2B]">
                    {verifyTarget.employee?.firstName} {verifyTarget.employee?.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#687086]">Licence Type:</span>
                  <span className="font-semibold text-[#171A2B]">{verifyTarget.licenceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#687086]">Licence Number:</span>
                  <span className="font-mono font-bold text-[#171A2B]">{verifyTarget.licenceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#687086]">Expiry Date:</span>
                  <span className="font-semibold text-[#171A2B]">{verifyTarget.expiryDate}</span>
                </div>
              </div>
              <p className="text-[11px] text-[#687086]">
                By approving, you confirm the officer&apos;s physical SIA licence or electronic portal verification matches the UK register and complies with mandatory security standards.
              </p>
            </div>
          </Modal>
        )}

        {/* Full Image Preview Modal */}
        {previewImageUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="relative bg-white rounded-2xl max-w-2xl w-full p-4 border border-slate-200 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#6C5CE7]" />
                  Uploaded SIA Licence Badge Photo
                </h3>
                <button
                  type="button"
                  onClick={() => setPreviewImageUrl(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[75vh]">
                <img
                  src={previewImageUrl}
                  alt="SIA Licence Full Preview"
                  className="max-h-[75vh] w-auto object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
