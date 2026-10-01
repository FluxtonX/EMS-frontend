import { Site, SiteJob } from './site';

export type AssignmentStatus = 'active' | 'completed' | 'transferred' | 'cancelled';

export interface AssignmentEmployee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  status?: string;
  accountStatus?: string;
  photoUrl?: string;
}

export interface Assignment {
  id: string;
  companyId: string;
  employeeId: string;
  siteJobId: string;
  payRate: number;
  startDate: string;
  endDate?: string;
  status: AssignmentStatus;
  employee?: AssignmentEmployee;
  siteJob?: SiteJob & { site: Site; jobType?: { id: string; name: string; code: string } };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssignmentPayload {
  employeeId: string;
  siteJobId: string;
  payRate?: number;
  startDate: string;
  endDate?: string;
}

export interface TransferAssignmentPayload {
  newSiteJobId: string;
  newPayRate?: number;
  transferDate: string;
  reason?: string;
}

export interface CloseAssignmentPayload {
  endDate: string;
  reason?: string;
}
