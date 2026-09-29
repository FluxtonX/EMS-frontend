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

export interface Employee {
  id: string;
  companyId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: EmployeeAddress;
  emergencyContact: EmergencyContact;
  employmentStatus: EmploymentStatus;
  employmentStartDate: string;
  employmentEndDate?: string;
  licence?: EmployeeLicence | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedEmployeesResponse {
  items: Employee[];
  total: number;
  page: number;
  totalPages: number;
}
