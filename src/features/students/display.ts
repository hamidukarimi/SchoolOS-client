import type { StudentClassSummary, StudentGender, StudentStatus } from "./types";

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
