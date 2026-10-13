import type { ApiSuccess } from "../auth/types";
import { http } from "../../services/http";
import {
  normalizeNotification,
  normalizeNotificationList,
  normalizeUnreadCount,
  normalizeUpdatedCount,
} from "./normalize";
import { notificationListParams } from "./query";
import type { NotificationItem, NotificationListQuery, NotificationListResult } from "./types";

export const notificationInvalidationKey = ["notifications"] as const;

export function notificationListKey(query: NotificationListQuery) {
  return ["notifications", "list", query] as const;
}

export function notificationUnreadKey() {
  return ["notifications", "unread-count"] as const;
}

export function notificationDetailKey(id: string) {
  return ["notifications", "detail", id] as const;
}

function requireData<T>(data: T | undefined, action: string): T {
  if (data === undefined || data === null) {
    throw new Error(`${action} response did not include data.`);
  }
  return data;
}

export async function fetchNotifications(query: NotificationListQuery): Promise<NotificationListResult> {
  const response = await http.get<ApiSuccess<unknown>>("/notifications", {
    params: notificationListParams(query),
  });
  return normalizeNotificationList(requireData(response.data.data, "Notification list"));
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const response = await http.get<ApiSuccess<unknown>>("/notifications/unread-count");
  return normalizeUnreadCount(requireData(response.data.data, "Unread count"));
}

export async function fetchNotification(id: string): Promise<NotificationItem> {
  const response = await http.get<ApiSuccess<unknown>>(`/notifications/${id}`);
  return normalizeNotification(requireData(response.data.data, "Notification"));
}

export async function markNotificationRead(id: string): Promise<NotificationItem> {
  const response = await http.patch<ApiSuccess<unknown>>(`/notifications/${id}/read`);
  return normalizeNotification(requireData(response.data.data, "Mark notification read"));
}

export async function markAllNotificationsRead(): Promise<number> {
  const response = await http.patch<ApiSuccess<unknown>>("/notifications/read-all");
  return normalizeUpdatedCount(requireData(response.data.data, "Mark all notifications read"));
}

export async function deleteNotification(id: string): Promise<void> {
  await http.delete<ApiSuccess<null>>(`/notifications/${id}`);
}
