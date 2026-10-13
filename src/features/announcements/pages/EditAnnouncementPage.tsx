import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ServerErrorAlert } from "../../../components/ui/Alert";
import { buttonClass } from "../../../components/ui/Button";
import { Spinner } from "../../../components/ui/Spinner";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { announcementDetailKey, announcementInvalidationKey, fetchAnnouncement, updateAnnouncement } from "../api";
import { dateInputValue } from "../display";
import { toAnnouncementPayload, type AnnouncementFormValues } from "../schemas";
import { AnnouncementForm } from "./AnnouncementForm";

export function EditAnnouncementPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const announcementQuery = useQuery({
    queryKey: announcementDetailKey(id),
    queryFn: () => fetchAnnouncement(id),
    enabled: Boolean(id),
  });
  const mutation = useMutation({
    mutationFn: (values: AnnouncementFormValues) => updateAnnouncement(id, toAnnouncementPayload(values, "update")),
    onSuccess: async (message) => {
      await queryClient.invalidateQueries({ queryKey: announcementInvalidationKey });
      navigate(`/app/announcements/${id}`, { replace: true, state: { notice: message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  if (announcementQuery.isLoading) return <Spinner label="Loading announcement" />;
  if (announcementQuery.error || !announcementQuery.data) {
    return (
      <section className="mx-auto grid max-w-3xl gap-4">
        <ServerErrorAlert error={getApiErrorMessage(announcementQuery.error)} />
        <Link to="/app/announcements" className={buttonClass("secondary")}>
          Back to announcements
        </Link>
      </section>
    );
  }

  const item = announcementQuery.data;
  const initialValues: AnnouncementFormValues = {
    title: item.title,
    content: item.content,
    audience: item.audience,
    classId: item.classId ?? "",
    publishDate: dateInputValue(item.publishDate),
    expiryDate: dateInputValue(item.expiryDate),
    isPublished: item.isPublished,
  };

  return (
    <AnnouncementForm
      heading="Edit announcement"
      description="Updates apply to the school post. They do not create a personal notification."
      initialValues={initialValues}
      savedClass={item.classRef}
      cancelTo={`/app/announcements/${item.id}`}
      submitLabel="Save announcement"
      pendingLabel="Saving"
      busy={mutation.isPending}
      serverError={serverError}
      onSubmit={(values) => mutation.mutate(values)}
    />
  );
}
