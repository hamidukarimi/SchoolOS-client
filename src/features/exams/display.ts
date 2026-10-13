import type { SchoolPersona } from "../access/types";
import type { ExamStatus } from "./types";

export function canManageExams(persona: SchoolPersona | undefined): boolean {
  return persona === "admin";
}

export function examStatusLabel(status: ExamStatus): string {
  switch (status) {
    case "scheduled":
      return "Scheduled";
    case "ongoing":
      return "Ongoing";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
  }
}

export function examListIntroduction(persona: SchoolPersona | undefined): string {
  if (persona === "admin") {
    return "Review exams and create one when a class and teacher already exist. Teachers and students can read the exams the server allows, but only an administrator can change them.";
  }
  if (persona === "teacher") {
    return "These are exams assigned to you, or exams for classes you teach. Creating and editing exams is limited to administrators.";
  }
  if (persona === "student") {
    return "These are exams for your classes. You cannot change them.";
  }
  return "Exams are not available for this account.";
}

export function examDateInput(value: string): string {
  return /^(\d{4}-\d{2}-\d{2})/.exec(value)?.[1] ?? "";
}

export function formatExamDate(value: string): string {
  const day = examDateInput(value);
  if (!day) return "Not recorded";
  const [year, month, date] = day.split("-").map(Number);
  const utc = new Date(Date.UTC(year, (month ?? 1) - 1, date ?? 1));
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(utc);
}

export function readNotice(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("notice" in value)) return null;
  const notice = (value as { notice?: unknown }).notice;
  return typeof notice === "string" && notice.trim() ? notice : null;
}
