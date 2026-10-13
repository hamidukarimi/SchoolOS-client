import type { ApiSuccess } from "../auth/types";
import { http } from "../../services/http";
import { normalizeTeacher, normalizeTeacherList } from "./normalize";
import { TEACHER_PAGE_SIZE } from "./query";
import type { TeacherListQuery, TeacherListResult, TeacherRecord, TeacherUpdatePayload } from "./types";

export function teacherListKey(query: TeacherListQuery) {
  return ["teachers", query] as const;
}

export function teacherDetailKey(id: string) {
  return ["teachers", "detail", id] as const;
}

function requireData<T>(data: T | undefined, action: string): T {
  if (data === undefined || data === null) {
    throw new Error(`${action} response did not include data.`);
  }
  return data;
}

export async function fetchTeachers(query: TeacherListQuery): Promise<TeacherListResult> {
  const params: Record<string, string | number> = {
    page: query.page,
    limit: TEACHER_PAGE_SIZE,
  };
  if (query.search) params.search = query.search;
  if (query.status) params.status = query.status;

  const response = await http.get<ApiSuccess<unknown>>("/teachers", { params });
  return normalizeTeacherList(requireData(response.data.data, "Teacher list"));
}

export async function fetchTeacher(id: string): Promise<TeacherRecord> {
  const response = await http.get<ApiSuccess<unknown>>(`/teachers/${id}`);
  return normalizeTeacher(requireData(response.data.data, "Teacher"));
}

export async function updateTeacher(
  id: string,
  input: TeacherUpdatePayload,
): Promise<{ teacher: TeacherRecord; message: string }> {
  const response = await http.put<ApiSuccess<unknown>>(`/teachers/${id}`, input);
  return {
    teacher: normalizeTeacher(requireData(response.data.data, "Teacher update")),
    message: response.data.message ?? "Teacher updated successfully",
  };
}

export async function createTeacher(
  input: TeacherUpdatePayload & { userId: string; teacherId: string },
): Promise<{ teacher: TeacherRecord; message: string }> {
  const response = await http.post<ApiSuccess<unknown>>("/teachers", input);
  return {
    teacher: normalizeTeacher(requireData(response.data.data, "Create teacher")),
    message: response.data.message ?? "Teacher created successfully",
  };
}

export async function deleteTeacher(id: string): Promise<string> {
  const response = await http.delete<ApiSuccess<null>>(`/teachers/${id}`);
  return response.data.message ?? "Teacher deleted successfully";
}
