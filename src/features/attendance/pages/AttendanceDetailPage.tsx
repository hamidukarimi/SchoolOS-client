import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { useAccess } from "../../access/access-context";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import {
  attendanceDetailKey,
  attendanceInvalidationKey,
  attendanceSummaryKey,
  deleteAttendance,
  fetchAttendanceRecord,
  fetchAttendanceSummary,
} from "../api";
import {
  attendanceStatusLabel,
  canManageAttendance,
  formatAttendanceDate,
  readNotice,
} from "../display";
import { AttendanceSummaryPanel } from "./AttendanceListPage";

export function AttendanceDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const access = useAccess();
  const queryClient = useQueryClient();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const notice = readNotice(location.state);
  const recordQuery = useQuery({
    queryKey: attendanceDetailKey(id),
    queryFn: () => fetchAttendanceRecord(id),
    enabled: Boolean(id),
  });
  const studentId = recordQuery.data?.student?.id;
  const classId = recordQuery.data?.classRef?.id;
  const summaryQuery = useQuery({
    queryKey: attendanceSummaryKey(studentId ?? "", classId),
    queryFn: () => fetchAttendanceSummary(studentId ?? "", classId),
    enabled: Boolean(studentId),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteAttendance(id),
    onSuccess: async (message) => {
      await queryClient.invalidateQueries({ queryKey: attendanceInvalidationKey });
      navigate("/app/attendance", { replace: true, state: { notice: message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  if (recordQuery.isLoading) return <FullPageSpinner label="Loading attendance" />;

  if (recordQuery.error || !recordQuery.data) {
    return (
      <section className="mx-auto grid max-w-3xl gap-4">
        <ServerErrorAlert
          error={
            recordQuery.error
              ? getApiErrorMessage(recordQuery.error)
              : { message: "This attendance record could not be loaded.", errors: [] }
          }
        />
        <Link to="/app/attendance" className={buttonClass("secondary")}>
          Back to attendance
        </Link>
      </section>
    );
  }

  const record = recordQuery.data;
  const canManage = canManageAttendance(access.context?.persona);

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-wide text-pine uppercase">Attendance</p>
          <h1 className="mt-2 font-serif text-4xl">
            {record.student ? `${record.student.firstName} ${record.student.lastName}` : "Student name not returned"}
          </h1>
          <p className="mt-2 text-slate-600">
            {formatAttendanceDate(record.date)} · {attendanceStatusLabel(record.status)}
          </p>
        </div>
        {canManage ? (
          <Link to={`/app/attendance/${record.id}/edit`} className={buttonClass("primary")}>
            Edit attendance
          </Link>
        ) : null}
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <dl className="grid gap-4 rounded-xl border border-line bg-white p-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-slate-600">Student ID</dt>
          <dd className="mt-1 text-sm font-medium">{record.student?.studentId || "Not returned"}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Status</dt>
          <dd className="mt-1 text-sm font-medium">{attendanceStatusLabel(record.status)}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Class</dt>
          <dd className="mt-1 text-sm font-medium">
            {record.classRef ? `${record.classRef.name}, section ${record.classRef.section}` : "Not returned"}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Teacher</dt>
          <dd className="mt-1 text-sm font-medium">
            {record.teacher
              ? `${record.teacher.firstName} ${record.teacher.lastName}${record.teacher.teacherId ? ` · ${record.teacher.teacherId}` : ""}`
              : "Not returned"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm text-slate-600">Note</dt>
          <dd className="mt-1 text-sm font-medium">{record.note || "No note"}</dd>
        </div>
      </dl>
      {summaryQuery.data ? <AttendanceSummaryPanel {...summaryQuery.data} /> : null}
      {summaryQuery.error ? <ServerErrorAlert error={getApiErrorMessage(summaryQuery.error)} /> : null}
      {canManage ? (
        <div className="rounded-xl border border-rose-200 bg-white p-4">
          <h2 className="text-base font-medium">Delete attendance record</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            This removes the attendance record. It does not delete the student, class, or teacher.
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
              Delete record
            </Button>
          )}
        </div>
      ) : null}
      <Link to="/app/attendance" className={buttonClass("secondary")}>
        Back to attendance
      </Link>
    </section>
  );
}
