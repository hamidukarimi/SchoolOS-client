import type { ApiSuccess } from "../auth/types";
import { http } from "../../services/http";
import { normalizeAttendance, normalizeAttendanceList, normalizeAttendanceSummary } from "./normalize";
import { ATTENDANCE_CLASS_DATE_LIMIT, ATTENDANCE_PAGE_SIZE } from "./query";
import type {
  AttendanceCreatePayload,
  AttendanceListQuery,
  AttendanceListResult,
  AttendanceRecord,
  AttendanceSummary,
  AttendanceUpdatePayload,
} from "./types";

export function attendanceListKey(query: AttendanceListQuery) {
  return ["attendance", query] as const;
}

export function attendanceDetailKey(id: string) {
  return ["attendance", "detail", id] as const;
}

export function attendanceSummaryKey(studentId: string, classId?: string) {
  return ["attendance", "summary", studentId, classId ?? ""] as const;
}

export function classDateAttendanceKey(classId: string, date: string) {
  return ["attendance", "class-date", classId, date] as const;
}

export const attendanceInvalidationKey = ["attendance"] as const;

function requireData<T>(data: T | undefined, action: string): T {
  if (data === undefined || data === null) {
    throw new Error(`${action} response did not include data.`);
  }
  return data;
}

export async function fetchAttendance(
  query: AttendanceListQuery,
  limit = ATTENDANCE_PAGE_SIZE,
): Promise<AttendanceListResult> {
  const params: Record<string, string | number> = { page: query.page, limit };
  if (query.studentId) params.studentId = query.studentId;
  if (query.classId) params.classId = query.classId;
  if (query.status) params.status = query.status;
  if (query.date) params.date = query.date;
  const response = await http.get<ApiSuccess<unknown>>("/attendance", { params });
  return normalizeAttendanceList(requireData(response.data.data, "Attendance list"));
}

export async function fetchClassDateAttendance(classId: string, date: string): Promise<AttendanceListResult> {
  return fetchAttendance(
    { studentId: "", classId, status: "", date, page: 1 },
    ATTENDANCE_CLASS_DATE_LIMIT,
  );
}

export async function fetchAttendanceRecord(id: string): Promise<AttendanceRecord> {
  const response = await http.get<ApiSuccess<unknown>>(`/attendance/${id}`);
  return normalizeAttendance(requireData(response.data.data, "Attendance"));
}

export async function fetchAttendanceSummary(studentId: string, classId?: string): Promise<AttendanceSummary> {
  const response = await http.get<ApiSuccess<unknown>>(`/attendance/summary/${studentId}`, {
    params: classId ? { classId } : undefined,
  });
  return normalizeAttendanceSummary(requireData(response.data.data, "Attendance summary"));
}

export async function createAttendance(input: AttendanceCreatePayload): Promise<string> {
  const response = await http.post<ApiSuccess<unknown>>("/attendance", input);
  return response.data.message ?? "Attendance recorded successfully";
}

export async function updateAttendance(id: string, input: AttendanceUpdatePayload): Promise<string> {
  const response = await http.put<ApiSuccess<unknown>>(`/attendance/${id}`, input);
  return response.data.message ?? "Attendance updated successfully";
}

export async function deleteAttendance(id: string): Promise<string> {
  const response = await http.delete<ApiSuccess<null>>(`/attendance/${id}`);
  return response.data.message ?? "Attendance record deleted successfully";
}
