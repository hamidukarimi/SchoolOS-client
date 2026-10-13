import type { SchoolPersona } from "../access/types";
import { TIMETABLE_DAYS, type TimetableDay, type TimetableRecord, type TimetableStatus } from "./types";

export function canManageTimetable(persona: SchoolPersona | undefined): boolean {
  return persona === "admin";
}

export function timetableDayLabel(day: TimetableDay): string {
  switch (day) {
    case "monday":
      return "Monday";
    case "tuesday":
      return "Tuesday";
    case "wednesday":
      return "Wednesday";
    case "thursday":
      return "Thursday";
    case "friday":
      return "Friday";
  }
}

export function timetableStatusLabel(status: TimetableStatus): string {
  return status === "active" ? "Active" : "Inactive";
}

export function timetableListIntroduction(persona: SchoolPersona | undefined): string {
  if (persona === "admin") {
    return "Review the weekly schedule and add one lesson at a time. Teachers and students can read the entries the server allows, but only an administrator can change them.";
  }
  if (persona === "teacher") {
    return "These are lessons assigned to you, or lessons for classes you teach. Changing the schedule is limited to administrators.";
  }
  if (persona === "student") {
    return "These are lessons for your classes. You cannot change them.";
  }
  return "The timetable is not available for this account.";
}

export function groupTimetableByDay(entries: readonly TimetableRecord[]): { day: TimetableDay; entries: TimetableRecord[] }[] {
  return TIMETABLE_DAYS.map((day) => ({
    day,
    entries: entries.filter((entry) => entry.dayOfWeek === day),
  })).filter((group) => group.entries.length > 0);
}

export function readNotice(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("notice" in value)) return null;
  const notice = (value as { notice?: unknown }).notice;
  return typeof notice === "string" && notice.trim() ? notice : null;
}
