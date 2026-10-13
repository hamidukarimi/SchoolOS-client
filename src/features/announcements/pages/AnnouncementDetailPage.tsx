import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { Spinner } from "../../../components/ui/Spinner";
import { useAccess } from "../../access/access-context";
import { getApiErrorMessage } from "../../../services/api-error";
import { announcementDetailKey, announcementInvalidationKey, deleteAnnouncement, fetchAnnouncement } from "../api";
import { audienceLabel, canManageAnnouncements, formatAnnouncementDate, readNotice } from "../display";

export function AnnouncementDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const access = useAccess();
  const queryClient = useQueryClient();
  const notice = readNotice(location.state);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const persona = access.context?.persona;
  const announcementQuery = useQuery({
    queryKey: announcementDetailKey(id),
    queryFn: () => fetchAnnouncement(id),
    enabled: Boolean(id),
  });
  const remove = useMutation({
    mutationFn: () => deleteAnnouncement(id),
    onSuccess: async (message) => {
      await queryClient.invalidateQueries({ queryKey: announcementInvalidationKey });
      navigate("/app/announcements", { replace: true, state: { notice: message } });
    },
  });

  if (announcementQuery.isLoading) return <Spinner label="Loading announcement" />;
  if (announcementQuery.error || !announcementQuery.data) {
    return (
      <section className="mx-auto grid max-w-3xl gap-4">
        <ServerErrorAlert error={getApiErrorMessage(announcementQuery.error)} />
        <Button type="button" variant="secondary" onClick={() => void announcementQuery.refetch()}>
          Retry
        </Button>
        <Link to="/app/announcements" className={buttonClass("ghost")}>
          Back to announcements
        </Link>
      </section>
    );
  }

  const item = announcementQuery.data;
  const canManage = canManageAnnouncements(persona);

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      <div>
        <p className="text-sm text-slate-600">
          {audienceLabel(item.audience)}
          {item.classRef ? ` · ${item.classRef.name}, section ${item.classRef.section}` : " · School-wide"}
          {canManage && !item.isPublished ? " · Draft" : ""}
        </p>
        <h1 className="mt-2 font-serif text-4xl">{item.title}</h1>
        <p className="mt-3 text-sm text-slate-600">
          {item.publishedBy ? `${item.publishedBy.firstname} ${item.publishedBy.lastname}` : "Publisher name not returned"}
          {" · "}
          {formatAnnouncementDate(item.publishDate)}
          {item.expiryDate ? ` · Expires ${formatAnnouncementDate(item.expiryDate)}` : ""}
        </p>
      </div>
      {remove.error ? <ServerErrorAlert error={getApiErrorMessage(remove.error)} /> : null}
      <p className="whitespace-pre-wrap leading-7 text-slate-800">{item.content}</p>
      {canManage ? (
        <div className="flex flex-wrap gap-2">
          <Link to={`/app/announcements/${item.id}/edit`} className={buttonClass("secondary")}>
            Edit announcement
          </Link>
        </div>
      ) : null}
      {canManage ? (
        <div className="rounded-xl border border-rose-200 bg-white p-4">
          <h2 className="text-base font-medium">Delete announcement</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">This removes the school post. It does not delete a personal notification.</p>
          {confirmingDelete ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="danger" busy={remove.isPending} onClick={() => remove.mutate()}>
                {remove.isPending ? "Deleting" : "Confirm delete"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button type="button" variant="danger" className="mt-4" onClick={() => setConfirmingDelete(true)}>
              Delete announcement
            </Button>
          )}
        </div>
      ) : null}
      <Link to="/app/announcements" className={buttonClass("secondary")}>
        Back to announcements
      </Link>
    </section>
  );
}
