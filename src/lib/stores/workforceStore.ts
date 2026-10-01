import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Employee } from '@/types/employee';
import { Site, JobType, SiteJob } from '@/types/site';
import { EmployeeLicence, ComplianceSummary, LicenceStatus } from '@/types/licence';
import {
  mockEmployees,
  mockSites,
  mockJobTypes,
  mockLicences,
  mockComplianceSummary,
} from '@/lib/mockData';
import {
  fetchEmployees as apiFetchEmployees,
  createEmployeeApi,
  updateEmployeeApi,
  onboardEmployeeApi,
  resendEmployeeInviteApi,
} from '@/lib/api/employees';
import {
  fetchSites as apiFetchSites,
  createSiteApi,
  fetchJobTypes as apiFetchJobTypes,
  createJobTypeApi,
  addSiteJobApi,
  updateSiteJobApi,
} from '@/lib/api/sites';
import {
  fetchLicencesApi,
  fetchComplianceSummaryApi,
  createEmployeeLicenceApi,
  verifyLicenceApi,
  deleteLicenceApi,
} from '@/lib/api/licences';

const STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes freshness window
const ERROR_COOLDOWN_MS = 30 * 1000; // 30 seconds cooldown on API error to prevent spamming

function calculateComplianceSummary(licences: EmployeeLicence[]): ComplianceSummary {
  const total = licences.length;
  let valid = 0;
  let expiringSoon = 0;
  let expired = 0;
  let pendingVerification = 0;

  for (const lic of licences) {
    switch (lic.status) {
      case 'valid':
        valid++;
        break;
      case 'expiring_soon':
        expiringSoon++;
        break;
      case 'expired':
        expired++;
        break;
      case 'pending_verification':
      default:
        pendingVerification++;
        break;
    }
  }

  const compliantRate = total > 0 ? Math.round(((valid + expiringSoon) / total) * 100) : 100;

  return {
    total,
    valid,
    expiringSoon,
    expired,
    pendingVerification,
    rejected: 0,
  };
}

interface WorkforceState {
  // Employees State
  employees: Employee[];
  totalEmployees: number;
  isEmployeesLoading: boolean;
  isEmployeesRefreshing: boolean;
  employeesLastFetched: number | null;
  hasRealEmployees: boolean;

  // Sites State
  sites: Site[];
  isSitesLoading: boolean;
  isSitesRefreshing: boolean;
  sitesLastFetched: number | null;
  hasRealSites: boolean;

  // Job Types State
  jobTypes: JobType[];
  isJobTypesLoading: boolean;
  jobTypesLastFetched: number | null;

  // Licences & Compliance State
  licences: EmployeeLicence[];
  complianceSummary: ComplianceSummary;
  isLicencesLoading: boolean;
  isLicencesRefreshing: boolean;
  licencesLastFetched: number | null;
  hasRealLicences: boolean;

  // Actions
  fetchEmployees: (force?: boolean) => Promise<void>;
  createEmployee: (payload: any) => Promise<Employee>;
  onboardEmployee: (payload: any) => Promise<any>;
  resendEmployeeInvite: (id: string) => Promise<any>;
  updateEmployee: (id: string, updates: any) => Promise<Employee>;

  fetchSites: (force?: boolean) => Promise<void>;
  createSite: (payload: any) => Promise<Site>;
  fetchJobTypes: (force?: boolean) => Promise<void>;
  createJobType: (payload: any) => Promise<JobType>;
  addSiteJob: (siteId: string, data: any) => Promise<SiteJob>;
  updateSiteJob: (siteId: string, siteJobId: string, data: any) => Promise<SiteJob>;

  fetchLicences: (force?: boolean) => Promise<void>;
  createLicence: (employeeId: string, payload: any) => Promise<EmployeeLicence>;
  verifyLicence: (id: string, status: LicenceStatus) => Promise<void>;
  deleteLicence: (id: string) => Promise<void>;

  // Sync entire workforce state in background
  syncAll: () => Promise<void>;
}

