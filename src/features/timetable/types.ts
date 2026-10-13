export const TIMETABLE_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;

export const TIMETABLE_STATUSES = ["active", "inactive"] as const;

export type TimetableDay = (typeof TIMETABLE_DAYS)[number];

export type TimetableStatus = (typeof TIMETABLE_STATUSES)[number];

export interface TimetableClassRef {
  id: string;
  name: string;
  section: string;
  grade: string;
}

export interface TimetableTeacherRef {
  id: string;
  firstName: string;
  lastName: string;
  teacherId: string;
  subject: string;
}

export interface TimetableRecord {
  id: string;
  classRef: TimetableClassRef | null;
  teacher: TimetableTeacherRef | null;
  subject: string;
  dayOfWeek: TimetableDay;
  startTime: string;
  endTime: string;
  room: string;
  academicYear: string;
  status: TimetableStatus;
}

export interface TimetableListResult {
  timetables: TimetableRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TimetableListQuery {
  classId: string;
  teacherId: string;
  dayOfWeek: TimetableDay | "";
  academicYear: string;
  page: number;
}

export interface TimetableWritePayload {
  classId: string;
  teacherId: string;
  subject: string;
  dayOfWeek: TimetableDay;
  startTime: string;
  endTime: string;
  academicYear: string;
  status: TimetableStatus;
  room?: string;
}
