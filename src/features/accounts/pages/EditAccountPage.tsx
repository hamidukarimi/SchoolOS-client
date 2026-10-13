import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router";
import { ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { toDateInputValue } from "../../auth/schemas";
import { useAuth } from "../../auth/auth-context";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { accountDetailKey, accountInvalidationKey, fetchAccount, updateAccount } from "../api";
import { accountRoleLabel, accountStatusLabel } from "../display";
import { editAccountFormSchema, toAccountUpdatePayload, type EditAccountFormValues } from "../schemas";
import { ACCOUNT_ROLES, ACCOUNT_STATUSES, type AccountRecord } from "../types";
import { AccountFields, type AccountIdentityValues } from "./AccountForm";

function toFormValues(account: AccountRecord): EditAccountFormValues {
  return {
    firstname: account.firstname,
    lastname: account.lastname,
    username: account.username,
    email: account.email,
    password: "",
    birthday: toDateInputValue(account.birthday),
    gender: account.gender ?? "",
    city: account.location?.city ?? "",
    country: account.location?.country ?? "",
    role: account.role,
    status: account.isActive ? "active" : "inactive",
  };
}

export function EditAccountPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuth();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const accountQuery = useQuery({
    queryKey: accountDetailKey(id),
    queryFn: () => fetchAccount(id),
    enabled: Boolean(id),
  });
  const lockAccess = accountQuery.data?.id === user?.id;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditAccountFormValues>({
    resolver: zodResolver(editAccountFormSchema),
    defaultValues: accountQuery.data ? toFormValues(accountQuery.data) : undefined,
  });

  useEffect(() => {
    if (!accountQuery.data || isDirty) return;
    reset(toFormValues(accountQuery.data));
  }, [accountQuery.data, isDirty, reset]);

  const mutation = useMutation({
    mutationFn: (values: EditAccountFormValues) => updateAccount(id, toAccountUpdatePayload(values, lockAccess)),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: accountInvalidationKey });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      if (user && result.account.id === user.id) {
        updateUser({
          ...user,
          firstname: result.account.firstname,
          lastname: result.account.lastname,
          username: result.account.username,
          email: result.account.email,
          role: result.account.role,
          isActive: result.account.isActive,
        });
      }
      navigate(`/app/accounts/${id}`, { replace: true, state: { notice: result.message } });
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

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-pine uppercase">Administrator</p>
        <h1 className="mt-2 font-serif text-4xl">Edit account</h1>
        <p className="mt-3 leading-7 text-slate-700">
          {lockAccess
            ? "This is your own account. Role and status stay unchanged here so you cannot remove your administrator access."
            : "Saving a new password signs that account out of existing sessions. School profiles linked to the account stay in place."}
        </p>
      </div>
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <form className="grid gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
        <AccountFields
          register={register as UseFormRegister<AccountIdentityValues>}
          errors={errors as FieldErrors<AccountIdentityValues>}
          passwordDisabled={lockAccess}
          passwordHint={
            lockAccess
              ? "Use Password in the account menu to change your own password."
              : "Leave blank to keep the current password."
          }
        />
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField label="Role" error={errors.role?.message} disabled={lockAccess} {...register("role")}>
            {ACCOUNT_ROLES.map((role) => (
              <option key={role} value={role}>
                {accountRoleLabel(role)}
              </option>
            ))}
          </SelectField>
          <SelectField label="Status" error={errors.status?.message} disabled={lockAccess} {...register("status")}>
            {ACCOUNT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {accountStatusLabel(status === "active")}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" busy={mutation.isPending}>
            {mutation.isPending ? "Saving" : "Save account"}
          </Button>
          <Link to={`/app/accounts/${id}`} className={buttonClass("secondary")}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
