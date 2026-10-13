import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { fetchTimetable, timetableDetailKey, timetableInvalidationKey, updateTimetable } from "../api";
import { toTimetableUpdatePayload, type TimetableFormValues } from "../schemas";
import { TimetableForm } from "./TimetableForm";

export function EditTimetablePage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const entryQuery = useQuery({
    queryKey: timetableDetailKey(id),
    queryFn: () => fetchTimetable(id),
    enabled: Boolean(id),
  });
  const entry = entryQuery.data;
  const formValues: TimetableFormValues | null = entry
    ? {
        classId: entry.classRef?.id ?? "",
        teacherId: entry.teacher?.id ?? "",
        subject: entry.subject,
        dayOfWeek: entry.dayOfWeek,
        startTime: entry.startTime,
        endTime: entry.endTime,
        room: entry.room,
        academicYear: entry.academicYear,
        status: entry.status,
      }
    : null;
  const mutation = useMutation({
    mutationFn: (values: TimetableFormValues) => updateTimetable(id, toTimetableUpdatePayload(values)),
    onSuccess: async (message) => {
      await queryClient.invalidateQueries({ queryKey: timetableInvalidationKey });
      navigate(`/app/timetables/${id}`, { replace: true, state: { notice: message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  if (entryQuery.isLoading) return <FullPageSpinner label="Loading lesson" />;

  if (entryQuery.error || !entry || !formValues) {
    return (
      <section className="mx-auto grid max-w-3xl gap-4">
        <ServerErrorAlert
          error={
            entryQuery.error
              ? getApiErrorMessage(entryQuery.error)
              : { message: "This lesson could not be loaded.", errors: [] }
          }
        />
        <Button type="button" variant="secondary" className="w-fit" onClick={() => entryQuery.refetch()}>
          Try again
        </Button>
        <Link to="/app/timetables" className={buttonClass("secondary")}>
          Back to timetable
        </Link>
      </section>
    );
  }

  return (
    <TimetableForm
      key={entry.id}
      heading="Edit lesson"
      description="Class, teacher, subject, day, times, room, year, and status can all be changed. Saving does not check whether the teacher is already booked. A blank room clears the saved room."
      initialValues={formValues}
      savedClass={entry.classRef}
      savedTeacher={entry.teacher}
      cancelTo={`/app/timetables/${entry.id}`}
      submitLabel="Save changes"
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
