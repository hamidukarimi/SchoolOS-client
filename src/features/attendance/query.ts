import { ATTENDANCE_STATUSES, type AttendanceListQuery, type AttendanceStatus } from "./types";

export const ATTENDANCE_PAGE_SIZE = 20;
export const ATTENDANCE_CLASS_DATE_LIMIT = 100;

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function parseAttendanceListQuery(params: URLSearchParams): AttendanceListQuery {
  const rawStatus = params.get("status") ?? "";
  const status = (ATTENDANCE_STATUSES as readonly string[]).includes(rawStatus)
    ? (rawStatus as AttendanceStatus)
    : "";
  const rawDate = (params.get("date") ?? "").trim();
  const date = datePattern.test(rawDate) ? rawDate : "";
  const rawPage = Number(params.get("page"));
  return {
    studentId: (params.get("studentId") ?? "").trim(),
    classId: (params.get("classId") ?? "").trim(),
    status,
    date,
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export function attendanceListSearch(query: AttendanceListQuery): string {
  const params = new URLSearchParams();
  if (query.studentId) params.set("studentId", query.studentId);
  if (query.classId) params.set("classId", query.classId);
  if (query.status) params.set("status", query.status);
  if (query.date) params.set("date", query.date);
  if (query.page > 1) params.set("page", String(query.page));
  const value = params.toString();
  return value ? `?${value}` : "";
}
