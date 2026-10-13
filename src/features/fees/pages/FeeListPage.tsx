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
import { fetchStudents, studentListKey } from "../../students/api";
import { feeListKey, feeSummaryKey, fetchFeeSummary, fetchFees } from "../api";
import {
  canManageFees,
  feeListIntroduction,
  feeStatusLabel,
  feeStudentLabel,
  formatFeeAmount,
  formatFeeDate,
  readNotice,
} from "../display";
import { feeListQueryForPersona, parseFeeListQuery } from "../query";
import { FEE_STATUSES, type FeeListQuery, type FeeStatus, type FeeSummary } from "../types";

function replaceQuery(
  current: URLSearchParams,
  setSearchParams: (next: URLSearchParams) => void,
  next: Partial<FeeListQuery>,
) {
  const query = { ...parseFeeListQuery(current), ...next };
  const params = new URLSearchParams();
  if (query.studentId) params.set("studentId", query.studentId);
  if (query.status) params.set("status", query.status);
  if (query.academicYear) params.set("academicYear", query.academicYear);
  if (query.term) params.set("term", query.term);
  if (query.page > 1) params.set("page", String(query.page));
  setSearchParams(params);
}

export function FeeListPage() {
  const access = useAccess();
  const location = useLocation();
  const notice = readNotice(location.state);
  const persona = access.context?.persona;
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = parseFeeListQuery(searchParams);
  const query = feeListQueryForPersona(requested, persona);
  const [yearDraft, setYearDraft] = useState(query.academicYear);
  const [termDraft, setTermDraft] = useState(query.term);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentQueryText, setStudentQueryText] = useState("");
  const feesQuery = useQuery({
    queryKey: feeListKey(query),
    queryFn: () => fetchFees(query),
  });
  const summaryStudentId = persona === "student" ? access.context?.studentProfileId : query.studentId;
  const summaryQuery = useQuery({
    queryKey: feeSummaryKey(summaryStudentId ?? "", query.academicYear || undefined),
    queryFn: () => fetchFeeSummary(summaryStudentId ?? "", query.academicYear || undefined),
    enabled: Boolean(summaryStudentId),
  });
  const studentsQuery = useQuery({
    queryKey: studentListKey({ search: studentQueryText, status: "", page: 1 }),
    queryFn: () => fetchStudents({ search: studentQueryText, status: "", page: 1 }),
    enabled: persona !== "student" && studentQueryText.length > 0,
  });

  useEffect(() => {
    setYearDraft(query.academicYear);
    setTermDraft(query.term);
  }, [query.academicYear, query.term]);

  const filtered = Boolean(query.status || query.academicYear || query.term || query.studentId);

  return (
    <section className="mx-auto grid max-w-5xl gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Fees</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">{feeListIntroduction(persona)}</p>
        </div>
        {canManageFees(persona) ? (
          <Link to="/app/fees/new" className={buttonClass("primary")}>
            Add fee
          </Link>
        ) : null}
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {summaryQuery.data ? <FeeSummaryPanel summary={summaryQuery.data} academicYear={query.academicYear} /> : null}
      {summaryQuery.error ? <ServerErrorAlert error={getApiErrorMessage(summaryQuery.error)} /> : null}
      <form
        className="grid gap-4 rounded-xl border border-line bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          replaceQuery(searchParams, setSearchParams, {
            academicYear: yearDraft.trim(),
            term: termDraft.trim(),
            page: 1,
          });
        }}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <SelectField
            label="Status"
            name="status"
            value={query.status}
            onChange={(event) =>
              replaceQuery(searchParams, setSearchParams, { status: event.target.value as FeeStatus | "", page: 1 })
            }
          >
            <option value="">All statuses</option>
            {FEE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {feeStatusLabel(status)}
              </option>
            ))}
          </SelectField>
          <TextField label="Academic year" name="academicYear" value={yearDraft} onChange={(event) => setYearDraft(event.target.value)} />
          <TextField label="Term" name="term" value={termDraft} onChange={(event) => setTermDraft(event.target.value)} />
        </div>
        {persona !== "student" ? (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-60 flex-1">
                <TextField
                  label="Find a student"
                  name="studentSearch"
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  hint="Filters by a student you are allowed to see."
                />
              </div>
              <Button type="button" variant="secondary" onClick={() => setStudentQueryText(studentSearch.trim())}>
                Find student
              </Button>
              {query.studentId ? (
                <Button type="button" variant="ghost" onClick={() => replaceQuery(searchParams, setSearchParams, { studentId: "", page: 1 })}>
                  Clear student
                </Button>
              ) : null}
            </div>
            {studentsQuery.data && studentsQuery.data.students.length > 0 ? (
              <SelectField
                label="Student"
                name="studentId"
                value={query.studentId}
                onChange={(event) => replaceQuery(searchParams, setSearchParams, { studentId: event.target.value, page: 1 })}
              >
                <option value="">All students in this search</option>
                {studentsQuery.data.students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} · {student.studentId}
                  </option>
                ))}
              </SelectField>
            ) : null}
            {studentsQuery.data && studentsQuery.data.students.length === 0 ? (
              <p className="text-sm text-slate-700">No students matched that search.</p>
            ) : null}
            {studentsQuery.error ? <ServerErrorAlert error={getApiErrorMessage(studentsQuery.error)} /> : null}
          </div>
        ) : null}
        <Button type="submit" variant="secondary">
          Apply filters
        </Button>
      </form>
      {feesQuery.isLoading ? <Spinner label="Loading fees" /> : null}
      {feesQuery.error ? <ServerErrorAlert error={getApiErrorMessage(feesQuery.error)} /> : null}
      {feesQuery.data ? (
        <FeeResults
          fees={feesQuery.data.fees}
          total={feesQuery.data.total}
          page={feesQuery.data.page}
          totalPages={feesQuery.data.totalPages}
          filtered={filtered}
          onPage={(page) => replaceQuery(searchParams, setSearchParams, { page })}
        />
      ) : null}
    </section>
  );
}

