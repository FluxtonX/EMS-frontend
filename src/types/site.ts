export interface SiteAddress {
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface JobType {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface SiteJob {
  id: string;
  companyId: string;
  siteId: string;
  jobTypeId: string;
  defaultPayRate: number;
  billingRate: number;
  currency: string;
  status: 'active' | 'inactive';
  jobType?: JobType;
  createdAt: string;
}

export interface Site {
  id: string;
  companyId: string;
  name: string;
  code: string;
  address: SiteAddress;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  status: 'active' | 'inactive' | 'archived';
  configuredJobsCount?: number;
  jobs?: SiteJob[];
  createdAt: string;
  updatedAt: string;
}
