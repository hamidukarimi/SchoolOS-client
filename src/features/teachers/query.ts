import { TEACHER_STATUSES, type TeacherListQuery, type TeacherStatus } from "./types";

export const TEACHER_PAGE_SIZE = 20;

export function parseTeacherListQuery(params: URLSearchParams): TeacherListQuery {
  const search = (params.get("search") ?? "").trim();
  const rawStatus = params.get("status") ?? "";
  const status = (TEACHER_STATUSES as readonly string[]).includes(rawStatus)
    ? (rawStatus as TeacherStatus)
    : "";
  const rawPage = Number(params.get("page"));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  return { search, status, page };
}

export function teacherListSearch(query: TeacherListQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.page > 1) params.set("page", String(query.page));
  const value = params.toString();
  return value ? `?${value}` : "";
}
