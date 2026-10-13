export const ACCOUNT_ROLES = ["user", "admin"] as const;
export const ACCOUNT_STATUSES = ["active", "inactive"] as const;
export const ACCOUNT_GENDERS = ["male", "female", "other"] as const;

export type AccountRole = (typeof ACCOUNT_ROLES)[number];
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];
export type AccountGender = (typeof ACCOUNT_GENDERS)[number];

export interface AccountLocation {
  city?: string;
  country?: string;
}

export interface AccountSummary {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  role: AccountRole;
  isActive: boolean;
  hasStudentProfile: boolean;
  hasTeacherProfile: boolean;
  hasStaffRecord: boolean;
}

export interface AccountRecord extends AccountSummary {
  isVerified: boolean;
  gender?: AccountGender;
  birthday?: string;
  location?: AccountLocation;
  createdAt: string;
  updatedAt: string;
  studentProfileId?: string;
  teacherProfileId?: string;
  staffRecordId?: string;
}

export interface AccountListQuery {
  search: string;
  role: AccountRole | "";
  status: AccountStatus | "";
  page: number;
}

export interface AccountListResult {
  accounts: AccountSummary[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AccountWritePayload {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password?: string;
  birthday?: string;
  gender?: AccountGender;
  location?: AccountLocation;
  role: AccountRole;
}

export interface AccountUpdatePayload {
  firstname?: string;
  lastname?: string;
  username?: string;
  email?: string;
  password?: string;
  birthday?: string;
  gender?: AccountGender;
  location?: AccountLocation;
  role?: AccountRole;
  isActive?: boolean;
}
