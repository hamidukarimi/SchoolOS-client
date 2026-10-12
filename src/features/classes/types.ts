export const CLASS_STATUSES = ["active", "inactive"] as const;

export type ClassStatus = (typeof CLASS_STATUSES)[number];

export interface ClassTeacherSummary {
  id: string;
  teacherId: string;
  firstName: string;
  lastName: string;
  subject: string;
}

export interface ClassStudentSummary {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  status: string;
}

export interface ClassRecord {
  id: string;
  name: string;
  section: string;
  grade: string;
  teacher: ClassTeacherSummary | null;
  students: ClassStudentSummary[];
  studentCount: number;
  capacity: number;
  academicYear: string;
  status: ClassStatus;
}

export interface ClassListResult {
  classes: ClassRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ClassListQuery {
  search: string;
  status: ClassStatus | "";
  grade: string;
  academicYear: string;
  page: number;
}

export interface ClassWritePayload {
  name: string;
  section: string;
  grade: string;
  capacity: number;
  academicYear: string;
  status: ClassStatus;
  teacherId?: string;
}
