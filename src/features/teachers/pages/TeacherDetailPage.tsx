import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { ServerErrorAlert } from "../../../components/ui/Alert";
import { buttonClass } from "../../../components/ui/Button";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { getApiErrorMessage } from "../../../services/api-error";
import { fetchTeacher, teacherDetailKey } from "../api";
import {
  formatTeacherDate,
  formatTeacherNumber,
  teacherGenderLabel,
  teacherStatusLabel,
} from "../display";
import type { TeacherRecord } from "../types";

export function TeacherDetailPage() {
  const { id = "" } = useParams();
  const teacherQuery = useQuery({
    queryKey: teacherDetailKey(id),
    queryFn: () => fetchTeacher(id),
    enabled: Boolean(id),
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

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
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
      <TeacherFacts teacher={teacher} />
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
