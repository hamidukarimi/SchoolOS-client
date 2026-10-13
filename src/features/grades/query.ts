import type { SchoolPersona } from "../access/types";
import type { GradeListQuery } from "./types";

export const GRADE_PAGE_SIZE = 20;
export const GRADE_LOOKUP_LIMIT = 100;

export function parseGradeListQuery(params: URLSearchParams): GradeListQuery {
  const rawPage = Number(params.get("page"));
  return {
    studentId: (params.get("studentId") ?? "").trim(),
    examId: (params.get("examId") ?? "").trim(),
    classId: (params.get("classId") ?? "").trim(),
    subject: (params.get("subject") ?? "").trim(),
    academicYear: (params.get("academicYear") ?? "").trim(),
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export function gradeListQueryForPersona(
  query: GradeListQuery,
  persona: SchoolPersona | undefined,
): GradeListQuery {
  if (persona === "student") return { ...query, studentId: "" };
  return query;
}

export function gradeListSearch(query: GradeListQuery): string {
  const params = new URLSearchParams();
  if (query.studentId) params.set("studentId", query.studentId);
  if (query.examId) params.set("examId", query.examId);
  if (query.classId) params.set("classId", query.classId);
  if (query.subject) params.set("subject", query.subject);
  if (query.academicYear) params.set("academicYear", query.academicYear);
  if (query.page > 1) params.set("page", String(query.page));
  const value = params.toString();
  return value ? `?${value}` : "";
}
