import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { Spinner } from "../../../components/ui/Spinner";
import { TextField } from "../../../components/ui/TextField";
import { getApiErrorMessage } from "../../../services/api-error";
import { accountListKey, fetchAccounts } from "../api";
import { accountDirectoryCopy, accountRoleLabel, accountStatusLabel, linkedProfileSummary, readNotice } from "../display";
import { parseAccountListQuery } from "../query";
import { ACCOUNT_ROLES, ACCOUNT_STATUSES, type AccountListQuery, type AccountRole, type AccountStatus } from "../types";

function replaceQuery(
  current: URLSearchParams,
  setSearchParams: (next: URLSearchParams) => void,
  next: Partial<AccountListQuery>,
) {
  const query = { ...parseAccountListQuery(current), ...next };
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.role) params.set("role", query.role);
  if (query.status) params.set("status", query.status);
  if (query.page > 1) params.set("page", String(query.page));
  setSearchParams(params);
}

export function AccountListPage() {
  const location = useLocation();
  const notice = readNotice(location.state);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = parseAccountListQuery(searchParams);
  const [searchDraft, setSearchDraft] = useState(query.search);
  const accountsQuery = useQuery({
    queryKey: accountListKey(query),
    queryFn: () => fetchAccounts(query),
  });

  useEffect(() => {
    setSearchDraft(query.search);
  }, [query.search]);

  const filtered = Boolean(query.search || query.role || query.status);

  return (
    <section className="mx-auto grid max-w-5xl gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-wide text-pine uppercase">Administrator</p>
          <h1 className="mt-2 font-serif text-4xl">Accounts</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">
            These are login accounts. Creating an account does not add a student profile, teacher profile, or staff record, and a staff record does not change the account role.
          </p>
        </div>
        <Link to="/app/accounts/new" className={buttonClass("primary")}>
          Add account
        </Link>
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      <form
        className="grid gap-4 rounded-xl border border-line bg-white p-4"
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
          hint="Matches first name, last name, username, or email."
        />
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <SelectField
            label="Role"
            name="role"
            value={query.role}
            onChange={(event) =>
              replaceQuery(searchParams, setSearchParams, { role: event.target.value as AccountRole | "", page: 1 })
            }
          >
            <option value="">All roles</option>
            {ACCOUNT_ROLES.map((role) => (
              <option key={role} value={role}>
                {accountRoleLabel(role)}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Status"
            name="status"
            value={query.status}
            onChange={(event) =>
              replaceQuery(searchParams, setSearchParams, { status: event.target.value as AccountStatus | "", page: 1 })
            }
          >
            <option value="">All statuses</option>
            {ACCOUNT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {accountStatusLabel(status === "active")}
              </option>
            ))}
          </SelectField>
          <Button type="submit">Search</Button>
        </div>
      </form>
      {accountsQuery.isLoading ? <Spinner label={accountDirectoryCopy("loading")} /> : null}
      {accountsQuery.error ? (
        <div className="grid gap-2">
          <p className="text-sm font-medium text-rose-800">{accountDirectoryCopy("error")}</p>
          <ServerErrorAlert error={getApiErrorMessage(accountsQuery.error)} />
        </div>
      ) : null}
      {accountsQuery.data && accountsQuery.data.accounts.length === 0 ? (
        <Alert tone="info" title={filtered ? "No accounts match these filters" : "No accounts to show"}>
          {accountDirectoryCopy(filtered ? "filtered" : "empty")}
        </Alert>
      ) : null}
      {accountsQuery.data && accountsQuery.data.accounts.length > 0 ? (
        <div className="grid gap-4">
          <p className="text-sm text-slate-600" aria-live="polite">
            {accountsQuery.data.total} {accountsQuery.data.total === 1 ? "account" : "accounts"}
            {accountsQuery.data.totalPages > 1 ? `, page ${accountsQuery.data.page} of ${accountsQuery.data.totalPages}` : ""}
          </p>
          <ul className="grid gap-3">
            {accountsQuery.data.accounts.map((account) => (
              <li key={account.id}>
                <Link
                  to={`/app/accounts/${account.id}`}
                  className="grid gap-1 rounded-xl border border-line bg-white px-4 py-4 hover:border-pine focus-visible:ring-2 focus-visible:ring-pine focus-visible:outline-none"
                >
                  <span className="font-medium text-ink">
                    {account.firstname} {account.lastname}
                  </span>
                  <span className="text-sm break-all text-slate-600">
                    {account.username} · {account.email} · {accountRoleLabel(account.role)} · {accountStatusLabel(account.isActive)}
                  </span>
                  <span className="text-sm text-slate-600">{linkedProfileSummary(account)}</span>
                </Link>
              </li>
            ))}
          </ul>
          {accountsQuery.data.totalPages > 1 ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={accountsQuery.data.page <= 1}
                onClick={() => replaceQuery(searchParams, setSearchParams, { page: accountsQuery.data.page - 1 })}
              >
                Previous page
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={accountsQuery.data.page >= accountsQuery.data.totalPages}
                onClick={() => replaceQuery(searchParams, setSearchParams, { page: accountsQuery.data.page + 1 })}
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
