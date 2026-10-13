import type { SchoolPersona } from "../access/types";
import { EXAM_STATUSES, type ExamListQuery, type ExamStatus } from "./types";

export const EXAM_PAGE_SIZE = 20;
export const EXAM_LOOKUP_LIMIT = 100;

export function parseExamListQuery(params: URLSearchParams): ExamListQuery {
  const rawStatus = params.get("status") ?? "";
  const status = (EXAM_STATUSES as readonly string[]).includes(rawStatus) ? (rawStatus as ExamStatus) : "";
  const rawPage = Number(params.get("page"));
  return {
    classId: (params.get("classId") ?? "").trim(),
    teacherId: (params.get("teacherId") ?? "").trim(),
    subject: (params.get("subject") ?? "").trim(),
    status,
    academicYear: (params.get("academicYear") ?? "").trim(),
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export function examListQueryForPersona(query: ExamListQuery, persona: SchoolPersona | undefined): ExamListQuery {
  if (persona === "student") return { ...query, classId: "" };
  return query;
}

export function examChoicesQuery(subject: string): ExamListQuery {
  return {
    classId: "",
    teacherId: "",
    subject: subject.trim(),
    status: "",
    academicYear: "",
    page: 1,
  };
}

export function examListSearch(query: ExamListQuery): string {
  const params = new URLSearchParams();
  if (query.classId) params.set("classId", query.classId);
  if (query.teacherId) params.set("teacherId", query.teacherId);
  if (query.subject) params.set("subject", query.subject);
  if (query.status) params.set("status", query.status);
  if (query.academicYear) params.set("academicYear", query.academicYear);
  if (query.page > 1) params.set("page", String(query.page));
  const value = params.toString();
  return value ? `?${value}` : "";
}
