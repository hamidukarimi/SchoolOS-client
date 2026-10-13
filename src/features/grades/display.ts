import type { SchoolPersona } from "../access/types";

export function canManageGrades(persona: SchoolPersona | undefined): boolean {
  return persona === "admin";
}

export function gradeListIntroduction(persona: SchoolPersona | undefined): string {
  if (persona === "admin") {
    return "Review results and record one student for an existing exam. Teachers and students can read the results the server allows, but only an administrator can change them.";
  }
  if (persona === "teacher") {
    return "These results are for students on your class lists, or results that name you as the teacher. Recording results is limited to administrators.";
  }
  if (persona === "student") {
    return "These are your results. You cannot change them.";
  }
  return "Results are not available for this account.";
}

export function gradeDateInput(value: string): string {
  return /^(\d{4}-\d{2}-\d{2})/.exec(value)?.[1] ?? "";
}

export function formatGradeDate(value: string): string {
  const day = gradeDateInput(value);
  if (!day) return "Not recorded";
  const [year, month, date] = day.split("-").map(Number);
  const utc = new Date(Date.UTC(year, (month ?? 1) - 1, date ?? 1));
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(utc);
}

export function formatStoredGrade(grade: string): string {
  return grade.trim() || "Not recorded";
}

export function marksPercentage(marksObtained: number, totalMarks: number): number | null {
  if (!Number.isFinite(marksObtained) || !Number.isFinite(totalMarks) || totalMarks <= 0) return null;
  return Math.round((marksObtained / totalMarks) * 10000) / 100;
}

export function canSubmitGrade(input: {
  pending: boolean;
  studentId: string;
  examId: string;
  classId: string;
  teacherId: string;
  subject: string;
  academicYear: string;
  marksObtained: number;
  totalMarks: number;
  gradedStudentIds: readonly string[];
}): boolean {
  if (input.pending) return false;
  if (!input.studentId || !input.examId || !input.classId || !input.teacherId) return false;
  if (!input.subject.trim() || !input.academicYear.trim()) return false;
  if (!Number.isFinite(input.marksObtained) || input.marksObtained < 0) return false;
  if (!Number.isFinite(input.totalMarks) || input.totalMarks < 1) return false;
  return !input.gradedStudentIds.includes(input.studentId);
}

export function readNotice(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("notice" in value)) return null;
  const notice = (value as { notice?: unknown }).notice;
  return typeof notice === "string" && notice.trim() ? notice : null;
}
