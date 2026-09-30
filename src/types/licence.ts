import { Employee } from './employee';

export type LicenceStatus = 'valid' | 'expiring_soon' | 'expired' | 'pending_verification' | 'rejected';

export interface EmployeeLicence {
  id: string;
  companyId: string;
  employeeId: string;
  licenceType: string;
  licenceNumber: string;
  expiryDate: string;
  status: LicenceStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
}

export interface ComplianceSummary {
  total: number;
  valid: number;
  expiringSoon: number;
  expired: number;
  pendingVerification: number;
  rejected: number;
}

export interface CreateLicencePayload {
  licenceType: string;
  licenceNumber: string;
  expiryDate: string;
}

export interface UpdateLicencePayload {
  licenceType?: string;
  licenceNumber?: string;
  expiryDate?: string;
  status?: LicenceStatus;
}
