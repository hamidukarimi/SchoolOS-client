import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { toDateInputValue } from "../../auth/schemas";
import { useAuth } from "../../auth/auth-context";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { accountDetailKey, accountInvalidationKey, fetchAccount, updateAccount } from "../api";
import { accountRoleLabel, accountStatusLabel, linkedProfileSummary, readNotice } from "../display";
import type { AccountRecord } from "../types";

export function AccountDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const notice = readNotice(location.state);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [noticeOverride, setNoticeOverride] = useState<string | null>(null);
  const accountQuery = useQuery({
    queryKey: accountDetailKey(id),
    queryFn: () => fetchAccount(id),
    enabled: Boolean(id),
  });
  const statusMutation = useMutation({
    mutationFn: (isActive: boolean) => updateAccount(id, { isActive }),
    onSuccess: async (result) => {
      setConfirming(false);
      setServerError(null);
      setNoticeOverride(result.message);
      await queryClient.invalidateQueries({ queryKey: accountInvalidationKey });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  if (accountQuery.isLoading) return <FullPageSpinner label="Loading account" />;

  if (accountQuery.error || !accountQuery.data) {
    return (
      <section className="mx-auto grid max-w-3xl gap-4">
        <ServerErrorAlert
          error={
            accountQuery.error
              ? getApiErrorMessage(accountQuery.error)
              : { message: "This account could not be loaded.", errors: [] }
          }
        />
        <Link to="/app/accounts" className={buttonClass("secondary")}>
          Back to accounts
        </Link>
      </section>
    );
  }

  const account = accountQuery.data;
  const isSelf = account.id === user?.id;

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-wide text-pine uppercase">Account</p>
          <h1 className="mt-2 font-serif text-4xl">
            {account.firstname} {account.lastname}
          </h1>
          <p className="mt-2 text-slate-600">
            {accountRoleLabel(account.role)} · {accountStatusLabel(account.isActive)}
          </p>
        </div>
        <Link to={`/app/accounts/${account.id}/edit`} className={buttonClass("primary")}>
          Edit account
        </Link>
      </div>
      {noticeOverride || notice ? <Alert tone="success">{noticeOverride ?? notice}</Alert> : null}
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <AccountFacts account={account} />
      <div className="rounded-xl border border-line bg-white p-4">
        <h2 className="text-base font-medium text-ink">Account status</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Deactivation signs the account out and stops it from opening protected pages. Student profiles, teacher profiles, staff records, and messages stay in place. Accounts are not deleted.
        </p>
        {isSelf ? (
          <p className="mt-3 text-sm text-slate-700">Your own administrator access cannot be removed from this page.</p>
        ) : account.isActive ? (
          confirming ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="danger" busy={statusMutation.isPending} onClick={() => statusMutation.mutate(false)}>
                {statusMutation.isPending ? "Deactivating" : "Confirm deactivation"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button type="button" variant="danger" className="mt-4" onClick={() => setConfirming(true)}>
              Deactivate account
            </Button>
          )
        ) : (
          <Button type="button" className="mt-4" busy={statusMutation.isPending} onClick={() => statusMutation.mutate(true)}>
            {statusMutation.isPending ? "Reactivating" : "Reactivate account"}
          </Button>
        )}
      </div>
      <Link to="/app/accounts" className={buttonClass("secondary")}>
        Back to accounts
      </Link>
    </section>
  );
}

function AccountFacts({ account }: { account: AccountRecord }) {
  const location = [account.location?.city, account.location?.country].filter(Boolean).join(", ");
  const rows = [
    ["Username", account.username],
    ["Email", account.email],
    ["Role", accountRoleLabel(account.role)],
    ["Status", accountStatusLabel(account.isActive)],
    ["Linked records", linkedProfileSummary(account)],
    ["Gender", account.gender ?? "Not recorded"],
    ["Birthday", toDateInputValue(account.birthday) || "Not recorded"],
    ["Location", location || "Not recorded"],
    ["Email verified", account.isVerified ? "Yes" : "No"],
  ];

  return (
    <div className="grid gap-4">
      <dl className="grid gap-4 rounded-xl border border-line bg-white p-4 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-slate-600">{label}</dt>
            <dd className="mt-1 text-sm font-medium break-all text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-2">
        {account.studentProfileId ? (
          <Link to={`/app/students/${account.studentProfileId}`} className={buttonClass("secondary")}>
            Open student profile
          </Link>
        ) : null}
        {account.teacherProfileId ? (
          <Link to={`/app/teachers/${account.teacherProfileId}`} className={buttonClass("secondary")}>
            Open teacher profile
          </Link>
        ) : null}
        {account.staffRecordId ? (
          <Link to={`/app/staff/${account.staffRecordId}`} className={buttonClass("secondary")}>
            Open staff record
          </Link>
        ) : null}
      </div>
    </div>
  );
}
