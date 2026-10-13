import { z } from "zod";
import { ANNOUNCEMENT_AUDIENCES, type AnnouncementWritePayload } from "./types";

const optionalDate = z.string().refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Use a valid date");

export const announcementFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  audience: z.enum(ANNOUNCEMENT_AUDIENCES),
  classId: z.string(),
  publishDate: optionalDate,
  expiryDate: optionalDate,
  isPublished: z.boolean(),
});

export type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

export function toAnnouncementPayload(values: AnnouncementFormValues, mode: "create" | "update" = "create"): AnnouncementWritePayload {
  const payload: AnnouncementWritePayload = {
    title: values.title.trim(),
    content: values.content.trim(),
    audience: values.audience,
    isPublished: values.isPublished,
  };
  const classId = values.classId.trim();
  if (classId) payload.classId = classId;
  else if (mode === "update") payload.classId = "";
  if (values.publishDate) payload.publishDate = values.publishDate;
  if (values.expiryDate) payload.expiryDate = values.expiryDate;
  return payload;
}
