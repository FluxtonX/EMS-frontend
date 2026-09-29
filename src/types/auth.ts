export type Role = 'Owner' | 'Admin' | 'Manager' | 'Supervisor' | 'Employee';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  tier?: string;
  role: Role;
}

export interface AuthSession {
  user: User;
  company: Company;
  permissions: string[];
  accessToken: string;
  refreshToken: string;
}