export const useWorkforceStore = create<WorkforceState>()(
  persist(
    (set, get) => ({
      // Baseline initial state is loaded immediately from seed data
      employees: mockEmployees,
      totalEmployees: mockEmployees.length,
      isEmployeesLoading: false,
      isEmployeesRefreshing: false,
      employeesLastFetched: null,
      hasRealEmployees: false,

      sites: mockSites,
      isSitesLoading: false,
      isSitesRefreshing: false,
      sitesLastFetched: null,
      hasRealSites: false,

      jobTypes: mockJobTypes,
      isJobTypesLoading: false,
      jobTypesLastFetched: null,

      licences: mockLicences,
      complianceSummary: mockComplianceSummary,
      isLicencesLoading: false,
      isLicencesRefreshing: false,
      licencesLastFetched: null,
      hasRealLicences: false,

      /* -------------------------------------------------------------
       * EMPLOYEES ACTIONS
       * ----------------------------------------------------------- */
      fetchEmployees: async (force = false) => {
        const { employeesLastFetched, isEmployeesRefreshing, employees } = get();
        const now = Date.now();

        // 1. If freshly fetched and not forcing, return 0ms instant data
        if (!force && employeesLastFetched && now - employeesLastFetched < STALE_TIME_MS) {
          return;
        }

        // 2. Prevent concurrent duplicate fetches
        if (isEmployeesRefreshing) {
          return;
        }

        // Only show full loading if we have zero employees in memory
        if (employees.length === 0) {
          set({ isEmployeesLoading: true });
        }
        set({ isEmployeesRefreshing: true });

        try {
          const res = await apiFetchEmployees({ page: 1, limit: 100 });
          if (res && Array.isArray(res.items) && res.items.length > 0) {
            set({
              employees: res.items,
              totalEmployees: res.total || res.items.length,
              hasRealEmployees: true,
              employeesLastFetched: Date.now(),
            });
          } else {
            // Keep existing employees (mock or persisted), update timestamp
            set({ employeesLastFetched: Date.now() });
          }
        } catch {
          // On network/auth error, gracefully set cooldown without wiping existing table
          set({ employeesLastFetched: Date.now() - (STALE_TIME_MS - ERROR_COOLDOWN_MS) });
        } finally {
          set({ isEmployeesLoading: false, isEmployeesRefreshing: false });
        }
      },

      createEmployee: async (payload: any) => {
        try {
          const created = await createEmployeeApi(payload);
          set((state) => {
            const nextEmployees = [created, ...state.employees];
            return {
              employees: nextEmployees,
              totalEmployees: state.totalEmployees + 1,
              hasRealEmployees: true,
            };
          });
          return created;
        } catch (err) {
          // Optimistic fallback for client-side demo or network drop
          const fallbackEmployee: Employee = {
            id: `emp-local-${Date.now()}`,
            companyId: 'company-demo-1',
            employeeNumber: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
            firstName: payload.firstName || 'New',
            lastName: payload.lastName || 'Officer',
            email: payload.email || 'officer@apexsecurity.co.uk',
            phone: payload.phone || '+44 7700 900000',
            dateOfBirth: payload.dateOfBirth || '1990-01-01',
            address: {
              line1: payload.line1 || payload.addressLine1 || 'High Street',
              line2: payload.line2 || '',
              city: payload.city || 'London',
              postalCode: payload.postalCode || payload.postcode || 'E1 6AN',
              country: payload.country || 'United Kingdom',
            },
            emergencyContact: {
              name: payload.emergencyName || payload.emergencyContactName || 'Next of Kin',
              phone: payload.emergencyPhone || payload.emergencyContactPhone || '+44 7700 900001',
              relationship: payload.emergencyRelationship || payload.emergencyContactRelation || 'Spouse',
            },
            employmentStatus: payload.employmentStatus || 'active',
            employmentStartDate: payload.employmentStartDate || payload.startDate || new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set((state) => ({
            employees: [fallbackEmployee, ...state.employees],
            totalEmployees: state.totalEmployees + 1,
          }));
          return fallbackEmployee;
        }
      },

      onboardEmployee: async (payload: any) => {
        const res = await onboardEmployeeApi(payload);
        const created = res.employee || res;
        set((state) => ({
          employees: [created, ...state.employees],
          totalEmployees: state.totalEmployees + 1,
          hasRealEmployees: true,
        }));
        return res;
      },

      resendEmployeeInvite: async (id: string) => {
        const res = await resendEmployeeInviteApi(id);
        set((state) => ({
          employees: state.employees.map((e) =>
            e.id === id ? { ...e, accountStatus: 'invited' as const } : e
          ),
        }));
        return res;
      },

      updateEmployee: async (id: string, updates: any) => {
        try {
          const updated = await updateEmployeeApi(id, updates);
          set((state) => ({
            employees: state.employees.map((e) => (e.id === id ? { ...e, ...updated } : e)),
          }));
          return updated;
        } catch {
          // Local state update
          set((state) => ({
            employees: state.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)),
          }));
          const current = get().employees.find((e) => e.id === id);
          return current!;
        }
      },

      /* -------------------------------------------------------------
       * SITES & ROLES ACTIONS
       * ----------------------------------------------------------- */
      fetchSites: async (force = false) => {
        const { sitesLastFetched, isSitesRefreshing, sites } = get();
        const now = Date.now();

        if (!force && sitesLastFetched && now - sitesLastFetched < STALE_TIME_MS) {
          return;
        }

        if (isSitesRefreshing) {
          return;
        }

        if (sites.length === 0) {
          set({ isSitesLoading: true });
        }
        set({ isSitesRefreshing: true });

        try {
          const res = await apiFetchSites();
          if (Array.isArray(res) && res.length > 0) {
            set({
              sites: res,
              hasRealSites: true,
              sitesLastFetched: Date.now(),
            });
          } else {
            set({ sitesLastFetched: Date.now() });
          }
        } catch {
          set({ sitesLastFetched: Date.now() - (STALE_TIME_MS - ERROR_COOLDOWN_MS) });
        } finally {
          set({ isSitesLoading: false, isSitesRefreshing: false });
        }
      },

      createSite: async (payload: any) => {
        try {
          const created = await createSiteApi(payload);
          set((state) => ({
            sites: [created, ...state.sites],
            hasRealSites: true,
          }));
          return created;
        } catch {
          const fallbackSite: Site = {
            id: `site-local-${Date.now()}`,
            companyId: 'company-demo-1',
            name: payload.name || 'New Deployment Site',
            code: payload.code || `SITE-${Math.floor(100 + Math.random() * 900)}`,
            address: payload.address || {
              line1: '100 Security Way',
              city: 'London',
              postalCode: 'EC1A 1BB',
              country: 'United Kingdom',
            },
            contactName: payload.contactName || 'Duty Lead',
            contactPhone: payload.contactPhone || '+44 20 7946 0000',
            contactEmail: payload.contactEmail || 'lead@site.co.uk',
            status: 'active',
            configuredJobsCount: 0,
            jobs: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set((state) => ({
            sites: [fallbackSite, ...state.sites],
          }));
          return fallbackSite;
        }
      },

      fetchJobTypes: async (force = false) => {
        const { jobTypesLastFetched, isJobTypesLoading } = get();
        const now = Date.now();

        if (!force && jobTypesLastFetched && now - jobTypesLastFetched < STALE_TIME_MS) {
          return;
        }

        if (isJobTypesLoading) return;

        set({ isJobTypesLoading: true });
        try {
          const res = await apiFetchJobTypes();
          if (Array.isArray(res) && res.length > 0) {
            set({ jobTypes: res, jobTypesLastFetched: Date.now() });
          } else {
            set({ jobTypesLastFetched: Date.now() });
          }
        } catch {
          set({ jobTypesLastFetched: Date.now() - (STALE_TIME_MS - ERROR_COOLDOWN_MS) });
        } finally {
          set({ isJobTypesLoading: false });
        }
      },

      createJobType: async (payload: any) => {
        try {
          const created = await createJobTypeApi(payload);
          set((state) => ({ jobTypes: [...state.jobTypes, created] }));
          return created;
        } catch {
          const fallback: JobType = {
            id: `job-type-local-${Date.now()}`,
            companyId: 'company-demo-1',
            name: payload.name,
            description: payload.description || '',
            isActive: true,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({ jobTypes: [...state.jobTypes, fallback] }));
          return fallback;
        }
      },

      addSiteJob: async (siteId: string, data: any) => {
        try {
          const created = await addSiteJobApi(siteId, data);
          set((state) => ({
            sites: state.sites.map((s) => {
              if (s.id !== siteId) return s;
              const nextJobs = [...(s.jobs || []), created];
              return {
                ...s,
                jobs: nextJobs,
                configuredJobsCount: nextJobs.length,
              };
            }),
          }));
          return created;
        } catch {
          const jobType = get().jobTypes.find((j) => j.id === data.jobTypeId);
          const fallback: SiteJob = {
            id: `site-job-local-${Date.now()}`,
            companyId: 'company-demo-1',
            siteId,
            jobTypeId: data.jobTypeId,
            defaultPayRate: Number(data.defaultPayRate) || 14.5,
            billingRate: Number(data.billingRate) || 22.0,
            currency: data.currency || 'GBP',
            status: 'active',
            createdAt: new Date().toISOString(),
            jobType: jobType || {
              id: data.jobTypeId,
              companyId: 'company-demo-1',
              name: 'Security Officer',
              isActive: true,
              createdAt: new Date().toISOString(),
            },
          };
          set((state) => ({
            sites: state.sites.map((s) => {
              if (s.id !== siteId) return s;
              const nextJobs = [...(s.jobs || []), fallback];
              return {
                ...s,
                jobs: nextJobs,
                configuredJobsCount: nextJobs.length,
              };
            }),
          }));
          return fallback;
        }
      },

      updateSiteJob: async (siteId: string, siteJobId: string, data: any) => {
        try {
          const updated = await updateSiteJobApi(siteId, siteJobId, data);
          set((state) => ({
            sites: state.sites.map((s) => {
              if (s.id !== siteId) return s;
              return {
                ...s,
                jobs: (s.jobs || []).map((j) => (j.id === siteJobId ? { ...j, ...updated } : j)),
              };
            }),
          }));
          return updated;
        } catch {
          set((state) => ({
            sites: state.sites.map((s) => {
              if (s.id !== siteId) return s;
              return {
                ...s,
                jobs: (s.jobs || []).map((j) => (j.id === siteJobId ? { ...j, ...data } : j)),
              };
            }),
          }));
          const site = get().sites.find((s) => s.id === siteId);
          const job = site?.jobs?.find((j) => j.id === siteJobId);
          return job!;
        }
      },

      /* -------------------------------------------------------------
       * LICENCES & COMPLIANCE ACTIONS
       * ----------------------------------------------------------- */
      fetchLicences: async (force = false) => {
        const { licencesLastFetched, isLicencesRefreshing, licences } = get();
        const now = Date.now();

        if (!force && licencesLastFetched && now - licencesLastFetched < STALE_TIME_MS) {
          return;
        }

        if (isLicencesRefreshing) return;

        if (licences.length === 0) {
          set({ isLicencesLoading: true });
        }
        set({ isLicencesRefreshing: true });

        try {
          const [licRes, summaryRes] = await Promise.allSettled([
            fetchLicencesApi({ limit: 100 }),
            fetchComplianceSummaryApi(),
          ]);

          let nextLicences = licences;
          let hasReal = false;

          if (licRes.status === 'fulfilled' && licRes.value?.items?.length > 0) {
            nextLicences = licRes.value.items;
            hasReal = true;
          }

          let nextSummary = get().complianceSummary;
          if (summaryRes.status === 'fulfilled' && summaryRes.value) {
            nextSummary = summaryRes.value;
          } else if (hasReal) {
            nextSummary = calculateComplianceSummary(nextLicences);
          }

          set({
            licences: nextLicences,
            complianceSummary: nextSummary,
            hasRealLicences: hasReal,
            licencesLastFetched: Date.now(),
          });
        } catch {
          set({ licencesLastFetched: Date.now() - (STALE_TIME_MS - ERROR_COOLDOWN_MS) });
        } finally {
          set({ isLicencesLoading: false, isLicencesRefreshing: false });
        }
      },

      createLicence: async (employeeId: string, payload: any) => {
        try {
          const created = await createEmployeeLicenceApi(employeeId, payload);
          set((state) => {
            const next = [created, ...state.licences];
            return {
              licences: next,
              complianceSummary: calculateComplianceSummary(next),
              hasRealLicences: true,
            };
          });
          return created;
        } catch {
          const emp = get().employees.find((e) => e.id === employeeId);
          const fallback: EmployeeLicence = {
            id: `lic-local-${Date.now()}`,
            companyId: 'company-demo-1',
            employeeId,
            licenceType: payload.licenceType,
            licenceNumber: payload.licenceNumber,
            expiryDate: payload.expiryDate,
            status: 'pending_verification',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            employee: emp,
          };

          set((state) => {
            const next = [fallback, ...state.licences];
            return {
              licences: next,
              complianceSummary: calculateComplianceSummary(next),
            };
          });
          return fallback;
        }
      },

      verifyLicence: async (id: string, status: LicenceStatus) => {
        try {
          await verifyLicenceApi(id, status);
        } catch {
          // proceed with local state update
        }

        set((state) => {
          const next = state.licences.map((lic) =>
            lic.id === id
              ? {
                  ...lic,
                  status,
                  verifiedAt: new Date().toISOString(),
                  verifiedBy: 'Senior Compliance Lead',
                }
              : lic
          );
          return {
            licences: next,
            complianceSummary: calculateComplianceSummary(next),
          };
        });
      },

      deleteLicence: async (id: string) => {
        try {
          await deleteLicenceApi(id);
        } catch {
          // ignore
        }

        set((state) => {
          const next = state.licences.filter((lic) => lic.id !== id);
          return {
            licences: next,
            complianceSummary: calculateComplianceSummary(next),
          };
        });
      },

      syncAll: async () => {
        const { fetchEmployees, fetchSites, fetchJobTypes, fetchLicences } = get();
        await Promise.allSettled([
          fetchEmployees(),
          fetchSites(),
          fetchJobTypes(),
          fetchLicences(),
        ]);
      },
    }),
    {
      name: 'workforce_entity_store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        employees: state.employees,
        totalEmployees: state.totalEmployees,
        hasRealEmployees: state.hasRealEmployees,
        sites: state.sites,
        hasRealSites: state.hasRealSites,
        jobTypes: state.jobTypes,
        licences: state.licences,
        complianceSummary: state.complianceSummary,
        hasRealLicences: state.hasRealLicences,
      }),
    }
  )
);
