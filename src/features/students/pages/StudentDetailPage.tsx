import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { ServerErrorAlert } from "../../../components/ui/Alert";
import { buttonClass } from "../../../components/ui/Button";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { getApiErrorMessage } from "../../../services/api-error";
import { fetchStudent, studentDetailKey } from "../api";
import { formatStudentDate, studentClassLabel, studentGenderLabel, studentStatusLabel } from "../display";
import type { StudentRecord } from "../types";

export function StudentDetailPage() {
  const { id = "" } = useParams();
  const studentQuery = useQuery({
    queryKey: studentDetailKey(id),
    queryFn: () => fetchStudent(id),
    enabled: Boolean(id),
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

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-pine uppercase">Student</p>
        <h1 className="mt-2 font-serif text-4xl">
          {student.firstName} {student.lastName}
        </h1>
        <p className="mt-2 text-slate-600">
          {student.studentId} · {studentStatusLabel(student.status)}
        </p>
      </div>
      <StudentFacts student={student} />
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
