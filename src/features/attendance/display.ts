import type { SchoolPersona } from "../access/types";
import type { AttendanceStatus } from "./types";

export function canManageAttendance(persona: SchoolPersona | undefined): boolean {
  return persona === "admin";
}

export function attendanceStatusLabel(status: AttendanceStatus): string {
  switch (status) {
    case "present":
      return "Present";
    case "absent":
      return "Absent";
    case "late":
      return "Late";
    case "excused":
      return "Excused";
  }
}

export function attendanceDateInput(value: string): string {
  return /^(\d{4}-\d{2}-\d{2})/.exec(value)?.[1] ?? "";
}

export function formatAttendanceDate(value: string): string {
  const day = attendanceDateInput(value);
  if (!day) return "Not recorded";
  const [year, month, date] = day.split("-").map(Number);
  const utc = new Date(Date.UTC(year, (month ?? 1) - 1, date ?? 1));
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(utc);
}

export function attendanceListIntroduction(persona: SchoolPersona | undefined): string {
  if (persona === "admin") {
    return "Review attendance and record one student at a time. Teachers and students can read the records the server allows, but only an administrator can change them.";
  }
  if (persona === "teacher") {
    return "These records are for students on your class lists, or records that name you as the teacher. Recording attendance is limited to administrators.";
  }
  if (persona === "student") {
    return "These are your attendance records. You cannot change them.";
  }
  return "Attendance is not available for this account.";
}

export function canSubmitAttendance(input: {
  pending: boolean;
  studentId: string;
  classId: string;
  teacherId: string;
  date: string;
  markedStudentIds: readonly string[];
}): boolean {
  if (input.pending) return false;
  if (!input.studentId || !input.classId || !input.teacherId || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return false;
  }
  return !input.markedStudentIds.includes(input.studentId);
}

export function readNotice(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("notice" in value)) return null;
  const notice = (value as { notice?: unknown }).notice;
  return typeof notice === "string" && notice.trim() ? notice : null;
}
