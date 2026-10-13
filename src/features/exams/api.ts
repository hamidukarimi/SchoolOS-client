import type { ApiSuccess } from "../auth/types";
import { http } from "../../services/http";
import { normalizeExam, normalizeExamList } from "./normalize";
import { EXAM_PAGE_SIZE } from "./query";
import type { ExamListQuery, ExamListResult, ExamRecord, ExamWritePayload } from "./types";

export function examListKey(query: ExamListQuery) {
  return ["exams", query] as const;
}

export function examDetailKey(id: string) {
  return ["exams", "detail", id] as const;
}

export const examInvalidationKey = ["exams"] as const;

function requireData<T>(data: T | undefined, action: string): T {
  if (data === undefined || data === null) {
    throw new Error(`${action} response did not include data.`);
  }
  return data;
}

export async function fetchExams(query: ExamListQuery, limit = EXAM_PAGE_SIZE): Promise<ExamListResult> {
  const params: Record<string, string | number> = { page: query.page, limit };
  if (query.classId) params.classId = query.classId;
  if (query.teacherId) params.teacherId = query.teacherId;
  if (query.subject) params.subject = query.subject;
  if (query.status) params.status = query.status;
  if (query.academicYear) params.academicYear = query.academicYear;
  const response = await http.get<ApiSuccess<unknown>>("/exams", { params });
  return normalizeExamList(requireData(response.data.data, "Exam list"));
}

export async function fetchExam(id: string): Promise<ExamRecord> {
  const response = await http.get<ApiSuccess<unknown>>(`/exams/${id}`);
  return normalizeExam(requireData(response.data.data, "Exam"));
}

export async function createExam(input: ExamWritePayload): Promise<{ message: string; exam: ExamRecord }> {
  const response = await http.post<ApiSuccess<unknown>>("/exams", input);
  return {
    message: response.data.message ?? "Exam created successfully",
    exam: normalizeExam(requireData(response.data.data, "Exam")),
  };
}

export async function updateExam(id: string, input: ExamWritePayload): Promise<string> {
  const response = await http.put<ApiSuccess<unknown>>(`/exams/${id}`, input);
  return response.data.message ?? "Exam updated successfully";
}

export async function deleteExam(id: string): Promise<string> {
  const response = await http.delete<ApiSuccess<null>>(`/exams/${id}`);
  return response.data.message ?? "Exam deleted successfully";
}