function FeeResults({
  fees,
  total,
  page,
  totalPages,
  filtered,
  onPage,
}: {
  fees: { id: string; title: string; status: FeeStatus; amount: number; dueDate: string; student: Parameters<typeof feeStudentLabel>[0] }[];
  total: number;
  page: number;
  totalPages: number;
  filtered: boolean;
  onPage: (page: number) => void;
}) {
  if (fees.length === 0) {
    return (
      <Alert tone="info">
        <p className="font-medium">{filtered ? "No fees match these filters" : "No fees to show"}</p>
        <p className="mt-2 text-sm">
          {filtered ? "Try another status, year, term, or student." : "There are no fee records in this view."}
        </p>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm text-slate-600" aria-live="polite">
        {total} {total === 1 ? "fee" : "fees"}
        {totalPages > 1 ? `, page ${page} of ${totalPages}` : ""}
      </p>
      <ul className="grid gap-3">
        {fees.map((fee) => (
          <li key={fee.id}>
            <Link
              to={`/app/fees/${fee.id}`}
              className="grid gap-1 rounded-xl border border-line bg-white px-4 py-4 hover:border-pine focus-visible:ring-2 focus-visible:ring-pine focus-visible:outline-none"
            >
              <span className="font-medium text-ink">{fee.title}</span>
              <span className="text-sm text-slate-600">
                {feeStudentLabel(fee.student)} · {feeStatusLabel(fee.status)} · {formatFeeAmount(fee.amount)}
              </span>
              <span className="text-sm text-slate-600">Due {formatFeeDate(fee.dueDate)}</span>
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

export function FeeSummaryPanel({ summary, academicYear }: { summary: FeeSummary; academicYear: string }) {
  const rows = [
    ["Records", summary.total],
    ["Amount", formatFeeAmount(summary.totalAmount)],
    ["Paid", formatFeeAmount(summary.totalPaid)],
    ["Outstanding", formatFeeAmount(summary.totalPending)],
    ["Pending", summary.pending],
    ["Partially paid", summary.partial],
    ["Paid records", summary.paid],
    ["Overdue", summary.overdue],
  ];
  return (
    <section className="rounded-xl border border-line bg-white p-4">
      <h2 className="text-base font-medium">Summary{academicYear ? ` · ${academicYear}` : ""}</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map(([label, value]) => (
          <div key={String(label)}>
            <dt className="text-sm text-slate-600">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
