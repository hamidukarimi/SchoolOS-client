import { z } from "zod";
import type { MessageDraft } from "./types";

export const messageFormSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required"),
  content: z.string().trim().min(1, "Message is required"),
});

export type MessageFormValues = z.infer<typeof messageFormSchema>;

export function toMessageDraft(receiverId: string, values: MessageFormValues): MessageDraft {
  return {
    receiverId,
    subject: values.subject.trim(),
    content: values.content.trim(),
  };
}
