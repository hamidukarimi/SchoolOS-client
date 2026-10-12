export const TEACHER_STATUSES = ["active", "inactive", "suspended"] as const;
export const TEACHER_GENDERS = ["male", "female"] as const;

export type TeacherStatus = (typeof TEACHER_STATUSES)[number];
export type TeacherGender = (typeof TEACHER_GENDERS)[number];

export interface TeacherAccountLink {
  id: string;
  email: string;
}

export interface TeacherRecord {
  id: string;
  teacherId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: TeacherGender;
  phone: string;
  address: string;
  subject: string;
  qualification: string;
  experience: number | null;
  salary: number | null;
  account: TeacherAccountLink | null;
  joinDate: string;
  status: TeacherStatus;
}

export interface TeacherListResult {
  teachers: TeacherRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TeacherListQuery {
  search: string;
  status: TeacherStatus | "";
  page: number;
}

export interface TeacherUpdatePayload {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: TeacherGender;
  phone: string;
  address: string;
  subject: string;
  qualification: string;
  experience?: number;
  salary?: number;
  joinDate?: string;
  status: TeacherStatus;
}
