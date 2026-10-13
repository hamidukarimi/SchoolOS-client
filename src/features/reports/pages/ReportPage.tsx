import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { Spinner } from "../../../components/ui/Spinner";
import { TextField } from "../../../components/ui/TextField";
import { useAccess } from "../../access/access-context";
import { getApiErrorMessage } from "../../../services/api-error";
import { fetchClasses, classListKey } from "../../classes/api";
import { fetchStudents, studentListKey } from "../../students/api";
import { downloadReportCsv, fetchReport, reportKey } from "../api";
import { reportById } from "../display";
import { parseReportFilters, reportRequestParams, reportSearch } from "../query";
import type { ReportFilters } from "../types";

export function ReportPage() {
  const { reportId = "" } = useParams();
  const access = useAccess();
  const persona = access.context?.persona;
  const report = reportById(reportId, persona);
  const [searchParams, setSearchParams] = useSearchParams();
  const applied = parseReportFilters(searchParams);
  const running = searchParams.get("run") === "1";
  const queryText = searchParams.toString();
  const [draft, setDraft] = useState<ReportFilters>(applied);
  const [exportError, setExportError] = useState<string | null>(null);
  const params = report ? reportRequestParams(applied, report) : {};
  const resultQuery = useQuery({
    queryKey: reportKey(reportId, params),
    queryFn: () => fetchReport(report!, params),
    enabled: Boolean(report) && running,
  });
  const needsClass = Boolean(report?.filters.includes("classId"));
  const needsStudent = Boolean(report?.filters.includes("studentId") && persona !== "student");
  const classesQuery = useQuery({
    queryKey: classListKey({ search: "", status: "", grade: "", academicYear: "", page: 1 }),
    queryFn: () => fetchClasses({ search: "", status: "", grade: "", academicYear: "", page: 1 }),
    enabled: needsClass,
  });
  useEffect(() => {
    setDraft(parseReportFilters(searchParams));
  }, [queryText, searchParams]);

  const studentsQuery = useQuery({
    queryKey: studentListKey({ search: "", status: "", page: 1 }),
    queryFn: () => fetchStudents({ search: "", status: "", page: 1 }),
    enabled: needsStudent,
  });

  if (!report) {
    return (
      <section className="mx-auto grid max-w-3xl gap-4">
        <h1 className="font-serif text-4xl">Report unavailable</h1>
        <p className="leading-7 text-slate-700">This report is not available for the current account.</p>
        <Link to="/app/reports" className={buttonClass("secondary")}>
          Back to reports
        </Link>
      </section>
    );
  }

  function update(next: Partial<ReportFilters>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  function apply(filters: ReportFilters) {
    setSearchParams(new URLSearchParams(reportSearch(filters, report!, true).replace(/^\?/, "")));
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">{report.title}</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">{report.description}</p>
        </div>
        <Link to="/app/reports" className={buttonClass("secondary")}>
          All reports
        </Link>
      </div>
      <form
        className="grid gap-4 rounded-xl border border-line bg-white p-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          apply({ ...draft, page: 1 });
        }}
      >
        {report.filters.includes("academicYear") ? (
          <TextField label="Academic year" name="academicYear" value={draft.academicYear} onChange={(event) => update({ academicYear: event.target.value })} />
        ) : null}
        {report.filters.includes("term") ? (
          <TextField label="Term" name="term" value={draft.term} onChange={(event) => update({ term: event.target.value })} />
        ) : null}
        {report.filters.includes("subject") ? (
          <TextField label="Subject" name="subject" value={draft.subject} onChange={(event) => update({ subject: event.target.value })} />
        ) : null}
        {report.filters.includes("from") ? (
          <TextField label="From" name="from" type="date" value={draft.from} onChange={(event) => update({ from: event.target.value })} />
        ) : null}
        {report.filters.includes("to") ? (
          <TextField label="To" name="to" type="date" value={draft.to} onChange={(event) => update({ to: event.target.value })} />
        ) : null}
        {needsClass ? (
          <SelectField label="Class" name="classId" value={draft.classId} onChange={(event) => update({ classId: event.target.value })}>
            <option value="">All classes in this view</option>
            {classesQuery.data?.classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.section}
              </option>
            ))}
          </SelectField>
        ) : null}
        {needsStudent ? (
          <SelectField label="Student" name="studentId" value={draft.studentId} onChange={(event) => update({ studentId: event.target.value })}>
            <option value="">All students in this view</option>
            {studentsQuery.data?.students.map((item) => (
              <option key={item.id} value={item.id}>
                {item.firstName} {item.lastName} · {item.studentId}
              </option>
            ))}
          </SelectField>
        ) : null}
        {report.statuses.length > 0 ? (
          <SelectField label="Status" name="status" value={draft.status} onChange={(event) => update({ status: event.target.value })}>
            <option value="">All statuses</option>
            {report.statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </SelectField>
        ) : null}
        <div className="flex flex-wrap items-end gap-2">
          <Button type="submit">Run report</Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!running || resultQuery.isFetching}
            onClick={() => {
              setExportError(null);
              void downloadReportCsv(report, params).catch((error: unknown) => {
                setExportError(error instanceof Error ? error.message : "The report could not be exported.");
              });
            }}
          >
            Export CSV
          </Button>
        </div>
      </form>
      {!running ? (
        <Alert tone="info">
          <p className="font-medium">Choose filters and run the report</p>
        </Alert>
      ) : null}
      {exportError ? <Alert tone="error">{exportError}</Alert> : null}
      {resultQuery.isLoading ? <Spinner label="Running report" /> : null}
      {resultQuery.error ? <ServerErrorAlert error={getApiErrorMessage(resultQuery.error)} /> : null}
      {resultQuery.data && resultQuery.data.rows.length === 0 ? (
        <Alert tone="info">
          <p className="font-medium">No rows match these filters</p>
        </Alert>
      ) : null}
      {resultQuery.data && resultQuery.data.rows.length > 0 ? (
        <div className="grid gap-4">
          <dl className="grid gap-3 rounded-xl border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
            {resultQuery.data.summary.map((item) => (
              <div key={item.label}>
                <dt className="text-sm text-slate-600">{item.label}</dt>
                <dd className="mt-1 text-lg font-medium text-ink">{item.value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-slate-600" aria-live="polite">
            {resultQuery.data.total} {resultQuery.data.total === 1 ? "row" : "rows"}
            {resultQuery.data.totalPages > 1 ? `, page ${resultQuery.data.page} of ${resultQuery.data.totalPages}` : ""}
          </p>
          <div className="overflow-x-auto rounded-xl border border-line bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-line bg-mist">
                <tr>
                  {report.columns.map((column) => (
                    <th key={column.key} scope="col" className="px-3 py-2 font-medium text-slate-700">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resultQuery.data.rows.map((row, index) => (
                  <tr key={`${String(row.id ?? index)}`} className="border-b border-line last:border-0">
                    {report.columns.map((column) => (
                      <td key={column.key} className="px-3 py-2 text-ink">
                        {row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {resultQuery.data.totalPages > 1 ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" disabled={applied.page <= 1} onClick={() => apply({ ...applied, page: applied.page - 1 })}>
                Previous page
              </Button>
              <Button type="button" variant="secondary" disabled={applied.page >= resultQuery.data.totalPages} onClick={() => apply({ ...applied, page: applied.page + 1 })}>
                Next page
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
