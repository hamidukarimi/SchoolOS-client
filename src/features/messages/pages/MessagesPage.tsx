import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { Spinner } from "../../../components/ui/Spinner";
import { useAccess } from "../../access/access-context";
import { useAuth } from "../../auth/auth-context";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import {
  conversationListKey,
  conversationThreadKey,
  fetchConversation,
  fetchConversations,
  markConversationRead,
  messageInvalidationKey,
  sendMessage,
} from "../api";
import { canStartConversation, formatMessageTime, messageIntro } from "../display";
import { personLabel } from "../normalize";
import { parseMessagePage } from "../query";
import { toMessageDraft } from "../schemas";
import { MessageComposer } from "./MessageComposer";
import { NewConversation } from "./NewConversation";

export function MessagesPage() {
  const { participantId = "" } = useParams();
  const access = useAccess();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseMessagePage(searchParams);
  const [starting, setStarting] = useState(false);
  const [listPage, setListPage] = useState(1);
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const persona = access.context?.persona;
  const listQuery = useQuery({
    queryKey: conversationListKey(listPage),
    queryFn: () => fetchConversations(listPage),
  });
  const threadQuery = useQuery({
    queryKey: conversationThreadKey(participantId, page),
    queryFn: () => fetchConversation(participantId, page),
    enabled: Boolean(participantId),
  });
  const readMutation = useMutation({
    mutationFn: () => markConversationRead(participantId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageInvalidationKey });
    },
  });
  const markRead = readMutation.mutate;
  const sendMutation = useMutation({
    mutationFn: (values: { subject: string; content: string }) => sendMessage(toMessageDraft(participantId, values)),
    onSuccess: async () => {
      setServerError(null);
      await queryClient.invalidateQueries({ queryKey: messageInvalidationKey });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  const unreadKey =
    threadQuery.data?.messages
      .filter((message) => !message.isRead && message.sender.id !== user?.id)
      .map((message) => message.id)
      .join(",") ?? "";

  useEffect(() => {
    if (!participantId || !unreadKey) return;
    markRead();
  }, [participantId, unreadKey, markRead]);

  function setPage(next: number) {
    const params = new URLSearchParams(searchParams);
    if (next > 1) params.set("page", String(next));
    else params.delete("page");
    setSearchParams(params);
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Messages</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">{messageIntro(persona)}</p>
        </div>
        {canStartConversation(persona) ? (
          <Button type="button" onClick={() => setStarting((current) => !current)}>
            {starting ? "Hide new conversation" : "New conversation"}
          </Button>
        ) : null}
      </div>
      {starting ? <NewConversation onClose={() => setStarting(false)} /> : null}
      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className={participantId ? "hidden lg:grid lg:gap-3" : "grid gap-3"}>
          {listQuery.isLoading ? <Spinner label="Loading conversations" /> : null}
          {listQuery.error ? <ServerErrorAlert error={getApiErrorMessage(listQuery.error)} /> : null}
          {listQuery.data && listQuery.data.conversations.length === 0 ? (
            <Alert tone="info">
              <p className="font-medium">No conversations yet</p>
            </Alert>
          ) : null}
          {listQuery.data && listQuery.data.conversations.length > 0 ? (
            <ul className="grid gap-2">
              {listQuery.data.conversations.map((conversation) => {
                const active = conversation.participant.id === participantId;
                return (
                  <li key={conversation.participant.id}>
                    <Link
                      to={`/app/messages/${conversation.participant.id}`}
                      aria-current={active ? "page" : undefined}
                      className={`grid gap-1 rounded-xl border px-3 py-3 focus-visible:ring-2 focus-visible:ring-pine focus-visible:outline-none ${
                        active ? "border-pine bg-white" : "border-line bg-white hover:border-pine"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-medium text-ink">{personLabel(conversation.participant)}</span>
                        {conversation.unreadCount > 0 ? (
                          <span className="rounded-full bg-pine px-2 py-0.5 text-xs text-white">
                            {conversation.unreadCount} unread
                          </span>
                        ) : null}
                      </span>
                      <span className="truncate text-sm text-slate-600">{conversation.lastMessage.subject}</span>
                      <span className="text-xs text-slate-500">{formatMessageTime(conversation.lastMessage.createdAt)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {listQuery.data && listQuery.data.totalPages > 1 ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" disabled={listPage <= 1} onClick={() => setListPage((current) => current - 1)}>
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={listPage >= listQuery.data.totalPages}
                onClick={() => setListPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </aside>
        <div className={participantId ? "grid gap-4" : "hidden lg:grid"}>
          {!participantId ? (
            <Alert tone="info">
              <p className="font-medium">Choose a conversation</p>
            </Alert>
          ) : null}
          {participantId ? (
            <Link to="/app/messages" className={`${buttonClass("secondary")} lg:hidden`}>
              Back to conversations
            </Link>
          ) : null}
          {threadQuery.isLoading ? <Spinner label="Loading messages" /> : null}
          {threadQuery.error ? <ServerErrorAlert error={getApiErrorMessage(threadQuery.error)} /> : null}
          {threadQuery.data ? (
            <div className="grid gap-4">
              <h2 className="font-serif text-2xl">{personLabel(threadQuery.data.participant)}</h2>
              {threadQuery.data.messages.length === 0 ? (
                <Alert tone="info">
                  <p className="font-medium">No messages in this conversation</p>
                </Alert>
              ) : (
                <div className="grid gap-3">
                  {threadQuery.data.totalPages > 1 ? (
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                        Newer messages
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={page >= threadQuery.data.totalPages}
                        onClick={() => setPage(page + 1)}
                      >
                        Earlier messages
                      </Button>
                    </div>
                  ) : null}
                  <ol className="grid gap-3">
                    {threadQuery.data.messages.map((message) => {
                      const mine = message.sender.id === user?.id;
                      return (
                        <li key={message.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                          <article
                            className={`grid max-w-[85%] gap-1 rounded-xl px-4 py-3 ${
                              mine ? "bg-pine text-white" : "border border-line bg-white text-ink"
                            }`}
                          >
                            <p className={`text-xs ${mine ? "text-emerald-50" : "text-slate-500"}`}>
                              {mine ? "You" : personLabel(message.sender)} · {formatMessageTime(message.createdAt)}
                              {mine && message.isRead ? " · Read" : ""}
                            </p>
                            <h3 className="text-sm font-medium">{message.subject}</h3>
                            <p className="text-sm leading-6 whitespace-pre-wrap">{message.content}</p>
                          </article>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
              {serverError ? <ServerErrorAlert error={serverError} /> : null}
              <MessageComposer
                busy={sendMutation.isPending}
                onSend={async (values) => {
                  await sendMutation.mutateAsync(values);
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
