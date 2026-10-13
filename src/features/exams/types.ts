export const EXAM_STATUSES = ["scheduled", "ongoing", "completed", "cancelled"] as const;

export type ExamStatus = (typeof EXAM_STATUSES)[number];

export interface ExamClassRef {
  id: string;
  name: string;
  section: string;
  grade: string;
}

export interface ExamTeacherRef {
  id: string;
  firstName: string;
  lastName: string;
  teacherId: string;
  subject: string;
}

export interface ExamRecord {
  id: string;
  title: string;
  description: string;
  classRef: ExamClassRef | null;
  subject: string;
  teacher: ExamTeacherRef | null;
  date: string;
  startTime: string;
  endTime: string;
  totalMarks: number;
  passingMarks: number;
  academicYear: string;
  status: ExamStatus;
}

export interface ExamListResult {
  exams: ExamRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ExamListQuery {
  classId: string;
  teacherId: string;
  subject: string;
  status: ExamStatus | "";
  academicYear: string;
  page: number;
}

export interface ExamWritePayload {
  title: string;
  description?: string;
  classId: string;
  subject: string;
  teacherId: string;
  date: string;
  startTime: string;
  endTime: string;
  totalMarks: number;
  passingMarks: number;
  academicYear: string;
  status: ExamStatus;
}
