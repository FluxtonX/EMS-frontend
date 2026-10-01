export type EmploymentStatus = 'active' | 'probation' | 'suspended' | 'terminated' | 'on_leave';

export type LicenceStatus = 'valid' | 'expiring_soon' | 'expired' | 'pending_verification' | 'rejected';

export interface EmployeeAddress {
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface EmployeeLicence {
  id?: string;
  licenceType: string;
  licenceNumber: string;
  expiryDate: string;
  status: LicenceStatus;
  verifiedAt?: string;
}

export type AccountStatus = 'invited' | 'active' | 'suspended' | 'disabled';

export interface EmployeeCurrentAssignment {
  id: string;
  siteName: string;
  siteCode?: string;
  role: string;
  payRate: number;
  startDate: string;
}

export interface Employee {
  id: string;
  companyId: string;
  userId?: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: EmployeeAddress;
  emergencyContact: EmergencyContact;
  employmentStatus: EmploymentStatus;
  accountStatus?: AccountStatus;
  employmentStartDate: string;
  employmentEndDate?: string;
  licence?: EmployeeLicence | null;
  currentAssignment?: EmployeeCurrentAssignment | null;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardEmployeePayload {
  employeeNumber?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: EmployeeAddress;
  emergencyContact: EmergencyContact;
  employmentStatus?: EmploymentStatus;
  employmentStartDate: string;
  employmentType?: string;
  positionTitle?: string;
  initialAssignment?: {
    siteJobId: string;
    payRate?: number;
    startDate?: string;
  };
  initialLicence?: {
    licenceType: string;
    licenceNumber: string;
    expiryDate: string;
  };
  sendInvitation?: boolean;
}

export interface PaginatedEmployeesResponse {
  items: Employee[];
  total: number;
  page: number;
  totalPages: number;
}
