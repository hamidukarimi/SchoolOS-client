import type { SchoolPersona } from "../access/types";
import type { EnrolledClass, StudentClassSummary, StudentGender, StudentStatus } from "./types";

export function studentStatusLabel(status: StudentStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "inactive":
      return "Inactive";
    case "suspended":
      return "Suspended";
    case "graduated":
      return "Graduated";
  }
}

export function studentGenderLabel(gender: StudentGender): string {
  return gender === "male" ? "Male" : "Female";
}

export function readNotice(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("notice" in value)) return null;
  const notice = (value as { notice?: unknown }).notice;
  return typeof notice === "string" && notice.trim() ? notice : null;
}

export function formatStudentDate(value: string): string {
  const day = /^(\d{4}-\d{2}-\d{2})/.exec(value)?.[1];
  if (!day) return "Not recorded";
  const date = new Date(`${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function studentClassLabel(summary: StudentClassSummary | null): string {
  if (!summary) return "Not assigned";
  return summary.section ? `${summary.name}, section ${summary.section}` : summary.name;
}

export const enrolledClassesEmptyMessage = "This student is not enrolled in a class.";

export function enrolledClassTitle(entry: EnrolledClass): string {
  return entry.section ? `${entry.name}, section ${entry.section}` : entry.name;
}

export function enrolledClassMeta(entry: EnrolledClass): string {
  return `Grade ${entry.grade} · ${entry.academicYear}`;
}

export function enrolledClassTeacherLabel(entry: EnrolledClass): string {
  if (!entry.teacher) return "No teacher assigned";
  const name = `${entry.teacher.firstName} ${entry.teacher.lastName}`.trim();
  if (!name) return "No teacher assigned";
  return entry.teacher.teacherId ? `${name} · ${entry.teacher.teacherId}` : name;
}

export function canOpenEnrolledClass(
  persona: SchoolPersona | undefined,
  teacherProfileId: string | undefined,
  entry: EnrolledClass,
): boolean {
  if (persona === "admin" || persona === "student") return true;
  if (persona === "teacher") return Boolean(teacherProfileId && entry.teacher?.id === teacherProfileId);
  return false;
}

export function enrolledClassesPanel(status: "loading" | "error" | "ready", count: number): "loading" | "error" | "empty" | "list" {
  if (status === "loading") return "loading";
  if (status === "error") return "error";
  return count === 0 ? "empty" : "list";
}
