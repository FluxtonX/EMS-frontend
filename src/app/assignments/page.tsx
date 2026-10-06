'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  TableSkeleton,
  EmptyState,
} from '@/components/ui';
import { toast } from '@/lib/toastStore';
import {
  fetchCompanyAssignments,
  createAssignmentApi,
  transferEmployeeApi,
  closeAssignmentApi,
  fetchEmployeeAssignments,
} from '@/lib/api/assignments';
import { fetchSites, fetchSiteJobs } from '@/lib/api/sites';
import { Assignment, AssignmentStatus } from '@/types/assignment';
import {
  UserCheck,
  Plus,
  Search,
  Building2,
  Lock,
  ArrowRightLeft,
  Calendar,
  Shield,
  CheckCircle2,
  AlertCircle,
  XCircle,
  History,
  UserX,
  AlertTriangle,
  ArrowUpRight,
  Radio,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';

export default function AssignmentsPage() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const rawRole = (session?.company?.role || 'OWNER').toUpperCase().trim();
  const currentRole = rawRole === 'SUPERVISOR' ? 'OPERATOR' : rawRole;
  const isOperator = currentRole === 'OPERATOR';

  const { employees, fetchEmployees } = useWorkforceStore();

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('all');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Selected Assignment for Actions
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [historyEmployee, setHistoryEmployee] = useState<{ id: string; name: string; number: string } | null>(null);

  // Deploy Form State
  const [deployEmployeeId, setDeployEmployeeId] = useState('');
  const [deploySiteId, setDeploySiteId] = useState('');
  const [deploySiteJobId, setDeploySiteJobId] = useState('');
  const [deployPayRate, setDeployPayRate] = useState<number | ''>('');
  const [deployStartDate, setDeployStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [deployEndDate, setDeployEndDate] = useState('');

  // Transfer Form State
  const [transferSiteId, setTransferSiteId] = useState('');
  const [transferSiteJobId, setTransferSiteJobId] = useState('');
  const [transferPayRate, setTransferPayRate] = useState<number | ''>('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [transferReason, setTransferReason] = useState('');

  // Close Form State
  const [closeEndDate, setCloseEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [closeReason, setCloseReason] = useState('');

  // Initial load
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Fetch Sites
  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: fetchSites,
    staleTime: 5 * 60 * 1000,
  });

  const realSites = useMemo(() => {
    const list = sites.filter((s) => !s.id.startsWith('site-demo-'));
    return list.length > 0 ? list : sites;
  }, [sites]);

  const candidateEmployees = useMemo(() => {
    const real = employees.filter((e) => !e.id.startsWith('emp-demo-'));
    return real.length > 0 ? real : employees;
  }, [employees]);

  // Fetch Assignments
  const {
    data: assignments = [],
    isLoading: isLoadingAssignments,
  } = useQuery({
    queryKey: ['company-assignments', selectedSiteFilter, selectedStatusTab],
    queryFn: () =>
      fetchCompanyAssignments({
        siteId: selectedSiteFilter !== 'all' ? selectedSiteFilter : undefined,
        status: selectedStatusTab !== 'all' ? selectedStatusTab : undefined,
      }),
  });

  // Fetch site jobs when selecting site in Deploy Modal
  const { data: rawDeploySiteJobs = [], isLoading: isLoadingDeployJobs } = useQuery({
    queryKey: ['site-jobs', deploySiteId],
    queryFn: () => fetchSiteJobs(deploySiteId),
    enabled: !!deploySiteId,
  });

  const deploySiteJobs = useMemo(
    () => (rawDeploySiteJobs || []).filter((j) => j.status === 'active'),
    [rawDeploySiteJobs]
  );

  // Fetch site jobs when selecting site in Transfer Modal
  const { data: rawTransferSiteJobs = [], isLoading: isLoadingTransferJobs } = useQuery({
    queryKey: ['site-jobs', transferSiteId],
    queryFn: () => fetchSiteJobs(transferSiteId),
    enabled: !!transferSiteId,
  });

  const transferSiteJobs = useMemo(
    () => (rawTransferSiteJobs || []).filter((j) => j.status === 'active'),
    [rawTransferSiteJobs]
  );

  // Auto-populate first job role and default rate on deploy site change
  useEffect(() => {
    if (deploySiteId && deploySiteJobs.length > 0 && !deploySiteJobId) {
      setDeploySiteJobId(deploySiteJobs[0].id);
      setDeployPayRate(deploySiteJobs[0].defaultPayRate);
    }
  }, [deploySiteId, deploySiteJobs, deploySiteJobId]);

  // Auto-populate first job role and default rate on transfer site change
  useEffect(() => {
    if (transferSiteId && transferSiteJobs.length > 0 && !transferSiteJobId) {
      setTransferSiteJobId(transferSiteJobs[0].id);
      setTransferPayRate(transferSiteJobs[0].defaultPayRate);
    }
  }, [transferSiteId, transferSiteJobs, transferSiteJobId]);

  // Fetch Employee History for modal
  const { data: employeeHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['employee-assignment-history', historyEmployee?.id],
    queryFn: () => (historyEmployee ? fetchEmployeeAssignments(historyEmployee.id) : Promise.resolve([])),
    enabled: !!historyEmployee?.id && isHistoryModalOpen,
  });

  // Automatically update pay rate when site job changes in deploy modal
  const handleDeploySiteJobChange = (jobId: string) => {
    setDeploySiteJobId(jobId);
    const selectedJob = deploySiteJobs.find((j) => j.id === jobId);
    if (selectedJob) {
      setDeployPayRate(selectedJob.defaultPayRate);
    }
  };

  // Automatically update pay rate when site job changes in transfer modal
  const handleTransferSiteJobChange = (jobId: string) => {
    setTransferSiteJobId(jobId);
    const selectedJob = transferSiteJobs.find((j) => j.id === jobId);
    if (selectedJob) {
      setTransferPayRate(selectedJob.defaultPayRate);
    }
  };

  // Deploy Mutation
  const deployMutation = useMutation({
    mutationFn: createAssignmentApi,
    onSuccess: () => {
      toast.success('Workforce member successfully deployed to site with locked rate.');
      setIsDeployModalOpen(false);
      resetDeployForm();
      queryClient.invalidateQueries({ queryKey: ['company-assignments'] });
      fetchEmployees(true);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to deploy employee.');
    },
  });

  // Transfer Mutation
  const transferMutation = useMutation({
    mutationFn: ({ employeeId, payload }: { employeeId: string; payload: any }) =>
      transferEmployeeApi(employeeId, payload),
    onSuccess: () => {
      toast.success('Atomic transfer completed. Historical records preserved.');
      setIsTransferModalOpen(false);
      setSelectedAssignment(null);
      resetTransferForm();
      queryClient.invalidateQueries({ queryKey: ['company-assignments'] });
      fetchEmployees(true);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to transfer employee.');
    },
  });

  // Close Mutation
  const closeMutation = useMutation({
    mutationFn: ({ assignmentId, payload }: { assignmentId: string; payload: any }) =>
      closeAssignmentApi(assignmentId, payload),
    onSuccess: () => {
      toast.success('Assignment closed. Employee returned to unassigned workforce pool.');
      setIsCloseModalOpen(false);
      setSelectedAssignment(null);
      resetCloseForm();
      queryClient.invalidateQueries({ queryKey: ['company-assignments'] });
      fetchEmployees(true);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to close assignment.');
    },
  });

  const resetDeployForm = () => {
    setDeployEmployeeId('');
    setDeploySiteId('');
    setDeploySiteJobId('');
    setDeployPayRate('');
    setDeployStartDate(new Date().toISOString().split('T')[0]);
    setDeployEndDate('');
  };

  const resetTransferForm = () => {
    setTransferSiteId('');
    setTransferSiteJobId('');
    setTransferPayRate('');
    setTransferDate(new Date().toISOString().split('T')[0]);
    setTransferReason('');
  };

  const resetCloseForm = () => {
    setCloseEndDate(new Date().toISOString().split('T')[0]);
    setCloseReason('');
  };

  // KPIs
  const activeAssignments = useMemo(
    () => assignments.filter((a) => a.status === 'active'),
    [assignments]
  );

  const activeEmployeeIds = useMemo(
    () => new Set(activeAssignments.map((a) => a.employeeId)),
    [activeAssignments]
  );

  const unassignedEmployees = useMemo(
    () => candidateEmployees.filter((e) => e.employmentStatus === 'active' && !activeEmployeeIds.has(e.id)),
    [candidateEmployees, activeEmployeeIds]
  );

  const activeSitesCovered = useMemo(() => {
    const sIds = new Set(
      activeAssignments
        .map((a) => a.siteJob?.site?.id)
        .filter(Boolean)
    );
    return sIds.size;
  }, [activeAssignments]);

  // Filtered & Paginated
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empName = `${a.employee?.firstName || ''} ${a.employee?.lastName || ''}`.toLowerCase();
        const empNum = (a.employee?.employeeNumber || '').toLowerCase();
        const siteName = (a.siteJob?.site?.name || '').toLowerCase();
        const jobName = (a.siteJob?.jobType?.name || '').toLowerCase();
        if (!empName.includes(q) && !empNum.includes(q) && !siteName.includes(q) && !jobName.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [assignments, searchQuery]);

  const totalPages = Math.ceil(filteredAssignments.length / pageSize) || 1;
  const paginatedAssignments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAssignments.slice(start, start + pageSize);
  }, [filteredAssignments, page, pageSize]);

  // Modals helpers
  const openTransferModal = (a: Assignment) => {
    setSelectedAssignment(a);
    setTransferSiteId('');
    setTransferSiteJobId('');
    setTransferPayRate('');
    setTransferDate(new Date().toISOString().split('T')[0]);
    setTransferReason('');
    setIsTransferModalOpen(true);
  };

  const openCloseModal = (a: Assignment) => {
    setSelectedAssignment(a);
    setCloseEndDate(new Date().toISOString().split('T')[0]);
    setCloseReason('');
    setIsCloseModalOpen(true);
  };

  const openHistoryModal = (a: Assignment) => {
    const empName = a.employee ? `${a.employee.firstName} ${a.employee.lastName}` : 'Employee';
    const empNum = a.employee?.employeeNumber || a.employeeId;
    setHistoryEmployee({ id: a.employeeId, name: empName, number: empNum });
    setIsHistoryModalOpen(true);
  };

  // Submit Handlers
  const handleDeploySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deployEmployeeId || !deploySiteJobId || !deployStartDate) {
      toast.error('Please fill in all required fields.');
      return;
    }
    deployMutation.mutate({
      employeeId: deployEmployeeId,
      siteJobId: deploySiteJobId,
      payRate: Number(deployPayRate) || undefined,
      startDate: deployStartDate,
      endDate: deployEndDate || undefined,
    });
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    if (!transferSiteJobId || !transferDate) {
      toast.error('Target site job and transfer effective date are required.');
      return;
    }

    if (new Date(transferDate) < new Date(selectedAssignment.startDate)) {
      toast.error('Transfer effective date cannot precede the current assignment start date.');
      return;
    }

    transferMutation.mutate({
      employeeId: selectedAssignment.employeeId,
      payload: {
        newSiteJobId: transferSiteJobId,
        newPayRate: Number(transferPayRate) || undefined,
        transferDate,
        reason: transferReason || undefined,
      },
    });
  };

  const handleCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    if (!closeEndDate) {
      toast.error('Closing end date is required.');
      return;
    }

    if (new Date(closeEndDate) < new Date(selectedAssignment.startDate)) {
      toast.error('End date cannot precede the assignment start date.');
      return;
    }

    closeMutation.mutate({
      assignmentId: selectedAssignment.id,
      payload: {
        endDate: closeEndDate,
        reason: closeReason || undefined,
      },
    });
  };

  const getStatusBadge = (status: AssignmentStatus) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="success" className="gap-1 shadow-sm font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </Badge>
        );
      case 'transferred':
        return (
          <Badge variant="warning" className="gap-1 font-medium bg-amber-50 text-amber-700 border-amber-200">
            <ArrowRightLeft className="w-3 h-3 text-amber-600" />
            Transferred
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="neutral" className="gap-1 font-medium bg-slate-100 text-slate-700 border-slate-200">
            <CheckCircle2 className="w-3 h-3 text-slate-500" />
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="danger" className="gap-1 font-medium">
            <XCircle className="w-3 h-3" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <AppShell>
      <PageContainer
        title="Workforce Assignments"
        subtitle="Real-time operational deployments, site role mappings, and locked historical compensation rates."
        primaryAction={
          isOperator ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-semibold shadow-2xs">
              <Radio className="w-3.5 h-3.5 text-amber-600" />
              <span>Live Deployment Monitor</span>
            </div>
          ) : (
            <Button
              onClick={() => setIsDeployModalOpen(true)}
              className="bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_4px_rgba(108,92,231,0.25)] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Deploy Workforce Member
            </Button>
          )
        }
      >
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Deployments</span>
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{activeAssignments.length}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-medium">Live on client sites</span> with locked rates
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Sites Covered</span>
              <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Building2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{activeSitesCovered}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              Across {sites.length} total operational premises
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Unassigned Workforce</span>
              <span className="p-2 rounded-lg bg-purple-50 text-[#6C5CE7]">
                <UserX className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{unassignedEmployees.length}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              Active employees available for immediate deployment
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Historical Records</span>
              <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <History className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{assignments.length}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              Audit-safe assignments & transfers
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)] p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by employee, ID, site, or role..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 bg-slate-50/50 border-slate-200 focus:bg-white text-sm"
              />
            </div>

            {/* Filter Dropdowns & Status */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Site:</span>
                <select
                  value={selectedSiteFilter}
                  onChange={(e) => {
                    setSelectedSiteFilter(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7]"
                >
                  <option value="all">All Sites ({realSites.length})</option>
                  {realSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/60">
                {(['all', 'active', 'transferred', 'completed'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setSelectedStatusTab(tab);
                      setPage(1);
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                      selectedStatusTab === tab
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
          {isLoadingAssignments ? (
            <div className="p-6">
              <TableSkeleton rows={6} cols={6} />
            </div>
          ) : filteredAssignments.length === 0 ? (
            <EmptyState
              icon={<UserCheck className="h-6 w-6 text-[#6C5CE7]" />}
              title="No assignments found"
              description={
                searchQuery
                  ? 'No assignments match your search query.'
                  : 'No assignments have been created yet. Deploy an employee to begin site operations.'
              }
              action={
                <Button
                  onClick={() => setIsDeployModalOpen(true)}
                  className="bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white"
                >
                  Deploy First Employee
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                    <TableHead>Workforce Member</TableHead>
                    <TableHead>Deployment & Role</TableHead>
                    <TableHead>Locked Pay Rate</TableHead>
                    <TableHead>Effective Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Operational Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAssignments.map((a) => {
                    const empName = a.employee
                      ? `${a.employee.firstName} ${a.employee.lastName}`
                      : 'Unknown Employee';
                    const empNum = a.employee?.employeeNumber || '—';
                    const siteName = a.siteJob?.site?.name || 'Assigned Site';
                    const siteCity = a.siteJob?.site?.address?.city || '';
                    const roleName = a.siteJob?.jobType?.name || 'Assigned Role';

                    return (
                      <TableRow key={a.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Workforce Member */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-purple-100 border border-purple-200 text-[#6C5CE7] font-semibold text-xs flex items-center justify-center shadow-sm">
                              {empName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                                {empName}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">
                                ID: {empNum}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Deployment & Role */}
                        <TableCell>
                          <div>
                            <div className="font-medium text-slate-900 text-sm flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {siteName}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                                {roleName}
                              </span>
                              {siteCity && (
                                <span className="text-xs text-slate-400">· {siteCity}</span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Locked Pay Rate */}
                        <TableCell>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50/70 border border-emerald-200/80 text-emerald-800">
                            <Lock className="w-3 h-3 text-emerald-600" />
                            <span className="font-mono font-semibold text-sm">
                              £{Number(a.payRate).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-emerald-600/80 font-medium">/hr</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Rate locked for payroll</div>
                        </TableCell>

                        {/* Effective Dates */}
                        <TableCell>
                          <div className="text-xs text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>From: {new Date(a.startDate).toLocaleDateString('en-GB')}</span>
                            </div>
                            {a.endDate ? (
                              <div className="text-slate-500 text-[11px] mt-0.5 pl-5">
                                To: {new Date(a.endDate).toLocaleDateString('en-GB')}
                              </div>
                            ) : (
                              <div className="text-emerald-600 text-[11px] font-medium mt-0.5 pl-5">
                                Ongoing
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>{getStatusBadge(a.status)}</TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!isOperator && a.status === 'active' ? (
                              <>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => openTransferModal(a)}
                                  className="text-xs h-8 px-2.5 gap-1.5 text-slate-700 border-slate-200 hover:bg-slate-100"
                                  title="Atomic Transfer to new site/role"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" />
                                  Transfer
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => openCloseModal(a)}
                                  className="text-xs h-8 px-2.5 gap-1.5 text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-200"
                                  title="End this assignment"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  End
                                </Button>
                              </>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openHistoryModal(a)}
                              className="text-xs h-8 px-2 text-slate-500 hover:text-slate-800"
                              title="View assignment audit trail"
                            >
                              <History className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {filteredAssignments.length > pageSize && (
            <div className="p-4 border-t border-slate-200 bg-slate-50/50">
              <TablePagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={filteredAssignments.length}
                pageSize={pageSize}
              />
            </div>
          )}
        </div>

        {/* MODAL 1: DEPLOY EMPLOYEE */}
        <Modal
          isOpen={isDeployModalOpen}
          onClose={() => setIsDeployModalOpen(false)}
          title="Deploy Workforce Member"
          description="Deploy an active workforce member to a client site with role-specific locked compensation."
          maxWidth="lg"
        >
          <form onSubmit={handleDeploySubmit} className="space-y-4">
              {/* Step 1: Select Employee */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Workforce Member <span className="text-rose-500">*</span>
                </label>
                <select
                  value={deployEmployeeId}
                  onChange={(e) => setDeployEmployeeId(e.target.value)}
                  required
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7]"
                >
                  <option value="">-- Choose an employee --</option>
                  {candidateEmployees
                    .filter((e) => e.employmentStatus === 'active')
                    .map((e) => {
                      const isAlreadyAssigned = activeEmployeeIds.has(e.id);
                      return (
                        <option key={e.id} value={e.id}>
                          {e.firstName} {e.lastName} ({e.employeeNumber})
                          {isAlreadyAssigned ? ' [Already Assigned - Transfer Required]' : ' [Available]'}
                        </option>
                      );
                    })}
                </select>
                {deployEmployeeId && activeEmployeeIds.has(deployEmployeeId) && (() => {
                  const currentAssign = activeAssignments.find((a) => a.employeeId === deployEmployeeId);
                  return (
                    <div className="p-3 mt-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold">
                            Employee already has an active deployment at {currentAssign?.siteJob?.site?.name || 'Current Site'} ({currentAssign?.siteJob?.jobType?.name || 'Role'}).
                          </span>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            To preserve historical payroll records, staff cannot be deployed twice. Use an <strong>Atomic Transfer</strong> to move them.
                          </p>
                        </div>
                      </div>
                      {currentAssign && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setIsDeployModalOpen(false);
                            openTransferModal(currentAssign);
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-2.5 py-1 font-semibold flex items-center gap-1.5"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          Switch to Transfer Flow
                        </Button>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Step 2: Select Site */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination Client Site <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={deploySiteId}
                    onChange={(e) => {
                      setDeploySiteId(e.target.value);
                      setDeploySiteJobId('');
                      setDeployPayRate('');
                    }}
                    required
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7]"
                  >
                    <option value="">-- Choose a site --</option>
                    {realSites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code || s.address?.city || 'UK'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 3: Select Site Job */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Site Role Configuration <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={deploySiteJobId}
                    onChange={(e) => handleDeploySiteJobChange(e.target.value)}
                    disabled={!deploySiteId || isLoadingDeployJobs || deploySiteJobs.length === 0}
                    required
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7] disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">
                      {isLoadingDeployJobs
                        ? 'Loading site roles...'
                        : !deploySiteId
                        ? '-- Select a site first --'
                        : deploySiteJobs.length === 0
                        ? 'No configured roles for this site'
                        : '-- Choose configured role --'}
                    </option>
                    {deploySiteJobs.map((sj) => (
                      <option key={sj.id} value={sj.id}>
                        {sj.jobType?.name || 'Role'} (Default: £{sj.defaultPayRate}/hr)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {deploySiteId && !isLoadingDeployJobs && deploySiteJobs.length === 0 && (
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs space-y-1.5">
                  <div className="flex items-start gap-2 text-amber-900 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>No active job roles configured for this site yet</span>
                  </div>
                  <p className="text-amber-700 text-[11px]">
                    Configure security job roles and hourly billing rates in the Sites &amp; Rates module to deploy workforce members here.
                  </p>
                  <div className="pt-1">
                    <Link
                      href="/sites"
                      target="_blank"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                    >
                      <span>Configure Rates in Sites</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )}

            {/* Step 4: Agreed Locked Rate & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Locked Pay Rate (£/hr) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                    £
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="15.00"
                    value={deployPayRate}
                    onChange={(e) => setDeployPayRate(e.target.value ? parseFloat(e.target.value) : '')}
                    required
                    className="pl-7 text-sm font-semibold"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Locked permanently for this assignment</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start Date <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="date"
                  value={deployStartDate}
                  onChange={(e) => setDeployStartDate(e.target.value)}
                  required
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  End Date <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <Input
                  type="date"
                  value={deployEndDate}
                  onChange={(e) => setDeployEndDate(e.target.value)}
                  min={deployStartDate}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Rate Locking Architecture Note */}
            <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-lg text-xs text-purple-900 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-[#6C5CE7] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Immutable Compensation Rate Lock:</span> When deployed, the agreed pay rate is locked directly into the assignment record. Future updates to company catalog rates will not alter historical or active timesheet pay calculations.
              </div>
            </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsDeployModalOpen(false)}
                  disabled={deployMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={deployMutation.isPending || (!!deployEmployeeId && activeEmployeeIds.has(deployEmployeeId)) || !deploySiteJobId}
                  className="bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {deployMutation.isPending ? 'Deploying...' : 'Deploy to Site'}
                </Button>
              </div>
          </form>
        </Modal>

        {/* MODAL 2: ATOMIC REASSIGNMENT / TRANSFER */}
        <Modal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          title="Atomic Workforce Transfer"
          description="Transfer an active workforce member to a new site role with historical audit preservation."
          maxWidth="lg"
        >
          {selectedAssignment && (
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              {/* Current Assignment Banner */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Current Active Deployment
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-1">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      {selectedAssignment.employee?.firstName} {selectedAssignment.employee?.lastName} (
                      {selectedAssignment.employee?.employeeNumber})
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedAssignment.siteJob?.site?.name}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-medium text-purple-700">
                        {selectedAssignment.siteJob?.jobType?.name}
                      </span>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-800 text-xs font-mono font-semibold">
                    <Lock className="w-3 h-3 text-slate-500" />
                    Current: £{Number(selectedAssignment.payRate).toFixed(2)}/hr
                  </div>
                </div>
              </div>

              {/* Destination Site & Job */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination Site <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={transferSiteId}
                    onChange={(e) => {
                      setTransferSiteId(e.target.value);
                      setTransferSiteJobId('');
                      setTransferPayRate('');
                    }}
                    required
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7]"
                  >
                    <option value="">-- Choose destination site --</option>
                    {realSites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code || s.address?.city || 'UK'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination Site Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={transferSiteJobId}
                    onChange={(e) => handleTransferSiteJobChange(e.target.value)}
                    disabled={!transferSiteId || isLoadingTransferJobs || transferSiteJobs.length === 0}
                    required
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7] disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">
                      {isLoadingTransferJobs
                        ? 'Loading roles...'
                        : !transferSiteId
                        ? '-- Choose site first --'
                        : transferSiteJobs.length === 0
                        ? 'No configured roles for this site'
                        : '-- Choose role --'}
                    </option>
                    {transferSiteJobs.map((sj) => (
                      <option key={sj.id} value={sj.id}>
                        {sj.jobType?.name} (Def: £{sj.defaultPayRate}/hr)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {transferSiteId && !isLoadingTransferJobs && transferSiteJobs.length === 0 && (
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs space-y-1.5">
                  <div className="flex items-start gap-2 text-amber-900 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>No active job roles configured for destination site</span>
                  </div>
                  <p className="text-amber-700 text-[11px]">
                    Configure security roles and hourly pay rates in the Sites &amp; Rates module to transfer staff to this location.
                  </p>
                  <div className="pt-1">
                    <Link
                      href="/sites"
                      target="_blank"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                    >
                      <span>Configure Rates in Sites</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Effective Transfer Date & New Rate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transfer Effective Date <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    min={selectedAssignment.startDate}
                    required
                    className="text-sm"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Previous assignment closes effective on this date
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Locked Pay Rate (£/hr) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                      £
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="16.50"
                      value={transferPayRate}
                      onChange={(e) => setTransferPayRate(e.target.value ? parseFloat(e.target.value) : '')}
                      required
                      className="pl-7 text-sm font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Reason / Audit Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transfer Reason / Audit Note <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <Input
                  placeholder="e.g., Client site rotation, promotion, coverage request..."
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Atomic Safety Notice */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Atomic Transaction Assurance:</span> In accordance with Section 38 & 51, the current assignment will be marked as <code className="bg-amber-100/70 px-1 py-0.5 rounded text-amber-800">transferred</code> and the new assignment created atomically. All historical timesheets and shifts remain permanently bound to their historical rates.
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsTransferModalOpen(false)}
                  disabled={transferMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={transferMutation.isPending || !transferSiteJobId}
                  className="bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {transferMutation.isPending ? 'Processing Transfer...' : 'Execute Atomic Transfer'}
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* MODAL 3: CLOSE / END ASSIGNMENT */}
        <Modal
          isOpen={isCloseModalOpen}
          onClose={() => setIsCloseModalOpen(false)}
          title="End Assignment"
          description="Terminate this assignment and return the workforce member to the available pool."
          maxWidth="md"
        >
          {selectedAssignment && (
            <form onSubmit={handleCloseSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                <div className="font-bold text-slate-900 text-sm mb-1">
                  {selectedAssignment.employee?.firstName} {selectedAssignment.employee?.lastName}
                </div>
                <div>
                  Site: <strong>{selectedAssignment.siteJob?.site?.name}</strong> (
                  {selectedAssignment.siteJob?.jobType?.name})
                </div>
                <div className="text-slate-500 mt-0.5">
                  Started: {new Date(selectedAssignment.startDate).toLocaleDateString('en-GB')}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Closing Effective Date <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="date"
                  value={closeEndDate}
                  onChange={(e) => setCloseEndDate(e.target.value)}
                  min={selectedAssignment.startDate}
                  required
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Conclusion <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <Input
                  placeholder="e.g. Contract completed, site closed, workforce rotation"
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsCloseModalOpen(false)}
                  disabled={closeMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={closeMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-2"
                >
                  {closeMutation.isPending ? 'Closing...' : 'Close Assignment'}
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* MODAL 4: AUDIT TRAIL / ASSIGNMENT HISTORY */}
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title={`Assignment History — ${historyEmployee?.name || 'Employee'}`}
          description={`Full chronological deployment timeline and rate history for ${historyEmployee?.number || 'workforce member'}.`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            {isLoadingHistory ? (
              <div className="p-4">
                <TableSkeleton rows={4} cols={4} />
              </div>
            ) : employeeHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No assignment history found for this employee.
              </div>
            ) : (
              <div className="relative border-l-2 border-purple-200 ml-3 space-y-6 my-2">
                {employeeHistory.map((item) => (
                  <div key={item.id} className="relative pl-6">
                    <div
                      className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white ${
                        item.status === 'active'
                          ? 'border-emerald-500 bg-emerald-50'
                          : item.status === 'transferred'
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-slate-300'
                      }`}
                    />
                    <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {item.siteJob?.site?.name || 'Assigned Site'}
                          </div>
                          <div className="text-xs text-purple-700 font-medium mt-0.5">
                            {item.siteJob?.jobType?.name || 'Role'}
                          </div>
                        </div>
                        <div>{getStatusBadge(item.status)}</div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-3 pt-2.5 border-t border-slate-200/60 text-xs text-slate-600">
                        <div className="flex items-center gap-1 font-mono font-semibold text-slate-800">
                          <Lock className="w-3 h-3 text-slate-400" />
                          £{Number(item.payRate).toFixed(2)}/hr
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(item.startDate).toLocaleDateString('en-GB')}{' '}
                          {item.endDate
                            ? `→ ${new Date(item.endDate).toLocaleDateString('en-GB')}`
                            : '→ Present'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                onClick={() => setIsHistoryModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </AppShell>
  );
}
