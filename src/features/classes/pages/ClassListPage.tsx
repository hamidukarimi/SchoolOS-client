import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { Spinner } from "../../../components/ui/Spinner";
import { TextField } from "../../../components/ui/TextField";
import { useAccess } from "../../access/access-context";
import { getApiErrorMessage } from "../../../services/api-error";
import { classListKey, fetchClasses } from "../api";
import {
  canManageClasses,
  classEmptyMessage,
  classEmptyTitle,
  classListHeading,
  classListIntroduction,
  classStatusLabel,
  classTeacherLabel,
  readNotice,
  showsClassSearch,
} from "../display";
import { parseClassListQuery } from "../query";
import { CLASS_STATUSES, type ClassListQuery, type ClassStatus } from "../types";

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

export function ClassListPage() {
  const access = useAccess();
  const location = useLocation();
  const notice = readNotice(location.state);
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = parseClassListQuery(searchParams);
  const persona = access.context?.persona;
  const allowSearch = showsClassSearch(persona);
  const query = allowSearch ? requested : { ...requested, search: "" };
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

  return (
    <section className="mx-auto grid max-w-5xl gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">{classListHeading()}</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">{classListIntroduction(persona)}</p>
        </div>
        {canManageClasses(persona) ? (
          <Link to="/app/classes/new" className={buttonClass("primary")}>
            New class
          </Link>
        ) : null}
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      <form
        className="grid gap-4 rounded-xl border border-line bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          replaceQuery(searchParams, setSearchParams, {
            search: allowSearch ? searchDraft.trim() : "",
            grade: gradeDraft.trim(),
            academicYear: yearDraft.trim(),
            page: 1,
          });
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {allowSearch ? (
            <TextField
              label="Search"
              name="search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              hint="Matches class name, section, or grade."
            />
          ) : null}
          <SelectField
            label="Status"
            name="status"
            value={query.status}
            onChange={(event) => {
              const status = event.target.value as ClassStatus | "";
              replaceQuery(searchParams, setSearchParams, { status, page: 1 });
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
      {classesQuery.data ? (
        <ClassResults
          classes={classesQuery.data.classes}
          total={classesQuery.data.total}
          page={classesQuery.data.page}
          totalPages={classesQuery.data.totalPages}
          filtered={Boolean(query.search || query.status || query.grade || query.academicYear)}
          emptyMessage={classEmptyMessage(persona, Boolean(query.search || query.status || query.grade || query.academicYear))}
          onPage={(page) => replaceQuery(searchParams, setSearchParams, { page })}
        />
      ) : null}
    </section>
  );
}

function ClassResults({
  classes,
  total,
  page,
  totalPages,
  filtered,
  emptyMessage,
  onPage,
}: {
  classes: Awaited<ReturnType<typeof fetchClasses>>["classes"];
  total: number;
  page: number;
  totalPages: number;
  filtered: boolean;
  emptyMessage: string;
  onPage: (page: number) => void;
}) {
  if (classes.length === 0) {
    return (
      <Alert tone="info" title={classEmptyTitle(filtered)}>
        {emptyMessage}
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
        {total} {total === 1 ? "class" : "classes"}
        {totalPages > 1 ? `, page ${page} of ${totalPages}` : ""}
      </p>
      <ul className="grid gap-3">
        {classes.map((classRecord) => (
          <li key={classRecord.id}>
            <Link
              to={`/app/classes/${classRecord.id}`}
              className="grid gap-1 rounded-xl border border-line bg-white px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine hover:border-pine"
            >
              <span className="font-medium text-ink">
                {classRecord.name}, section {classRecord.section}
              </span>
              <span className="text-sm text-slate-600">
                Grade {classRecord.grade} · {classRecord.academicYear} · {classStatusLabel(classRecord.status)}
              </span>
              <span className="text-sm text-slate-600">
                {classTeacherLabel(classRecord.teacher)} · {classRecord.studentCount}{" "}
                {classRecord.studentCount === 1 ? "student" : "students"}
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
          <Button type="button" variant="secondary" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
            Next page
          </Button>
        </div>
      ) : null}
    </div>
  );
}
