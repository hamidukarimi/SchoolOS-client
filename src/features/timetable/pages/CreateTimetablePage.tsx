import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { createTimetable, timetableInvalidationKey } from "../api";
import { toTimetableCreatePayload, type TimetableFormValues } from "../schemas";
import { TimetableForm } from "./TimetableForm";

const emptyEntry: TimetableFormValues = {
  classId: "",
  teacherId: "",
  subject: "",
  dayOfWeek: "monday",
  startTime: "",
  endTime: "",
  room: "",
  academicYear: "",
  status: "active",
};

export function CreateTimetablePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const mutation = useMutation({
    mutationFn: (values: TimetableFormValues) => createTimetable(toTimetableCreatePayload(values)),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: timetableInvalidationKey });
      navigate(`/app/timetables/${result.entry.id}`, { replace: true, state: { notice: result.message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  return (
    <TimetableForm
      heading="New lesson"
      description="A lesson needs a class and a teacher that already exist. For an active lesson, the server rejects it when that teacher already has an active lesson the same day and year whose time text overlaps. Editing later does not run that check."
      initialValues={emptyEntry}
      savedClass={null}
      savedTeacher={null}
      cancelTo="/app/timetables"
      submitLabel="Save lesson"
      pendingLabel="Saving"
      busy={mutation.isPending}
      serverError={serverError}
      onSubmit={(values) => {
        setServerError(null);
        mutation.mutate(values);
      }}
    />
  );
}
