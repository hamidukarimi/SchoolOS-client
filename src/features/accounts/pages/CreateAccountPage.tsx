import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { accountInvalidationKey, createAccount } from "../api";
import { accountRoleLabel } from "../display";
import { createAccountFormSchema, toAccountCreatePayload, type CreateAccountFormValues } from "../schemas";
import { ACCOUNT_ROLES } from "../types";
import { AccountFields, type AccountIdentityValues } from "./AccountForm";

const emptyValues: CreateAccountFormValues = {
  firstname: "",
  lastname: "",
  username: "",
  email: "",
  password: "",
  birthday: "",
  gender: "",
  city: "",
  country: "",
  role: "user",
};

export function CreateAccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const form = useForm<CreateAccountFormValues>({
    resolver: zodResolver(createAccountFormSchema),
    defaultValues: emptyValues,
  });
  const mutation = useMutation({
    mutationFn: (values: CreateAccountFormValues) => createAccount(toAccountCreatePayload(values)),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: accountInvalidationKey });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      navigate(`/app/accounts/${result.account.id}`, { replace: true, state: { notice: result.message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });
  const { errors } = form.formState;

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-pine uppercase">Administrator</p>
        <h1 className="mt-2 font-serif text-4xl">Add account</h1>
        <p className="mt-3 leading-7 text-slate-700">
          This creates a login. It does not create a student profile, teacher profile, or staff record, and it does not sign that person in on this browser.
        </p>
      </div>
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
        <AccountFields
          register={form.register as UseFormRegister<AccountIdentityValues>}
          errors={errors as FieldErrors<AccountIdentityValues>}
          passwordHint="At least 6 characters. The password is stored only as a hash."
        />
        <SelectField label="Role" error={errors.role?.message} {...form.register("role")}>
          {ACCOUNT_ROLES.map((role) => (
            <option key={role} value={role}>
              {accountRoleLabel(role)}
            </option>
          ))}
        </SelectField>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" busy={mutation.isPending}>
            {mutation.isPending ? "Saving" : "Create account"}
          </Button>
          <Link to="/app/accounts" className={buttonClass("secondary")}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
