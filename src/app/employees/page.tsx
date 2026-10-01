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
  DatePicker,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TablePagination,
  Badge,
  Modal,
  Drawer,
  Tabs,
  TabList,
  TabTrigger,
  TabContent,
  TableSkeleton,
  EmptyState,
} from '@/components/ui';
import { toast } from '@/lib/toastStore';
import { fetchEmployees, createEmployeeApi, updateEmployeeApi } from '@/lib/api/employees';
import {
  fetchEmployeeAssignments,
  fetchActiveAssignment,
  createAssignmentApi,
  transferEmployeeApi,
  closeAssignmentApi,
} from '@/lib/api/assignments';
import { fetchSites, fetchSiteJobs } from '@/lib/api/sites';
import { Employee, EmploymentStatus } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Site, SiteJob } from '@/types/site';
import {
  Plus,
  Search,
  User,
  Shield,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  Check,
  Building2,
  Briefcase,
  ArrowRightLeft,
  Clock,
  Coins,
  CheckCircle2,
  Info,
  LayoutGrid,
  List,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { mockEmployees } from '@/lib/mockData';

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Drawer / Modal states
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState('overview');

  // Assignment and Transfer modal states (Phase 4)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [assignSiteJobs, setAssignSiteJobs] = useState<SiteJob[]>([]);
  const [assignForm, setAssignForm] = useState({
    siteJobId: '',
    payRate: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });
  const [transferForm, setTransferForm] = useState({
    siteId: '',
    newSiteJobId: '',
    newPayRate: '',
    transferDate: new Date().toISOString().split('T')[0],
    reason: '',
  });
  const [transferSiteJobs, setTransferSiteJobs] = useState<SiteJob[]>([]);

  // 5-Step Creation Wizard Form State (Phase 3 Spec)
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardSiteJobs, setWizardSiteJobs] = useState<SiteJob[]>([]);
  const [isSiteJobsLoading, setIsSiteJobsLoading] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Step 1: Personal
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    line1: '',
    line2: '',
    city: 'London',
    postalCode: '',
    country: 'United Kingdom',
    emergencyName: '',
    emergencyRelationship: 'Spouse',
    emergencyPhone: '',

    // Step 2: Employment
    employeeNumber: '',
    isCustomEmployeeId: false,
    employmentStatus: 'active' as EmploymentStatus,
    employmentStartDate: new Date().toISOString().split('T')[0],
    employmentType: 'full_time',
    positionTitle: 'Security Officer',

    // Step 3: Initial Assignment
    hasInitialAssignment: true,
    assignmentSiteId: '',
    assignmentSiteJobId: '',
    assignmentPayRate: '',
    assignmentStartDate: new Date().toISOString().split('T')[0],

    // Step 4: Account & Portal Access
    sendInvitation: true,
    hasLicence: false,
    licenceType: 'SIA Door Supervisor',
    licenceNumber: '',
    licenceExpiryDate: '',
  });

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Central Workforce Store
  const {
    employees: storeEmployees,
    totalEmployees: storeTotalEmployees,
    hasRealEmployees,
    isEmployeesLoading,
    isEmployeesRefreshing,
    fetchEmployees: syncEmployees,
    createEmployee: storeCreateEmployee,
    onboardEmployee: storeOnboardEmployee,
    resendEmployeeInvite: storeResendInvite,
    updateEmployee: storeUpdateEmployee,
    sites: availableSites,
    fetchSites: syncSites,
  } = useWorkforceStore();

  useEffect(() => {
    syncEmployees();
    syncSites();
  }, [syncEmployees, syncSites]);

  // Atomic Onboarding Mutation (Phase 3)
  const onboardMutation = useMutation({
    mutationFn: (payload: any) => storeOnboardEmployee(payload),
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Employee onboarded successfully.');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsWizardOpen(false);
      resetWizard();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to onboard employee.');
    },
  });

  // Resend Invite Action
  const handleResendInvite = async (emp: Employee) => {
    try {
      setResendingId(emp.id);
      const res = await storeResendInvite(emp.id);
      toast.success(res?.message || `Invitation resent to ${emp.email}`);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend invitation.');
    } finally {
      setResendingId(null);
    }
  };

  // Update Employee Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => storeUpdateEmployee(id, updates),
    onSuccess: (updated) => {
      toast.success('Employee updated.');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setSelectedEmployee(updated);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update employee.');
    },
  });

  // Assignment Queries & Mutations (Phase 4)
  const { data: assignments = [], refetch: refetchAssignments } = useQuery({
    queryKey: ['employee-assignments', selectedEmployee?.id],
    queryFn: () => (selectedEmployee ? fetchEmployeeAssignments(selectedEmployee.id) : Promise.resolve([])),
    enabled: !!selectedEmployee,
  });

  const { data: activeAssignment, refetch: refetchActiveAssignment } = useQuery({
    queryKey: ['employee-active-assignment', selectedEmployee?.id],
    queryFn: () => (selectedEmployee ? fetchActiveAssignment(selectedEmployee.id) : Promise.resolve(null)),
    enabled: !!selectedEmployee,
  });

  const createAssignmentMutation = useMutation({
    mutationFn: createAssignmentApi,
    onSuccess: () => {
      refetchAssignments();
      refetchActiveAssignment();
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee assigned to site successfully.');
      setIsAssignModalOpen(false);
      setAssignForm({
        siteJobId: '',
        payRate: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create assignment.');
    },
  });

  const transferMutation = useMutation({
    mutationFn: ({ employeeId, payload }: { employeeId: string; payload: any }) =>
      transferEmployeeApi(employeeId, payload),
    onSuccess: () => {
      refetchAssignments();
      refetchActiveAssignment();
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee transferred atomically with historical lockdown.');
      setIsTransferModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to transfer employee.');
    },
  });

  const closeAssignmentMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      closeAssignmentApi(id, payload),
    onSuccess: () => {
      refetchAssignments();
      refetchActiveAssignment();
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Assignment closed successfully.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to close assignment.');
    },
  });

  const handleSiteSelectForAssign = async (siteId: string) => {
    setSelectedSiteId(siteId);
    if (!siteId) {
      setAssignSiteJobs([]);
      return;
    }
    try {
      const jobs = await fetchSiteJobs(siteId);
      setAssignSiteJobs(jobs.filter((j) => j.status === 'active'));
    } catch {
      setAssignSiteJobs([]);
    }
  };

  const handleSiteSelectForTransfer = async (siteId: string) => {
    setTransferForm((prev) => ({ ...prev, siteId, newSiteJobId: '', newPayRate: '' }));
    if (!siteId) {
      setTransferSiteJobs([]);
      return;
    }
    try {
      const jobs = await fetchSiteJobs(siteId);
      setTransferSiteJobs(jobs.filter((j) => j.status === 'active'));
    } catch {
      setTransferSiteJobs([]);
    }
  };

  const handleWizardSiteChange = async (siteId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignmentSiteId: siteId,
      assignmentSiteJobId: '',
      assignmentPayRate: '',
    }));
    if (!siteId) {
      setWizardSiteJobs([]);
      return;
    }
    setIsSiteJobsLoading(true);
    try {
      const jobs = await fetchSiteJobs(siteId);
      const activeJobs = jobs.filter((j) => j.status === 'active');
      setWizardSiteJobs(activeJobs);
      if (activeJobs.length > 0) {
        setFormData((prev) => ({
          ...prev,
          assignmentSiteId: siteId,
          assignmentSiteJobId: activeJobs[0].id,
          assignmentPayRate: activeJobs[0].defaultPayRate.toString(),
        }));
      }
    } catch {
      setWizardSiteJobs([]);
    } finally {
      setIsSiteJobsLoading(false);
    }
  };

  const handleWizardJobChange = (siteJobId: string) => {
    const job = wizardSiteJobs.find((j) => j.id === siteJobId);
    setFormData((prev) => ({
      ...prev,
      assignmentSiteJobId: siteJobId,
      assignmentPayRate: job ? job.defaultPayRate.toString() : prev.assignmentPayRate,
    }));
  };

  const resetWizard = () => {
    setWizardStep(1);
    setWizardSiteJobs([]);
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      email: '',
      phone: '',
      line1: '',
      line2: '',
      city: 'London',
      postalCode: '',
      country: 'United Kingdom',
      emergencyName: '',
      emergencyRelationship: 'Spouse',
      emergencyPhone: '',
      employeeNumber: '',
      isCustomEmployeeId: false,
      employmentStatus: 'active',
      employmentStartDate: new Date().toISOString().split('T')[0],
      employmentType: 'full_time',
      positionTitle: 'Security Officer',
      hasInitialAssignment: true,
      assignmentSiteId: '',
      assignmentSiteJobId: '',
      assignmentPayRate: '',
      assignmentStartDate: new Date().toISOString().split('T')[0],
      sendInvitation: true,
      hasLicence: false,
      licenceType: 'SIA Door Supervisor',
      licenceNumber: '',
      licenceExpiryDate: '',
    });
  };

  const handleWizardSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Step 1: Personal Info validation
    if (wizardStep === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        toast.error('First name and last name are required.');
        return;
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        toast.error('A valid email address is required.');
        return;
      }
      if (!formData.phone.trim()) {
        toast.error('Phone number is required.');
        return;
      }
      if (!formData.dateOfBirth) {
        toast.error('Date of birth is required.');
        return;
      }
      if (!formData.line1.trim() || !formData.city.trim() || !formData.postalCode.trim()) {
        toast.error('Address line 1, city, and postal code are required.');
        return;
      }
      if (!formData.emergencyName.trim() || !formData.emergencyPhone.trim()) {
        toast.error('Emergency contact name and phone are required.');
        return;
      }
      setWizardStep(2);
      return;
    }

    // Step 2: Employment Details validation
    if (wizardStep === 2) {
      if (!formData.employmentStartDate) {
        toast.error('Employment start date is required.');
        return;
      }
      setWizardStep(3);
      return;
    }

    // Step 3: Initial Assignment validation
    if (wizardStep === 3) {
      if (formData.hasInitialAssignment) {
        if (!formData.assignmentSiteId) {
          toast.error('Please select a site or uncheck the assignment option.');
          return;
        }
        if (!formData.assignmentSiteJobId) {
          toast.error('Please select a job role at the selected site.');
          return;
        }
      }
      setWizardStep(4);
      return;
    }

    // Step 4: Account & Portal Access validation
    if (wizardStep === 4) {
      if (formData.hasLicence) {
        if (!formData.licenceNumber.trim()) {
          toast.error('Licence number is required when licence option is enabled.');
          return;
        }
        if (!formData.licenceExpiryDate) {
          toast.error('Licence expiry date is required.');
          return;
        }
      }
      setWizardStep(5);
      return;
    }

    // Step 5: Final Submission to backend atomic onboard endpoint
    const payload: any = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.toLowerCase().trim(),
      phone: formData.phone.trim(),
      dateOfBirth: formData.dateOfBirth,
      address: {
        line1: formData.line1.trim(),
        line2: formData.line2.trim() || undefined,
        city: formData.city.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country.trim(),
      },
      emergencyContact: {
        name: formData.emergencyName.trim(),
        relationship: formData.emergencyRelationship.trim(),
        phone: formData.emergencyPhone.trim(),
      },
      employmentStatus: formData.employmentStatus,
      employmentStartDate: formData.employmentStartDate,
      employmentType: formData.employmentType,
      positionTitle: formData.positionTitle,
      sendInvitation: formData.sendInvitation,
    };

    if (formData.isCustomEmployeeId && formData.employeeNumber.trim()) {
      payload.employeeNumber = formData.employeeNumber.trim();
    }

    if (formData.hasInitialAssignment && formData.assignmentSiteJobId) {
      payload.initialAssignment = {
        siteJobId: formData.assignmentSiteJobId,
        payRate: formData.assignmentPayRate ? parseFloat(formData.assignmentPayRate) : undefined,
        startDate: formData.assignmentStartDate || formData.employmentStartDate,
      };
    }

    if (formData.hasLicence && formData.licenceNumber.trim()) {
      payload.initialLicence = {
        licenceType: formData.licenceType,
        licenceNumber: formData.licenceNumber.trim(),
        expiryDate: formData.licenceExpiryDate,
      };
    }

    onboardMutation.mutate(payload);
  };

  const renderStatusBadge = (status: EmploymentStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" dot>Active</Badge>;
      case 'probation':
        return <Badge variant="warning" dot>Probation</Badge>;
      case 'suspended':
        return <Badge variant="danger" dot>Suspended</Badge>;
      case 'terminated':
        return <Badge variant="neutral">Terminated</Badge>;
      case 'on_leave':
        return <Badge variant="info" dot>On Leave</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const renderAccountBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="success" size="sm" className="gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Active
          </Badge>
        );
      case 'invited':
        return (
          <Badge variant="warning" size="sm" className="gap-1">
            <Mail className="h-3 w-3 text-amber-600" />
            Invited
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="danger" size="sm">
            Suspended
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm">
            Pending
          </Badge>
        );
    }
  };

  const renderLicenceBadge = (licence?: any) => {
    if (!licence) {
      return <Badge variant="neutral">No Licence</Badge>;
    }
    switch (licence.status) {
      case 'valid':
        return <Badge variant="success">Valid: {licence.number}</Badge>;
      case 'expiring_soon':
        return <Badge variant="warning">Expiring: {licence.number}</Badge>;
      case 'expired':
        return <Badge variant="danger">Expired</Badge>;
      default:
        return <Badge variant="info">{licence.status}</Badge>;
    }
  };

  // Filtered employees from store with instant search & status filter
  const filteredEmployees = React.useMemo(() => {
    return storeEmployees.filter((emp) => {
      const matchesSearch =
        !debouncedSearch ||
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        emp.employeeNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        emp.phone.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === 'all' || emp.employmentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [storeEmployees, debouncedSearch, statusFilter]);

  const activeTotalCount = filteredEmployees.length;

  const displayItems = React.useMemo(() => {
    const startIndex = (page - 1) * 10;
    return filteredEmployees.slice(startIndex, startIndex + 10);
  }, [filteredEmployees, page]);

  return (
    <AppShell>
      <PageContainer
        title="Employees"
        subtitle={
          <div className="flex items-center gap-2">
            <span>
              <strong className="text-[#171A2B]">{activeTotalCount}</strong> Workforce Records
            </span>
            {!hasRealEmployees && (
              <Badge variant="info" size="sm" className="gap-1">
                <Info className="h-3 w-3 text-[#6C5CE7]" />
                Sample Data Preview
              </Badge>
            )}
          </div>
        }
        breadcrumbs={[
          { label: 'Workforce Platform', href: '/dashboard' },
          { label: 'Employees' },
        ]}
        primaryAction={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              resetWizard();
              setIsWizardOpen(true);
            }}
          >
            Add Employee
          </Button>
        }
      >
        {!hasRealEmployees && (
          <div className="p-3 rounded-lg bg-[#F5F3FF] border border-[#D5D0FA] flex items-center justify-between text-xs text-[#171A2B]">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#6C5CE7] animate-pulse" />
              <span>Showing sample workforce records. Create your first employee using &quot;Add Employee&quot; to switch to live records.</span>
            </div>
          </div>
        )}

        {/* Modern Segment Tabs, Search Bar, and View Mode Switcher (Screenshot 2) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/80 p-3 rounded-2xl border border-white/80 shadow-[0_4px_20px_-4px_rgba(22,34,66,0.03)] backdrop-blur-xl">
          {/* Segment Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All', count: storeEmployees.length },
              {
                id: 'active',
                label: 'Active',
                count: storeEmployees.filter((e) => e.employmentStatus === 'active').length,
              },
              {
                id: 'invited',
                label: 'Onboarding',
                count: storeEmployees.filter((e) => e.accountStatus === 'invited').length,
              },
              {
                id: 'on_leave',
                label: 'On leave',
                count: storeEmployees.filter((e) => e.employmentStatus === 'on_leave').length,
              },
              {
                id: 'probation',
                label: 'Probation',
                count: storeEmployees.filter((e) => e.employmentStatus === 'probation').length,
              },
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#6C5CE7] text-white shadow-xs'
                      : 'text-[#687086] hover:text-[#171A2B] hover:bg-[#F5F3FF]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Controls: Search, View Mode Toggle */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9096A9]" />
              <input
                type="text"
                placeholder="Search officers, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-[#E5E3F2] rounded-xl text-[#171A2B] placeholder-[#9096A9] focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7] outline-none transition-all"
              />
            </div>

            {/* View Mode Switcher */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#6C5CE7] shadow-2xs font-bold'
                    : 'text-[#9096A9] hover:text-[#171A2B]'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-[#6C5CE7] shadow-2xs font-bold'
                    : 'text-[#9096A9] hover:text-[#171A2B]'
                }`}
                title="Table view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area: Grid View / Table View / Loading / Empty */}
        {isEmployeesLoading && storeEmployees.length === 0 ? (
          <TableSkeleton rows={5} cols={6} />
        ) : displayItems.length === 0 ? (
          <EmptyState
            title="No employees found"
            description="No workforce records match your active query filters."
            action={
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  resetWizard();
                  setIsWizardOpen(true);
                }}
              >
                Add Employee
              </Button>
            }
          />
        ) : viewMode === 'grid' ? (
          /* ========================================================================= */
          /* 4-COLUMN FLOATING GLASS EMPLOYEE CARDS (SCREENSHOT 2 EXACT DESIGN) */
          /* ========================================================================= */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {displayItems.map((emp) => {
                const avatarGrad = [
                  'from-blue-500 to-indigo-600',
                  'from-emerald-400 to-teal-600',
                  'from-purple-500 to-pink-600',
                  'from-amber-400 to-orange-500',
                  'from-rose-400 to-red-600',
                  'from-cyan-400 to-blue-600',
                ][Math.abs(emp.id.charCodeAt(0) || 0) % 6];

                const initials = `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase() || 'EM';
                const siteName = emp.currentAssignment?.siteName || (emp.id === 'emp-demo-1' ? 'Canary Wharf Tower A' : emp.id === 'emp-demo-2' ? 'Control Room A' : 'Apex Static Post');
                const roleName = emp.currentAssignment?.role || 'Security Officer';

                return (
                  <div
                    key={emp.id}
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setActiveProfileTab('overview');
                    }}
                    className="group relative flex flex-col justify-between rounded-2xl bg-white/80 p-5 shadow-[0_8px_24px_-4px_rgba(22,34,66,0.04)] backdrop-blur-xl border border-white/80 transition-all duration-300 hover:shadow-[0_16px_36px_-6px_rgba(22,34,66,0.1)] hover:-translate-y-1 cursor-pointer"
                  >
                    {/* Top Row: Employee ID & Status Indicator */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded-md">
                        #{emp.employeeNumber}
                      </span>
                      <div>
                        {emp.employmentStatus === 'active' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : emp.employmentStatus === 'on_leave' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            On leave
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#EDE9FE] px-2 py-0.5 text-[10px] font-bold text-[#6C5CE7] border border-[#D5D0FA]">
                            {emp.employmentStatus}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Centered Identity & Avatar */}
                    <div className="my-4 flex flex-col items-center text-center">
                      {/* Gradient Ring Avatar */}
                      <div className="relative mb-3 flex h-16 w-16 items-center justify-center rounded-full p-0.5 shadow-md">
                        <div
                          className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr ${avatarGrad} text-white font-black text-lg tracking-wider ring-4 ring-white select-none`}
                        >
                          {initials}
                        </div>
                      </div>

                      {/* Name */}
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#6C5CE7] transition-colors">
                        {emp.firstName} {emp.lastName}
                      </h4>

                      {/* Job Title */}
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{roleName}</p>

                      {/* Site deployment pill */}
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100/80 px-2.5 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200/60 max-w-[210px] truncate">
                        <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{siteName}</span>
                      </div>
                    </div>

                    {/* Meta row: SIA Licence & Account */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mb-3">
                      <div>
                        {renderLicenceBadge(emp.licence)}
                      </div>
                      <div>
                        {emp.accountStatus === 'active' ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            App Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                            Invited
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Bar: Email & Real-Time Chat */}
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`mailto:${emp.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-50 hover:bg-[#F5F3FF] text-slate-600 hover:text-[#6C5CE7] text-xs font-semibold border border-slate-200/80 transition-colors"
                        title={`Send email to ${emp.email}`}
                      >
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span>Email</span>
                      </a>
                      <Link
                        href={`/chat?employeeId=${emp.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#F5F3FF] hover:bg-[#6C5CE7] text-[#6C5CE7] hover:text-white text-xs font-bold border border-[#D5D0FA] shadow-2xs transition-all"
                        title={`Open chat with ${emp.firstName}`}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Chat</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <TablePagination
              currentPage={page}
              totalPages={Math.max(1, Math.ceil(filteredEmployees.length / 10))}
              totalItems={filteredEmployees.length}
              pageSize={10}
              onPageChange={setPage}
            />
          </div>
        ) : (
          /* ========================================================================= */
          /* TABLE VIEW OPTION */
          /* ========================================================================= */
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Portal Account</TableHead>
                  <TableHead>Current Assignment</TableHead>
                  <TableHead>Licence</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayItems.map((emp) => (
                  <TableRow
                    key={emp.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setActiveProfileTab('overview');
                    }}
                  >
                    <TableCell className="font-mono text-xs font-semibold text-[#6C5CE7]">
                      {emp.employeeNumber}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-900">
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500">{emp.email}</div>
                    </TableCell>
                    <TableCell>{renderStatusBadge(emp.employmentStatus)}</TableCell>
                    <TableCell>
                      {emp.accountStatus === 'active' ? (
                        <Badge variant="success" size="sm" className="gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Active
                        </Badge>
                      ) : emp.accountStatus === 'invited' ? (
                        <Badge variant="warning" size="sm" className="gap-1">
                          <Mail className="h-3 w-3 text-amber-600" />
                          Invited
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {emp.currentAssignment ? (
                        <div>
                          <span className="font-medium text-slate-900">
                            {emp.currentAssignment.siteName}
                          </span>
                          <span className="block text-[11px] text-slate-500">
                            {emp.currentAssignment.role} &bull; &pound;{Number(emp.currentAssignment.payRate).toFixed(2)}/hr
                          </span>
                        </div>
                      ) : (
                        <span className="italic text-slate-400">
                          {emp.id === 'emp-demo-1' ? 'Canary Wharf Tower A' : emp.id === 'emp-demo-2' ? 'Control Room A' : 'Unassigned'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{renderLicenceBadge(emp.licence)}</TableCell>
                    <TableCell className="text-xs text-slate-600">{emp.phone}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/chat?employeeId=${emp.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex h-7 items-center gap-1 rounded-lg bg-[#F5F3FF] px-2 text-xs font-semibold text-[#6C5CE7] hover:bg-[#EDE9FE] border border-[#D5D0FA] transition-colors"
                        >
                          <MessageSquare className="h-3 w-3" />
                          Chat
                        </Link>
                        {emp.accountStatus === 'invited' && (
                          <Button
                            variant="outline"
                            size="xs"
                            className="text-amber-600 border-amber-200 hover:bg-amber-50 gap-1 text-[11px] h-7"
                            isLoading={resendingId === emp.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResendInvite(emp);
                            }}
                          >
                            <Mail className="h-3 w-3" />
                            Resend
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmployee(emp);
                            setActiveProfileTab('overview');
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <TablePagination
              currentPage={page}
              totalPages={Math.max(1, Math.ceil(filteredEmployees.length / 10))}
              totalItems={filteredEmployees.length}
              pageSize={10}
              onPageChange={setPage}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* ADD EMPLOYEE 5-STEP ONBOARDING WIZARD (PHASE 3 SPEC) */}
        {/* ========================================================================= */}
        <Modal
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          title={`Add Employee — Step ${wizardStep} of 5: ${
            wizardStep === 1
              ? 'Personal Information'
              : wizardStep === 2
              ? 'Employment Terms'
              : wizardStep === 3
              ? 'Initial Site Assignment'
              : wizardStep === 4
              ? 'Account & Portal Access'
              : 'Review & Confirm'
          }`}
          description="Atomic employee creation with assignment lockdown and Brevo portal onboarding."
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (wizardStep > 1) setWizardStep((prev) => prev - 1);
                  else setIsWizardOpen(false);
                }}
                leftIcon={wizardStep > 1 ? <ChevronLeft className="h-4 w-4" /> : undefined}
              >
                {wizardStep > 1 ? 'Back' : 'Cancel'}
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={onboardMutation.isPending}
                onClick={() => handleWizardSubmit()}
                rightIcon={
                  wizardStep < 5 ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )
                }
              >
                {wizardStep < 5
                  ? 'Continue'
                  : formData.sendInvitation
                  ? 'Complete Onboarding & Send Invitation'
                  : 'Complete Onboarding'}
              </Button>
            </div>
          }
        >
          {/* Step Progress Pills */}
          <div className="flex items-center gap-1.5 mb-5 pb-3 border-b border-[#F0EEF8]">
            {[
              { num: 1, label: 'Personal' },
              { num: 2, label: 'Employment' },
              { num: 3, label: 'Assignment' },
              { num: 4, label: 'Access' },
              { num: 5, label: 'Review' },
            ].map((s) => (
              <div key={s.num} className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    s.num === wizardStep
                      ? 'bg-[#6C5CE7]'
                      : s.num < wizardStep
                      ? 'bg-[#6C5CE7]/40'
                      : 'bg-[#E5E3F2]'
                  }`}
                />
                <span
                  className={`block text-[10px] font-semibold mt-1 ${
                    s.num === wizardStep
                      ? 'text-[#6C5CE7]'
                      : s.num < wizardStep
                      ? 'text-[#171A2B]'
                      : 'text-[#9096A9]'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleWizardSubmit(); }} className="space-y-4">
            {/* STEP 1: PERSONAL INFORMATION */}
            {wizardStep === 1 && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#687086] mb-1">
                      First Name *
                    </label>
                    <Input
                      required
                      placeholder="e.g. Marcus"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#687086] mb-1">
                      Last Name *
                    </label>
                    <Input
                      required
                      placeholder="e.g. Vance"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#687086] mb-1">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      required
                      placeholder="marcus.vance@example.co.uk"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#687086] mb-1">
                      Phone Number *
                    </label>
                    <Input
                      required
                      placeholder="+44 7700 900123"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#687086] mb-1">
                    Date of Birth *
                  </label>
                  <DatePicker
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>

                <div className="pt-2 border-t border-[#F0EEF8]">
                  <h4 className="text-xs font-bold text-[#687086] uppercase tracking-wider mb-2">
                    Residential Address
                  </h4>
                  <div className="space-y-2">
                    <Input
                      placeholder="Address Line 1 *"
                      required
                      value={formData.line1}
                      onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                    />
                    <Input
                      placeholder="Address Line 2 (Optional)"
                      value={formData.line2}
                      onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="City *"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                      <Input
                        placeholder="Postal Code *"
                        required
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      />
                      <Input
                        placeholder="Country *"
                        required
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F0EEF8]">
                  <h4 className="text-xs font-bold text-[#687086] uppercase tracking-wider mb-2">
                    Emergency Contact
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Full Name *"
                      required
                      value={formData.emergencyName}
                      onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                    />
                    <Input
                      placeholder="Relationship *"
                      required
                      value={formData.emergencyRelationship}
                      onChange={(e) =>
                        setFormData({ ...formData, emergencyRelationship: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Phone Number *"
                      required
                      value={formData.emergencyPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, emergencyPhone: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: EMPLOYMENT DETAILS */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-lg border border-[#E5E3F2] bg-[#F5F3FF] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-[#171A2B]">Employee ID / Badge Number</span>
                      <p className="text-[11px] text-[#687086]">
                        {formData.isCustomEmployeeId
                          ? 'Assign a custom internal employee identifier.'
                          : 'Auto-generated systematically upon creation (e.g. EMP-2026-XXXX).'}
                      </p>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-[#6C5CE7] font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isCustomEmployeeId}
                        onChange={(e) =>
                          setFormData({ ...formData, isCustomEmployeeId: e.target.checked })
                        }
                        className="rounded border-[#E5E3F2] text-[#6C5CE7] focus:ring-[#6C5CE7]"
                      />
                      Custom ID
                    </label>
                  </div>

                  {formData.isCustomEmployeeId ? (
                    <Input
                      placeholder="e.g. EMP-0492"
                      value={formData.employeeNumber}
                      onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                      className="bg-white"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-white rounded border border-[#E5E3F2] text-xs font-mono text-[#687086]">
                      [Will be automatically generated: EMP-{new Date().getFullYear()}-XXXX]
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#687086] mb-1">
                      Job Title / Position
                    </label>
                    <select
                      value={formData.positionTitle}
                      onChange={(e) => setFormData({ ...formData, positionTitle: e.target.value })}
                      className="w-full h-9 rounded bg-white px-3 text-xs border border-[#E5E3F2] outline-none text-[#171A2B]"
                    >
                      <option value="Security Officer">Security Officer</option>
                      <option value="Door Supervisor">Door Supervisor</option>
                      <option value="CCTV Operator">CCTV Operator</option>
                      <option value="Close Protection Officer">Close Protection Officer</option>
                      <option value="Concierge Security">Concierge Security</option>
                      <option value="Patrol Officer">Patrol Officer</option>
                      <option value="Operations Supervisor">Operations Supervisor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#687086] mb-1">
                      Employment Type
                    </label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                      className="w-full h-9 rounded bg-white px-3 text-xs border border-[#E5E3F2] outline-none text-[#171A2B]"
                    >
                      <option value="full_time">Full-Time</option>
                      <option value="part_time">Part-Time</option>
                      <option value="casual">Casual / Zero-Hours</option>
                      <option value="contractor">Subcontractor</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#687086] mb-1">
                      Employment Status
                    </label>
                    <select
                      value={formData.employmentStatus}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          employmentStatus: e.target.value as EmploymentStatus,
                        })
                      }
                      className="w-full h-9 rounded bg-white px-3 text-xs border border-[#E5E3F2] outline-none text-[#171A2B]"
                    >
                      <option value="active">Active</option>
                      <option value="probation">Probation (3 Months)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#687086] mb-1">
                      Employment Start Date *
                    </label>
                    <DatePicker
                      required
                      value={formData.employmentStartDate}
                      onChange={(e) =>
                        setFormData({ ...formData, employmentStartDate: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: INITIAL SITE ASSIGNMENT */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-[#E5E3F2] bg-[#F5F3FF]">
                  <div>
                    <span className="text-xs font-semibold text-[#171A2B]">
                      Assign to Client Site Now?
                    </span>
                    <p className="text-[11px] text-[#687086]">
                      Attach employee to a specific deployment site and lock in agreed hourly pay rate.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.hasInitialAssignment}
                    onChange={(e) =>
                      setFormData({ ...formData, hasInitialAssignment: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-[#E5E3F2] text-[#6C5CE7] focus:ring-[#6C5CE7]"
                  />
                </div>

                {formData.hasInitialAssignment ? (
                  <div className="space-y-3.5 p-3.5 rounded-lg border border-[#E5E3F2] bg-white">
                    <div>
                      <label className="block text-xs font-semibold text-[#687086] mb-1">
                        Select Client Site *
                      </label>
                      <select
                        value={formData.assignmentSiteId}
                        onChange={(e) => handleWizardSiteChange(e.target.value)}
                        className="w-full h-9 rounded bg-white px-3 text-xs border border-[#E5E3F2] outline-none text-[#171A2B]"
                      >
                        <option value="">-- Choose a site --</option>
                        {availableSites.map((site) => (
                          <option key={site.id} value={site.id}>
                            {site.name} ({site.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.assignmentSiteId && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#687086] mb-1">
                            Site Job Role *
                          </label>
                          {isSiteJobsLoading ? (
                            <div className="text-xs text-[#687086] py-1">Loading site roles...</div>
                          ) : wizardSiteJobs.length === 0 ? (
                            <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200">
                              No active job roles configured for this site yet.
                            </div>
                          ) : (
                            <select
                              value={formData.assignmentSiteJobId}
                              onChange={(e) => handleWizardJobChange(e.target.value)}
                              className="w-full h-9 rounded bg-white px-3 text-xs border border-[#E5E3F2] outline-none text-[#171A2B]"
                            >
                              <option value="">-- Choose a role --</option>
                              {wizardSiteJobs.map((sj) => (
                                <option key={sj.id} value={sj.id}>
                                  {sj.jobType?.name || 'Role'} &mdash; Default Rate: &pound;{sj.defaultPayRate}/hr
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-[#687086] mb-1">
                              Agreed Hourly Pay Rate (&pound;/hr) *
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="e.g. 14.50"
                              value={formData.assignmentPayRate}
                              onChange={(e) =>
                                setFormData({ ...formData, assignmentPayRate: e.target.value })
                              }
                            />
                            <p className="text-[10px] text-[#6C5CE7] mt-1 font-medium">
                              &bull; Rate locked into assignment for audit & payroll integrity.
                            </p>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#687086] mb-1">
                              Assignment Start Date *
                            </label>
                            <DatePicker
                              value={formData.assignmentStartDate}
                              onChange={(e) =>
                                setFormData({ ...formData, assignmentStartDate: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg border border-dashed border-[#D5D0FA] bg-[#F5F3FF] text-xs text-[#687086]">
                    Employee will be created without an immediate site placement and will appear in the workforce pool as <span className="font-semibold text-[#171A2B]">Unassigned</span>.
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: ACCOUNT & PORTAL ACCESS */}
            {wizardStep === 4 && (
              <div className="space-y-4">
                {/* Brevo Transactional Email Card */}
                <div className="p-3.5 rounded-lg border border-[#D5D0FA] bg-gradient-to-br from-[#F5F3FF] to-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-[#6C5CE7] text-white">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#171A2B]">
                          Employee Portal Activation (Brevo)
                        </span>
                        <p className="text-[11px] text-[#687086]">
                          Send an automated invitation to <strong>{formData.email || 'employee'}</strong>.
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.sendInvitation}
                      onChange={(e) => setFormData({ ...formData, sendInvitation: e.target.checked })}
                      className="h-4 w-4 rounded border-[#E5E3F2] text-[#6C5CE7] focus:ring-[#6C5CE7]"
                    />
                  </div>

                  <div className="p-2.5 rounded bg-white/80 border border-[#E5E3F2] text-[11px] text-[#2D3748] space-y-1">
                    <div className="font-semibold flex items-center gap-1.5 text-[#6C5CE7]">
                      <Shield className="h-3.5 w-3.5" />
                      Security Note: Company Admins Never Set Passwords
                    </div>
                    <p className="text-[#687086]">
                      The employee will receive a single-use, cryptographically verified activation link valid for 7 days. They will choose their own secure password to access shifts, timesheets, and payslips.
                    </p>
                  </div>
                </div>

                {/* SIA Licence Option */}
                <div className="p-3.5 rounded-lg border border-[#E5E3F2] bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-[#171A2B]">
                        Include SIA Licence Record?
                      </span>
                      <p className="text-[11px] text-[#687086]">
                        Record official SIA licence details for compliance and audit checking.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.hasLicence}
                      onChange={(e) => setFormData({ ...formData, hasLicence: e.target.checked })}
                      className="h-4 w-4 rounded border-[#E5E3F2] text-[#6C5CE7] focus:ring-[#6C5CE7]"
                    />
                  </div>

                  {formData.hasLicence && (
                    <div className="space-y-2.5 pt-2 border-t border-[#F0EEF8]">
                      <div>
                        <label className="block text-xs font-semibold text-[#687086] mb-1">
                          Licence Type *
                        </label>
                        <select
                          value={formData.licenceType}
                          onChange={(e) => setFormData({ ...formData, licenceType: e.target.value })}
                          className="w-full h-8 rounded bg-white px-2.5 text-xs border border-[#E5E3F2] outline-none text-[#171A2B]"
                        >
                          <option value="SIA Door Supervisor">SIA Door Supervisor</option>
                          <option value="SIA Security Guard">SIA Security Guard</option>
                          <option value="SIA CCTV Operator">SIA CCTV Operator</option>
                          <option value="SIA Close Protection">SIA Close Protection</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-[#687086] mb-1">
                            Licence Number (16 Digits) *
                          </label>
                          <Input
                            placeholder="1029384756102938"
                            value={formData.licenceNumber}
                            onChange={(e) =>
                              setFormData({ ...formData, licenceNumber: e.target.value })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#687086] mb-1">
                            Expiry Date *
                          </label>
                          <DatePicker
                            value={formData.licenceExpiryDate}
                            onChange={(e) =>
                              setFormData({ ...formData, licenceExpiryDate: e.target.value })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: REVIEW & CONFIRM */}
            {wizardStep === 5 && (
              <div className="space-y-3">
                <p className="text-xs text-[#687086]">
                  Please review all onboarding parameters before completing creation.
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Card 1: Personal */}
                  <div className="p-3 rounded-lg border border-[#E5E3F2] bg-white space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-[#171A2B] border-b border-[#F0EEF8] pb-1">
                      <User className="h-3.5 w-3.5 text-[#6C5CE7]" />
                      Personal Details
                    </div>
                    <div><span className="text-[#687086]">Name:</span> {formData.firstName} {formData.lastName}</div>
                    <div><span className="text-[#687086]">Email:</span> {formData.email}</div>
                    <div><span className="text-[#687086]">Phone:</span> {formData.phone}</div>
                    <div><span className="text-[#687086]">DOB:</span> {formData.dateOfBirth}</div>
                    <div className="text-[11px] text-[#687086] pt-1 border-t border-[#F0EEF8]">
                      Emergency: {formData.emergencyName} ({formData.emergencyRelationship} - {formData.emergencyPhone})
                    </div>
                  </div>

                  {/* Card 2: Employment */}
                  <div className="p-3 rounded-lg border border-[#E5E3F2] bg-white space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-[#171A2B] border-b border-[#F0EEF8] pb-1">
                      <Briefcase className="h-3.5 w-3.5 text-[#6C5CE7]" />
                      Employment Terms
                    </div>
                    <div>
                      <span className="text-[#687086]">ID:</span>{' '}
                      <span className="font-mono text-[#6C5CE7]">
                        {formData.isCustomEmployeeId && formData.employeeNumber
                          ? formData.employeeNumber
                          : 'Auto-generated'}
                      </span>
                    </div>
                    <div><span className="text-[#687086]">Position:</span> {formData.positionTitle}</div>
                    <div><span className="text-[#687086]">Type:</span> {formData.employmentType.replace('_', ' ')}</div>
                    <div><span className="text-[#687086]">Start Date:</span> {formData.employmentStartDate}</div>
                    <div><span className="text-[#687086]">Status:</span> {formData.employmentStatus}</div>
                  </div>

                  {/* Card 3: Assignment */}
                  <div className="p-3 rounded-lg border border-[#E5E3F2] bg-white space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-[#171A2B] border-b border-[#F0EEF8] pb-1">
                      <Building2 className="h-3.5 w-3.5 text-[#6C5CE7]" />
                      Initial Site Assignment
                    </div>
                    {formData.hasInitialAssignment && formData.assignmentSiteId ? (
                      <>
                        <div>
                          <span className="text-[#687086]">Site:</span>{' '}
                          {availableSites.find((s) => s.id === formData.assignmentSiteId)?.name || 'Selected Site'}
                        </div>
                        <div>
                          <span className="text-[#687086]">Role:</span>{' '}
                          {wizardSiteJobs.find((j) => j.id === formData.assignmentSiteJobId)?.jobType?.name || 'Officer'}
                        </div>
                        <div>
                          <span className="text-[#687086]">Agreed Rate:</span>{' '}
                          <span className="font-semibold text-emerald-700">
                            &pound;{formData.assignmentPayRate || '0.00'}/hr (Locked)
                          </span>
                        </div>
                        <div><span className="text-[#687086]">Effective:</span> {formData.assignmentStartDate}</div>
                      </>
                    ) : (
                      <div className="italic text-[#9096A9] py-2">
                        Unassigned (Workforce Pool)
                      </div>
                    )}
                  </div>

                  {/* Card 4: Access & Licence */}
                  <div className="p-3 rounded-lg border border-[#E5E3F2] bg-white space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-[#171A2B] border-b border-[#F0EEF8] pb-1">
                      <Shield className="h-3.5 w-3.5 text-[#6C5CE7]" />
                      Access &amp; Compliance
                    </div>
                    <div>
                      <span className="text-[#687086]">Portal Invite:</span>{' '}
                      {formData.sendInvitation ? (
                        <span className="text-emerald-700 font-medium">Immediate Brevo Email</span>
                      ) : (
                        <span className="text-[#687086]">Deferred / Disabled</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[#687086]">Licence:</span>{' '}
                      {formData.hasLicence ? (
                        <span>{formData.licenceType} ({formData.licenceNumber || 'Pending'})</span>
                      ) : (
                        <span className="text-[#9096A9] italic">None Attached</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </Modal>

        {/* ========================================================================= */}
        {/* EMPLOYEE DETAIL PROFILE DRAWER (SECTION 35) */}
        {/* ========================================================================= */}
        <Drawer
          isOpen={!!selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          title={
            selectedEmployee
              ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
              : 'Employee Details'
          }
          description={
            selectedEmployee
              ? `${selectedEmployee.employeeNumber} • Joined ${selectedEmployee.employmentStartDate}`
              : undefined
          }
          width="lg"
        >
          {selectedEmployee && (
            <div className="space-y-4">
              {/* Profile Header Status */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded bg-[#F5F3FF] border border-[#E5E3F2]">
                <div>
                  <span className="text-xs text-[#687086] block">Employment</span>
                  <div className="mt-1">{renderStatusBadge(selectedEmployee.employmentStatus)}</div>
                </div>
                <div>
                  <span className="text-xs text-[#687086] block">Portal Account</span>
                  <div className="mt-1 flex items-center gap-1.5">
                    {renderAccountBadge(selectedEmployee.accountStatus)}
                    {selectedEmployee.accountStatus === 'invited' && (
                      <Button
                        variant="outline"
                        size="xs"
                        className="text-[10px] h-6 px-2 text-[#D97706] border-[#FDE68A] hover:bg-[#FEF3C7]"
                        isLoading={resendingId === selectedEmployee.id}
                        onClick={() => handleResendInvite(selectedEmployee)}
                      >
                        Resend
                      </Button>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#687086] block">Licence</span>
                  <div className="mt-1">{renderLicenceBadge(selectedEmployee.licence)}</div>
                </div>
              </div>

              {/* Profile Tabs matching Section 35 */}
              <Tabs activeTab={activeProfileTab} onChange={setActiveProfileTab}>
                <TabList>
                  <TabTrigger value="overview">Overview</TabTrigger>
                  <TabTrigger value="employment">Employment</TabTrigger>
                  <TabTrigger value="assignments">Assignments</TabTrigger>
                  <TabTrigger value="licences">Licences</TabTrigger>
                  <TabTrigger value="history">History</TabTrigger>
                </TabList>

                {/* Sub-tab 1: Overview */}
                <TabContent value="overview">
                  <div className="space-y-4 text-xs">
                    <div className="p-3.5 rounded border border-[#E5E3F2] bg-white space-y-2.5">
                      <h4 className="font-bold text-[#687086] uppercase tracking-wider">
                        Contact Details
                      </h4>
                      <div className="flex items-center gap-2 text-[#171A2B]">
                        <Mail className="h-3.5 w-3.5 text-[#687086]" />
                        <span>{selectedEmployee.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#171A2B]">
                        <Phone className="h-3.5 w-3.5 text-[#687086]" />
                        <span>{selectedEmployee.phone}</span>
                      </div>
                      <div className="flex items-start gap-2 text-[#171A2B]">
                        <MapPin className="h-3.5 w-3.5 text-[#687086] shrink-0 mt-0.5" />
                        <span>
                          {selectedEmployee.address.line1}, {selectedEmployee.address.city},{' '}
                          {selectedEmployee.address.postalCode}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded border border-[#E5E3F2] bg-white space-y-2">
                      <h4 className="font-bold text-[#687086] uppercase tracking-wider">
                        Emergency Contact
                      </h4>
                      <p className="font-semibold text-[#171A2B]">
                        {selectedEmployee.emergencyContact.name}{' '}
                        <span className="font-normal text-[#687086]">
                          ({selectedEmployee.emergencyContact.relationship})
                        </span>
                      </p>
                      <p className="text-[#687086]">{selectedEmployee.emergencyContact.phone}</p>
                    </div>

                    <div className="p-3.5 rounded border border-[#E5E3F2] bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-[#687086] uppercase tracking-wider">
                          Current Assignment
                        </h4>
                        {activeAssignment && (
                          <Badge variant="success" size="sm">active</Badge>
                        )}
                      </div>

                      {activeAssignment ? (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-[#171A2B] flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-sky-600" />
                              {activeAssignment.siteJob?.site.name} [{activeAssignment.siteJob?.site.code}]
                            </span>
                            <span className="font-mono font-semibold text-[#171A2B]">
                              £{Number(activeAssignment.payRate).toFixed(2)}/hr
                            </span>
                          </div>
                          <div className="text-xs text-[#687086] flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            <span>Role: {activeAssignment.siteJob?.jobType?.name || 'Security Officer'}</span>
                          </div>
                          <div className="text-xs text-[#687086] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Effective since: {activeAssignment.startDate}</span>
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-[#F0EEF8]">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => {
                                setTransferForm({
                                  siteId: '',
                                  newSiteJobId: '',
                                  newPayRate: '',
                                  transferDate: new Date().toISOString().split('T')[0],
                                  reason: '',
                                });
                                setIsTransferModalOpen(true);
                              }}
                              className="gap-1 text-sky-600 border-sky-200 hover:bg-sky-50"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              Transfer Employee
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => {
                                if (confirm('Close this assignment?')) {
                                  closeAssignmentMutation.mutate({
                                    id: activeAssignment.id,
                                    payload: {
                                      endDate: new Date().toISOString().split('T')[0],
                                      reason: 'Closed by manager',
                                    },
                                  });
                                }
                              }}
                              className="text-rose-600 hover:bg-rose-50"
                            >
                              End Assignment
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-1">
                          <p className="text-[#687086] italic mb-2">
                            No active deployment. Employee is not currently assigned to any site.
                          </p>
                          <Button
                            size="xs"
                            variant="primary"
                            onClick={() => {
                              setSelectedSiteId('');
                              setAssignSiteJobs([]);
                              setIsAssignModalOpen(true);
                            }}
                            className="gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Assign to Site
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </TabContent>

                {/* Sub-tab 2: Employment */}
                <TabContent value="employment">
                  <div className="p-4 rounded border border-[#E5E3F2] bg-white text-xs space-y-3">
                    <div>
                      <span className="text-[#687086] block">Employee Number</span>
                      <span className="font-mono font-bold text-[#171A2B]">
                        {selectedEmployee.employeeNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#687086] block">Start Date</span>
                      <span className="font-medium text-[#171A2B]">
                        {selectedEmployee.employmentStartDate}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#687086] block">Status Actions</span>
                      <div className="flex gap-2 mt-1.5">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() =>
                            updateMutation.mutate({
                              id: selectedEmployee.id,
                              updates: {
                                employmentStatus:
                                  selectedEmployee.employmentStatus === 'active'
                                    ? 'on_leave'
                                    : 'active',
                              },
                            })
                          }
                        >
                          Toggle Leave Status
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabContent>

                {/* Sub-tab 3: Assignments */}
                <TabContent value="assignments">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#687086] uppercase tracking-wider">
                        Assignment History ({assignments.length})
                      </span>
                      {activeAssignment ? (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setTransferForm({
                              siteId: '',
                              newSiteJobId: '',
                              newPayRate: '',
                              transferDate: new Date().toISOString().split('T')[0],
                              reason: '',
                            });
                            setIsTransferModalOpen(true);
                          }}
                          className="gap-1"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          Transfer
                        </Button>
                      ) : (
                        <Button
                          size="xs"
                          variant="primary"
                          onClick={() => {
                            setSelectedSiteId('');
                            setAssignSiteJobs([]);
                            setIsAssignModalOpen(true);
                          }}
                          className="gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Assign to Site
                        </Button>
                      )}
                    </div>

                    {assignments.length === 0 ? (
                      <div className="p-6 rounded border border-dashed border-[#E5E3F2] bg-[#F5F3FF] text-center">
                        <Building2 className="w-6 h-6 text-[#9096A9] mx-auto mb-1.5" />
                        <p className="text-xs text-[#687086]">No assignment history on file.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {assignments.map((a) => (
                          <div
                            key={a.id}
                            className="p-3 bg-white rounded border border-[#E5E3F2] shadow-2xs text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#171A2B] flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-sky-600" />
                                {a.siteJob?.site.name} [{a.siteJob?.site.code}]
                              </span>
                              <Badge
                                variant={
                                  a.status === 'active'
                                    ? 'success'
                                    : a.status === 'transferred'
                                    ? 'warning'
                                    : 'neutral'
                                }
                                size="sm"
                              >
                                {a.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-[#687086]">
                              <span>Role: {a.siteJob?.jobType?.name || 'Security Officer'}</span>
                              <span className="font-mono font-semibold text-[#171A2B]">
                                Locked Rate: £{Number(a.payRate).toFixed(2)}/hr
                              </span>
                            </div>
                            <div className="text-[11px] text-[#9096A9] flex items-center gap-1 pt-1 border-t border-[#F5F3FF]">
                              <Calendar className="w-3 h-3" />
                              <span>{a.startDate} → {a.endDate || 'Present'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabContent>

                {/* Sub-tab 4: Licences */}
                <TabContent value="licences">
                  {selectedEmployee.licence ? (
                    <div className="p-4 rounded border border-[#E5E3F2] bg-white space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#171A2B]">
                          {selectedEmployee.licence.licenceType}
                        </span>
                        {renderLicenceBadge(selectedEmployee.licence)}
                      </div>
                      <p className="text-[#687086] font-mono">
                        Number: {selectedEmployee.licence.licenceNumber}
                      </p>
                      <p className="text-[#687086]">
                        Expires: {selectedEmployee.licence.expiryDate}
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 rounded border border-dashed border-[#E5E3F2] bg-[#F5F3FF] text-center">
                      <FileCheck className="h-6 w-6 text-[#9096A9] mx-auto mb-1.5" />
                      <p className="text-xs text-[#687086]">No licence registered on file.</p>
                    </div>
                  )}
                </TabContent>

                {/* Sub-tab 5: History */}
                <TabContent value="history">
                  <div className="p-4 rounded border border-[#E5E3F2] bg-white text-xs space-y-2">
                    <p className="text-[#687086]">
                      Created: {new Date(selectedEmployee.createdAt).toLocaleString('en-GB')}
                    </p>
                    <p className="text-[#687086]">
                      Last Updated: {new Date(selectedEmployee.updatedAt).toLocaleString('en-GB')}
                    </p>
                  </div>
                </TabContent>
              </Tabs>
            </div>
          )}
        </Drawer>

        {/* CREATE ASSIGNMENT MODAL (SECTION 37) */}
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title={`Assign ${selectedEmployee?.firstName} ${selectedEmployee?.lastName}`}
          description="Place employee into an active site job role with authoritative locked pay rate."
          maxWidth="lg"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedEmployee || !assignForm.siteJobId) {
                toast.error('Please select a site and role.');
                return;
              }
              createAssignmentMutation.mutate({
                employeeId: selectedEmployee.id,
                siteJobId: assignForm.siteJobId,
                payRate: assignForm.payRate ? parseFloat(assignForm.payRate) : undefined,
                startDate: assignForm.startDate,
                endDate: assignForm.endDate || undefined,
              });
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Deployment Site *
              </label>
              <Select
                value={selectedSiteId}
                onChange={(e) => handleSiteSelectForAssign(e.target.value)}
                options={[
                  { value: '', label: '-- Select a Site --' },
                  ...availableSites.map((s) => ({
                    value: s.id,
                    label: `${s.name} [${s.code}]`,
                  })),
                ]}
                required
              />
            </div>

            {selectedSiteId && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Role at Site *
                </label>
                <Select
                  value={assignForm.siteJobId}
                  onChange={(e) => {
                    const sjId = e.target.value;
                    const found = assignSiteJobs.find((j) => j.id === sjId);
                    setAssignForm({
                      ...assignForm,
                      siteJobId: sjId,
                      payRate: found ? found.defaultPayRate.toString() : '',
                    });
                  }}
                  options={[
                    { value: '', label: '-- Select a Role --' },
                    ...assignSiteJobs.map((j) => ({
                      value: j.id,
                      label: `${j.jobType?.name || 'Role'} (Default: £${j.defaultPayRate}/hr)`,
                    })),
                  ]}
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agreed Pay Rate (£/hr) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 14.50"
                  value={assignForm.payRate}
                  onChange={(e) => setAssignForm({ ...assignForm, payRate: e.target.value })}
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Locks this rate permanently for this assignment period.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start Date *
                </label>
                <Input
                  type="date"
                  value={assignForm.startDate}
                  onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                End Date (Optional)
              </label>
              <Input
                type="date"
                value={assignForm.endDate}
                onChange={(e) => setAssignForm({ ...assignForm, endDate: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAssignModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={createAssignmentMutation.isPending}
              >
                Create Assignment
              </Button>
            </div>
          </form>
        </Modal>

        {/* TRANSFER EMPLOYEE MODAL (SECTION 38) */}
        <Modal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          title="Atomic Employee Transfer"
          description="Atomically terminates previous assignment with historical rate lockdown and initiates new assignment."
          maxWidth="lg"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedEmployee || !transferForm.newSiteJobId) {
                toast.error('Please select destination site and role.');
                return;
              }
              transferMutation.mutate({
                employeeId: selectedEmployee.id,
                payload: {
                  newSiteJobId: transferForm.newSiteJobId,
                  newPayRate: transferForm.newPayRate ? parseFloat(transferForm.newPayRate) : undefined,
                  transferDate: transferForm.transferDate,
                  reason: transferForm.reason,
                },
              });
            }}
            className="space-y-4 text-xs"
          >
            {/* Current vs Target Comparison (Section 38) */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Current Assignment
                </span>
                <div className="font-semibold text-slate-900">
                  {activeAssignment?.siteJob?.site.name} [{activeAssignment?.siteJob?.site.code}]
                </div>
                <div className="text-slate-600 mt-0.5">
                  {activeAssignment?.siteJob?.jobType?.name}
                </div>
                <div className="font-mono text-xs font-semibold text-slate-800 mt-1">
                  £{Number(activeAssignment?.payRate).toFixed(2)}/hr
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block mb-1">
                  Destination Target
                </span>
                <div className="text-slate-600 italic">
                  {transferForm.newSiteJobId ? 'Selected below' : 'Select site & role below'}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Destination Site *
              </label>
              <Select
                value={transferForm.siteId}
                onChange={(e) => handleSiteSelectForTransfer(e.target.value)}
                options={[
                  { value: '', label: '-- Select Destination Site --' },
                  ...availableSites
                    .filter((s) => s.id !== activeAssignment?.siteJob?.site.id)
                    .map((s) => ({
                      value: s.id,
                      label: `${s.name} [${s.code}]`,
                    })),
                ]}
                required
              />
            </div>

            {transferForm.siteId && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination Role at Site *
                </label>
                <Select
                  value={transferForm.newSiteJobId}
                  onChange={(e) => {
                    const sjId = e.target.value;
                    const found = transferSiteJobs.find((j) => j.id === sjId);
                    setTransferForm({
                      ...transferForm,
                      newSiteJobId: sjId,
                      newPayRate: found ? found.defaultPayRate.toString() : '',
                    });
                  }}
                  options={[
                    { value: '', label: '-- Select a Role --' },
                    ...transferSiteJobs.map((j) => ({
                      value: j.id,
                      label: `${j.jobType?.name || 'Role'} (Default: £${j.defaultPayRate}/hr)`,
                    })),
                  ]}
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Agreed Pay Rate (£/hr) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 15.50"
                  value={transferForm.newPayRate}
                  onChange={(e) => setTransferForm({ ...transferForm, newPayRate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Effective Transfer Date *
                </label>
                <Input
                  type="date"
                  value={transferForm.transferDate}
                  onChange={(e) => setTransferForm({ ...transferForm, transferDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transfer Reason / Operational Notes
              </label>
              <Input
                placeholder="e.g. Client redeployment request"
                value={transferForm.reason}
                onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTransferModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={transferMutation.isPending}
              >
                Confirm Transfer
              </Button>
            </div>
          </form>
        </Modal>
      </PageContainer>
    </AppShell>
  );
}
