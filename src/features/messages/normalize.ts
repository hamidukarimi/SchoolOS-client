import type {
  ConversationListResult,
  ConversationSummary,
  ConversationThread,
  MessagePerson,
  MessageRecipient,
  MessageRecord,
  RecipientSearchResult,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readText(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function readId(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  return null;
}

function readPerson(value: unknown): MessagePerson | null {
  if (!isRecord(value)) return null;
  const id = readId(value.id) ?? readId(value._id);
  if (!id) return null;
  return {
    id,
    firstname: readText(value, "firstname"),
    lastname: readText(value, "lastname"),
  };
}

function readCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function personLabel(person: Pick<MessagePerson, "firstname" | "lastname">): string {
  const name = `${person.firstname} ${person.lastname}`.trim();
  return name || "Unknown account";
}

export function normalizeMessage(value: unknown): MessageRecord {
  if (!isRecord(value)) throw new Error("Message response was not an object.");
  const id = readId(value._id) ?? readId(value.id);
  const sender = readPerson(value.sender);
  const receiver = readPerson(value.receiver);
  if (!id || !sender || !receiver) throw new Error("Message response did not include the participants.");
  const subject = readText(value, "subject").trim();
  const content = readText(value, "content").trim();
  if (!subject || !content) throw new Error("Message response did not include the message.");
  return {
    id,
    subject,
    content,
    createdAt: readText(value, "createdAt"),
    isRead: value.isRead === true,
    readAt: typeof value.readAt === "string" ? value.readAt : null,
    sender,
    receiver,
  };
}

export function normalizeConversation(value: unknown): ConversationSummary {
  if (!isRecord(value) || !isRecord(value.lastMessage)) {
    throw new Error("Conversation response was not valid.");
  }
  const participant = readPerson(value.participant);
  const last = value.lastMessage;
  const id = readId(last.id) ?? readId(last._id);
  const senderId = readId(last.senderId);
  if (!participant || !id || !senderId) throw new Error("Conversation response did not include a participant.");
  return {
    participant,
    unreadCount: readCount(value.unreadCount),
    lastMessage: {
      id,
      subject: readText(last, "subject"),
      content: readText(last, "content"),
      createdAt: readText(last, "createdAt"),
      isRead: last.isRead === true,
      senderId,
    },
  };
}

export function normalizeConversationList(value: unknown): ConversationListResult {
  if (!isRecord(value) || !Array.isArray(value.conversations)) {
    throw new Error("Conversation list response was not valid.");
  }
  return {
    conversations: value.conversations.map((item) => normalizeConversation(item)),
    total: readCount(value.total),
    page: typeof value.page === "number" && value.page > 0 ? value.page : 1,
    totalPages: readCount(value.totalPages),
  };
}

export function normalizeThread(value: unknown): ConversationThread {
  if (!isRecord(value) || !Array.isArray(value.messages)) {
    throw new Error("Conversation response was not valid.");
  }
  const participant = readPerson(value.participant);
  if (!participant) throw new Error("Conversation response did not include a participant.");
  return {
    participant,
    messages: value.messages.map((item) => normalizeMessage(item)),
    total: readCount(value.total),
    page: typeof value.page === "number" && value.page > 0 ? value.page : 1,
    totalPages: readCount(value.totalPages),
  };
}

export function normalizeRecipients(value: unknown): RecipientSearchResult {
  if (!isRecord(value) || !Array.isArray(value.recipients)) {
    throw new Error("Recipient response was not valid.");
  }
  return {
    searchRequired: value.searchRequired === true,
    recipients: value.recipients.map((item) => {
      if (!isRecord(item)) throw new Error("Recipient response was not valid.");
      const id = readId(item.id);
      if (!id) throw new Error("Recipient response did not include an account.");
      const recipient: MessageRecipient = {
        id,
        firstname: readText(item, "firstname"),
        lastname: readText(item, "lastname"),
        detail: readText(item, "detail"),
      };
      return recipient;
    }),
  };
}
