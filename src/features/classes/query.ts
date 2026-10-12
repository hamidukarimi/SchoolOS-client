import { CLASS_STATUSES, type ClassListQuery, type ClassStatus } from "./types";

export const CLASS_PAGE_SIZE = 20;

export function parseClassListQuery(params: URLSearchParams): ClassListQuery {
  const search = (params.get("search") ?? "").trim();
  const grade = (params.get("grade") ?? "").trim();
  const academicYear = (params.get("academicYear") ?? "").trim();
  const rawStatus = params.get("status") ?? "";
  const status = (CLASS_STATUSES as readonly string[]).includes(rawStatus)
    ? (rawStatus as ClassStatus)
    : "";
  const rawPage = Number(params.get("page"));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  return { search, status, grade, academicYear, page };
}

export function classListSearch(query: ClassListQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.grade) params.set("grade", query.grade);
  if (query.academicYear) params.set("academicYear", query.academicYear);
  if (query.page > 1) params.set("page", String(query.page));
  const value = params.toString();
  return value ? `?${value}` : "";
}
