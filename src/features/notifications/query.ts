import type { NotificationListQuery, NotificationReadFilter } from "./types";

export const NOTIFICATION_PAGE_SIZE = 20;

const readFilters: readonly NotificationReadFilter[] = ["read", "unread"];

export function parseNotificationListQuery(params: URLSearchParams): NotificationListQuery {
  const rawRead = params.get("read") ?? "";
  const read = readFilters.includes(rawRead as NotificationReadFilter)
    ? (rawRead as NotificationReadFilter)
    : "";
  const rawPage = Number(params.get("page"));
  return {
    read,
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export function notificationListSearch(query: NotificationListQuery): string {
  const params = new URLSearchParams();
  if (query.read) params.set("read", query.read);
  if (query.page > 1) params.set("page", String(query.page));
  const value = params.toString();
  return value ? `?${value}` : "";
}

export function notificationListParams(query: NotificationListQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: query.page,
    limit: NOTIFICATION_PAGE_SIZE,
  };
  if (query.read) params.read = query.read;
  return params;
}

export function pageAfterRemoval(page: number, remainingOnPage: number): number {
  if (remainingOnPage > 0 || page <= 1) return page;
  return page - 1;
}

export function pageAfterEmptyList(page: number, itemCount: number, totalPages: number): number | null {
  if (page <= 1 || itemCount > 0) return null;
  const next = totalPages > 0 ? Math.min(page, totalPages) : 1;
  return next === page ? null : next;
}
