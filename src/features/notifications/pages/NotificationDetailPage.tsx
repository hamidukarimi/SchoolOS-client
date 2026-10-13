import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { Spinner } from "../../../components/ui/Spinner";
import { getApiErrorMessage } from "../../../services/api-error";
import {
  deleteNotification,
  fetchNotification,
  markNotificationRead,
  notificationDetailKey,
  notificationInvalidationKey,
} from "../api";
import { formatNotificationTime, notificationTypeIcon, notificationTypeLabel, notificationView } from "../display";

export function NotificationDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const notificationQuery = useQuery({
    queryKey: notificationDetailKey(id),
    queryFn: () => fetchNotification(id),
    enabled: Boolean(id),
  });

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: notificationInvalidationKey });
    await queryClient.invalidateQueries({ queryKey: notificationDetailKey(id) });
  }

  const markRead = useMutation({
    mutationFn: () => markNotificationRead(id),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: () => deleteNotification(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationInvalidationKey });
      navigate("/app/notifications", { replace: true });
    },
  });

  if (notificationQuery.isLoading) return <Spinner label="Loading notification" />;
  if (notificationQuery.error || !notificationQuery.data) {
    return (
      <section className="mx-auto grid max-w-3xl gap-4">
        <ServerErrorAlert error={getApiErrorMessage(notificationQuery.error)} />
        <Button type="button" variant="secondary" onClick={() => void notificationQuery.refetch()}>
          Retry
        </Button>
        <Link to="/app/notifications" className={buttonClass("ghost")}>
          Back to notifications
        </Link>
      </section>
    );
  }

  const item = notificationQuery.data;
  const view = notificationView(item);
  const Icon = notificationTypeIcon(item.type);
  const busy = markRead.isPending || remove.isPending;

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="text-sm text-slate-600">{notificationTypeLabel(item.type)}</p>
        <h1 className="mt-2 flex items-center gap-3 font-serif text-4xl">
          <Icon aria-hidden="true" size={28} />
          {item.title}
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          {view.unread ? "Unread" : `Read ${formatNotificationTime(item.readAt ?? "")}`} · {formatNotificationTime(item.createdAt)}
        </p>
      </div>
      {markRead.error ? <ServerErrorAlert error={getApiErrorMessage(markRead.error)} /> : null}
      {remove.error ? <ServerErrorAlert error={getApiErrorMessage(remove.error)} /> : null}
      <p className="leading-7 text-slate-800">{item.body}</p>
      {view.unavailableLink ? (
        <p className="text-sm text-slate-600">This link is not available in SchoolOS.</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {view.destination ? (
          <Link to={view.destination} className={buttonClass("primary")}>
            Open
          </Link>
        ) : null}
        {view.unread ? (
          <Button type="button" variant="secondary" busy={markRead.isPending} disabled={busy} onClick={() => markRead.mutate()}>
            {markRead.isPending ? "Marking read" : "Mark as read"}
          </Button>
        ) : null}
      </div>
      <div className="rounded-xl border border-rose-200 bg-white p-4">
        <h2 className="text-base font-medium">Delete notification</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          This removes the notice from your account. It does not change the school record.
        </p>
        {confirmingDelete ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="danger" busy={remove.isPending} disabled={busy} onClick={() => remove.mutate()}>
              {remove.isPending ? "Deleting" : "Confirm delete"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button type="button" variant="danger" className="mt-4" disabled={busy} onClick={() => setConfirmingDelete(true)}>
            Delete notification
          </Button>
        )}
      </div>
      <Link to="/app/notifications" className={buttonClass("secondary")}>
        Back to notifications
      </Link>
    </section>
  );
}
