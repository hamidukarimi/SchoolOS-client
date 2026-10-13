import type { ApiSuccess } from "../auth/types";
import { http } from "../../services/http";
import { normalizeTimetable, normalizeTimetableList } from "./normalize";
import { TIMETABLE_PAGE_SIZE } from "./query";
import type { TimetableListQuery, TimetableListResult, TimetableRecord, TimetableWritePayload } from "./types";

export function timetableListKey(query: TimetableListQuery) {
  return ["timetables", query] as const;
}

export function timetableDetailKey(id: string) {
  return ["timetables", "detail", id] as const;
}

export const timetableInvalidationKey = ["timetables"] as const;

function requireData<T>(data: T | undefined, action: string): T {
  if (data === undefined || data === null) {
    throw new Error(`${action} response did not include data.`);
  }
  return data;
}

export async function fetchTimetables(query: TimetableListQuery, limit = TIMETABLE_PAGE_SIZE): Promise<TimetableListResult> {
  const params: Record<string, string | number> = { page: query.page, limit };
  if (query.classId) params.classId = query.classId;
  if (query.teacherId) params.teacherId = query.teacherId;
  if (query.dayOfWeek) params.dayOfWeek = query.dayOfWeek;
  if (query.academicYear) params.academicYear = query.academicYear;
  const response = await http.get<ApiSuccess<unknown>>("/timetables", { params });
  return normalizeTimetableList(requireData(response.data.data, "Timetable list"));
}

export async function fetchTimetable(id: string): Promise<TimetableRecord> {
  const response = await http.get<ApiSuccess<unknown>>(`/timetables/${id}`);
  return normalizeTimetable(requireData(response.data.data, "Timetable"));
}

export async function createTimetable(input: TimetableWritePayload): Promise<{ message: string; entry: TimetableRecord }> {
  const response = await http.post<ApiSuccess<unknown>>("/timetables", input);
  return {
    message: response.data.message ?? "Timetable entry created successfully",
    entry: normalizeTimetable(requireData(response.data.data, "Timetable")),
  };
}

export async function updateTimetable(id: string, input: TimetableWritePayload): Promise<string> {
  const response = await http.put<ApiSuccess<unknown>>(`/timetables/${id}`, input);
  return response.data.message ?? "Timetable entry updated successfully";
}

export async function deleteTimetable(id: string): Promise<string> {
  const response = await http.delete<ApiSuccess<null>>(`/timetables/${id}`);
  return response.data.message ?? "Timetable entry deleted successfully";
}
