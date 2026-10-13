import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ServerErrorAlert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { TextField } from "../../components/ui/TextField";
import { getApiErrorMessage } from "../../services/api-error";
import { accountLinkState, accountSearchKey, searchAccounts, type AccountChoice } from "./api";

export function AccountPicker({
  profile,
  selectedId,
  onSelect,
}: {
  profile: "student" | "teacher";
  selectedId: string;
  onSelect: (account: AccountChoice) => void;
}) {
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [chosen, setChosen] = useState<AccountChoice | null>(null);
  const query = useQuery({
    queryKey: accountSearchKey(search),
    queryFn: () => searchAccounts(search),
    enabled: search.length >= 2,
  });
  const selected = chosen?.id === selectedId ? chosen : query.data?.users.find((account) => account.id === selectedId);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-60 flex-1">
          <TextField
            label="Find an account"
            name="accountSearch"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            hint="Search by name, username, or email. At least 2 characters."
          />
        </div>
        <Button type="button" variant="secondary" onClick={() => setSearch(draft.trim())}>
          Find account
        </Button>
      </div>
      {selected ? (
        <p className="text-sm text-slate-700">
          Selected: {selected.firstname} {selected.lastname} · {selected.email}
        </p>
      ) : null}
      {query.isFetching ? <Spinner label="Searching accounts" /> : null}
      {query.error ? <ServerErrorAlert error={getApiErrorMessage(query.error)} /> : null}
      {query.data && query.data.users.length === 0 ? (
        <p className="text-sm text-slate-600">No accounts match that search.</p>
      ) : null}
      {query.data && query.data.users.length > 0 ? (
        <ul className="grid gap-2">
          {query.data.users.map((account) => {
            const state = accountLinkState(account, profile);
            return (
              <li key={account.id}>
                <button
                  type="button"
                  disabled={state.disabled}
                  aria-pressed={account.id === selectedId}
                  className="w-full rounded-lg border border-line bg-white px-3 py-3 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => {
                    setChosen(account);
                    onSelect(account);
                  }}
                >
                  <span className="font-medium text-ink">
                    {account.firstname} {account.lastname}
                  </span>
                  <span className="mt-1 block text-slate-600">
                    {account.username} · {account.email}
                    {state.reason ? ` · ${state.reason}` : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
