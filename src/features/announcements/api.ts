import type { ApiSuccess } from "../auth/types";
import { http } from "../../services/http";
import { normalizeAnnouncement, normalizeAnnouncementList } from "./normalize";
import { announcementListParams } from "./query";
import type { Announcement, AnnouncementListQuery, AnnouncementListResult, AnnouncementWritePayload } from "./types";

export const announcementInvalidationKey = ["announcements"] as const;

export function announcementListKey(query: AnnouncementListQuery) {
  return ["announcements", query] as const;
}

export function announcementDetailKey(id: string) {
  return ["announcements", "detail", id] as const;
}

function requireData<T>(data: T | undefined, action: string): T {
  if (data === undefined || data === null) {
    throw new Error(`${action} response did not include data.`);
  }
  return data;
}

export async function fetchAnnouncements(query: AnnouncementListQuery): Promise<AnnouncementListResult> {
  const response = await http.get<ApiSuccess<unknown>>("/announcements", {
    params: announcementListParams(query),
  });
  return normalizeAnnouncementList(requireData(response.data.data, "Announcement list"));
}

export async function fetchAnnouncement(id: string): Promise<Announcement> {
  const response = await http.get<ApiSuccess<unknown>>(`/announcements/${id}`);
  return normalizeAnnouncement(requireData(response.data.data, "Announcement"));
}

export async function createAnnouncement(input: AnnouncementWritePayload): Promise<{ message: string; announcement: Announcement }> {
  const response = await http.post<ApiSuccess<unknown>>("/announcements", input);
  return {
    message: response.data.message ?? "Announcement created successfully",
    announcement: normalizeAnnouncement(requireData(response.data.data, "Create announcement")),
  };
}

export async function updateAnnouncement(id: string, input: AnnouncementWritePayload): Promise<string> {
  const response = await http.put<ApiSuccess<unknown>>(`/announcements/${id}`, input);
  return response.data.message ?? "Announcement updated successfully";
}

export async function deleteAnnouncement(id: string): Promise<string> {
  const response = await http.delete<ApiSuccess<null>>(`/announcements/${id}`);
  return response.data.message ?? "Announcement deleted successfully";
}
