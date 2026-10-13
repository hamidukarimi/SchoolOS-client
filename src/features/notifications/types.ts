export const NOTIFICATION_TYPES = ["attendance", "grade", "exam", "timetable"] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationReadFilter = "read" | "unread";

export interface NotificationMetadata {
  recordId?: string;
  status?: string;
  subject?: string;
  dayOfWeek?: string;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  readAt: string | null;
  link: string | null;
  metadata: NotificationMetadata | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListQuery {
  page: number;
  read: NotificationReadFilter | "";
}

export interface NotificationListResult {
  notifications: NotificationItem[];
  total: number;
  page: number;
  totalPages: number;
}
