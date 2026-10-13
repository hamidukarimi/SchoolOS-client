import type { SchoolPersona } from "../access/types";
import type { AnnouncementAudience } from "./types";

export function canManageAnnouncements(persona: SchoolPersona | undefined): boolean {
  return persona === "admin";
}

export function audienceLabel(audience: AnnouncementAudience): string {
  switch (audience) {
    case "all":
      return "Everyone";
    case "teachers":
      return "Teachers";
    case "students":
      return "Students";
    case "parents":
      return "Parents";
  }
}

export function announcementListIntroduction(persona: SchoolPersona | undefined): string {
  if (persona === "admin") {
    return "Post school announcements and review drafts. Teachers, students, and accounts without a school profile only see the audiences the server allows. Parent login is not available, so parent announcements stay with administrators.";
  }
  if (persona === "teacher") {
    return "Announcements for everyone and for teachers. Student-only and parent announcements are not included. These are school posts, not personal notifications.";
  }
  if (persona === "student") {
    return "Announcements for everyone and for students. Teacher-only and parent announcements are not included. These are school posts, not personal notifications.";
  }
  return "School-wide announcements for every signed-in account. Teacher, student, parent, and class announcements are not included.";
}

export function formatAnnouncementDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

export function readNotice(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("notice" in value)) return null;
  const notice = (value as { notice?: unknown }).notice;
  return typeof notice === "string" && notice.trim() ? notice : null;
}

export function dateInputValue(value: string | null): string {
  return /^(\d{4}-\d{2}-\d{2})/.exec(value ?? "")?.[1] ?? "";
}
