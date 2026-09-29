import { Site, SiteJob } from './site';
import { Employee } from './employee';

export type ShiftStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Shift {
  id: string;
  companyId: string;
  siteId: string;
  siteJobId: string;
  employeeId?: string;
  shiftDate: string; // 'YYYY-MM-DD'
  startTime: string; // 'HH:MM'
  endTime: string;   // 'HH:MM'
  breakMinutes: number;
  status: ShiftStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  site?: Site;
  siteJob?: SiteJob & { jobType?: { id: string; name: string } };
  employee?: Employee;
}

export interface CreateShiftInput {
  siteId: string;
  siteJobId: string;
  employeeId?: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  notes?: string;
}

export interface UpdateShiftInput {
  employeeId?: string | null;
  shiftDate?: string;
  startTime?: string;
  endTime?: string;
  breakMinutes?: number;
  status?: ShiftStatus;
  notes?: string;
}

export interface EligibleEmployee {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    siaLicenceNumber?: string;
  };
  hasActiveAssignment: boolean;
  isAssignedToThisSite: boolean;
  isAssignedToThisJob: boolean;
  assignedPayRate: number | null;
  hasConflict: boolean;
  conflictDetails: string | null;
  isEligible: boolean;
}
