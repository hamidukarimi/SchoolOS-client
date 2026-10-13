import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router";
import { ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { feeDetailKey, feeInvalidationKey, fetchFee, updateFee } from "../api";
import { feeDateInput, feeStudentLabel } from "../display";
import { feeFormSchema, toFeeUpdatePayload, type FeeFormValues } from "../schemas";
import { FeeFields } from "./FeeForm";

export function EditFeePage() {
  const { id = "" } = useParams();
  const feeQuery = useQuery({
    queryKey: feeDetailKey(id),
    queryFn: () => fetchFee(id),
    enabled: Boolean(id),
  });

  if (feeQuery.isLoading) return <FullPageSpinner label="Loading fee" />;

  if (feeQuery.error || !feeQuery.data) {
    return (
      <section className="mx-auto grid max-w-3xl gap-4">
        <ServerErrorAlert
          error={feeQuery.error ? getApiErrorMessage(feeQuery.error) : { message: "This fee could not be loaded.", errors: [] }}
        />
        <Link to="/app/fees" className={buttonClass("secondary")}>
          Back to fees
        </Link>
      </section>
    );
  }

  const fee = feeQuery.data;
  return (
    <EditFeeForm
      id={fee.id}
      studentLabel={feeStudentLabel(fee.student)}
      defaults={{
        studentId: fee.student?.id ?? "000000000000000000000000",
        title: fee.title,
        description: fee.description,
        amount: fee.amount,
        dueDate: feeDateInput(fee.dueDate),
        academicYear: fee.academicYear,
        term: fee.term,
        status: fee.status,
      }}
    />
  );
}

function EditFeeForm({ id, studentLabel, defaults }: { id: string; studentLabel: string; defaults: FeeFormValues }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const form = useForm<FeeFormValues>({
    resolver: zodResolver(feeFormSchema),
    defaultValues: defaults,
  });
  const mutation = useMutation({
    mutationFn: (values: FeeFormValues) => updateFee(id, toFeeUpdatePayload(values)),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: feeInvalidationKey });
      navigate(`/app/fees/${id}`, { replace: true, state: { notice: result.message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-pine uppercase">Administrator</p>
        <h1 className="mt-2 font-serif text-4xl">Edit fee</h1>
        <p className="mt-3 leading-7 text-slate-700">
          {defaults.title} · {studentLabel}. Payments are recorded from the fee page.
        </p>
      </div>
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
        <FeeFields form={form} includeStudent={false} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" busy={mutation.isPending}>
            {mutation.isPending ? "Saving" : "Save fee"}
          </Button>
          <Link to={`/app/fees/${id}`} className={buttonClass("secondary")}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
