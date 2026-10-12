import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { useAccess } from "../../access/access-context";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { deleteStudent, fetchStudent, studentDetailKey } from "../api";
import { formatStudentDate, readNotice, studentClassLabel, studentGenderLabel, studentStatusLabel } from "../display";
import type { StudentRecord } from "../types";

export function StudentDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const access = useAccess();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const notice = readNotice(location.state);
  const studentQuery = useQuery({
    queryKey: studentDetailKey(id),
    queryFn: () => fetchStudent(id),
    enabled: Boolean(id),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteStudent(id),
    onSuccess: async (message) => {
      await queryClient.invalidateQueries({ queryKey: ["students"] });
      navigate("/app/students", { replace: true, state: { notice: message } });
    },
    onError: (error) => {
      setServerError(getApiErrorMessage(error));
    },
  });

  if (studentQuery.isLoading) {
    return <FullPageSpinner label="Loading student" />;
  }

  if (studentQuery.error || !studentQuery.data) {
    return (
      <section className="mx-auto grid max-w-3xl gap-4">
        <ServerErrorAlert
          error={
            studentQuery.error
              ? getApiErrorMessage(studentQuery.error)
              : { message: "This student could not be loaded.", errors: [] }
          }
        />
        <Link to="/app/students" className={buttonClass("secondary")}>
          Back to students
        </Link>
      </section>
    );
  }

  const student = studentQuery.data;
  const canManage = access.context?.persona === "admin";

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-wide text-pine uppercase">Student</p>
          <h1 className="mt-2 font-serif text-4xl">
            {student.firstName} {student.lastName}
          </h1>
          <p className="mt-2 text-slate-600">
            {student.studentId} · {studentStatusLabel(student.status)}
          </p>
        </div>
        {canManage ? (
          <Link to={`/app/students/${student.id}/edit`} className={buttonClass("primary")}>
            Edit student
          </Link>
        ) : null}
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <StudentFacts student={student} />
      {canManage ? (
        <div className="rounded-xl border border-rose-200 bg-white p-4">
          <h2 className="text-base font-medium text-ink">Delete student profile</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            This removes the student profile. It does not delete the linked user account, and it does
            not change class enrollment lists.
          </p>
          {confirmingDelete ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="danger"
                busy={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending ? "Deleting" : "Confirm delete"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button type="button" variant="danger" className="mt-4" onClick={() => setConfirmingDelete(true)}>
              Delete student
            </Button>
          )}
        </div>
      ) : null}
      <Link to="/app/students" className={buttonClass("secondary")}>
        Back to students
      </Link>
    </section>
  );
}

export function StudentFacts({ student }: { student: StudentRecord }) {
  const rows = [
    ["Student ID", student.studentId],
    ["Status", studentStatusLabel(student.status)],
    ["Date of birth", formatStudentDate(student.dateOfBirth)],
    ["Gender", studentGenderLabel(student.gender)],
    ["Phone", student.phone || "Not recorded"],
    ["Address", student.address || "Not recorded"],
    ["Class", studentClassLabel(student.classSummary)],
    ["Linked account", student.account?.email ?? "No account email was returned"],
    ["Parent or guardian", student.parentName || "Not recorded"],
    ["Parent phone", student.parentPhone || "Not recorded"],
    ["Parent email", student.parentEmail || "Not recorded"],
    ["Enrollment date", formatStudentDate(student.enrollmentDate)],
  ];

  return (
    <dl className="grid gap-4 rounded-xl border border-line bg-white p-4 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-sm text-slate-600">{label}</dt>
          <dd className="mt-1 text-sm font-medium text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
