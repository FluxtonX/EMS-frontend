'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { useWorkforceStore } from '@/lib/stores/workforceStore';
import {
  Button,
  Input,
  Select,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Modal,
  Drawer,
  EmptyState,
  TableSkeleton,
} from '@/components/ui';
import { toast } from '@/lib/toastStore';
import {
  fetchSites,
  createSiteApi,
  fetchJobTypes,
  createJobTypeApi,
  fetchSiteJobs,
  addSiteJobApi,
  updateSiteJobApi,
} from '@/lib/api/sites';
import { Site, SiteJob } from '@/types/site';
import {
  Plus,
  Search,
  Building2,
  Briefcase,
  MapPin,
  Phone,
  SlidersHorizontal,
  Coins,
  CheckCircle2,
  Edit2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { mockSites, mockJobTypes } from '@/lib/mockData';

export default function SitesPage() {
  const queryClient = useQueryClient();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');

  // Modals & Drawers
  const [isCreateSiteOpen, setIsCreateSiteOpen] = useState(false);
  const [isJobTypesDrawerOpen, setIsJobTypesDrawerOpen] = useState(false);
  const [selectedSiteForRates, setSelectedSiteForRates] = useState<Site | null>(null);
  const [isAddRateOpen, setIsAddRateOpen] = useState(false);
  const [editingSiteJob, setEditingSiteJob] = useState<SiteJob | null>(null);

  // Form states: Create Site
  const [newSite, setNewSite] = useState({
    name: '',
    code: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      postalCode: '',
      country: 'United Kingdom',
    },
    contactName: '',
    contactPhone: '',
    contactEmail: '',
  });

  // Form states: Global Job Type
  const [newJobType, setNewJobType] = useState({
    name: '',
    description: '',
  });

  // Form states: Site Job Rate Matrix
  const [rateForm, setRateForm] = useState({
    jobTypeId: '',
    defaultPayRate: '',
    billingRate: '',
    currency: 'GBP',
  });

  // Workforce Central Store
  const {
    sites,
    jobTypes,
    hasRealSites,
    isSitesLoading,
    isSitesRefreshing,
    isJobTypesLoading: isLoadingJobTypes,
    fetchSites: syncSites,
    fetchJobTypes: syncJobTypes,
    createSite: storeCreateSite,
    createJobType: storeCreateJobType,
    addSiteJob: storeAddSiteJob,
    updateSiteJob: storeUpdateSiteJob,
  } = useWorkforceStore();

  useEffect(() => {
    syncSites();
    syncJobTypes();
  }, [syncSites, syncJobTypes]);

  const { data: realSiteJobs = [], isLoading: isLoadingSiteJobs } = useQuery({
    queryKey: ['site-jobs', selectedSiteForRates?.id],
    queryFn: () => (selectedSiteForRates ? fetchSiteJobs(selectedSiteForRates.id) : Promise.resolve([])),
    enabled: !!selectedSiteForRates && hasRealSites,
  });

  const siteJobs = hasRealSites ? realSiteJobs : (selectedSiteForRates?.jobs || []);

  // Mutations backed by instant store state
  const createSiteMutation = useMutation({
    mutationFn: (payload: any) => storeCreateSite(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success(`Deployment site ${data.name} [${data.code}] registered successfully.`);
      setIsCreateSiteOpen(false);
      setNewSite({
        name: '',
        code: '',
        address: { line1: '', line2: '', city: '', postalCode: '', country: 'United Kingdom' },
        contactName: '',
        contactPhone: '',
        contactEmail: '',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create site.');
    },
  });

  const createJobTypeMutation = useMutation({
    mutationFn: (payload: any) => storeCreateJobType(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['job-types'] });
      toast.success(`Role catalog updated: ${data.name} added.`);
      setNewJobType({ name: '', description: '' });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create job role.');
    },
  });

  const addSiteJobMutation = useMutation({
    mutationFn: ({ siteId, data }: { siteId: string; data: any }) => storeAddSiteJob(siteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-jobs', selectedSiteForRates?.id] });
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Role and authoritative rate matrix attached to site.');
      setIsAddRateOpen(false);
      setRateForm({ jobTypeId: '', defaultPayRate: '', billingRate: '', currency: 'GBP' });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to configure role rates.');
    },
  });

  const updateSiteJobMutation = useMutation({
    mutationFn: ({ siteId, jobId, data }: { siteId: string; jobId: string; data: any }) =>
      storeUpdateSiteJob(siteId, jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-jobs', selectedSiteForRates?.id] });
      toast.success('Site rates updated.');
      setEditingSiteJob(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update rates.');
    },
  });

  // Filtered Sites
  const filteredSites = sites.filter((site) => {
    const matchesSearch =
      searchTerm === '' ||
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.contactName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || site.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreateSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSite.name.trim() || !newSite.code.trim()) {
      toast.error('Site name and code are mandatory.');
      return;
    }
    createSiteMutation.mutate(newSite);
  };

  const handleCreateJobType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobType.name.trim()) {
      toast.error('Job role title is required.');
      return;
    }
    createJobTypeMutation.mutate(newJobType);
  };

  const handleAddSiteJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteForRates) return;
    if (!rateForm.jobTypeId) {
      toast.error('Please select a global job role.');
      return;
    }
    const pay = parseFloat(rateForm.defaultPayRate);
    const bill = parseFloat(rateForm.billingRate);
    if (isNaN(pay) || pay < 0 || isNaN(bill) || bill < 0) {
      toast.error('Valid non-negative pay and billing rates are required.');
      return;
    }

    addSiteJobMutation.mutate({
      siteId: selectedSiteForRates.id,
      data: {
        jobTypeId: rateForm.jobTypeId,
        defaultPayRate: pay,
        billingRate: bill,
        currency: rateForm.currency,
      },
    });
  };

  return (
    <AppShell>
      <PageContainer
        title="Deployment Sites & Rates"
        subtitle="Physical client sites, security deployments, and centralized role-rate matrices."
        primaryAction={
          <Button
            variant="primary"
            onClick={() => setIsCreateSiteOpen(true)}
            className="gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            New Deployment Site
          </Button>
        }
        secondaryActions={
          <div className="flex items-center gap-2">
            {!hasRealSites && (
              <Badge variant="info" size="sm" className="gap-1">
                <Info className="w-3 h-3 text-[#6C5CE7]" />
                Sample Sites Preview
              </Badge>
            )}
            <Button
              variant="outline"
              onClick={() => setIsJobTypesDrawerOpen(true)}
              className="gap-2"
            >
              <Briefcase className="w-4 h-4 text-slate-400" />
              Role Catalog ({jobTypes.length})
            </Button>
          </div>
        }
      >
        {!hasRealSites && (
          <div className="p-3 mb-6 rounded-lg bg-[#F5F3FF] border border-[#D5D0FA] flex items-center justify-between text-xs text-[#171A2B]">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#6C5CE7] animate-pulse" />
              <span>Showing sample client deployment sites. Click &quot;New Deployment Site&quot; to register your first live location.</span>
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div className="bg-white border border-[#E5E3F2] rounded-lg p-4 mb-6 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by site code, name, city, or manager..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-[#E5E3F2] rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
            />
          </div>

          <div className="w-full md:w-56">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              options={[
                { value: 'all', label: 'All Deployment Statuses' },
                { value: 'active', label: 'Active Sites Only' },
                { value: 'inactive', label: 'Inactive Sites' },
                { value: 'archived', label: 'Archived Sites' },
              ]}
            />
          </div>
        </div>

        {/* Sites Table */}
        <div className="bg-white border border-[#E5E3F2] rounded-lg shadow-xs overflow-hidden">
          {isSitesLoading && sites.length === 0 ? (
            <TableSkeleton rows={5} cols={6} />
          ) : filteredSites.length === 0 ? (
            <EmptyState
              title="No deployment sites found"
              description="Register physical deployment locations and attach billable job rates."
              action={
                <Button variant="primary" onClick={() => setIsCreateSiteOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add First Site
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site Code</TableHead>
                  <TableHead>Location & Name</TableHead>
                  <TableHead>Site Contact</TableHead>
                  <TableHead>Configured Roles & Rates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-800 rounded border border-slate-200">
                        {site.code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {site.name}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {site.address?.city || 'UK'}, {site.address?.postalCode || ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      {site.contactName ? (
                        <div className="text-sm">
                          <div className="text-slate-800 font-medium">
                            {site.contactName}
                          </div>
                          {site.contactPhone && (
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />
                              {site.contactPhone}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No contact assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => setSelectedSiteForRates(site)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
                      >
                        <Coins className="w-3.5 h-3.5 text-sky-600" />
                        <span>Manage Rates ({site.configuredJobsCount ?? 0})</span>
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          site.status === 'active'
                            ? 'success'
                            : site.status === 'inactive'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {site.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedSiteForRates(site)}
                        className="text-xs gap-1"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        Roles & Rates
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </PageContainer>

      {/* CREATE SITE MODAL */}
      <Modal
        isOpen={isCreateSiteOpen}
        onClose={() => setIsCreateSiteOpen(false)}
        title="Register New Deployment Site"
        description="Physical client location where security workforce will be assigned and tracked."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSite} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Site Name *</label>
              <Input
                placeholder="e.g. Canary Wharf Tower 2"
                value={newSite.name}
                onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Site Code *</label>
              <Input
                placeholder="e.g. CW-02"
                value={newSite.code}
                onChange={(e) => setNewSite({ ...newSite, code: e.target.value.toUpperCase() })}
                required
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Location Address
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address Line 1</label>
                <Input
                  placeholder="Building number, street"
                  value={newSite.address.line1}
                  onChange={(e) =>
                    setNewSite({
                      ...newSite,
                      address: { ...newSite.address, line1: e.target.value },
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <Input
                    placeholder="London"
                    value={newSite.address.city}
                    onChange={(e) =>
                      setNewSite({
                        ...newSite,
                        address: { ...newSite.address, city: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Postal Code</label>
                  <Input
                    placeholder="E14 5AB"
                    value={newSite.address.postalCode}
                    onChange={(e) =>
                      setNewSite({
                        ...newSite,
                        address: { ...newSite.address, postalCode: e.target.value.toUpperCase() },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Primary Site Contact
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name</label>
                <Input
                  placeholder="Site Manager"
                  value={newSite.contactName}
                  onChange={(e) => setNewSite({ ...newSite, contactName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <Input
                  placeholder="+44 7..."
                  value={newSite.contactPhone}
                  onChange={(e) => setNewSite({ ...newSite, contactPhone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email</label>
                <Input
                  placeholder="site@client.com"
                  value={newSite.contactEmail}
                  onChange={(e) => setNewSite({ ...newSite, contactEmail: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateSiteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createSiteMutation.isPending}
            >
              Create Site
            </Button>
          </div>
        </form>
      </Modal>

      {/* GLOBAL JOB TYPES CATALOG DRAWER */}
      <Drawer
        isOpen={isJobTypesDrawerOpen}
        onClose={() => setIsJobTypesDrawerOpen(false)}
        title="Global Role Catalog"
        description="Company-wide standard job designations. Prevents duplicate titles and standardizes compliance."
        width="lg"
      >
        <div className="space-y-6">
          {/* Add Job Type Form */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-2">
              Add New Standard Role
            </h4>
            <form onSubmit={handleCreateJobType} className="space-y-3">
              <Input
                placeholder="Role title (e.g. CCTV Control Officer, Door Supervisor)"
                value={newJobType.name}
                onChange={(e) => setNewJobType({ ...newJobType, name: e.target.value })}
                required
              />
              <Input
                placeholder="Brief role responsibilities or licence prerequisites..."
                value={newJobType.description}
                onChange={(e) => setNewJobType({ ...newJobType, description: e.target.value })}
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-full gap-2"
                isLoading={createJobTypeMutation.isPending}
              >
                <Plus className="w-4 h-4" />
                Add to Global Catalog
              </Button>
            </form>
          </div>

          {/* Existing Job Types */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Existing Standard Roles ({jobTypes.length})
            </h4>
            {isLoadingJobTypes ? (
              <p className="text-sm text-slate-400">Loading catalog...</p>
            ) : jobTypes.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No job roles created yet.</p>
            ) : (
              <div className="space-y-2">
                {jobTypes.map((job) => (
                  <div
                    key={job.id}
                    className="p-3 bg-white rounded-md border border-slate-200 flex items-start justify-between shadow-2xs"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-sky-500" />
                        {job.name}
                      </div>
                      {job.description && (
                        <p className="text-xs text-slate-500 mt-1">
                          {job.description}
                        </p>
                      )}
                    </div>
                    <Badge variant={job.isActive ? 'success' : 'neutral'} size="sm">
                      {job.isActive ? 'active' : 'inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Drawer>

      {/* SITE JOBS & AUTHORITATIVE RATE MATRIX DRAWER (SECTION 21) */}
      <Drawer
        isOpen={!!selectedSiteForRates}
        onClose={() => {
          setSelectedSiteForRates(null);
          setIsAddRateOpen(false);
          setEditingSiteJob(null);
        }}
        title={`Rates Matrix: ${selectedSiteForRates?.name || ''}`}
        description={`Authoritative pay & billing rates for ${selectedSiteForRates?.code || ''}. Overrides global defaults with zero duplicate tables.`}
        width="xl"
      >
        <div className="space-y-6">
          {/* Site summary header */}
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold text-sky-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-600" />
                {selectedSiteForRates?.name} [{selectedSiteForRates?.code}]
              </div>
              <Badge variant="success" size="sm">Authoritative Rates</Badge>
            </div>
            <p className="text-xs text-sky-700">
              When an employee is assigned to this site under a configured role, these rates govern all shift calculations, gross margin displays, and payroll generation.
            </p>
          </div>

          {/* Action to attach new role to site */}
          {!isAddRateOpen ? (
            <Button
              variant="outline"
              onClick={() => setIsAddRateOpen(true)}
              className="w-full gap-2 border-dashed"
            >
              <Plus className="w-4 h-4 text-sky-600" />
              Attach Role & Define Hourly Rates
            </Button>
          ) : (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-900">
                  Configure Site Role Rate
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsAddRateOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>

              <form onSubmit={handleAddSiteJob} className="space-y-3">
                <Select
                  label="Select Role from Catalog *"
                  value={rateForm.jobTypeId}
                  onChange={(e) => setRateForm({ ...rateForm, jobTypeId: e.target.value })}
                  options={[
                    { value: '', label: '-- Select a Role --' },
                    ...jobTypes.map((jt) => ({
                      value: jt.id,
                      label: jt.name,
                    })),
                  ]}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Default Pay Rate (£/hr) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 14.50"
                      value={rateForm.defaultPayRate}
                      onChange={(e) => setRateForm({ ...rateForm, defaultPayRate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Client Billing Rate (£/hr) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 21.00"
                      value={rateForm.billingRate}
                      onChange={(e) => setRateForm({ ...rateForm, billingRate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {rateForm.defaultPayRate && rateForm.billingRate && (
                  <div className="p-2.5 bg-white rounded border border-slate-200 text-xs flex justify-between">
                    <span className="text-slate-500">Gross Margin:</span>
                    <span className="font-semibold text-emerald-600">
                      £{(parseFloat(rateForm.billingRate) - parseFloat(rateForm.defaultPayRate)).toFixed(2)}/hr (
                      {(
                        ((parseFloat(rateForm.billingRate) - parseFloat(rateForm.defaultPayRate)) /
                          parseFloat(rateForm.billingRate)) *
                        100
                      ).toFixed(1)}
                      %)
                    </span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full gap-2 mt-2"
                  isLoading={addSiteJobMutation.isPending}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save Site Rate Matrix
                </Button>
              </form>
            </div>
          )}

          {/* Configured Site Rates List */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Configured Rates for Site ({siteJobs.length})
            </h4>

            {isLoadingSiteJobs ? (
              <p className="text-sm text-slate-400">Loading site rate matrices...</p>
            ) : siteJobs.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">
                  No roles configured for this site yet.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Add roles above so assignments can pull locked pay and billing rates.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {siteJobs.map((sj) => {
                  const margin = sj.billingRate - sj.defaultPayRate;
                  const marginPct = (margin / (sj.billingRate || 1)) * 100;
                  const isEditing = editingSiteJob?.id === sj.id;

                  return (
                    <div
                      key={sj.id}
                      className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs"
                    >
                      {!isEditing ? (
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
                              <Briefcase className="w-4 h-4 text-sky-500" />
                              {sj.jobType?.name || 'Assigned Role'}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge variant={sj.status === 'active' ? 'success' : 'neutral'} size="sm">
                                {sj.status}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingSiteJob(sj)}
                                className="h-7 w-7 p-0"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                            <div>
                              <span className="text-slate-400 block">Default Pay</span>
                              <span className="font-mono font-semibold text-slate-800">
                                £{Number(sj.defaultPayRate).toFixed(2)}/hr
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Client Billing</span>
                              <span className="font-mono font-semibold text-slate-800">
                                £{Number(sj.billingRate).toFixed(2)}/hr
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Gross Margin</span>
                              <span className="font-mono font-semibold text-emerald-600">
                                £{margin.toFixed(2)} ({marginPct.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <h5 className="text-xs font-bold text-slate-700">
                            Edit Rates for {sj.jobType?.name}
                          </h5>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Pay Rate (£/hr)</label>
                              <Input
                                type="number"
                                step="0.01"
                                value={editingSiteJob.defaultPayRate}
                                onChange={(e) =>
                                  setEditingSiteJob({
                                    ...editingSiteJob,
                                    defaultPayRate: parseFloat(e.target.value) || 0,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Rate (£/hr)</label>
                              <Input
                                type="number"
                                step="0.01"
                                value={editingSiteJob.billingRate}
                                onChange={(e) =>
                                  setEditingSiteJob({
                                    ...editingSiteJob,
                                    billingRate: parseFloat(e.target.value) || 0,
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingSiteJob(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              isLoading={updateSiteJobMutation.isPending}
                              onClick={() =>
                                selectedSiteForRates &&
                                updateSiteJobMutation.mutate({
                                  siteId: selectedSiteForRates.id,
                                  jobId: sj.id,
                                  data: {
                                    defaultPayRate: editingSiteJob.defaultPayRate,
                                    billingRate: editingSiteJob.billingRate,
                                  },
                                })
                              }
                            >
                              Save Rates
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Drawer>
    </AppShell>
  );
}
