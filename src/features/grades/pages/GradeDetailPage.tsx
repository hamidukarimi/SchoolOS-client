import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { useAccess } from "../../access/access-context";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import {
  deleteGrade,
  fetchGrade,
  fetchGradeSummary,
  gradeDetailKey,
  gradeInvalidationKey,
  gradeSummaryKey,
} from "../api";
import {
  canManageGrades,
  formatGradeDate,
  formatStoredGrade,
  marksPercentage,
  readNotice,
} from "../display";
import { GradeSummaryPanel } from "./GradeListPage";

export function GradeDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const access = useAccess();
  const queryClient = useQueryClient();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const notice = readNotice(location.state);
  const recordQuery = useQuery({
    queryKey: gradeDetailKey(id),
    queryFn: () => fetchGrade(id),
    enabled: Boolean(id),
  });
  const studentId = recordQuery.data?.student?.id;
  const academicYear = recordQuery.data?.academicYear;
  const summaryQuery = useQuery({
    queryKey: gradeSummaryKey(studentId ?? "", academicYear),
    queryFn: () => fetchGradeSummary(studentId ?? "", academicYear || undefined),
    enabled: Boolean(studentId),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteGrade(id),
    onSuccess: async (message) => {
      await queryClient.invalidateQueries({ queryKey: gradeInvalidationKey });
      navigate("/app/grades", { replace: true, state: { notice: message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  if (recordQuery.isLoading) return <FullPageSpinner label="Loading result" />;

  if (recordQuery.error || !recordQuery.data) {
    return (
      <section className="mx-auto grid max-w-3xl gap-4">
        <ServerErrorAlert
          error={
            recordQuery.error
              ? getApiErrorMessage(recordQuery.error)
              : { message: "This result could not be loaded.", errors: [] }
          }
        />
        <Link to="/app/grades" className={buttonClass("secondary")}>
          Back to results
        </Link>
      </section>
    );
  }

  const record = recordQuery.data;
  const canManage = canManageGrades(access.context?.persona);
  const percentage = marksPercentage(record.marksObtained, record.totalMarks);

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-wide text-pine uppercase">Result</p>
          <h1 className="mt-2 font-serif text-4xl">
            {record.student ? `${record.student.firstName} ${record.student.lastName}` : "Student name not returned"}
          </h1>
          <p className="mt-2 text-slate-600">
            {record.exam?.title ?? "Exam name not returned"} · {formatStoredGrade(record.grade)}
          </p>
        </div>
        {canManage ? (
          <Link to={`/app/grades/${record.id}/edit`} className={buttonClass("primary")}>
            Edit result
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
          <dt className="text-sm text-slate-600">Letter</dt>
          <dd className="mt-1 text-sm font-medium">{formatStoredGrade(record.grade)}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Marks</dt>
          <dd className="mt-1 text-sm font-medium">
            {record.marksObtained} / {record.totalMarks}
            {percentage !== null ? ` · ${percentage}% from these marks` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Subject</dt>
          <dd className="mt-1 text-sm font-medium">{record.subject || "Not returned"}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Academic year</dt>
          <dd className="mt-1 text-sm font-medium">{record.academicYear || "Not returned"}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Exam date</dt>
          <dd className="mt-1 text-sm font-medium">{record.exam ? formatGradeDate(record.exam.date) : "Not returned"}</dd>
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
        {record.exam?.passingMarks !== null && record.exam?.passingMarks !== undefined ? (
          <div>
            <dt className="text-sm text-slate-600">Exam passing marks</dt>
            <dd className="mt-1 text-sm font-medium">{record.exam.passingMarks}</dd>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <dt className="text-sm text-slate-600">Remarks</dt>
          <dd className="mt-1 text-sm font-medium">{record.remarks || "No remarks"}</dd>
        </div>
      </dl>
      <p className="text-sm leading-6 text-slate-600">
        The letter is stored on the result. It is calculated from the marks when the result is first saved.
        There is no separate published or unpublished state.
      </p>
      {summaryQuery.data ? <GradeSummaryPanel {...summaryQuery.data} academicYear={academicYear} /> : null}
      {summaryQuery.error ? <ServerErrorAlert error={getApiErrorMessage(summaryQuery.error)} /> : null}
      {canManage ? (
        <div className="rounded-xl border border-rose-200 bg-white p-4">
          <h2 className="text-base font-medium">Delete result</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            This removes the result. It does not delete the student, exam, class, or teacher.
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
              Delete result
            </Button>
          )}
        </div>
      ) : null}
      <Link to="/app/grades" className={buttonClass("secondary")}>
        Back to results
      </Link>
    </section>
  );
}
