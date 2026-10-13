import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { Spinner } from "../../../components/ui/Spinner";
import { getApiErrorMessage } from "../../../services/api-error";
import {
  deleteNotification,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  notificationDetailKey,
  notificationInvalidationKey,
  notificationListKey,
  notificationUnreadKey,
} from "../api";
import {
  formatNotificationTime,
  notificationEmptyCopy,
  notificationTypeIcon,
  notificationView,
  unreadSummary,
} from "../display";
import { notificationListSearch, pageAfterEmptyList, pageAfterRemoval, parseNotificationListQuery } from "../query";
import type { NotificationItem, NotificationListQuery, NotificationReadFilter } from "../types";

function replaceQuery(
  setSearchParams: (next: URLSearchParams) => void,
  current: NotificationListQuery,
  next: Partial<NotificationListQuery>,
) {
  const query = { ...current, ...next };
  setSearchParams(new URLSearchParams(notificationListSearch(query).replace(/^\?/, "")));
}

const filters: { label: string; read: NotificationReadFilter | "" }[] = [
  { label: "All", read: "" },
  { label: "Unread", read: "unread" },
  { label: "Read", read: "read" },
];

export function NotificationListPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = parseNotificationListQuery(searchParams);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const listQuery = useQuery({
    queryKey: notificationListKey(query),
    queryFn: () => fetchNotifications(query),
  });
  const countQuery = useQuery({
    queryKey: notificationUnreadKey(),
    queryFn: fetchUnreadNotificationCount,
    staleTime: 30_000,
  });

  useEffect(() => {
    const data = listQuery.data;
    if (!data) return;
    const next = pageAfterEmptyList(query.page, data.notifications.length, data.totalPages);
    if (next !== null) replaceQuery(setSearchParams, query, { page: next });
  }, [listQuery.data, query, setSearchParams]);

  async function refresh(id?: string) {
    await queryClient.invalidateQueries({ queryKey: notificationInvalidationKey });
    if (id) await queryClient.invalidateQueries({ queryKey: notificationDetailKey(id) });
  }

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: async (_item, id) => {
      await refresh(id);
    },
  });
  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      await refresh();
    },
  });
  const remove = useMutation({
    mutationFn: deleteNotification,
    onSuccess: async (_result, id) => {
      const remaining = (listQuery.data?.notifications.length ?? 1) - 1;
      const nextPage = pageAfterRemoval(query.page, remaining);
      if (nextPage !== query.page) replaceQuery(setSearchParams, query, { page: nextPage });
      if (confirmingId === id) setConfirmingId(null);
      await refresh(id);
    },
  });

  const busy = markRead.isPending || markAll.isPending || remove.isPending;

  return (
    <section className="mx-auto grid max-w-5xl gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Notifications</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">
            Notices for your account. SchoolOS lists only the notifications returned for the signed-in user.
          </p>
          <p className="mt-2 text-sm text-slate-600" aria-live="polite">
            {countQuery.isError ? "Unread count is unavailable." : unreadSummary(countQuery.data)}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          busy={markAll.isPending}
          disabled={busy || countQuery.data === 0}
          onClick={() => markAll.mutate()}
        >
          {markAll.isPending ? "Marking all read" : "Mark all as read"}
        </Button>
      </div>
      {markRead.error ? <ServerErrorAlert error={getApiErrorMessage(markRead.error)} /> : null}
      {markAll.error ? <ServerErrorAlert error={getApiErrorMessage(markAll.error)} /> : null}
      {remove.error ? <ServerErrorAlert error={getApiErrorMessage(remove.error)} /> : null}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Notification filter">
        {filters.map((filter) => {
          const selected = query.read === filter.read;
          return (
            <Button
              key={filter.label}
              type="button"
              variant={selected ? "primary" : "secondary"}
              aria-pressed={selected}
              onClick={() => replaceQuery(setSearchParams, query, { read: filter.read, page: 1 })}
            >
              {filter.label}
            </Button>
          );
        })}
      </div>
      {listQuery.isLoading ? <Spinner label="Loading notifications" /> : null}
      {listQuery.error ? (
        <div className="grid gap-3">
          <ServerErrorAlert error={getApiErrorMessage(listQuery.error)} />
          <Button type="button" variant="secondary" onClick={() => void listQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : null}
      {listQuery.data && listQuery.data.notifications.length === 0 ? (
        <Alert tone="info" title={notificationEmptyCopy(query.read).title}>
          {notificationEmptyCopy(query.read).body}
        </Alert>
      ) : null}
      {listQuery.data && listQuery.data.notifications.length > 0 ? (
        <div className="grid gap-4">
          <p className="text-sm text-slate-600" aria-live="polite">
            {listQuery.data.total} {listQuery.data.total === 1 ? "notification" : "notifications"}
            {listQuery.data.totalPages > 1 ? `, page ${listQuery.data.page} of ${listQuery.data.totalPages}` : ""}
          </p>
          <ul className="grid gap-3">
            {listQuery.data.notifications.map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                confirming={confirmingId === item.id}
                busy={busy}
                onConfirm={() => setConfirmingId(item.id)}
                onCancel={() => setConfirmingId(null)}
                onRead={() => markRead.mutate(item.id)}
                onDelete={() => remove.mutate(item.id)}
              />
            ))}
          </ul>
          {listQuery.data.totalPages > 1 ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={listQuery.data.page <= 1}
                onClick={() => replaceQuery(setSearchParams, query, { page: listQuery.data.page - 1 })}
              >
                Previous page
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={listQuery.data.page >= listQuery.data.totalPages}
                onClick={() => replaceQuery(setSearchParams, query, { page: listQuery.data.page + 1 })}
              >
                Next page
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function NotificationCard({
  item,
  confirming,
  busy,
  onConfirm,
  onCancel,
  onRead,
  onDelete,
}: {
  item: NotificationItem;
  confirming: boolean;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onRead: () => void;
  onDelete: () => void;
}) {
  const view = notificationView(item);
  const Icon = notificationTypeIcon(item.type);
  return (
    <li className={`rounded-xl border bg-white px-4 py-4 ${view.unread ? "border-pine" : "border-line"}`}>
      <div className="flex items-start gap-3">
        <Icon aria-hidden="true" size={18} className="mt-1 text-pine" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-medium text-ink">{item.title}</h2>
            <span className="text-sm text-slate-600">{view.typeLabel}</span>
            {view.unread ? (
              <span className="rounded-full bg-mist px-2 py-0.5 text-xs font-medium text-ink">Unread</span>
            ) : (
              <span className="text-xs text-slate-500">Read</span>
            )}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-700">{item.body}</p>
          <p className="mt-2 text-sm text-slate-600">{formatNotificationTime(item.createdAt)}</p>
          {view.unavailableLink ? (
            <p className="mt-2 text-sm text-slate-600">This link is not available in SchoolOS.</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to={`/app/notifications/${item.id}`} className={buttonClass("secondary")}>
              Details
            </Link>
            {view.destination ? (
              <Link to={view.destination} className={buttonClass("secondary")}>
                Open
              </Link>
            ) : null}
            {view.unread ? (
              <Button type="button" variant="secondary" busy={busy} onClick={onRead}>
                Mark as read
              </Button>
            ) : null}
            {confirming ? (
              <>
                <Button type="button" variant="danger" busy={busy} onClick={onDelete}>
                  Confirm delete
                </Button>
                <Button type="button" variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button type="button" variant="danger" disabled={busy} onClick={onConfirm}>
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
