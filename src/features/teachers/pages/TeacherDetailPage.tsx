import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { useAccess } from "../../access/access-context";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { deleteTeacher, fetchTeacher, teacherDetailKey } from "../api";
import {
  canManageTeachers,
  formatTeacherDate,
  formatTeacherNumber,
  readNotice,
  teacherGenderLabel,
  teacherStatusLabel,
} from "../display";
import type { TeacherRecord } from "../types";

export function TeacherDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const access = useAccess();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const notice = readNotice(location.state);
  const teacherQuery = useQuery({
    queryKey: teacherDetailKey(id),
    queryFn: () => fetchTeacher(id),
    enabled: Boolean(id),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteTeacher(id),
    onSuccess: async (message) => {
      await queryClient.invalidateQueries({ queryKey: ["teachers"] });
      navigate("/app/teachers", { replace: true, state: { notice: message } });
    },
    onError: (error) => {
      setServerError(getApiErrorMessage(error));
    },
  });

  if (teacherQuery.isLoading) {
    return <FullPageSpinner label="Loading teacher" />;
  }

  if (teacherQuery.error || !teacherQuery.data) {
    return (
      <section className="mx-auto grid max-w-3xl gap-4">
        <ServerErrorAlert
          error={
            teacherQuery.error
              ? getApiErrorMessage(teacherQuery.error)
              : { message: "This teacher could not be loaded.", errors: [] }
          }
        />
        <Link to="/app/teachers" className={buttonClass("secondary")}>
          Back to teachers
        </Link>
      </section>
    );
  }

  const teacher = teacherQuery.data;
  const canManage = canManageTeachers(access.context?.persona);

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-wide text-pine uppercase">Teacher</p>
          <h1 className="mt-2 font-serif text-4xl">
            {teacher.firstName} {teacher.lastName}
          </h1>
          <p className="mt-2 text-slate-600">
            {teacher.teacherId}
            {teacher.subject ? ` · ${teacher.subject}` : ""} · {teacherStatusLabel(teacher.status)}
          </p>
        </div>
        {canManage ? (
          <Link to={`/app/teachers/${teacher.id}/edit`} className={buttonClass("primary")}>
            Edit teacher
          </Link>
        ) : null}
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <TeacherFacts teacher={teacher} />
      {canManage ? (
        <div className="rounded-xl border border-rose-200 bg-white p-4">
          <h2 className="text-base font-medium text-ink">Delete teacher profile</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            This removes the teacher profile. It does not delete the linked user account, and it does
            not change classes that list this teacher.
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
              Delete teacher
            </Button>
          )}
        </div>
      ) : null}
      <Link to="/app/teachers" className={buttonClass("secondary")}>
        Back to teachers
      </Link>
    </section>
  );
}

export function TeacherFacts({ teacher }: { teacher: TeacherRecord }) {
  const rows = [
    ["Teacher ID", teacher.teacherId],
    ["Status", teacherStatusLabel(teacher.status)],
    ["Subject", teacher.subject || "Not recorded"],
    ["Qualification", teacher.qualification || "Not recorded"],
    ["Experience", formatTeacherNumber(teacher.experience)],
    ["Salary", formatTeacherNumber(teacher.salary)],
    ["Date of birth", formatTeacherDate(teacher.dateOfBirth)],
    ["Gender", teacherGenderLabel(teacher.gender)],
    ["Phone", teacher.phone || "Not recorded"],
    ["Address", teacher.address || "Not recorded"],
    ["Linked account", teacher.account?.email ?? "No account email was returned"],
    ["Join date", formatTeacherDate(teacher.joinDate)],
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
