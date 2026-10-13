export const STAFF_STATUSES = ["active", "inactive", "suspended", "terminated"] as const;
export const STAFF_GENDERS = ["male", "female"] as const;
export const STAFF_CONTRACT_TYPES = ["full-time", "part-time", "contract"] as const;

export type StaffStatus = (typeof STAFF_STATUSES)[number];
export type StaffGender = (typeof STAFF_GENDERS)[number];
export type StaffContractType = (typeof STAFF_CONTRACT_TYPES)[number];

export interface StaffAccountLink {
  id: string;
  email: string;
}

export interface StaffRecord {
  id: string;
  staffId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: StaffGender;
  phone: string;
  address: string;
  department: string;
  position: string;
  salary: number;
  joinDate: string;
  contractType: StaffContractType;
  status: StaffStatus;
  account: StaffAccountLink | null;
}

export interface StaffListResult {
  staff: StaffRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export interface StaffListQuery {
  search: string;
  department: string;
  status: StaffStatus | "";
  contractType: StaffContractType | "";
  page: number;
}

export interface StaffSummary {
  total: number;
  byStatus: {
    active: number;
    inactive: number;
    suspended: number;
    terminated: number;
  };
  byContractType: {
    fullTime: number;
    partTime: number;
    contract: number;
  };
  totalMonthlySalary: number;
}

export interface StaffWritePayload {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: StaffGender;
  phone: string;
  address: string;
  department: string;
  position: string;
  salary: number;
  joinDate?: string;
  contractType: StaffContractType;
  status: StaffStatus;
}
