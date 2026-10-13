import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { announcementInvalidationKey, createAnnouncement } from "../api";
import { AnnouncementForm } from "./AnnouncementForm";
import { toAnnouncementPayload, type AnnouncementFormValues } from "../schemas";

const emptyAnnouncement: AnnouncementFormValues = {
  title: "",
  content: "",
  audience: "all",
  classId: "",
  publishDate: "",
  expiryDate: "",
  isPublished: true,
};

export function CreateAnnouncementPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const mutation = useMutation({
    mutationFn: (values: AnnouncementFormValues) => createAnnouncement(toAnnouncementPayload(values)),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: announcementInvalidationKey });
      navigate(`/app/announcements/${result.announcement.id}`, { replace: true, state: { notice: result.message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  return (
    <AnnouncementForm
      heading="New announcement"
      description="Choose who should see this post. The server still decides which accounts can read it."
      initialValues={emptyAnnouncement}
      savedClass={null}
      cancelTo="/app/announcements"
      submitLabel="Publish announcement"
      pendingLabel="Saving"
      busy={mutation.isPending}
      serverError={serverError}
      onSubmit={(values) => mutation.mutate(values)}
    />
  );
}
