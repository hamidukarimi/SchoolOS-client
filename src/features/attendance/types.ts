export const ATTENDANCE_STATUSES = ["present", "absent", "late", "excused"] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export interface AttendanceStudentRef {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
}

export interface AttendanceClassRef {
  id: string;
  name: string;
  section: string;
  grade: string;
}

export interface AttendanceTeacherRef {
  id: string;
  firstName: string;
  lastName: string;
  teacherId: string;
}

export interface AttendanceRecord {
  id: string;
  student: AttendanceStudentRef | null;
  classRef: AttendanceClassRef | null;
  teacher: AttendanceTeacherRef | null;
  date: string;
  status: AttendanceStatus;
  note: string;
}

export interface AttendanceListResult {
  attendance: AttendanceRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AttendanceListQuery {
  studentId: string;
  classId: string;
  status: AttendanceStatus | "";
  date: string;
  page: number;
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  attendanceRate: number;
}

export interface AttendanceCreatePayload {
  studentId: string;
  classId: string;
  teacherId: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceUpdatePayload {
  status: AttendanceStatus;
  note: string;
}
