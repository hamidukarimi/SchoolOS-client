import type { SchoolPersona } from "../access/types";
import { TIMETABLE_DAYS, type TimetableDay, type TimetableListQuery } from "./types";

export const TIMETABLE_PAGE_SIZE = 20;

export function parseTimetableListQuery(params: URLSearchParams): TimetableListQuery {
  const rawDay = params.get("dayOfWeek") ?? "";
  const dayOfWeek = (TIMETABLE_DAYS as readonly string[]).includes(rawDay) ? (rawDay as TimetableDay) : "";
  const rawPage = Number(params.get("page"));
  return {
    classId: (params.get("classId") ?? "").trim(),
    teacherId: (params.get("teacherId") ?? "").trim(),
    dayOfWeek,
    academicYear: (params.get("academicYear") ?? "").trim(),
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export function timetableListQueryForPersona(
  query: TimetableListQuery,
  persona: SchoolPersona | undefined,
): TimetableListQuery {
  if (persona === "student") return { ...query, classId: "" };
  return query;
}

export function timetableListSearch(query: TimetableListQuery): string {
  const params = new URLSearchParams();
  if (query.classId) params.set("classId", query.classId);
  if (query.teacherId) params.set("teacherId", query.teacherId);
  if (query.dayOfWeek) params.set("dayOfWeek", query.dayOfWeek);
  if (query.academicYear) params.set("academicYear", query.academicYear);
  if (query.page > 1) params.set("page", String(query.page));
  const value = params.toString();
  return value ? `?${value}` : "";
}
