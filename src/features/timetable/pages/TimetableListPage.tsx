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
import { classListKey, fetchClasses } from "../../classes/api";
import { fetchTimetables, timetableListKey } from "../api";
import {
  canManageTimetable,
  groupTimetableByDay,
  readNotice,
  timetableDayLabel,
  timetableListIntroduction,
  timetableStatusLabel,
} from "../display";
import { parseTimetableListQuery, timetableListQueryForPersona } from "../query";
import { TIMETABLE_DAYS, type TimetableDay, type TimetableListQuery } from "../types";

function replaceQuery(
  current: URLSearchParams,
  setSearchParams: (next: URLSearchParams) => void,
  next: Partial<TimetableListQuery>,
) {
  const query = { ...parseTimetableListQuery(current), ...next };
  const params = new URLSearchParams();
  if (query.classId) params.set("classId", query.classId);
  if (query.teacherId) params.set("teacherId", query.teacherId);
  if (query.dayOfWeek) params.set("dayOfWeek", query.dayOfWeek);
  if (query.academicYear) params.set("academicYear", query.academicYear);
  if (query.page > 1) params.set("page", String(query.page));
  setSearchParams(params);
}

export function TimetableListPage() {
  const access = useAccess();
  const location = useLocation();
  const notice = readNotice(location.state);
  const persona = access.context?.persona;
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = parseTimetableListQuery(searchParams);
  const query = timetableListQueryForPersona(requested, persona);
  const [yearDraft, setYearDraft] = useState(query.academicYear);
  const [classSearch, setClassSearch] = useState("");
  const [classQueryText, setClassQueryText] = useState("");
  const timetableQuery = useQuery({
    queryKey: timetableListKey(query),
    queryFn: () => fetchTimetables(query),
  });
  const classesQuery = useQuery({
    queryKey: classListKey({ search: classQueryText, status: "", grade: "", academicYear: "", page: 1 }),
    queryFn: () => fetchClasses({ search: classQueryText, status: "", grade: "", academicYear: "", page: 1 }),
    enabled: persona !== "student" && classQueryText.length > 0,
  });

  useEffect(() => {
    setYearDraft(query.academicYear);
  }, [query.academicYear]);

  const filtered = Boolean(query.academicYear || query.dayOfWeek || query.classId);
  const groups = groupTimetableByDay(timetableQuery.data?.timetables ?? []);

  return (
    <section className="mx-auto grid max-w-5xl gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Timetable</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">{timetableListIntroduction(persona)}</p>
          <p className="mt-2 text-sm text-slate-600">
            Lessons on this page are grouped Monday to Friday. The server fetches them by day name, so a later page can still contain an earlier weekday.
          </p>
        </div>
        {canManageTimetable(persona) ? (
          <Link to="/app/timetables/new" className={buttonClass("primary")}>
            New lesson
          </Link>
        ) : null}
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      <form
        className="grid gap-4 rounded-xl border border-line bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          replaceQuery(searchParams, setSearchParams, { academicYear: yearDraft.trim(), page: 1 });
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Day"
            name="dayOfWeek"
            value={query.dayOfWeek}
            onChange={(event) => {
              replaceQuery(searchParams, setSearchParams, { dayOfWeek: event.target.value as TimetableDay | "", page: 1 });
            }}
          >
            <option value="">All weekdays</option>
            {TIMETABLE_DAYS.map((day) => (
              <option key={day} value={day}>
                {timetableDayLabel(day)}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Academic year"
            name="academicYear"
            value={yearDraft}
            onChange={(event) => setYearDraft(event.target.value)}
            hint="Matches the academic year exactly."
          />
        </div>
        {persona !== "student" ? (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-60 flex-1">
                <TextField
                  label="Find a class"
                  name="classSearch"
                  value={classSearch}
                  onChange={(event) => setClassSearch(event.target.value)}
                  hint="Filters by a class you are allowed to see."
                />
              </div>
              <Button type="button" variant="secondary" onClick={() => setClassQueryText(classSearch.trim())}>
                Find class
              </Button>
              {query.classId ? (
                <Button type="button" variant="ghost" onClick={() => replaceQuery(searchParams, setSearchParams, { classId: "", page: 1 })}>
                  Clear class
                </Button>
              ) : null}
            </div>
            {classesQuery.data ? (
              <SelectField
                label="Class"
                name="classId"
                value={query.classId}
                onChange={(event) => replaceQuery(searchParams, setSearchParams, { classId: event.target.value, page: 1 })}
              >
                <option value="">All classes</option>
                {classesQuery.data.classes.map((classRecord) => (
                  <option key={classRecord.id} value={classRecord.id}>
                    {classRecord.name}, section {classRecord.section}
                  </option>
                ))}
              </SelectField>
            ) : null}
          </div>
        ) : null}
        <Button type="submit" className="w-fit">
          Apply year
        </Button>
      </form>
      {timetableQuery.isLoading ? <Spinner label="Loading timetable" /> : null}
      {timetableQuery.error ? (
        <div className="grid gap-3">
          <ServerErrorAlert error={getApiErrorMessage(timetableQuery.error)} />
          <Button type="button" variant="secondary" className="w-fit" onClick={() => timetableQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : null}
      {timetableQuery.data && timetableQuery.data.timetables.length === 0 ? (
        <Alert tone="info" title={filtered ? "No lessons match these filters" : "No lessons to show"}>
          {filtered ? "Try another day, academic year, or class." : "No timetable entries are available in this view."}
        </Alert>
      ) : null}
      {timetableQuery.data && timetableQuery.data.timetables.length > 0 ? (
        <div className="grid gap-6">
          <p className="text-sm text-slate-600" aria-live="polite">
            {timetableQuery.data.total} {timetableQuery.data.total === 1 ? "lesson" : "lessons"}
            {timetableQuery.data.totalPages > 1
              ? `, page ${timetableQuery.data.page} of ${timetableQuery.data.totalPages}`
              : ""}
          </p>
          {groups.map((group) => (
            <section key={group.day} className="grid gap-3">
              <h2 className="font-serif text-2xl">{timetableDayLabel(group.day)}</h2>
              <ul className="grid gap-3">
                {group.entries.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={`/app/timetables/${item.id}`}
                      className="grid gap-1 rounded-xl border border-line bg-white px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine hover:border-pine"
                    >
                      <span className="font-medium text-ink">
                        {item.startTime || "No start"} – {item.endTime || "No end"} · {item.subject || "No subject"}
                      </span>
                      <span className="text-sm text-slate-600">
                        {item.classRef ? `${item.classRef.name}, section ${item.classRef.section}` : "Class name not returned"} ·{" "}
                        {item.teacher ? `${item.teacher.firstName} ${item.teacher.lastName}` : "Teacher name not returned"}
                      </span>
                      <span className="text-sm text-slate-600">
                        {item.room ? `Room ${item.room}` : "No room"} · {timetableStatusLabel(item.status)} · {item.academicYear || "No year"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {timetableQuery.data.totalPages > 1 ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={timetableQuery.data.page <= 1}
                onClick={() => replaceQuery(searchParams, setSearchParams, { page: timetableQuery.data.page - 1 })}
              >
                Previous page
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={timetableQuery.data.page >= timetableQuery.data.totalPages}
                onClick={() => replaceQuery(searchParams, setSearchParams, { page: timetableQuery.data.page + 1 })}
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
