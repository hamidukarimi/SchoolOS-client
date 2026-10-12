import type { ApiSuccess } from "../auth/types";
import { http } from "../../services/http";
import { normalizeClassList, normalizeClassRecord } from "./normalize";
import { CLASS_PAGE_SIZE } from "./query";
import type { ClassListQuery, ClassListResult, ClassRecord, ClassWritePayload } from "./types";

export function classListKey(query: ClassListQuery) {
  return ["classes", query] as const;
}

export function classDetailKey(id: string) {
  return ["classes", "detail", id] as const;
}

function requireData<T>(data: T | undefined, action: string): T {
  if (data === undefined || data === null) {
    throw new Error(`${action} response did not include data.`);
  }
  return data;
}

export async function fetchClasses(query: ClassListQuery): Promise<ClassListResult> {
  const params: Record<string, string | number> = {
    page: query.page,
    limit: CLASS_PAGE_SIZE,
  };
  if (query.search) params.search = query.search;
  if (query.status) params.status = query.status;
  if (query.grade) params.grade = query.grade;
  if (query.academicYear) params.academicYear = query.academicYear;

  const response = await http.get<ApiSuccess<unknown>>("/classes", { params });
  return normalizeClassList(requireData(response.data.data, "Class list"));
}

export async function fetchClass(id: string): Promise<ClassRecord> {
  const response = await http.get<ApiSuccess<unknown>>(`/classes/${id}`);
  return normalizeClassRecord(requireData(response.data.data, "Class"));
}

export async function createClass(
  input: ClassWritePayload,
): Promise<{ classRecord: ClassRecord; message: string }> {
  const response = await http.post<ApiSuccess<unknown>>("/classes", input);
  return {
    classRecord: normalizeClassRecord(requireData(response.data.data, "Class create")),
    message: response.data.message ?? "Class created successfully",
  };
}

export async function updateClass(
  id: string,
  input: ClassWritePayload,
): Promise<{ classRecord: ClassRecord; message: string }> {
  const response = await http.put<ApiSuccess<unknown>>(`/classes/${id}`, input);
  return {
    classRecord: normalizeClassRecord(requireData(response.data.data, "Class update")),
    message: response.data.message ?? "Class updated successfully",
  };
}

export async function deleteClass(id: string): Promise<string> {
  const response = await http.delete<ApiSuccess<null>>(`/classes/${id}`);
  return response.data.message ?? "Class deleted successfully";
}
