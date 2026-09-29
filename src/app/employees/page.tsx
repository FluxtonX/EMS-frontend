'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
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
} from 'lucide-react';

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  // Creation Wizard Form State (Section 36)
  const [wizardStep, setWizardStep] = useState(1);
  const [formData, setFormData] = useState({
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
    emergencyRelationship: '',
    emergencyPhone: '',
    employeeNumber: '',
    employmentStatus: 'active' as EmploymentStatus,
    employmentStartDate: new Date().toISOString().split('T')[0],
    hasLicence: true,
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

  // Fetch employees
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['employees', page, debouncedSearch, statusFilter],
    queryFn: () =>
      fetchEmployees({
        page,
        limit: 10,
        search: debouncedSearch,
        status: statusFilter,
      }),
  });

  // Create Employee Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => createEmployeeApi(payload),
    onSuccess: () => {
      toast.success('Employee created successfully.');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsWizardOpen(false);
      resetWizard();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create employee.');
    },
  });

  // Update Employee Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => updateEmployeeApi(id, updates),
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

  const { data: availableSites = [] } = useQuery({
    queryKey: ['available-sites-list'],
    queryFn: fetchSites,
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

  const resetWizard = () => {
    setWizardStep(1);
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
      emergencyRelationship: '',
      emergencyPhone: '',
      employeeNumber: '',
      employmentStatus: 'active',
      employmentStartDate: new Date().toISOString().split('T')[0],
      hasLicence: true,
      licenceType: 'SIA Door Supervisor',
      licenceNumber: '',
      licenceExpiryDate: '',
    });
  };

  const handleWizardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wizardStep < 4) {
      setWizardStep((prev) => prev + 1);
      return;
    }

    // Submit payload matching backend DTO
    const payload = {
      employeeNumber: formData.employeeNumber,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
      address: {
        line1: formData.line1,
        line2: formData.line2 || undefined,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country,
      },
      emergencyContact: {
        name: formData.emergencyName,
        relationship: formData.emergencyRelationship,
        phone: formData.emergencyPhone,
      },
      employmentStatus: formData.employmentStatus,
      employmentStartDate: formData.employmentStartDate,
      ...(formData.hasLicence &&
        formData.licenceNumber && {
          initialLicence: {
            licenceType: formData.licenceType,
            licenceNumber: formData.licenceNumber,
            expiryDate: formData.licenceExpiryDate,
          },
        }),
    };

    createMutation.mutate(payload);
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

  return (
    <AppShell>
      <PageContainer
        title="Employees"
        subtitle={
          <span>
            <strong className="text-[#0F172A]">{data?.total ?? '—'}</strong> Workforce Records
          </span>
        }
        breadcrumbs={[
          { label: 'Workforce Platform', href: '/' },
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
        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded border border-[#E2E8F0]">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search by name, ID, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              className="h-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B] font-medium whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded bg-white px-2.5 text-xs text-[#0F172A] border border-[#CBD5E1] outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="probation">Probation</option>
              <option value="suspended">Suspended</option>
              <option value="on_leave">On Leave</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </div>

        {/* Content Table / Loading / Empty */}
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : isError ? (
          <div className="p-8 text-center bg-white rounded border border-[#FECACA]">
            <AlertCircle className="h-8 w-8 text-[#DC2626] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#991B1B]">Unable to load workforce records</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
              Retry
            </Button>
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="No employees found"
            description={
              debouncedSearch || statusFilter !== 'all'
                ? 'No workforce records match your active query filters.'
                : 'Add your first employee to get started.'
            }
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
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Assignment</TableHead>
                  <TableHead>Licence</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((emp) => (
                  <TableRow
                    key={emp.id}
                    className="cursor-pointer hover:bg-[#F8FAFC]"
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setActiveProfileTab('overview');
                    }}
                  >
                    <TableCell className="font-mono text-xs font-semibold text-[#2563EB]">
                      {emp.employeeNumber}
                    </TableCell>
                    <TableCell className="font-semibold text-[#0F172A]">
                      {emp.firstName} {emp.lastName}
                    </TableCell>
                    <TableCell>{renderStatusBadge(emp.employmentStatus)}</TableCell>
                    <TableCell className="text-xs text-[#64748B]">
                      {/* Section 18, 20: Assignment derived from assignment records in Phase 4 */}
                      <span className="italic text-[#94A3B8]">Unassigned (Phase 4)</span>
                    </TableCell>
                    <TableCell>{renderLicenceBadge(emp.licence)}</TableCell>
                    <TableCell className="text-xs text-[#475569]">{emp.phone}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmployee(emp);
                          setActiveProfileTab('overview');
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <TablePagination
              currentPage={data.page}
              totalPages={data.totalPages}
              totalItems={data.total}
              pageSize={10}
              onPageChange={setPage}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* ADD EMPLOYEE MULTI-STEP WIZARD (SECTION 36) */}
        {/* ========================================================================= */}
        <Modal
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          title={`Add Employee — Step ${wizardStep} of 4: ${
            wizardStep === 1
              ? 'Personal Information'
              : wizardStep === 2
              ? 'Contact & Emergency'
              : wizardStep === 3
              ? 'Employment Terms'
              : 'Licence & Review'
          }`}
          description="Create a permanent workforce identity record."
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
                isLoading={createMutation.isPending}
                onClick={handleWizardSubmit}
                rightIcon={
                  wizardStep < 4 ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )
                }
              >
                {wizardStep < 4 ? 'Continue' : 'Create Employee'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleWizardSubmit} className="space-y-4">
            {/* STEP 1: PERSONAL */}
            {wizardStep === 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">
                      First Name *
                    </label>
                    <Input
                      required
                      placeholder="e.g. John"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">
                      Last Name *
                    </label>
                    <Input
                      required
                      placeholder="e.g. Smith"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    Date of Birth *
                  </label>
                  <DatePicker
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* STEP 2: CONTACT & EMERGENCY */}
            {wizardStep === 2 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">Email *</label>
                    <Input
                      type="email"
                      required
                      placeholder="john.smith@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">Phone *</label>
                    <Input
                      required
                      placeholder="+44 7700 900123"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F1F5F9]">
                  <h4 className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">
                    Address
                  </h4>
                  <div className="space-y-2">
                    <Input
                      placeholder="Address Line 1"
                      required
                      value={formData.line1}
                      onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="City"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                      <Input
                        placeholder="Postal Code"
                        required
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F1F5F9]">
                  <h4 className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">
                    Emergency Contact
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Full Name"
                      required
                      value={formData.emergencyName}
                      onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                    />
                    <Input
                      placeholder="Relationship"
                      required
                      value={formData.emergencyRelationship}
                      onChange={(e) =>
                        setFormData({ ...formData, emergencyRelationship: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Phone"
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

            {/* STEP 3: EMPLOYMENT */}
            {wizardStep === 3 && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    Employee ID / Number *
                  </label>
                  <Input
                    required
                    placeholder="e.g. EMP-0250"
                    value={formData.employeeNumber}
                    onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                  />
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Unique identifier assigned within your company workspace.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">
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
                      className="w-full h-9 rounded bg-white px-3 text-sm border border-[#CBD5E1] outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="probation">Probation</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">
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

            {/* STEP 4: LICENCE & REVIEW */}
            {wizardStep === 4 && (
              <div className="space-y-4">
                <div className="p-3 rounded border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#0F172A]">
                      Include SIA Licence Record?
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.hasLicence}
                      onChange={(e) => setFormData({ ...formData, hasLicence: e.target.checked })}
                      className="h-4 w-4 rounded text-[#2563EB]"
                    />
                  </div>

                  {formData.hasLicence && (
                    <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                      <select
                        value={formData.licenceType}
                        onChange={(e) => setFormData({ ...formData, licenceType: e.target.value })}
                        className="w-full h-8 rounded bg-white px-2.5 text-xs border border-[#CBD5E1]"
                      >
                        <option value="SIA Door Supervisor">SIA Door Supervisor</option>
                        <option value="SIA Security Guard">SIA Security Guard</option>
                        <option value="SIA CCTV Operator">SIA CCTV Operator</option>
                        <option value="SIA Close Protection">SIA Close Protection</option>
                      </select>

                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Licence Number (16 digits)"
                          value={formData.licenceNumber}
                          onChange={(e) =>
                            setFormData({ ...formData, licenceNumber: e.target.value })
                          }
                          className="h-8 text-xs"
                        />
                        <DatePicker
                          value={formData.licenceExpiryDate}
                          onChange={(e) =>
                            setFormData({ ...formData, licenceExpiryDate: e.target.value })
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Review Summary */}
                <div className="p-3 rounded bg-white border border-[#E2E8F0] text-xs space-y-1.5">
                  <p className="font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-1">
                    Summary Verification
                  </p>
                  <p>
                    <span className="text-[#64748B]">Name:</span> {formData.firstName}{' '}
                    {formData.lastName} ({formData.employeeNumber})
                  </p>
                  <p>
                    <span className="text-[#64748B]">Email / Phone:</span> {formData.email} •{' '}
                    {formData.phone}
                  </p>
                  <p>
                    <span className="text-[#64748B]">Emergency:</span> {formData.emergencyName} (
                    {formData.emergencyRelationship} - {formData.emergencyPhone})
                  </p>
                  <p>
                    <span className="text-[#64748B]">Start Date:</span>{' '}
                    {formData.employmentStartDate} (Status: {formData.employmentStatus})
                  </p>
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
              <div className="flex items-center justify-between p-3 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                <div>
                  <span className="text-xs text-[#64748B] block">Current Status</span>
                  <div className="mt-1">{renderStatusBadge(selectedEmployee.employmentStatus)}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#64748B] block">Licence Status</span>
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
                    <div className="p-3.5 rounded border border-[#E2E8F0] bg-white space-y-2.5">
                      <h4 className="font-bold text-[#475569] uppercase tracking-wider">
                        Contact Details
                      </h4>
                      <div className="flex items-center gap-2 text-[#0F172A]">
                        <Mail className="h-3.5 w-3.5 text-[#64748B]" />
                        <span>{selectedEmployee.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#0F172A]">
                        <Phone className="h-3.5 w-3.5 text-[#64748B]" />
                        <span>{selectedEmployee.phone}</span>
                      </div>
                      <div className="flex items-start gap-2 text-[#0F172A]">
                        <MapPin className="h-3.5 w-3.5 text-[#64748B] shrink-0 mt-0.5" />
                        <span>
                          {selectedEmployee.address.line1}, {selectedEmployee.address.city},{' '}
                          {selectedEmployee.address.postalCode}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded border border-[#E2E8F0] bg-white space-y-2">
                      <h4 className="font-bold text-[#475569] uppercase tracking-wider">
                        Emergency Contact
                      </h4>
                      <p className="font-semibold text-[#0F172A]">
                        {selectedEmployee.emergencyContact.name}{' '}
                        <span className="font-normal text-[#64748B]">
                          ({selectedEmployee.emergencyContact.relationship})
                        </span>
                      </p>
                      <p className="text-[#475569]">{selectedEmployee.emergencyContact.phone}</p>
                    </div>

                    <div className="p-3.5 rounded border border-[#E2E8F0] bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-[#475569] uppercase tracking-wider">
                          Current Assignment
                        </h4>
                        {activeAssignment && (
                          <Badge variant="success" size="sm">active</Badge>
                        )}
                      </div>

                      {activeAssignment ? (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-[#0F172A] flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-sky-600" />
                              {activeAssignment.siteJob?.site.name} [{activeAssignment.siteJob?.site.code}]
                            </span>
                            <span className="font-mono font-semibold text-[#0F172A]">
                              £{Number(activeAssignment.payRate).toFixed(2)}/hr
                            </span>
                          </div>
                          <div className="text-xs text-[#64748B] flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            <span>Role: {activeAssignment.siteJob?.jobType?.name || 'Security Officer'}</span>
                          </div>
                          <div className="text-xs text-[#64748B] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Effective since: {activeAssignment.startDate}</span>
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-[#F1F5F9]">
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
                          <p className="text-[#64748B] italic mb-2">
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
                  <div className="p-4 rounded border border-[#E2E8F0] bg-white text-xs space-y-3">
                    <div>
                      <span className="text-[#64748B] block">Employee Number</span>
                      <span className="font-mono font-bold text-[#0F172A]">
                        {selectedEmployee.employeeNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block">Start Date</span>
                      <span className="font-medium text-[#0F172A]">
                        {selectedEmployee.employmentStartDate}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block">Status Actions</span>
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
                      <span className="text-xs font-bold text-[#475569] uppercase tracking-wider">
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
                      <div className="p-6 rounded border border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-center">
                        <Building2 className="w-6 h-6 text-[#94A3B8] mx-auto mb-1.5" />
                        <p className="text-xs text-[#64748B]">No assignment history on file.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {assignments.map((a) => (
                          <div
                            key={a.id}
                            className="p-3 bg-white rounded border border-[#E2E8F0] shadow-2xs text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
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
                            <div className="flex items-center justify-between text-[#64748B]">
                              <span>Role: {a.siteJob?.jobType?.name || 'Security Officer'}</span>
                              <span className="font-mono font-semibold text-[#0F172A]">
                                Locked Rate: £{Number(a.payRate).toFixed(2)}/hr
                              </span>
                            </div>
                            <div className="text-[11px] text-[#94A3B8] flex items-center gap-1 pt-1 border-t border-[#F8FAFC]">
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
                    <div className="p-4 rounded border border-[#E2E8F0] bg-white space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0F172A]">
                          {selectedEmployee.licence.licenceType}
                        </span>
                        {renderLicenceBadge(selectedEmployee.licence)}
                      </div>
                      <p className="text-[#64748B] font-mono">
                        Number: {selectedEmployee.licence.licenceNumber}
                      </p>
                      <p className="text-[#64748B]">
                        Expires: {selectedEmployee.licence.expiryDate}
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 rounded border border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-center">
                      <FileCheck className="h-6 w-6 text-[#94A3B8] mx-auto mb-1.5" />
                      <p className="text-xs text-[#64748B]">No licence registered on file.</p>
                    </div>
                  )}
                </TabContent>

                {/* Sub-tab 5: History */}
                <TabContent value="history">
                  <div className="p-4 rounded border border-[#E2E8F0] bg-white text-xs space-y-2">
                    <p className="text-[#64748B]">
                      Created: {new Date(selectedEmployee.createdAt).toLocaleString('en-GB')}
                    </p>
                    <p className="text-[#64748B]">
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
