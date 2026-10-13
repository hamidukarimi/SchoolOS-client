import type { ApiSuccess } from "../auth/types";
import { http } from "../../services/http";
import { normalizeGrade, normalizeGradeList, normalizeGradeSummary } from "./normalize";
import { GRADE_LOOKUP_LIMIT, GRADE_PAGE_SIZE } from "./query";
import type {
  GradeCreatePayload,
  GradeListQuery,
  GradeListResult,
  GradeRecord,
  GradeSummary,
  GradeUpdatePayload,
} from "./types";

export function gradeListKey(query: GradeListQuery) {
  return ["grades", query] as const;
}

export function gradeDetailKey(id: string) {
  return ["grades", "detail", id] as const;
}

export function gradeSummaryKey(studentId: string, academicYear?: string) {
  return ["grades", "summary", studentId, academicYear ?? ""] as const;
}

export function examGradeKey(examId: string) {
  return ["grades", "exam", examId] as const;
}

export const gradeInvalidationKey = ["grades"] as const;

function requireData<T>(data: T | undefined, action: string): T {
  if (data === undefined || data === null) {
    throw new Error(`${action} response did not include data.`);
  }
  return data;
}

export async function fetchGrades(query: GradeListQuery, limit = GRADE_PAGE_SIZE): Promise<GradeListResult> {
  const params: Record<string, string | number> = { page: query.page, limit };
  if (query.studentId) params.studentId = query.studentId;
  if (query.examId) params.examId = query.examId;
  if (query.classId) params.classId = query.classId;
  if (query.subject) params.subject = query.subject;
  if (query.academicYear) params.academicYear = query.academicYear;
  const response = await http.get<ApiSuccess<unknown>>("/grades", { params });
  return normalizeGradeList(requireData(response.data.data, "Grade list"));
}

export async function fetchExamGrades(examId: string): Promise<GradeListResult> {
  return fetchGrades(
    { studentId: "", examId, classId: "", subject: "", academicYear: "", page: 1 },
    GRADE_LOOKUP_LIMIT,
  );
}

export async function fetchGrade(id: string): Promise<GradeRecord> {
  const response = await http.get<ApiSuccess<unknown>>(`/grades/${id}`);
  return normalizeGrade(requireData(response.data.data, "Grade"));
}

export async function fetchGradeSummary(studentId: string, academicYear?: string): Promise<GradeSummary> {
  const response = await http.get<ApiSuccess<unknown>>(`/grades/summary/${studentId}`, {
    params: academicYear ? { academicYear } : undefined,
  });
  return normalizeGradeSummary(requireData(response.data.data, "Grade summary"));
}

export async function createGrade(input: GradeCreatePayload): Promise<string> {
  const response = await http.post<ApiSuccess<unknown>>("/grades", input);
  return response.data.message ?? "Grade created successfully";
}

export async function updateGrade(id: string, input: GradeUpdatePayload): Promise<string> {
  const response = await http.put<ApiSuccess<unknown>>(`/grades/${id}`, input);
  return response.data.message ?? "Grade updated successfully";
}

export async function deleteGrade(id: string): Promise<string> {
  const response = await http.delete<ApiSuccess<null>>(`/grades/${id}`);
  return response.data.message ?? "Grade deleted successfully";
}
