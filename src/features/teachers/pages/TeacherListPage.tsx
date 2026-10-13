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
import { fetchTeachers, teacherListKey } from "../api";
import {
  readNotice,
  teacherEmptyMessage,
  teacherEmptyTitle,
  teacherListHeading,
  teacherListIntroduction,
  teacherStatusLabel,
} from "../display";
import { parseTeacherListQuery } from "../query";
import { TEACHER_STATUSES, type TeacherListQuery, type TeacherStatus } from "../types";

function replaceQuery(
  current: URLSearchParams,
  setSearchParams: (next: URLSearchParams) => void,
  next: Partial<TeacherListQuery>,
) {
  const query = { ...parseTeacherListQuery(current), ...next };
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.page > 1) params.set("page", String(query.page));
  setSearchParams(params);
}

export function TeacherListPage() {
  const access = useAccess();
  const location = useLocation();
  const notice = readNotice(location.state);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = parseTeacherListQuery(searchParams);
  const [searchDraft, setSearchDraft] = useState(query.search);
  const persona = access.context?.persona;
  const teachersQuery = useQuery({
    queryKey: teacherListKey(query),
    queryFn: () => fetchTeachers(query),
  });

  useEffect(() => {
    setSearchDraft(query.search);
  }, [query.search]);

  return (
    <section className="mx-auto grid max-w-5xl gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">{teacherListHeading(persona)}</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">{teacherListIntroduction(persona)}</p>
        </div>
        {persona === "admin" ? (
          <Link to="/app/teachers/new" className={buttonClass("primary")}>
            Add teacher
          </Link>
        ) : null}
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}

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
          hint="Matches first name, last name, teacher ID, or subject."
        />
        <SelectField
          label="Status"
          name="status"
          value={query.status}
          onChange={(event) => {
            const status = event.target.value as TeacherStatus | "";
            replaceQuery(searchParams, setSearchParams, { status, page: 1 });
          }}
        >
          <option value="">All statuses</option>
          {TEACHER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {teacherStatusLabel(status)}
            </option>
          ))}
        </SelectField>
        <Button type="submit">Search</Button>
      </form>

      {teachersQuery.isLoading ? <Spinner label="Loading teachers" /> : null}
      {teachersQuery.error ? <ServerErrorAlert error={getApiErrorMessage(teachersQuery.error)} /> : null}

      {teachersQuery.data ? (
        <TeacherResults
          teachers={teachersQuery.data.teachers}
          total={teachersQuery.data.total}
          page={teachersQuery.data.page}
          totalPages={teachersQuery.data.totalPages}
          filtered={Boolean(query.search || query.status)}
          emptyMessage={teacherEmptyMessage(persona, Boolean(query.search || query.status))}
          onPage={(page) => replaceQuery(searchParams, setSearchParams, { page })}
        />
      ) : null}
    </section>
  );
}

function TeacherResults({
  teachers,
  total,
  page,
  totalPages,
  filtered,
  emptyMessage,
  onPage,
}: {
  teachers: Awaited<ReturnType<typeof fetchTeachers>>["teachers"];
  total: number;
  page: number;
  totalPages: number;
  filtered: boolean;
  emptyMessage: string;
  onPage: (page: number) => void;
}) {
  if (teachers.length === 0) {
    return (
      <Alert tone="info" title={teacherEmptyTitle(filtered)}>
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
        {total} {total === 1 ? "teacher" : "teachers"}
        {totalPages > 1 ? `, page ${page} of ${totalPages}` : ""}
      </p>
      <ul className="grid gap-3">
        {teachers.map((teacher) => (
          <li key={teacher.id}>
            <Link
              to={`/app/teachers/${teacher.id}`}
              className="grid gap-1 rounded-xl border border-line bg-white px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine hover:border-pine"
            >
              <span className="font-medium text-ink">
                {teacher.firstName} {teacher.lastName}
              </span>
              <span className="text-sm text-slate-600">
                {teacher.teacherId}
                {teacher.subject ? ` · ${teacher.subject}` : ""} · {teacherStatusLabel(teacher.status)}
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
