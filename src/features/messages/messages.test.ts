import { describe, expect, it } from "vitest";
import { canStartConversation } from "./display";
import { normalizeConversationList, normalizeRecipients, normalizeThread, personLabel } from "./normalize";
import { toMessageDraft } from "./schemas";

const message = {
  id: "message-1",
  subject: "Homework",
  content: "Read chapter 1",
  createdAt: "2026-10-13T12:00:00.000Z",
  isRead: false,
  readAt: null,
  sender: { id: "teacher-user", firstname: "Laila", lastname: "Noori" },
  receiver: { id: "student-user", firstname: "Omar", lastname: "Khan" },
};

describe("messages", () => {
  it("reads a conversation without treating it as a school-wide inbox", () => {
    const thread = normalizeThread({
      participant: { id: "teacher-user", firstname: "Laila", lastname: "Noori" },
      messages: [message],
      total: 1,
      page: 1,
      totalPages: 1,
    });
    expect(personLabel(thread.participant)).toBe("Laila Noori");
    expect(thread.messages[0]?.sender.id).toBe("teacher-user");
    const list = normalizeConversationList({
      conversations: [
        {
          participant: { id: "student-user", firstname: "Omar", lastname: "Khan" },
          unreadCount: 1,
          lastMessage: {
            id: "message-1",
            subject: "Homework",
            content: "Read chapter 1",
            createdAt: "2026-10-13T12:00:00.000Z",
            isRead: false,
            senderId: "teacher-user",
          },
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    });
    expect(list.conversations[0]?.unreadCount).toBe(1);
    expect(normalizeRecipients({ recipients: [], searchRequired: true }).searchRequired).toBe(true);
  });

  it("rejects a conversation payload that is not a thread", () => {
    expect(() => normalizeThread({ messages: "nope" })).toThrow(/not valid/);
    expect(() => normalizeConversationList({ inbox: [] })).toThrow(/not valid/);
  });

  it("lets school personas start conversations and keeps the sender off the payload", () => {
    expect(canStartConversation("admin")).toBe(true);
    expect(canStartConversation("teacher")).toBe(true);
    expect(canStartConversation("student")).toBe(true);
    expect(canStartConversation("unscoped")).toBe(false);
    const draft = toMessageDraft("64b000000000000000000004", {
      subject: " Homework ",
      content: " Please read ",
    });
    expect(draft).toEqual({
      receiverId: "64b000000000000000000004",
      subject: "Homework",
      content: "Please read",
    });
    expect(draft).not.toHaveProperty("senderId");
  });
});
