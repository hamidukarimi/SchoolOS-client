import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { useAccess } from "../../access/access-context";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { deleteTimetable, fetchTimetable, timetableDetailKey, timetableInvalidationKey } from "../api";
import { canManageTimetable, readNotice, timetableDayLabel, timetableStatusLabel } from "../display";

export function TimetableDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const access = useAccess();
  const queryClient = useQueryClient();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const notice = readNotice(location.state);
  const entryQuery = useQuery({
    queryKey: timetableDetailKey(id),
    queryFn: () => fetchTimetable(id),
    enabled: Boolean(id),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteTimetable(id),
    onSuccess: async (message) => {
      await queryClient.invalidateQueries({ queryKey: timetableInvalidationKey });
      navigate("/app/timetables", { replace: true, state: { notice: message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  if (entryQuery.isLoading) return <FullPageSpinner label="Loading lesson" />;

  if (entryQuery.error || !entryQuery.data) {
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

  const entry = entryQuery.data;
  const canManage = canManageTimetable(access.context?.persona);

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-wide text-pine uppercase">Timetable</p>
          <h1 className="mt-2 font-serif text-4xl">{entry.subject || "No subject"}</h1>
          <p className="mt-2 text-slate-600">
            {timetableDayLabel(entry.dayOfWeek)} · {entry.startTime || "No start"} – {entry.endTime || "No end"}
          </p>
        </div>
        {canManage ? (
          <Link to={`/app/timetables/${entry.id}/edit`} className={buttonClass("primary")}>
            Edit lesson
          </Link>
        ) : null}
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <dl className="grid gap-4 rounded-xl border border-line bg-white p-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-slate-600">Class</dt>
          <dd className="mt-1 text-sm font-medium">
            {entry.classRef ? `${entry.classRef.name}, section ${entry.classRef.section}` : "Not returned"}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Teacher</dt>
          <dd className="mt-1 text-sm font-medium">
            {entry.teacher
              ? `${entry.teacher.firstName} ${entry.teacher.lastName}${entry.teacher.teacherId ? ` · ${entry.teacher.teacherId}` : ""}`
              : "Not returned"}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Room</dt>
          <dd className="mt-1 text-sm font-medium">{entry.room || "No room"}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Academic year</dt>
          <dd className="mt-1 text-sm font-medium">{entry.academicYear || "Not returned"}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Status</dt>
          <dd className="mt-1 text-sm font-medium">{timetableStatusLabel(entry.status)}</dd>
        </div>
      </dl>
      {canManage ? (
        <div className="rounded-xl border border-rose-200 bg-white p-4">
          <h2 className="text-base font-medium">Delete lesson</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            This removes the timetable entry. It does not delete the class or the teacher.
          </p>
          {confirmingDelete ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="danger" busy={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
                {deleteMutation.isPending ? "Deleting" : "Confirm delete"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button type="button" variant="danger" className="mt-4" onClick={() => setConfirmingDelete(true)}>
              Delete lesson
            </Button>
          )}
        </div>
      ) : null}
      <Link to="/app/timetables" className={buttonClass("secondary")}>
        Back to timetable
      </Link>
    </section>
  );
}
