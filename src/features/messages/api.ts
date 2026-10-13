import type { ApiSuccess } from "../auth/types";
import { http } from "../../services/http";
import { normalizeConversationList, normalizeRecipients, normalizeThread } from "./normalize";
import { MESSAGE_PAGE_SIZE } from "./query";
import type { ConversationListResult, ConversationThread, MessageDraft, MessageRecord, RecipientSearchResult } from "./types";

export const messageInvalidationKey = ["messages"] as const;

export function conversationListKey(page: number) {
  return ["messages", "conversations", page] as const;
}

export function conversationThreadKey(participantId: string, page: number) {
  return ["messages", "thread", participantId, page] as const;
}

export function messageUnreadKey() {
  return ["messages", "unread"] as const;
}

export function messageRecipientKey(search: string) {
  return ["messages", "recipients", search] as const;
}

function requireData<T>(data: T | undefined, action: string): T {
  if (data === undefined || data === null) throw new Error(`${action} response did not include data.`);
  return data;
}

export async function fetchConversations(page: number): Promise<ConversationListResult> {
  const response = await http.get<ApiSuccess<unknown>>("/messages/conversations", {
    params: { page, limit: MESSAGE_PAGE_SIZE },
  });
  return normalizeConversationList(requireData(response.data.data, "Conversations"));
}

export async function fetchConversation(participantId: string, page: number): Promise<ConversationThread> {
  const response = await http.get<ApiSuccess<unknown>>(`/messages/conversations/${participantId}`, {
    params: { page, limit: MESSAGE_PAGE_SIZE },
  });
  return normalizeThread(requireData(response.data.data, "Conversation"));
}

export async function fetchUnreadMessageCount(): Promise<number> {
  const response = await http.get<ApiSuccess<unknown>>("/messages/unread-count");
  const data = requireData(response.data.data, "Unread messages");
  if (typeof data !== "object" || data === null || typeof (data as { unreadCount?: unknown }).unreadCount !== "number") {
    throw new Error("Unread messages response was not valid.");
  }
  return (data as { unreadCount: number }).unreadCount;
}

export async function fetchMessageRecipients(search: string): Promise<RecipientSearchResult> {
  const response = await http.get<ApiSuccess<unknown>>("/messages/recipients", {
    params: search ? { search } : {},
  });
  return normalizeRecipients(requireData(response.data.data, "Recipients"));
}

export async function sendMessage(input: MessageDraft): Promise<{ message: MessageRecord; notice: string }> {
  const response = await http.post<ApiSuccess<unknown>>("/messages", input);
  return {
    message: normalizeSentMessage(requireData(response.data.data, "Send message"), input.receiverId),
    notice: response.data.message ?? "Message sent successfully",
  };
}

export async function markConversationRead(participantId: string): Promise<void> {
  await http.patch<ApiSuccess<unknown>>(`/messages/conversations/${participantId}/read`);
}

function normalizeSentMessage(value: unknown, receiverId: string): MessageRecord {
  if (typeof value !== "object" || value === null) throw new Error("Send message response was not an object.");
  const record = value as Record<string, unknown>;
  const id = typeof record._id === "string" ? record._id : typeof record.id === "string" ? record.id : "";
  const senderId = typeof record.senderId === "string" ? record.senderId : "";
  if (!id) throw new Error("Send message response did not include an id.");
  return {
    id,
    subject: typeof record.subject === "string" ? record.subject : "",
    content: typeof record.content === "string" ? record.content : "",
    createdAt: typeof record.createdAt === "string" ? record.createdAt : "",
    isRead: record.isRead === true,
    readAt: typeof record.readAt === "string" ? record.readAt : null,
    sender: { id: senderId, firstname: "", lastname: "" },
    receiver: { id: receiverId, firstname: "", lastname: "" },
  };
}
