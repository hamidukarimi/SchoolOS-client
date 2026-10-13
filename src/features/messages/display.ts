import type { SchoolPersona } from "../access/types";

export function canStartConversation(persona: SchoolPersona | undefined): boolean {
  return persona === "admin" || persona === "teacher" || persona === "student";
}

export function formatMessageTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function messageIntro(persona: SchoolPersona | undefined): string {
  if (persona === "admin") {
    return "Private messages stay between the people in the conversation. Search for an existing account to start one.";
  }
  if (persona === "teacher") {
    return "You can message students on your class lists, and reply to conversations that already include you.";
  }
  if (persona === "student") {
    return "You can message the teachers of your classes, and reply to conversations that already include you.";
  }
  return "You can read messages sent to this account and reply in those conversations. Starting a new conversation needs a teacher or student profile, or an administrator account.";
}
