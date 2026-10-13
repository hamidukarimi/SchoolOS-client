import {
  ANNOUNCEMENT_AUDIENCES,
  type Announcement,
  type AnnouncementAudience,
  type AnnouncementClassRef,
  type AnnouncementListResult,
  type AnnouncementPerson,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readId(value: unknown): string | null {
  const id = readText(value);
  return id || null;
}

function readAudience(value: unknown): AnnouncementAudience {
  if (typeof value === "string" && (ANNOUNCEMENT_AUDIENCES as readonly string[]).includes(value)) {
    return value as AnnouncementAudience;
  }
  throw new Error("Announcement response included an unsupported audience.");
}

function readCount(value: unknown, label: string): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
  throw new Error(`Announcement response did not include ${label}.`);
}

function readPerson(value: unknown): AnnouncementPerson | null {
  if (!isRecord(value)) return null;
  const id = readId(value._id) ?? readId(value.id);
  const firstname = readText(value.firstname);
  if (!id || !firstname) return null;
  return { id, firstname, lastname: readText(value.lastname) };
}

function readClass(value: unknown): AnnouncementClassRef | null {
  if (!isRecord(value)) return null;
  const id = readId(value._id) ?? readId(value.id);
  const name = readText(value.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    section: readText(value.section),
    grade: readText(value.grade),
  };
}

export function normalizeAnnouncement(value: unknown): Announcement {
  if (!isRecord(value)) throw new Error("Announcement response was not an object.");
  const id = readId(value._id) ?? readId(value.id);
  const title = readText(value.title);
  const content = readText(value.content);
  const publishDate = readText(value.publishDate);
  if (!id || !title || !content || !publishDate) {
    throw new Error("Announcement response did not include its required fields.");
  }
  const classRef = readClass(value.classId);
  const classId = classRef?.id ?? readId(value.classId);
  const expiryDate = readText(value.expiryDate);
  const createdAt = readText(value.createdAt);
  const updatedAt = readText(value.updatedAt);
  return {
    id,
    title,
    content,
    audience: readAudience(value.audience),
    classId,
    classRef,
    publishedBy: readPerson(value.publishedBy),
    publishDate,
    expiryDate: expiryDate || null,
    isPublished: value.isPublished !== false,
    createdAt: createdAt || publishDate,
    updatedAt: updatedAt || publishDate,
  };
}

export function normalizeAnnouncementList(value: unknown): AnnouncementListResult {
  if (!isRecord(value) || !Array.isArray(value.announcements)) {
    throw new Error("Announcement list response was not valid.");
  }
  return {
    announcements: value.announcements.map(normalizeAnnouncement),
    total: readCount(value.total, "a total"),
    page: readCount(value.page, "a page"),
    totalPages: readCount(value.totalPages, "total pages"),
  };
}
