import type { ApiSuccess } from "../auth/types";
import { http } from "../../services/http";
import { normalizeStudent, normalizeStudentList } from "./normalize";
import { STUDENT_PAGE_SIZE } from "./query";
import type { StudentListQuery, StudentListResult, StudentRecord, StudentUpdatePayload } from "./types";

export function studentListKey(query: StudentListQuery) {
  return ["students", query] as const;
}

export function studentDetailKey(id: string) {
  return ["students", "detail", id] as const;
}

function requireData<T>(data: T | undefined, action: string): T {
  if (data === undefined || data === null) {
    throw new Error(`${action} response did not include data.`);
  }
  return data;
}

export async function fetchStudents(query: StudentListQuery): Promise<StudentListResult> {
  const params: Record<string, string | number> = {
    page: query.page,
    limit: STUDENT_PAGE_SIZE,
  };
  if (query.search) params.search = query.search;
  if (query.status) params.status = query.status;

  const response = await http.get<ApiSuccess<unknown>>("/students", { params });
  return normalizeStudentList(requireData(response.data.data, "Student list"));
}

export async function fetchStudent(id: string): Promise<StudentRecord> {
  const response = await http.get<ApiSuccess<unknown>>(`/students/${id}`);
  return normalizeStudent(requireData(response.data.data, "Student"));
}

export async function updateStudent(
  id: string,
  input: StudentUpdatePayload,
): Promise<{ student: StudentRecord; message: string }> {
  const response = await http.put<ApiSuccess<unknown>>(`/students/${id}`, input);
  return {
    student: normalizeStudent(requireData(response.data.data, "Student update")),
    message: response.data.message ?? "Student updated successfully",
  };
}

export async function deleteStudent(id: string): Promise<string> {
  const response = await http.delete<ApiSuccess<null>>(`/students/${id}`);
  return response.data.message ?? "Student deleted successfully";
}
