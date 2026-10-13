import type { SchoolPersona } from "../access/types";
import type { TeacherGender, TeacherStatus } from "./types";

export function canManageTeachers(persona: SchoolPersona | undefined): boolean {
  return persona === "admin";
}

export function teacherListHeading(persona: SchoolPersona | undefined): string {
  return persona === "teacher" ? "Your teaching record" : "Teachers";
}

export function teacherListIntroduction(persona: SchoolPersona | undefined): string {
  if (persona === "admin") {
    return "Review teacher profiles or add one for an account that already exists. Adding a profile does not assign classes.";
  }
  if (persona === "teacher") {
    return "This page shows the teaching profile linked to your account. Only an administrator can change it.";
  }
  if (persona === "student") {
    return "These are the teachers assigned to your classes.";
  }
  return "Teacher records are not available for this account.";
}

export function teacherEmptyTitle(filtered: boolean): string {
  return filtered ? "No teachers match this search" : "No teachers to show";
}

export function teacherEmptyMessage(persona: SchoolPersona | undefined, filtered: boolean): string {
  if (filtered) return "Try a different name, teacher ID, subject, or status.";
  if (persona === "teacher") return "No teaching profile is linked to this account.";
  if (persona === "student") return "No teachers are assigned to your classes.";
  return "There are no teacher profiles in this view.";
}

export function teacherStatusLabel(status: TeacherStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "inactive":
      return "Inactive";
    case "suspended":
      return "Suspended";
  }
}

export function teacherGenderLabel(gender: TeacherGender): string {
  return gender === "male" ? "Male" : "Female";
}

export function readNotice(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("notice" in value)) return null;
  const notice = (value as { notice?: unknown }).notice;
  return typeof notice === "string" && notice.trim() ? notice : null;
}

export function formatTeacherDate(value: string): string {
  const day = /^(\d{4}-\d{2}-\d{2})/.exec(value)?.[1];
  if (!day) return "Not recorded";
  const date = new Date(`${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function formatTeacherNumber(value: number | null): string {
  if (value === null) return "Not recorded";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

export function numberInputValue(value: number | null): string {
  return value === null ? "" : String(value);
}
