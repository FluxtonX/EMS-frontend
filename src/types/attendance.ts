import { Site } from './site';
import { Employee } from './employee';
import { Shift } from './shift';

export type AttendanceStatus =
  | 'clocked_in'
  | 'on_break'
  | 'clocked_out'
  | 'reconciled'
  | 'flagged'
  | 'rejected';

export type VarianceFlag =
  | 'none'
  | 'late_arrival'
  | 'early_departure'
  | 'out_of_geofence'
  | 'overtime'
  | 'unmatched_shift';

export interface AttendanceRecord {
  id: string;
  companyId: string;
  shiftId?: string;
  employeeId: string;
  siteId: string;
  clockInTime: string;
  clockOutTime?: string;
  clockInLat?: number;
  clockInLng?: number;
  clockInAccuracy?: number;
  clockInDistance?: number;
  clockInVerified: boolean;
  clockOutLat?: number;
  clockOutLng?: number;
  clockOutAccuracy?: number;
  clockOutDistance?: number;
  clockOutVerified: boolean;
  breakStartTime?: string;
  breakEndTime?: string;
  breakMinutes: number;
  totalHours: number;
  status: AttendanceStatus;
  varianceFlag: VarianceFlag;
  supervisorNotes?: string;
  reconciledBy?: string;
  reconciledAt?: string;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
  site?: Site;
  shift?: Shift;
}

export interface ClockInPayload {
  employeeId: string;
  siteId: string;
  shiftId?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export interface ClockOutPayload {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export interface ReconcilePayload {
  adjustedTotalHours?: number;
  adjustedBreakMinutes?: number;
  status: 'reconciled' | 'flagged' | 'rejected';
  varianceFlag?: VarianceFlag;
  supervisorNotes: string;
}
