import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { Spinner } from "../../../components/ui/Spinner";
import { TextField } from "../../../components/ui/TextField";
import { getApiErrorMessage } from "../../../services/api-error";
import { classListKey, fetchClasses } from "../../classes/api";
import { classStatusLabel } from "../../classes/display";
import { parseClassListQuery } from "../../classes/query";
import { CLASS_STATUSES, type ClassListQuery, type ClassStatus } from "../../classes/types";

function replaceQuery(
  current: URLSearchParams,
  setSearchParams: (next: URLSearchParams) => void,
  next: Partial<ClassListQuery>,
) {
  const query = { ...parseClassListQuery(current), ...next };
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.grade) params.set("grade", query.grade);
  if (query.academicYear) params.set("academicYear", query.academicYear);
  if (query.page > 1) params.set("page", String(query.page));
  setSearchParams(params);
}

export function EnrollmentListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = parseClassListQuery(searchParams);
  const [searchDraft, setSearchDraft] = useState(query.search);
  const [gradeDraft, setGradeDraft] = useState(query.grade);
  const [yearDraft, setYearDraft] = useState(query.academicYear);
  const classesQuery = useQuery({
    queryKey: classListKey(query),
    queryFn: () => fetchClasses(query),
  });

  useEffect(() => {
    setSearchDraft(query.search);
    setGradeDraft(query.grade);
    setYearDraft(query.academicYear);
  }, [query.search, query.grade, query.academicYear]);

  const filtered = Boolean(query.search || query.status || query.grade || query.academicYear);

  return (
    <section className="mx-auto grid max-w-5xl gap-6">
      <div>
        <h1 className="font-serif text-4xl">Enrollment</h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-700">
          Choose a class to add or remove students on that class list. This does not change the class
          field on a student profile, and the API does not store a separate enrollment date.
        </p>
      </div>
      <form
        className="grid gap-4 rounded-xl border border-line bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          replaceQuery(searchParams, setSearchParams, {
            search: searchDraft.trim(),
            grade: gradeDraft.trim(),
            academicYear: yearDraft.trim(),
            page: 1,
          });
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Search"
            name="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            hint="Matches class name, section, or grade."
          />
          <SelectField
            label="Status"
            name="status"
            value={query.status}
            onChange={(event) => {
              replaceQuery(searchParams, setSearchParams, {
                status: event.target.value as ClassStatus | "",
                page: 1,
              });
            }}
          >
            <option value="">All statuses</option>
            {CLASS_STATUSES.map((status) => (
              <option key={status} value={status}>
                {classStatusLabel(status)}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Grade"
            name="grade"
            value={gradeDraft}
            onChange={(event) => setGradeDraft(event.target.value)}
            hint="Matches the grade exactly."
          />
          <TextField
            label="Academic year"
            name="academicYear"
            value={yearDraft}
            onChange={(event) => setYearDraft(event.target.value)}
            hint="Matches the academic year exactly."
          />
        </div>
        <Button type="submit" className="w-fit">
          Apply filters
        </Button>
      </form>
      {classesQuery.isLoading ? <Spinner label="Loading classes" /> : null}
      {classesQuery.error ? <ServerErrorAlert error={getApiErrorMessage(classesQuery.error)} /> : null}
      {classesQuery.data && classesQuery.data.classes.length === 0 ? (
        <Alert tone="info" title={filtered ? "No classes match these filters" : "No classes to show"}>
          {filtered ? "Try a different name, section, grade, academic year, or status." : "Create a class before enrolling students."}
        </Alert>
      ) : null}
      {classesQuery.data && classesQuery.data.classes.length > 0 ? (
        <div className="grid gap-4">
          <p className="text-sm text-slate-600" aria-live="polite">
            {classesQuery.data.total} {classesQuery.data.total === 1 ? "class" : "classes"}
            {classesQuery.data.totalPages > 1
              ? `, page ${classesQuery.data.page} of ${classesQuery.data.totalPages}`
              : ""}
          </p>
          <ul className="grid gap-3">
            {classesQuery.data.classes.map((classRecord) => (
              <li key={classRecord.id}>
                <Link
                  to={`/app/enrollments/${classRecord.id}`}
                  className="grid gap-1 rounded-xl border border-line bg-white px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine hover:border-pine"
                >
                  <span className="font-medium text-ink">
                    {classRecord.name}, section {classRecord.section}
                  </span>
                  <span className="text-sm text-slate-600">
                    Grade {classRecord.grade} · {classRecord.academicYear} · {classStatusLabel(classRecord.status)}
                  </span>
                  <span className="text-sm text-slate-600">
                    {classRecord.studentCount} of {classRecord.capacity}{" "}
                    {classRecord.capacity === 1 ? "seat" : "seats"} filled
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {classesQuery.data.totalPages > 1 ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={classesQuery.data.page <= 1}
                onClick={() => replaceQuery(searchParams, setSearchParams, { page: classesQuery.data.page - 1 })}
              >
                Previous page
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={classesQuery.data.page >= classesQuery.data.totalPages}
                onClick={() => replaceQuery(searchParams, setSearchParams, { page: classesQuery.data.page + 1 })}
              >
                Next page
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
