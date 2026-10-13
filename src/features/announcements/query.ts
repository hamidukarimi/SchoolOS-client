import type { SchoolPersona } from "../access/types";
import { ANNOUNCEMENT_AUDIENCES, type AnnouncementAudience, type AnnouncementListQuery, type PublishedFilter } from "./types";

export const ANNOUNCEMENT_PAGE_SIZE = 20;

const objectId = /^[a-f\d]{24}$/i;
const publishedFilters: readonly PublishedFilter[] = ["", "true", "false"];

export function audiencesForPersona(persona: SchoolPersona | undefined): AnnouncementAudience[] {
  switch (persona) {
    case "admin":
      return ["all", "teachers", "students", "parents"];
    case "teacher":
      return ["all", "teachers"];
    case "student":
      return ["all", "students"];
    default:
      return ["all"];
  }
}

export function parseAnnouncementListQuery(params: URLSearchParams): AnnouncementListQuery {
  const rawAudience = params.get("audience") ?? "";
  const audience = (ANNOUNCEMENT_AUDIENCES as readonly string[]).includes(rawAudience)
    ? (rawAudience as AnnouncementAudience)
    : "";
  const rawClassId = (params.get("classId") ?? "").trim();
  const rawPublished = params.get("published") ?? "";
  const published = publishedFilters.includes(rawPublished as PublishedFilter)
    ? (rawPublished as PublishedFilter)
    : "";
  const rawPage = Number(params.get("page"));
  return {
    audience,
    classId: objectId.test(rawClassId) ? rawClassId : "",
    published,
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export function announcementListQueryForPersona(
  query: AnnouncementListQuery,
  persona: SchoolPersona | undefined,
): AnnouncementListQuery {
  const allowed = audiencesForPersona(persona);
  return {
    audience: query.audience && allowed.includes(query.audience) ? query.audience : "",
    classId: persona === "admin" || persona === "teacher" ? query.classId : "",
    published: persona === "admin" ? query.published : "",
    page: query.page,
  };
}

export function announcementListParams(query: AnnouncementListQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: query.page,
    limit: ANNOUNCEMENT_PAGE_SIZE,
  };
  if (query.audience) params.audience = query.audience;
  if (query.classId) params.classId = query.classId;
  if (query.published) params.isPublished = query.published;
  return params;
}

export function announcementListSearch(query: AnnouncementListQuery): string {
  const params = new URLSearchParams();
  if (query.audience) params.set("audience", query.audience);
  if (query.classId) params.set("classId", query.classId);
  if (query.published) params.set("published", query.published);
  if (query.page > 1) params.set("page", String(query.page));
  const value = params.toString();
  return value ? `?${value}` : "";
}
