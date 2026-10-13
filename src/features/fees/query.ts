import type { SchoolPersona } from "../access/types";
import type { FeeListQuery } from "./types";
import { FEE_STATUSES } from "./types";

export const FEE_PAGE_SIZE = 20;

export function parseFeeListQuery(params: URLSearchParams): FeeListQuery {
  const rawPage = Number(params.get("page"));
  const rawStatus = params.get("status") ?? "";
  const status = (FEE_STATUSES as readonly string[]).includes(rawStatus) ? (rawStatus as FeeListQuery["status"]) : "";
  return {
    studentId: (params.get("studentId") ?? "").trim(),
    status,
    academicYear: (params.get("academicYear") ?? "").trim(),
    term: (params.get("term") ?? "").trim(),
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export function feeListQueryForPersona(query: FeeListQuery, persona: SchoolPersona | undefined): FeeListQuery {
  if (persona === "student") return { ...query, studentId: "" };
  return query;
}

export function feeListSearch(query: FeeListQuery): string {
  const params = new URLSearchParams();
  if (query.studentId) params.set("studentId", query.studentId);
  if (query.status) params.set("status", query.status);
  if (query.academicYear) params.set("academicYear", query.academicYear);
  if (query.term) params.set("term", query.term);
  if (query.page > 1) params.set("page", String(query.page));
  const value = params.toString();
  return value ? `?${value}` : "";
}
