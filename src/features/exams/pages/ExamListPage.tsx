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
import { examListKey, fetchExams } from "../api";
import { canManageExams, examListIntroduction, examStatusLabel, formatExamDate, readNotice } from "../display";
import { examListQueryForPersona, parseExamListQuery } from "../query";
import { EXAM_STATUSES, type ExamListQuery, type ExamStatus } from "../types";

function replaceQuery(
  current: URLSearchParams,
  setSearchParams: (next: URLSearchParams) => void,
  next: Partial<ExamListQuery>,
) {
  const query = { ...parseExamListQuery(current), ...next };
  const params = new URLSearchParams();
  if (query.classId) params.set("classId", query.classId);
  if (query.teacherId) params.set("teacherId", query.teacherId);
  if (query.subject) params.set("subject", query.subject);
  if (query.status) params.set("status", query.status);
  if (query.academicYear) params.set("academicYear", query.academicYear);
  if (query.page > 1) params.set("page", String(query.page));
  setSearchParams(params);
}

export function ExamListPage() {
  const access = useAccess();
  const location = useLocation();
  const notice = readNotice(location.state);
  const persona = access.context?.persona;
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = parseExamListQuery(searchParams);
  const query = examListQueryForPersona(requested, persona);
  const [subjectDraft, setSubjectDraft] = useState(query.subject);
  const [yearDraft, setYearDraft] = useState(query.academicYear);
  const [classSearch, setClassSearch] = useState("");
  const [classQueryText, setClassQueryText] = useState("");
  const examsQuery = useQuery({
    queryKey: examListKey(query),
    queryFn: () => fetchExams(query),
  });
  const classesQuery = useQuery({
    queryKey: classListKey({ search: classQueryText, status: "", grade: "", academicYear: "", page: 1 }),
    queryFn: () => fetchClasses({ search: classQueryText, status: "", grade: "", academicYear: "", page: 1 }),
    enabled: persona !== "student" && classQueryText.length > 0,
  });

  useEffect(() => {
    setSubjectDraft(query.subject);
    setYearDraft(query.academicYear);
  }, [query.subject, query.academicYear]);

  const filtered = Boolean(query.subject || query.academicYear || query.status || query.classId);

  return (
    <section className="mx-auto grid max-w-5xl gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Exams</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">{examListIntroduction(persona)}</p>
          <p className="mt-2 text-sm text-slate-600">The server lists exams by date, earliest first. Title search is not available.</p>
        </div>
        {canManageExams(persona) ? (
          <Link to="/app/exams/new" className={buttonClass("primary")}>
            New exam
          </Link>
        ) : null}
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      <form
        className="grid gap-4 rounded-xl border border-line bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          replaceQuery(searchParams, setSearchParams, { subject: subjectDraft.trim(), academicYear: yearDraft.trim(), page: 1 });
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Subject"
            name="subject"
            value={subjectDraft}
            onChange={(event) => setSubjectDraft(event.target.value)}
            hint="Matches part of the subject."
          />
          <TextField
            label="Academic year"
            name="academicYear"
            value={yearDraft}
            onChange={(event) => setYearDraft(event.target.value)}
            hint="Matches the academic year exactly."
          />
        </div>
        <SelectField
          label="Status"
          name="status"
          value={query.status}
          onChange={(event) => {
            replaceQuery(searchParams, setSearchParams, { status: event.target.value as ExamStatus | "", page: 1 });
          }}
        >
          <option value="">All statuses</option>
          {EXAM_STATUSES.map((status) => (
            <option key={status} value={status}>
              {examStatusLabel(status)}
            </option>
          ))}
        </SelectField>
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
          Apply subject and year
        </Button>
      </form>
      {examsQuery.isLoading ? <Spinner label="Loading exams" /> : null}
      {examsQuery.error ? (
        <div className="grid gap-3">
          <ServerErrorAlert error={getApiErrorMessage(examsQuery.error)} />
          <Button type="button" variant="secondary" className="w-fit" onClick={() => examsQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : null}
      {examsQuery.data && examsQuery.data.exams.length === 0 ? (
        <Alert tone="info" title={filtered ? "No exams match these filters" : "No exams to show"}>
          {filtered ? "Try another subject, academic year, status, or class." : "No exams are available in this view."}
        </Alert>
      ) : null}
      {examsQuery.data && examsQuery.data.exams.length > 0 ? (
        <div className="grid gap-4">
          <p className="text-sm text-slate-600" aria-live="polite">
            {examsQuery.data.total} {examsQuery.data.total === 1 ? "exam" : "exams"}
            {examsQuery.data.totalPages > 1 ? `, page ${examsQuery.data.page} of ${examsQuery.data.totalPages}` : ""}
          </p>
          <ul className="grid gap-3">
            {examsQuery.data.exams.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/app/exams/${item.id}`}
                  className="grid gap-1 rounded-xl border border-line bg-white px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine hover:border-pine"
                >
                  <span className="font-medium text-ink">{item.title}</span>
                  <span className="text-sm text-slate-600">
                    {formatExamDate(item.date)} · {item.subject || "No subject"} · {examStatusLabel(item.status)}
                  </span>
                  <span className="text-sm text-slate-600">
                    {item.classRef ? `${item.classRef.name}, section ${item.classRef.section}` : "Class name not returned"} ·{" "}
                    {item.totalMarks} total · {item.passingMarks} to pass
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {examsQuery.data.totalPages > 1 ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={examsQuery.data.page <= 1}
                onClick={() => replaceQuery(searchParams, setSearchParams, { page: examsQuery.data.page - 1 })}
              >
                Previous page
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={examsQuery.data.page >= examsQuery.data.totalPages}
                onClick={() => replaceQuery(searchParams, setSearchParams, { page: examsQuery.data.page + 1 })}
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
