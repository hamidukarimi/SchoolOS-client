export const STUDENT_STATUSES = ["active", "inactive", "suspended", "graduated"] as const;
export const STUDENT_GENDERS = ["male", "female"] as const;

export type StudentStatus = (typeof STUDENT_STATUSES)[number];
export type StudentGender = (typeof STUDENT_GENDERS)[number];

export interface StudentClassSummary {
  id: string;
  name: string;
  section: string;
}

export interface StudentAccountLink {
  id: string;
  email: string;
}

export interface StudentRecord {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: StudentGender;
  phone: string;
  address: string;
  classSummary: StudentClassSummary | null;
  account: StudentAccountLink | null;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  enrollmentDate: string;
  status: StudentStatus;
}

export interface StudentListResult {
  students: StudentRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export interface StudentListQuery {
  search: string;
  status: StudentStatus | "";
  page: number;
}

export interface StudentUpdatePayload {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: StudentGender;
  phone: string;
  address: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  status: StudentStatus;
}
