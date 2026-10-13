import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { TextField } from "../../../components/ui/TextField";
import { AccountPicker } from "../../accounts/AccountPicker";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { createStaff, staffInvalidationKey } from "../api";
import { createStaffFormSchema, toStaffCreatePayload, type CreateStaffFormValues } from "../schemas";
import { StaffFields } from "./StaffForm";

const emptyValues: CreateStaffFormValues = {
  userId: "",
  staffId: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "female",
  phone: "",
  address: "",
  department: "",
  position: "",
  salary: "",
  joinDate: "",
  contractType: "full-time",
  status: "active",
};

export function CreateStaffPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const form = useForm<CreateStaffFormValues>({
    resolver: zodResolver(createStaffFormSchema),
    defaultValues: emptyValues,
  });
  const mutation = useMutation({
    mutationFn: (values: CreateStaffFormValues) => createStaff(toStaffCreatePayload(values)),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: staffInvalidationKey });
      navigate(`/app/staff/${result.staff.id}`, { replace: true, state: { notice: result.message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });
  const { errors } = form.formState;

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-pine uppercase">Administrator</p>
        <h1 className="mt-2 font-serif text-4xl">Add staff</h1>
        <p className="mt-3 leading-7 text-slate-700">
          Link a staff record to an account that already exists. This does not create a login, change the account role, or add a teacher or student profile.
        </p>
      </div>
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
        <AccountPicker
          profile="staff"
          selectedId={form.watch("userId")}
          onSelect={(account) => form.setValue("userId", account.id, { shouldValidate: true })}
        />
        {errors.userId ? <p className="text-sm text-rose-700">{errors.userId.message}</p> : null}
        <TextField label="Staff ID" error={errors.staffId?.message} {...form.register("staffId")} />
        <StaffFields register={form.register} errors={errors} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" busy={mutation.isPending}>
            {mutation.isPending ? "Saving" : "Create staff"}
          </Button>
          <Link to="/app/staff" className={buttonClass("secondary")}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
