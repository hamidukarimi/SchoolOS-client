import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { Spinner } from "../../../components/ui/Spinner";
import { TextField } from "../../../components/ui/TextField";
import { getApiErrorMessage } from "../../../services/api-error";
import { fetchStaff, fetchStaffSummary, staffListKey, staffSummaryKey } from "../api";
import {
  formatStaffAmount,
  readNotice,
  staffContractLabel,
  staffStatusLabel,
} from "../display";
import { parseStaffListQuery } from "../query";
import {
  STAFF_CONTRACT_TYPES,
  STAFF_STATUSES,
  type StaffContractType,
  type StaffListQuery,
  type StaffStatus,
} from "../types";

function replaceQuery(
  current: URLSearchParams,
  setSearchParams: (next: URLSearchParams) => void,
  next: Partial<StaffListQuery>,
) {
  const query = { ...parseStaffListQuery(current), ...next };
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.department) params.set("department", query.department);
  if (query.status) params.set("status", query.status);
  if (query.contractType) params.set("contractType", query.contractType);
  if (query.page > 1) params.set("page", String(query.page));
  setSearchParams(params);
}

export function StaffListPage() {
  const location = useLocation();
  const notice = readNotice(location.state);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = parseStaffListQuery(searchParams);
  const [searchDraft, setSearchDraft] = useState(query.search);
  const [departmentDraft, setDepartmentDraft] = useState(query.department);
  const staffQuery = useQuery({
    queryKey: staffListKey(query),
    queryFn: () => fetchStaff(query),
  });
  const summaryQuery = useQuery({
    queryKey: staffSummaryKey(),
    queryFn: fetchStaffSummary,
  });

  useEffect(() => {
    setSearchDraft(query.search);
    setDepartmentDraft(query.department);
  }, [query.search, query.department]);

  const filtered = Boolean(query.search || query.department || query.status || query.contractType);

  return (
    <section className="mx-auto grid max-w-5xl gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-wide text-pine uppercase">Administrator</p>
          <h1 className="mt-2 font-serif text-4xl">Staff</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">
            These are staff records. A staff record is separate from a teacher profile and does not change an account role.
          </p>
        </div>
        <Link to="/app/staff/new" className={buttonClass("primary")}>
          Add staff
        </Link>
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {summaryQuery.isLoading ? <Spinner label="Loading staff summary" /> : null}
      {summaryQuery.error ? <ServerErrorAlert error={getApiErrorMessage(summaryQuery.error)} /> : null}
      {summaryQuery.data ? (
        <dl className="grid gap-3 rounded-xl border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryItem label="Total" value={String(summaryQuery.data.total)} />
          <SummaryItem label="Active" value={String(summaryQuery.data.byStatus.active)} />
          <SummaryItem label="Inactive" value={String(summaryQuery.data.byStatus.inactive)} />
          <SummaryItem label="Suspended" value={String(summaryQuery.data.byStatus.suspended)} />
          <SummaryItem label="Terminated" value={String(summaryQuery.data.byStatus.terminated)} />
          <SummaryItem label="Full-time" value={String(summaryQuery.data.byContractType.fullTime)} />
          <SummaryItem label="Part-time" value={String(summaryQuery.data.byContractType.partTime)} />
          <SummaryItem label="Contract" value={String(summaryQuery.data.byContractType.contract)} />
          <SummaryItem label="Total monthly salary" value={formatStaffAmount(summaryQuery.data.totalMonthlySalary)} />
        </dl>
      ) : null}
      <form
        className="grid gap-4 rounded-xl border border-line bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          replaceQuery(searchParams, setSearchParams, {
            search: searchDraft.trim(),
            department: departmentDraft.trim(),
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
            hint="Matches first name, last name, staff ID, or position."
          />
          <TextField
            label="Department"
            name="department"
            value={departmentDraft}
            onChange={(event) => setDepartmentDraft(event.target.value)}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <SelectField
            label="Status"
            name="status"
            value={query.status}
            onChange={(event) =>
              replaceQuery(searchParams, setSearchParams, { status: event.target.value as StaffStatus | "", page: 1 })
            }
          >
            <option value="">All statuses</option>
            {STAFF_STATUSES.map((status) => (
              <option key={status} value={status}>
                {staffStatusLabel(status)}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Contract type"
            name="contractType"
            value={query.contractType}
            onChange={(event) =>
              replaceQuery(searchParams, setSearchParams, {
                contractType: event.target.value as StaffContractType | "",
                page: 1,
              })
            }
          >
            <option value="">All contract types</option>
            {STAFF_CONTRACT_TYPES.map((contractType) => (
              <option key={contractType} value={contractType}>
                {staffContractLabel(contractType)}
              </option>
            ))}
          </SelectField>
          <Button type="submit">Search</Button>
        </div>
      </form>
      {staffQuery.isLoading ? <Spinner label="Loading staff" /> : null}
      {staffQuery.error ? <ServerErrorAlert error={getApiErrorMessage(staffQuery.error)} /> : null}
      {staffQuery.data && staffQuery.data.staff.length === 0 ? (
        <Alert tone="info" title={filtered ? "No staff match these filters" : "No staff to show"}>
          {filtered ? "Try another name, staff ID, department, status, or contract type." : "There are no staff records yet."}
        </Alert>
      ) : null}
      {staffQuery.data && staffQuery.data.staff.length > 0 ? (
        <div className="grid gap-4">
          <p className="text-sm text-slate-600" aria-live="polite">
            {staffQuery.data.total} {staffQuery.data.total === 1 ? "staff member" : "staff members"}
            {staffQuery.data.totalPages > 1 ? `, page ${staffQuery.data.page} of ${staffQuery.data.totalPages}` : ""}
          </p>
          <ul className="grid gap-3">
            {staffQuery.data.staff.map((member) => (
              <li key={member.id}>
                <Link
                  to={`/app/staff/${member.id}`}
                  className="grid gap-1 rounded-xl border border-line bg-white px-4 py-4 hover:border-pine focus-visible:ring-2 focus-visible:ring-pine focus-visible:outline-none"
                >
                  <span className="font-medium text-ink">
                    {member.firstName} {member.lastName}
                  </span>
                  <span className="text-sm text-slate-600">
                    {member.staffId} · {member.department} · {member.position} · {staffStatusLabel(member.status)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {staffQuery.data.totalPages > 1 ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={staffQuery.data.page <= 1}
                onClick={() => replaceQuery(searchParams, setSearchParams, { page: staffQuery.data.page - 1 })}
              >
                Previous page
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={staffQuery.data.page >= staffQuery.data.totalPages}
                onClick={() => replaceQuery(searchParams, setSearchParams, { page: staffQuery.data.page + 1 })}
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

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="mt-1 text-lg font-medium text-ink">{value}</dd>
    </div>
  );
}
