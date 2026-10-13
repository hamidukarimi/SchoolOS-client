import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { useAccess } from "../../access/access-context";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { fetchGrades, gradeInvalidationKey, gradeListKey } from "../../grades/api";
import { formatStoredGrade } from "../../grades/display";
import { deleteExam, examDetailKey, examInvalidationKey, fetchExam } from "../api";
import { canManageExams, examStatusLabel, formatExamDate, readNotice } from "../display";

export function ExamDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const access = useAccess();
  const queryClient = useQueryClient();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const notice = readNotice(location.state);
  const examQuery = useQuery({
    queryKey: examDetailKey(id),
    queryFn: () => fetchExam(id),
    enabled: Boolean(id),
  });
  const gradeQueryParams = { studentId: "", examId: id, classId: "", subject: "", academicYear: "", page: 1 };
  const gradesQuery = useQuery({
    queryKey: gradeListKey(gradeQueryParams),
    queryFn: () => fetchGrades(gradeQueryParams),
    enabled: Boolean(id),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteExam(id),
    onSuccess: async (message) => {
      await queryClient.invalidateQueries({ queryKey: examInvalidationKey });
      await queryClient.invalidateQueries({ queryKey: gradeInvalidationKey });
      navigate("/app/exams", { replace: true, state: { notice: message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  if (examQuery.isLoading) return <FullPageSpinner label="Loading exam" />;

  if (examQuery.error || !examQuery.data) {
    return (
      <section className="mx-auto grid max-w-3xl gap-4">
        <ServerErrorAlert
          error={
            examQuery.error ? getApiErrorMessage(examQuery.error) : { message: "This exam could not be loaded.", errors: [] }
          }
        />
        <Button type="button" variant="secondary" className="w-fit" onClick={() => examQuery.refetch()}>
          Try again
        </Button>
        <Link to="/app/exams" className={buttonClass("secondary")}>
          Back to exams
        </Link>
      </section>
    );
  }

  const exam = examQuery.data;
  const canManage = canManageExams(access.context?.persona);

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-wide text-pine uppercase">Exam</p>
          <h1 className="mt-2 font-serif text-4xl">{exam.title}</h1>
          <p className="mt-2 text-slate-600">
            {formatExamDate(exam.date)} · {examStatusLabel(exam.status)}
          </p>
        </div>
        {canManage ? (
          <Link to={`/app/exams/${exam.id}/edit`} className={buttonClass("primary")}>
            Edit exam
          </Link>
        ) : null}
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <dl className="grid gap-4 rounded-xl border border-line bg-white p-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-slate-600">Subject</dt>
          <dd className="mt-1 text-sm font-medium">{exam.subject || "Not returned"}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Academic year</dt>
          <dd className="mt-1 text-sm font-medium">{exam.academicYear || "Not returned"}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Class</dt>
          <dd className="mt-1 text-sm font-medium">
            {exam.classRef ? `${exam.classRef.name}, section ${exam.classRef.section}` : "Not returned"}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Teacher</dt>
          <dd className="mt-1 text-sm font-medium">
            {exam.teacher
              ? `${exam.teacher.firstName} ${exam.teacher.lastName}${exam.teacher.teacherId ? ` · ${exam.teacher.teacherId}` : ""}`
              : "Not returned"}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Time</dt>
          <dd className="mt-1 text-sm font-medium">
            {exam.startTime || "Not returned"} – {exam.endTime || "Not returned"}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Marks</dt>
          <dd className="mt-1 text-sm font-medium">
            {exam.totalMarks} total · {exam.passingMarks} to pass
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm text-slate-600">Description</dt>
          <dd className="mt-1 text-sm font-medium">{exam.description || "No description"}</dd>
        </div>
      </dl>
      <section className="rounded-xl border border-line bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-medium">Results for this exam</h2>
          <Link to={`/app/grades?examId=${exam.id}`} className="text-sm underline decoration-line underline-offset-4">
            Open in results
          </Link>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          These are the results this account is allowed to read. A student sees only their own.
        </p>
        {gradesQuery.isLoading ? <p className="mt-3 text-sm text-slate-600">Loading results</p> : null}
        {gradesQuery.error ? (
          <div className="mt-3 grid gap-3">
            <ServerErrorAlert error={getApiErrorMessage(gradesQuery.error)} />
            <Button type="button" variant="secondary" className="w-fit" onClick={() => gradesQuery.refetch()}>
              Try again
            </Button>
          </div>
        ) : null}
        {gradesQuery.data && gradesQuery.data.grades.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No results are recorded for this exam in this view.</p>
        ) : null}
        {gradesQuery.data && gradesQuery.data.grades.length > 0 ? (
          <ul className="mt-3 grid gap-2">
            {gradesQuery.data.grades.map((item) => (
              <li key={item.id} className="text-sm">
                <Link to={`/app/grades/${item.id}`} className="underline decoration-line underline-offset-4">
                  {item.student ? `${item.student.firstName} ${item.student.lastName}` : "Student name not returned"} ·{" "}
                  {item.marksObtained}/{item.totalMarks} · {formatStoredGrade(item.grade)}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {gradesQuery.data && gradesQuery.data.totalPages > 1 ? (
          <p className="mt-3 text-sm text-slate-600">More results exist. Open the results list to see the rest.</p>
        ) : null}
      </section>
      {canManage ? (
        <div className="rounded-xl border border-rose-200 bg-white p-4">
          <h2 className="text-base font-medium">Delete exam</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            This removes the exam. It does not delete results that point at it, and those results can keep an exam id the
            server can no longer fill in.
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
              Delete exam
            </Button>
          )}
        </div>
      ) : null}
      <Link to="/app/exams" className={buttonClass("secondary")}>
        Back to exams
      </Link>
    </section>
  );
}
