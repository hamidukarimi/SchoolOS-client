import {
  NOTIFICATION_TYPES,
  type NotificationItem,
  type NotificationListResult,
  type NotificationMetadata,
  type NotificationType,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readId(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readType(value: unknown): NotificationType {
  if (typeof value === "string" && (NOTIFICATION_TYPES as readonly string[]).includes(value)) {
    return value as NotificationType;
  }
  throw new Error("Notification response included an unsupported type.");
}

function readOptionalText(value: unknown, max: number): string | undefined {
  const text = readText(value);
  if (!text) return undefined;
  return text.slice(0, max);
}

function readMetadata(value: unknown): NotificationMetadata | null {
  if (!isRecord(value)) return null;
  const metadata: NotificationMetadata = {};
  const recordId = readOptionalText(value.recordId, 64);
  const status = readOptionalText(value.status, 32);
  const subject = readOptionalText(value.subject, 120);
  const dayOfWeek = readOptionalText(value.dayOfWeek, 16);
  if (recordId) metadata.recordId = recordId;
  if (status) metadata.status = status;
  if (subject) metadata.subject = subject;
  if (dayOfWeek) metadata.dayOfWeek = dayOfWeek;
  return Object.keys(metadata).length > 0 ? metadata : null;
}

function readCount(value: unknown, label: string): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
  throw new Error(`Notification response did not include ${label}.`);
}

export function normalizeNotification(value: unknown): NotificationItem {
  if (!isRecord(value)) throw new Error("Notification response was not an object.");
  const id = readId(value._id) ?? readId(value.id);
  if (!id) throw new Error("Notification response did not include an id.");
  const title = readText(value.title);
  const body = readText(value.body);
  if (!title || !body) throw new Error("Notification response did not include title and body.");
  const createdAt = readText(value.createdAt);
  const updatedAt = readText(value.updatedAt);
  if (!createdAt || !updatedAt) throw new Error("Notification response did not include timestamps.");
  const link = readText(value.link);
  return {
    id,
    type: readType(value.type),
    title,
    body,
    readAt: readText(value.readAt) || null,
    link: link || null,
    metadata: readMetadata(value.metadata),
    createdAt,
    updatedAt,
  };
}

export function normalizeNotificationList(value: unknown): NotificationListResult {
  if (!isRecord(value) || !Array.isArray(value.notifications)) {
    throw new Error("Notification list response was not valid.");
  }
  return {
    notifications: value.notifications.map(normalizeNotification),
    total: readCount(value.total, "a total"),
    page: readCount(value.page, "a page"),
    totalPages: readCount(value.totalPages, "total pages"),
  };
}

export function normalizeUnreadCount(value: unknown): number {
  if (!isRecord(value)) throw new Error("Unread count response was not valid.");
  return readCount(value.count, "a count");
}

export function normalizeUpdatedCount(value: unknown): number {
  if (!isRecord(value)) throw new Error("Mark-all response was not valid.");
  return readCount(value.updated, "an updated count");
}
