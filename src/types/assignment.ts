import { Site, SiteJob } from './site';

export type AssignmentStatus = 'active' | 'completed' | 'transferred' | 'cancelled';

export interface Assignment {
  id: string;
  companyId: string;
  employeeId: string;
  siteJobId: string;
  payRate: number;
  startDate: string;
  endDate?: string;
  status: AssignmentStatus;
  siteJob?: SiteJob & { site: Site };
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
