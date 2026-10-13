export const ANNOUNCEMENT_AUDIENCES = ["all", "teachers", "students", "parents"] as const;

export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];

export type PublishedFilter = "" | "true" | "false";

export interface AnnouncementPerson {
  id: string;
  firstname: string;
  lastname: string;
}

export interface AnnouncementClassRef {
  id: string;
  name: string;
  section: string;
  grade: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  audience: AnnouncementAudience;
  classId: string | null;
  classRef: AnnouncementClassRef | null;
  publishedBy: AnnouncementPerson | null;
  publishDate: string;
  expiryDate: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementListQuery {
  audience: AnnouncementAudience | "";
  classId: string;
  published: PublishedFilter;
  page: number;
}

export interface AnnouncementListResult {
  announcements: Announcement[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AnnouncementWritePayload {
  title: string;
  content: string;
  audience?: AnnouncementAudience;
  classId?: string;
  publishDate?: string;
  expiryDate?: string;
  isPublished?: boolean;
}
