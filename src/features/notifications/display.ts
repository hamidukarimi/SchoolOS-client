import type { LucideIcon } from "lucide-react";
import { Award, CalendarCheck, CalendarDays, ClipboardList } from "lucide-react";
import type { NotificationItem, NotificationReadFilter, NotificationType } from "./types";

const sections = new Set([
  "admin",
  "teacher",
  "student",
  "pending",
  "profile",
  "students",
  "teachers",
  "classes",
  "enrollments",
  "attendance",
  "grades",
  "exams",
  "timetables",
  "notifications",
]);

export function notificationDestination(link: string | null): string | null {
  if (!link || !link.startsWith("/app/")) return null;
  if (!/^\/app\/[A-Za-z0-9][A-Za-z0-9/_-]*$/.test(link)) return null;
  const section = link.slice("/app/".length).split("/")[0];
  if (!section || !sections.has(section)) return null;
  return link;
}

export function notificationTypeLabel(type: NotificationType): string {
  switch (type) {
    case "attendance":
      return "Attendance";
    case "grade":
      return "Result";
    case "exam":
      return "Exam";
    case "timetable":
      return "Lesson";
  }
}

export function notificationTypeIcon(type: NotificationType): LucideIcon {
  switch (type) {
    case "attendance":
      return CalendarCheck;
    case "grade":
      return Award;
    case "exam":
      return ClipboardList;
    case "timetable":
      return CalendarDays;
  }
}

export function formatNotificationTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function unreadBadgeLabel(count: number | undefined): string | null {
  if (count === undefined || count <= 0) return null;
  if (count > 99) return "99+";
  return String(count);
}

export function notificationView(item: NotificationItem): {
  unread: boolean;
  destination: string | null;
  unavailableLink: boolean;
  typeLabel: string;
} {
  const destination = notificationDestination(item.link);
  return {
    unread: item.readAt === null,
    destination,
    unavailableLink: Boolean(item.link) && destination === null,
    typeLabel: notificationTypeLabel(item.type),
  };
}

export function notificationEmptyCopy(read: NotificationReadFilter | ""): { title: string; body: string } {
  if (read === "unread") {
    return { title: "No notifications match this filter", body: "You have no unread notifications." };
  }
  if (read === "read") {
    return { title: "No notifications match this filter", body: "You have no read notifications." };
  }
  return {
    title: "No notifications",
    body: "New attendance, result, exam, and lesson notices will appear here.",
  };
}

export function unreadSummary(count: number | undefined): string {
  if (count === undefined) return "Checking unread notifications";
  if (count === 0) return "No unread notifications";
  if (count === 1) return "1 unread notification";
  return `${count} unread notifications`;
}
