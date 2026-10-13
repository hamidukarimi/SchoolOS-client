export interface GradeStudentRef {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
}

export interface GradeClassRef {
  id: string;
  name: string;
  section: string;
  grade: string;
}

export interface GradeTeacherRef {
  id: string;
  firstName: string;
  lastName: string;
  teacherId: string;
}

export interface GradeExamRef {
  id: string;
  title: string;
  date: string;
  totalMarks: number | null;
  passingMarks: number | null;
}

export interface GradeRecord {
  id: string;
  student: GradeStudentRef | null;
  exam: GradeExamRef | null;
  classRef: GradeClassRef | null;
  teacher: GradeTeacherRef | null;
  subject: string;
  marksObtained: number;
  totalMarks: number;
  grade: string;
  remarks: string;
  academicYear: string;
}

export interface GradeListResult {
  grades: GradeRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export interface GradeListQuery {
  studentId: string;
  examId: string;
  classId: string;
  subject: string;
  academicYear: string;
  page: number;
}

export interface GradeSummary {
  total: number;
  passed: number;
  failed: number;
  averageMarks: number;
}

export const EXAM_STATUSES = ["scheduled", "ongoing", "completed", "cancelled"] as const;

export type ExamStatus = (typeof EXAM_STATUSES)[number];

export interface GradeExamOption {
  id: string;
  title: string;
  subject: string;
  academicYear: string;
  totalMarks: number;
  passingMarks: number;
  date: string;
  status: ExamStatus | "";
  classRef: GradeClassRef | null;
  teacher: GradeTeacherRef | null;
}

export interface GradeExamListResult {
  exams: GradeExamOption[];
  total: number;
  page: number;
  totalPages: number;
}

export interface GradeCreatePayload {
  studentId: string;
  examId: string;
  classId: string;
  teacherId: string;
  subject: string;
  marksObtained: number;
  totalMarks: number;
  academicYear: string;
  remarks?: string;
}

export interface GradeUpdatePayload {
  marksObtained: number;
  totalMarks: number;
  remarks: string;
}
