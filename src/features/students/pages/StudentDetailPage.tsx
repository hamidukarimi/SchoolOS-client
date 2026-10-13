import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { FullPageSpinner, Spinner } from "../../../components/ui/Spinner";
import { useAccess } from "../../access/access-context";
import type { SchoolPersona } from "../../access/types";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { deleteStudent, fetchStudent, fetchStudentClasses, studentClassesKey, studentDetailKey } from "../api";
import {
  canOpenEnrolledClass,
  enrolledClassMeta,
  enrolledClassesEmptyMessage,
  enrolledClassesPanel,
  enrolledClassTeacherLabel,
  enrolledClassTitle,
  formatStudentDate,
  readNotice,
  studentGenderLabel,
  studentStatusLabel,
} from "../display";
import type { EnrolledClass, StudentRecord } from "../types";

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
  const classesQuery = useQuery({
    queryKey: studentClassesKey(id),
    queryFn: () => fetchStudentClasses(id),
    enabled: Boolean(id) && studentQuery.isSuccess,
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
      <EnrolledClasses
        classes={classesQuery.data ?? []}
        panel={enrolledClassesPanel(
          classesQuery.isPending ? "loading" : classesQuery.isError ? "error" : "ready",
          classesQuery.data?.length ?? 0,
        )}
        error={classesQuery.error ? getApiErrorMessage(classesQuery.error) : null}
        persona={access.context?.persona}
        teacherProfileId={access.context?.teacherProfileId}
      />
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

export function EnrolledClasses({
  classes,
  panel,
  error,
  persona,
  teacherProfileId,
}: {
  classes: EnrolledClass[];
  panel: "loading" | "error" | "empty" | "list";
  error: ParsedApiError | null;
  persona: SchoolPersona | undefined;
  teacherProfileId?: string;
}) {
  return (
    <section className="rounded-xl border border-line bg-white p-4">
      <h2 className="text-base font-medium text-ink">Enrolled classes</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        These are the classes that include this student.
      </p>
      {panel === "loading" ? (
        <div className="mt-4">
          <Spinner label="Loading classes" />
        </div>
      ) : null}
      {panel === "error" && error ? (
        <div className="mt-4">
          <ServerErrorAlert error={error} />
        </div>
      ) : null}
      {panel === "empty" ? <p className="mt-4 text-sm text-slate-700">{enrolledClassesEmptyMessage}</p> : null}
      {panel === "list" ? (
        <ul className="mt-4 grid gap-3">
          {classes.map((entry) => {
            const title = enrolledClassTitle(entry);
            const open = canOpenEnrolledClass(persona, teacherProfileId, entry);
            return (
              <li key={entry.id} className="rounded-lg border border-line px-4 py-3">
                {open ? (
                  <Link to={`/app/classes/${entry.id}`} className="font-medium text-ink hover:text-pine">
                    {title}
                  </Link>
                ) : (
                  <p className="font-medium text-ink">{title}</p>
                )}
                <p className="mt-1 text-sm text-slate-600">{enrolledClassMeta(entry)}</p>
                <p className="mt-1 text-sm text-slate-600">{enrolledClassTeacherLabel(entry)}</p>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
