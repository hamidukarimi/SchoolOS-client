import { STUDENT_STATUSES, type StudentListQuery, type StudentStatus } from "./types";

export const STUDENT_PAGE_SIZE = 20;

export function parseStudentListQuery(params: URLSearchParams): StudentListQuery {
  const search = (params.get("search") ?? "").trim();
  const rawStatus = params.get("status") ?? "";
  const status = (STUDENT_STATUSES as readonly string[]).includes(rawStatus)
    ? (rawStatus as StudentStatus)
    : "";
  const rawPage = Number(params.get("page"));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  return { search, status, page };
}

export function studentListSearch(query: StudentListQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.page > 1) params.set("page", String(query.page));
  const value = params.toString();
  return value ? `?${value}` : "";
}
