import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { Spinner } from "../../../components/ui/Spinner";
import { TextField } from "../../../components/ui/TextField";
import { useAccess } from "../../access/access-context";
import { getApiErrorMessage } from "../../../services/api-error";
import { fetchStudents, studentListKey } from "../api";
import { studentStatusLabel } from "../display";
import { parseStudentListQuery } from "../query";
import { STUDENT_STATUSES, type StudentListQuery, type StudentStatus } from "../types";

function replaceQuery(
  current: URLSearchParams,
  setSearchParams: (next: URLSearchParams) => void,
  next: Partial<StudentListQuery>,
) {
  const query = { ...parseStudentListQuery(current), ...next };
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.page > 1) params.set("page", String(query.page));
  setSearchParams(params);
}

export function StudentListPage() {
  const access = useAccess();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = parseStudentListQuery(searchParams);
  const [searchDraft, setSearchDraft] = useState(query.search);
  const persona = access.context?.persona;

  useEffect(() => {
    setSearchDraft(query.search);
  }, [query.search]);
  const studentsQuery = useQuery({
    queryKey: studentListKey(query),
    queryFn: () => fetchStudents(query),
  });

  const heading = persona === "student" ? "Your student record" : "Students";
  const introduction =
    persona === "admin"
      ? "Review and open student profiles. Creating a profile needs an existing user account, and this API does not provide a way to find one."
      : persona === "teacher"
        ? "These are the students enrolled in classes you teach. Only an administrator can change a student profile."
        : "This page shows the student profile linked to your account.";

  return (
    <section className="mx-auto grid max-w-5xl gap-6">
      <div>
        <h1 className="font-serif text-4xl">{heading}</h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-700">{introduction}</p>
      </div>

      <form
        className="grid gap-4 rounded-xl border border-line bg-white p-4 md:grid-cols-[1fr_14rem_auto] md:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          replaceQuery(searchParams, setSearchParams, { search: searchDraft.trim(), page: 1 });
        }}
      >
        <TextField
          label="Search"
          name="search"
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
          hint="Matches first name, last name, or student ID."
        />
        <SelectField
          label="Status"
          name="status"
          value={query.status}
          onChange={(event) => {
            const status = event.target.value as StudentStatus | "";
            replaceQuery(searchParams, setSearchParams, { status, page: 1 });
          }}
        >
          <option value="">All statuses</option>
          {STUDENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {studentStatusLabel(status)}
            </option>
          ))}
        </SelectField>
        <Button type="submit">Search</Button>
      </form>

      {studentsQuery.isLoading ? <Spinner label="Loading students" /> : null}
      {studentsQuery.error ? <ServerErrorAlert error={getApiErrorMessage(studentsQuery.error)} /> : null}

      {studentsQuery.data ? (
        <StudentResults
          students={studentsQuery.data.students}
          total={studentsQuery.data.total}
          page={studentsQuery.data.page}
          totalPages={studentsQuery.data.totalPages}
          filtered={Boolean(query.search || query.status)}
          onPage={(page) => replaceQuery(searchParams, setSearchParams, { page })}
        />
      ) : null}
    </section>
  );
}

function StudentResults({
  students,
  total,
  page,
  totalPages,
  filtered,
  onPage,
}: {
  students: Awaited<ReturnType<typeof fetchStudents>>["students"];
  total: number;
  page: number;
  totalPages: number;
  filtered: boolean;
  onPage: (page: number) => void;
}) {
  if (students.length === 0) {
    return (
      <Alert tone="info" title={filtered ? "No students match this search" : "No students to show"}>
        {filtered
          ? "Try a different name, student ID, or status."
          : "There are no student profiles in this view."}
        {total > 0 ? (
          <Button type="button" variant="secondary" className="mt-3" onClick={() => onPage(1)}>
            Back to the first page
          </Button>
        ) : null}
      </Alert>
    );
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm text-slate-600" aria-live="polite">
        {total} {total === 1 ? "student" : "students"}
        {totalPages > 1 ? `, page ${page} of ${totalPages}` : ""}
      </p>
      <ul className="grid gap-3">
        {students.map((student) => (
          <li key={student.id}>
            <Link
              to={`/app/students/${student.id}`}
              className="grid gap-1 rounded-xl border border-line bg-white px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine hover:border-pine"
            >
              <span className="font-medium text-ink">
                {student.firstName} {student.lastName}
              </span>
              <span className="text-sm text-slate-600">
                {student.studentId} · {studentStatusLabel(student.status)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {totalPages > 1 ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            Previous page
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
          >
            Next page
          </Button>
        </div>
      ) : null}
    </div>
  );
}
