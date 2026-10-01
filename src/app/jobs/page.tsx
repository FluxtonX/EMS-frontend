'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { useWorkforceStore } from '@/lib/stores/workforceStore';
import {
  Button,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TablePagination,
  Badge,
  Modal,
  Tabs,
  TabList,
  TabTrigger,
  TabContent,
  TableSkeleton,
  EmptyState,
} from '@/components/ui';
import { toast } from '@/lib/toastStore';
import { fetchSiteJobs, addSiteJobApi, updateSiteJobApi } from '@/lib/api/sites';
import { JobType, Site, SiteJob } from '@/types/site';
import {
  Briefcase,
  Plus,
  Search,
  Building2,
  Coins,
  TrendingUp,
  Percent,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Edit2,
  DollarSign,
} from 'lucide-react';

export default function JobRolesAndRatesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'catalog' | 'matrix'>('catalog');

  // Store bindings
  const {
    jobTypes,
    isJobTypesLoading,
    fetchJobTypes,
    createJobType,
    sites,
    isSitesLoading,
    fetchSites,
  } = useWorkforceStore();

  useEffect(() => {
    fetchJobTypes();
    fetchSites();
  }, [fetchJobTypes, fetchSites]);

  // Tab 1: Catalog Filters & Modal
  const [catalogSearch, setCatalogSearch] = useState('');
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({
    name: '',
    description: '',
  });

  // Tab 2: Site Rates Matrix Filters & Modals
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('all');
  const [matrixSearch, setMatrixSearch] = useState('');
  const [isAddSiteJobOpen, setIsAddSiteJobOpen] = useState(false);
  const [isEditSiteJobOpen, setIsEditSiteJobOpen] = useState(false);
  const [selectedSiteJobForEdit, setSelectedSiteJobForEdit] = useState<SiteJob | null>(null);

  const [siteJobForm, setSiteJobForm] = useState({
    siteId: '',
    jobTypeId: '',
    defaultPayRate: '',
    billingRate: '',
  });

  const [editSiteJobForm, setEditSiteJobForm] = useState({
    defaultPayRate: '',
    billingRate: '',
    status: 'active' as 'active' | 'inactive',
  });

  // Fetch all site jobs across all sites
  const { data: allSiteJobs = [], isLoading: isSiteJobsMatrixLoading, refetch: refetchSiteJobs } = useQuery({
    queryKey: ['all-site-jobs-matrix', sites.map((s) => s.id).join(',')],
    queryFn: async () => {
      if (sites.length === 0) return [];
      const results = await Promise.all(
        sites.map(async (site) => {
          try {
            const jobs = await fetchSiteJobs(site.id);
            return jobs.map((j) => ({
              ...j,
              siteName: site.name,
              siteCode: site.code,
            }));
          } catch {
            return [];
          }
        })
      );
      return results.flat();
    },
    enabled: sites.length > 0,
  });

  // Mutation: Create Job Role in Company Catalog
  const createJobTypeMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string }) =>
      createJobType(payload),
    onSuccess: (created) => {
      toast.success(`Job role '${created.name}' created successfully.`);
      setIsAddRoleOpen(false);
      setNewRoleForm({ name: '', description: '' });
      fetchJobTypes(true);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create job role.');
    },
  });

  // Mutation: Attach Role to Site
  const addSiteJobMutation = useMutation({
    mutationFn: async (payload: {
      siteId: string;
      jobTypeId: string;
      defaultPayRate: number;
      billingRate: number;
    }) => {
      return addSiteJobApi(payload.siteId, {
        jobTypeId: payload.jobTypeId,
        defaultPayRate: payload.defaultPayRate,
        billingRate: payload.billingRate,
        currency: 'GBP',
      });
    },
    onSuccess: () => {
      toast.success('Job role configured for site successfully.');
      setIsAddSiteJobOpen(false);
      setSiteJobForm({
        siteId: '',
        jobTypeId: '',
        defaultPayRate: '',
        billingRate: '',
      });
      refetchSiteJobs();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to configure site role.');
    },
  });

  // Mutation: Update Site Job Rate
  const updateSiteJobMutation = useMutation({
    mutationFn: async (payload: {
      siteId: string;
      siteJobId: string;
      defaultPayRate: number;
      billingRate: number;
      status: 'active' | 'inactive';
    }) => {
      return updateSiteJobApi(payload.siteId, payload.siteJobId, {
        defaultPayRate: payload.defaultPayRate,
        billingRate: payload.billingRate,
        status: payload.status,
      });
    },
    onSuccess: () => {
      toast.success('Site rates updated successfully.');
      setIsEditSiteJobOpen(false);
      setSelectedSiteJobForEdit(null);
      refetchSiteJobs();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update site rates.');
    },
  });

  // Filtered Job Types Catalog
  const filteredJobTypes = useMemo(() => {
    return jobTypes.filter((jt) => {
      const q = catalogSearch.toLowerCase();
      return jt.name.toLowerCase().includes(q) || (jt.description && jt.description.toLowerCase().includes(q));
    });
  }, [jobTypes, catalogSearch]);

  // Filtered Site Jobs Matrix
  const filteredMatrix = useMemo(() => {
    return allSiteJobs.filter((sj: any) => {
      const matchesSite = selectedSiteFilter === 'all' || sj.siteId === selectedSiteFilter;
      const q = matrixSearch.toLowerCase();
      const matchesQuery =
        !q ||
        sj.siteName?.toLowerCase().includes(q) ||
        sj.siteCode?.toLowerCase().includes(q) ||
        sj.jobType?.name?.toLowerCase().includes(q);
      return matchesSite && matchesQuery;
    });
  }, [allSiteJobs, selectedSiteFilter, matrixSearch]);

  // High-Level KPIs
  const totalRolesCount = jobTypes.length;
  const totalDeployments = allSiteJobs.length;

  const avgPayRate = useMemo(() => {
    if (allSiteJobs.length === 0) return 0;
    const sum = allSiteJobs.reduce((acc, curr) => acc + Number(curr.defaultPayRate || 0), 0);
    return sum / allSiteJobs.length;
  }, [allSiteJobs]);

  const avgBillingRate = useMemo(() => {
    if (allSiteJobs.length === 0) return 0;
    const sum = allSiteJobs.reduce((acc, curr) => acc + Number(curr.billingRate || 0), 0);
    return sum / allSiteJobs.length;
  }, [allSiteJobs]);

  const avgMargin = avgBillingRate > 0 ? ((avgBillingRate - avgPayRate) / avgBillingRate) * 100 : 0;

  return (
    <AppShell>
      <PageContainer
        title="Job Roles & Rates"
        subtitle="Manage company-wide role standards, site rate matrices, and billing margins."
        breadcrumbs={[
          { label: 'Workforce Platform', href: '/dashboard' },
          { label: 'Job Roles & Rates' },
        ]}
        primaryAction={
          activeTab === 'catalog' ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsAddRoleOpen(true)}
            >
              Add Job Role
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsAddSiteJobOpen(true)}
            >
              Configure Site Role
            </Button>
          )
        }
      >
        {/* KPI Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-xl bg-white border border-[#E5E3F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#687086]">Defined Job Roles</span>
              <div className="p-1.5 rounded-lg bg-[#F5F3FF] text-[#6C5CE7]">
                <Briefcase className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#171A2B] mt-1.5">{totalRolesCount}</div>
            <p className="text-[11px] text-[#687086] mt-0.5">Company operational catalog</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#E5E3F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#687086]">Site Deployments</span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#171A2B] mt-1.5">{totalDeployments}</div>
            <p className="text-[11px] text-[#687086] mt-0.5">Configured site role rates</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#E5E3F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#687086]">Avg. Worker Pay Rate</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Coins className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#171A2B] mt-1.5">
              &pound;{avgPayRate.toFixed(2)}<span className="text-xs font-normal text-[#687086]">/hr</span>
            </div>
            <p className="text-[11px] text-[#687086] mt-0.5">Base agreed hourly wage</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#E5E3F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#687086]">Avg. Gross Margin</span>
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-1.5">
              {avgMargin.toFixed(1)}%
            </div>
            <p className="text-[11px] text-[#687086] mt-0.5">
              Billing: &pound;{avgBillingRate.toFixed(2)}/hr
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-[#E5E3F2] flex items-center justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'catalog'
                  ? 'border-[#6C5CE7] text-[#6C5CE7]'
                  : 'border-transparent text-[#687086] hover:text-[#171A2B]'
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              Job Roles Catalog ({jobTypes.length})
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'matrix'
                  ? 'border-[#6C5CE7] text-[#6C5CE7]'
                  : 'border-transparent text-[#687086] hover:text-[#171A2B]'
              }`}
            >
              <Coins className="h-3.5 w-3.5" />
              Site Rates Matrix ({allSiteJobs.length})
            </button>
          </div>
        </div>

        {/* TAB 1: JOB ROLES CATALOG */}
        {activeTab === 'catalog' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E5E3F2]">
              <div className="w-80">
                <Input
                  placeholder="Search job roles..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                  className="h-8 text-xs"
                />
              </div>
              <span className="text-xs text-[#687086]">
                Showing {filteredJobTypes.length} defined standard roles
              </span>
            </div>

            {isJobTypesLoading && jobTypes.length === 0 ? (
              <TableSkeleton rows={4} cols={4} />
            ) : filteredJobTypes.length === 0 ? (
              <EmptyState
                title="No job roles found"
                description="Get started by defining company job roles like 'Door Supervisor' or 'Security Officer'."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus className="h-4 w-4" />}
                    onClick={() => setIsAddRoleOpen(true)}
                  >
                    Add Job Role
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Configured Sites</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobTypes.map((role) => {
                    const usageCount = allSiteJobs.filter((sj) => sj.jobTypeId === role.id).length;
                    return (
                      <TableRow key={role.id}>
                        <TableCell className="font-semibold text-[#171A2B] text-xs">
                          {role.name}
                        </TableCell>
                        <TableCell className="text-xs text-[#687086]">
                          {role.description || 'Standard workforce job role'}
                        </TableCell>
                        <TableCell>
                          {role.isActive ? (
                            <Badge variant="success" size="sm" dot>Active</Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-[#687086]">
                          <span className="font-semibold text-[#171A2B]">{usageCount}</span> sites
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => {
                              setSelectedSiteFilter('all');
                              setMatrixSearch(role.name);
                              setActiveTab('matrix');
                            }}
                            className="text-[11px] h-7"
                          >
                            View Rates
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* TAB 2: SITE RATES MATRIX */}
        {activeTab === 'matrix' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E5E3F2]">
              <div className="flex items-center gap-3">
                <div className="w-64">
                  <Input
                    placeholder="Search by site or role..."
                    value={matrixSearch}
                    onChange={(e) => setMatrixSearch(e.target.value)}
                    leftIcon={<Search className="h-4 w-4" />}
                    className="h-8 text-xs"
                  />
                </div>
                <select
                  value={selectedSiteFilter}
                  onChange={(e) => setSelectedSiteFilter(e.target.value)}
                  className="h-8 rounded bg-white px-2.5 text-xs text-[#171A2B] border border-[#E5E3F2] outline-none cursor-pointer"
                >
                  <option value="all">All Sites</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-xs text-[#687086]">
                Showing {filteredMatrix.length} site rate configurations
              </span>
            </div>

            {isSiteJobsMatrixLoading ? (
              <TableSkeleton rows={5} cols={6} />
            ) : filteredMatrix.length === 0 ? (
              <EmptyState
                title="No site rates configured"
                description="Configure hourly pay and billing rates for specific client sites."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus className="h-4 w-4" />}
                    onClick={() => setIsAddSiteJobOpen(true)}
                  >
                    Configure Site Role
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deployment Site</TableHead>
                    <TableHead>Role Title</TableHead>
                    <TableHead>Worker Pay Rate</TableHead>
                    <TableHead>Client Billing Rate</TableHead>
                    <TableHead>Gross Margin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatrix.map((sj: any) => {
                    const pay = Number(sj.defaultPayRate || 0);
                    const bill = Number(sj.billingRate || 0);
                    const marginDiff = bill - pay;
                    const marginPct = bill > 0 ? (marginDiff / bill) * 100 : 0;

                    return (
                      <TableRow key={sj.id}>
                        <TableCell>
                          <div className="font-semibold text-[#171A2B] text-xs">
                            {sj.siteName}
                          </div>
                          <div className="text-[11px] text-[#687086] font-mono">
                            {sj.siteCode}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-[#171A2B] text-xs">
                          {sj.jobType?.name || 'Security Officer'}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-[#171A2B]">
                          &pound;{pay.toFixed(2)}/hr
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-purple-700">
                          &pound;{bill.toFixed(2)}/hr
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={marginDiff >= 5 ? 'success' : marginDiff > 0 ? 'warning' : 'danger'}
                            size="sm"
                          >
                            +&pound;{marginDiff.toFixed(2)}/hr ({marginPct.toFixed(0)}%)
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {sj.status === 'active' ? (
                            <Badge variant="success" size="sm" dot>Active</Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="xs"
                            className="h-7 text-xs gap-1"
                            onClick={() => {
                              setSelectedSiteJobForEdit(sj);
                              setEditSiteJobForm({
                                defaultPayRate: sj.defaultPayRate.toString(),
                                billingRate: sj.billingRate.toString(),
                                status: sj.status || 'active',
                              });
                              setIsEditSiteJobOpen(true);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* MODAL: ADD JOB ROLE TO CATALOG */}
        <Modal
          isOpen={isAddRoleOpen}
          onClose={() => setIsAddRoleOpen(false)}
          title="Add Company Job Role"
          description="Define a new standardized job role definition for deployment across client sites."
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => setIsAddRoleOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={createJobTypeMutation.isPending}
                onClick={() => {
                  if (!newRoleForm.name.trim()) {
                    toast.error('Role name is required.');
                    return;
                  }
                  createJobTypeMutation.mutate(newRoleForm);
                }}
              >
                Create Job Role
              </Button>
            </div>
          }
        >
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#687086] mb-1">
                Role Title *
              </label>
              <Input
                placeholder="e.g. Close Protection Specialist"
                value={newRoleForm.name}
                onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#687086] mb-1">
                Description (Optional)
              </label>
              <Input
                placeholder="Brief summary of duties and responsibilities..."
                value={newRoleForm.description}
                onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
              />
            </div>
          </div>
        </Modal>

        {/* MODAL: CONFIGURE SITE ROLE */}
        <Modal
          isOpen={isAddSiteJobOpen}
          onClose={() => setIsAddSiteJobOpen(false)}
          title="Configure Job Role for Site"
          description="Attach a job role to a client site with agreed base pay and billing rates."
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => setIsAddSiteJobOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={addSiteJobMutation.isPending}
                onClick={() => {
                  if (!siteJobForm.siteId) {
                    toast.error('Please select a destination site.');
                    return;
                  }
                  if (!siteJobForm.jobTypeId) {
                    toast.error('Please select a job role.');
                    return;
                  }
                  if (!siteJobForm.defaultPayRate || !siteJobForm.billingRate) {
                    toast.error('Pay rate and billing rate are both required.');
                    return;
                  }
                  addSiteJobMutation.mutate({
                    siteId: siteJobForm.siteId,
                    jobTypeId: siteJobForm.jobTypeId,
                    defaultPayRate: parseFloat(siteJobForm.defaultPayRate),
                    billingRate: parseFloat(siteJobForm.billingRate),
                  });
                }}
              >
                Save Site Role
              </Button>
            </div>
          }
        >
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#687086] mb-1">
                Select Site *
              </label>
              <select
                value={siteJobForm.siteId}
                onChange={(e) => setSiteJobForm({ ...siteJobForm, siteId: e.target.value })}
                className="w-full h-9 rounded bg-white px-3 text-xs border border-[#E5E3F2] outline-none text-[#171A2B]"
              >
                <option value="">-- Choose Site --</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#687086] mb-1">
                Select Job Role *
              </label>
              <select
                value={siteJobForm.jobTypeId}
                onChange={(e) => setSiteJobForm({ ...siteJobForm, jobTypeId: e.target.value })}
                className="w-full h-9 rounded bg-white px-3 text-xs border border-[#E5E3F2] outline-none text-[#171A2B]"
              >
                <option value="">-- Choose Role --</option>
                {jobTypes.map((jt) => (
                  <option key={jt.id} value={jt.id}>
                    {jt.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#687086] mb-1">
                  Default Worker Pay (&pound;/hr) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 14.50"
                  value={siteJobForm.defaultPayRate}
                  onChange={(e) => setSiteJobForm({ ...siteJobForm, defaultPayRate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#687086] mb-1">
                  Client Billing Rate (&pound;/hr) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 21.00"
                  value={siteJobForm.billingRate}
                  onChange={(e) => setSiteJobForm({ ...siteJobForm, billingRate: e.target.value })}
                />
              </div>
            </div>

            {siteJobForm.defaultPayRate && siteJobForm.billingRate && (
              <div className="p-2.5 rounded bg-[#F5F3FF] border border-[#D5D0FA] flex items-center justify-between text-xs">
                <span className="text-[#687086]">Calculated Hourly Margin:</span>
                <span className="font-bold text-[#6C5CE7]">
                  &pound;{(parseFloat(siteJobForm.billingRate) - parseFloat(siteJobForm.defaultPayRate)).toFixed(2)}/hr
                </span>
              </div>
            )}
          </div>
        </Modal>

        {/* MODAL: EDIT SITE JOB RATES */}
        <Modal
          isOpen={isEditSiteJobOpen}
          onClose={() => setIsEditSiteJobOpen(false)}
          title={`Edit Rates — ${selectedSiteJobForEdit?.jobType?.name || 'Site Role'}`}
          description={`Update default wage or billing contract for ${selectedSiteJobForEdit?.siteId}.`}
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => setIsEditSiteJobOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={updateSiteJobMutation.isPending}
                onClick={() => {
                  if (!selectedSiteJobForEdit) return;
                  updateSiteJobMutation.mutate({
                    siteId: selectedSiteJobForEdit.siteId,
                    siteJobId: selectedSiteJobForEdit.id,
                    defaultPayRate: parseFloat(editSiteJobForm.defaultPayRate),
                    billingRate: parseFloat(editSiteJobForm.billingRate),
                    status: editSiteJobForm.status,
                  });
                }}
              >
                Update Rates
              </Button>
            </div>
          }
        >
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#687086] mb-1">
                  Default Worker Pay (&pound;/hr) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={editSiteJobForm.defaultPayRate}
                  onChange={(e) =>
                    setEditSiteJobForm({ ...editSiteJobForm, defaultPayRate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#687086] mb-1">
                  Client Billing Rate (&pound;/hr) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={editSiteJobForm.billingRate}
                  onChange={(e) =>
                    setEditSiteJobForm({ ...editSiteJobForm, billingRate: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#687086] mb-1">
                Deployment Status
              </label>
              <select
                value={editSiteJobForm.status}
                onChange={(e) =>
                  setEditSiteJobForm({ ...editSiteJobForm, status: e.target.value as any })
                }
                className="w-full h-9 rounded bg-white px-3 text-xs border border-[#E5E3F2] outline-none text-[#171A2B]"
              >
                <option value="active">Active (Available for assignments)</option>
                <option value="inactive">Inactive (Suspended)</option>
              </select>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </AppShell>
  );
}
