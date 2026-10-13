import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router";
import { ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { toDateInputValue } from "../../auth/schemas";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { fetchStaffMember, staffDetailKey, staffInvalidationKey, updateStaff } from "../api";
import { staffFormSchema, toStaffWritePayload, type StaffFormValues } from "../schemas";
import type { StaffRecord } from "../types";
import { StaffFields } from "./StaffForm";

function toFormValues(staff: StaffRecord): StaffFormValues {
  return {
    firstName: staff.firstName,
    lastName: staff.lastName,
    dateOfBirth: toDateInputValue(staff.dateOfBirth),
    gender: staff.gender,
    phone: staff.phone,
    address: staff.address,
    department: staff.department,
    position: staff.position,
    salary: String(staff.salary),
    joinDate: toDateInputValue(staff.joinDate),
    contractType: staff.contractType,
    status: staff.status,
  };
}

export function EditStaffPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const staffQuery = useQuery({
    queryKey: staffDetailKey(id),
    queryFn: () => fetchStaffMember(id),
    enabled: Boolean(id),
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: staffQuery.data ? toFormValues(staffQuery.data) : undefined,
  });

  useEffect(() => {
    if (!staffQuery.data || isDirty) return;
    reset(toFormValues(staffQuery.data));
  }, [staffQuery.data, isDirty, reset]);

  const mutation = useMutation({
    mutationFn: (values: StaffFormValues) => updateStaff(id, toStaffWritePayload(values)),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: staffInvalidationKey });
      navigate(`/app/staff/${id}`, { replace: true, state: { notice: result.message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  if (staffQuery.isLoading) return <FullPageSpinner label="Loading staff member" />;

  if (staffQuery.error || !staffQuery.data) {
    return (
      <section className="mx-auto grid max-w-3xl gap-4">
        <ServerErrorAlert
          error={
            staffQuery.error
              ? getApiErrorMessage(staffQuery.error)
              : { message: "This staff member could not be loaded.", errors: [] }
          }
        />
        <Link to="/app/staff" className={buttonClass("secondary")}>
          Back to staff
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-pine uppercase">Administrator</p>
        <h1 className="mt-2 font-serif text-4xl">Edit staff</h1>
        <p className="mt-3 leading-7 text-slate-700">
          Staff ID {staffQuery.data.staffId} and the linked account stay as they were created. Saving does not change the account role.
        </p>
      </div>
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <form className="grid gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
        <StaffFields register={register} errors={errors} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" busy={mutation.isPending}>
            {mutation.isPending ? "Saving" : "Save staff"}
          </Button>
          <Link to={`/app/staff/${id}`} className={buttonClass("secondary")}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
