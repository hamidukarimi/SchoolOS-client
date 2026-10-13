export interface MessagePerson {
  id: string;
  firstname: string;
  lastname: string;
}

export interface MessageRecord {
  id: string;
  subject: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
  sender: MessagePerson;
  receiver: MessagePerson;
}

export interface ConversationSummary {
  participant: MessagePerson;
  unreadCount: number;
  lastMessage: {
    id: string;
    subject: string;
    content: string;
    createdAt: string;
    isRead: boolean;
    senderId: string;
  };
}

export interface ConversationListResult {
  conversations: ConversationSummary[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ConversationThread {
  participant: MessagePerson;
  messages: MessageRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export interface MessageRecipient {
  id: string;
  firstname: string;
  lastname: string;
  detail: string;
}

export interface RecipientSearchResult {
  recipients: MessageRecipient[];
  searchRequired: boolean;
}

export interface MessageDraft {
  receiverId: string;
  subject: string;
  content: string;
}
