import { describe, expect, it } from "vitest";
import {
  notificationDetailKey,
  notificationInvalidationKey,
  notificationListKey,
  notificationUnreadKey,
} from "./api";
import {
  notificationDestination,
  notificationEmptyCopy,
  notificationView,
  unreadBadgeLabel,
  unreadSummary,
} from "./display";
import { normalizeNotification, normalizeNotificationList, normalizeUnreadCount, normalizeUpdatedCount } from "./normalize";
import { notificationListParams, pageAfterEmptyList, pageAfterRemoval, parseNotificationListQuery } from "./query";

const record = {
  _id: "64b000000000000000000001",
  recipient: "64b0000000000000000000aa",
  type: "grade",
  title: "Result recorded",
  body: "Your Mathematics result is 70/100.",
  readAt: null,
  link: "/app/grades/64b000000000000000000001",
  metadata: { recordId: "64b000000000000000000001", subject: "Mathematics", salary: 10 },
  dedupeKey: "grade:once",
  createdAt: "2026-10-13T06:00:00.000Z",
  updatedAt: "2026-10-13T06:00:00.000Z",
};

describe("notification responses", () => {
  it("reads a notification without exposing extra metadata", () => {
    expect(normalizeNotification(record)).toEqual({
      id: record._id,
      type: "grade",
      title: "Result recorded",
      body: "Your Mathematics result is 70/100.",
      readAt: null,
      link: "/app/grades/64b000000000000000000001",
      metadata: { recordId: record._id, subject: "Mathematics" },
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  });

  it("rejects an unsupported type and reads list, unread, and updated counts", () => {
    expect(() => normalizeNotification({ ...record, type: "message" })).toThrow(/type/);
    expect(normalizeNotificationList({ notifications: [record], total: 1, page: 1, totalPages: 1 }).notifications).toHaveLength(1);
    expect(normalizeUnreadCount({ count: 2 })).toBe(2);
    expect(normalizeUpdatedCount({ updated: 0 })).toBe(0);
    expect(() => normalizeUnreadCount({ unreadCount: 2 })).toThrow(/count/);
  });

  it("treats a timestamp as read and a null timestamp as unread", () => {
    const read = normalizeNotification({ ...record, readAt: "2026-10-13T07:00:00.000Z" });
    expect(notificationView(read).unread).toBe(false);
    expect(notificationView(normalizeNotification(record)).unread).toBe(true);
  });
});

describe("notification list query", () => {
  it("accepts read filters and pages, and never sends a recipient", () => {
    expect(parseNotificationListQuery(new URLSearchParams("read=unread&page=2"))).toEqual({
      read: "unread",
      page: 2,
    });
    expect(parseNotificationListQuery(new URLSearchParams("read=all&page=0"))).toEqual({
      read: "",
      page: 1,
    });
    const params = notificationListParams({ read: "read", page: 3 });
    expect(params).toEqual({ page: 3, limit: 20, read: "read" });
    expect(params).not.toHaveProperty("recipient");
    expect(notificationListKey({ read: "", page: 1 })[0]).toBe(notificationInvalidationKey[0]);
  });

  it("moves back a page after the last item on that page is removed", () => {
    expect(pageAfterRemoval(3, 0)).toBe(2);
    expect(pageAfterRemoval(3, 1)).toBe(3);
    expect(pageAfterRemoval(1, 0)).toBe(1);
    expect(pageAfterEmptyList(4, 0, 2)).toBe(2);
    expect(pageAfterEmptyList(1, 0, 0)).toBeNull();
  });

  it("describes empty filters", () => {
    expect(notificationEmptyCopy("").title).toBe("No notifications");
    expect(notificationEmptyCopy("unread").body).toMatch(/unread/);
    expect(notificationEmptyCopy("read").body).toMatch(/read/);
  });
});

describe("notification navigation", () => {
  it("opens known internal paths and ignores external or missing routes", () => {
    expect(notificationDestination("/app/attendance/64b000000000000000000001")).toBe(
      "/app/attendance/64b000000000000000000001",
    );
    expect(notificationDestination("https://example.com/app/grades/1")).toBeNull();
    expect(notificationDestination("//example.com")).toBeNull();
    expect(notificationDestination("/app/library/books")).toBeNull();
    expect(notificationView(normalizeNotification({ ...record, link: "/app/library/books" })).unavailableLink).toBe(true);
    expect(notificationView(normalizeNotification({ ...record, link: null })).destination).toBeNull();
  });

  it("hides a zero unread badge and caps a large count", () => {
    expect(unreadBadgeLabel(undefined)).toBeNull();
    expect(unreadBadgeLabel(0)).toBeNull();
    expect(unreadBadgeLabel(4)).toBe("4");
    expect(unreadBadgeLabel(120)).toBe("99+");
    expect(unreadSummary(0)).toBe("No unread notifications");
    expect(unreadSummary(3)).toBe("3 unread notifications");
  });

  it("refreshes the list, unread count, and detail from the same notification key", () => {
    expect(notificationUnreadKey()[0]).toBe("notifications");
    expect(notificationDetailKey(record._id)[0]).toBe(notificationInvalidationKey[0]);
    expect(notificationListKey({ read: "unread", page: 1 })[0]).toBe("notifications");
  });
});
