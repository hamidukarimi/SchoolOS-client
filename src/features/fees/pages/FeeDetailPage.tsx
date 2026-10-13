import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { TextField } from "../../../components/ui/TextField";
import { useAccess } from "../../access/access-context";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import {
  deleteFee,
  feeDetailKey,
  feeInvalidationKey,
  feeSummaryKey,
  fetchFee,
  fetchFeeSummary,
  recordFeePayment,
} from "../api";
import {
  canManageFees,
  feeOutstanding,
  feeStatusLabel,
  feeStudentLabel,
  formatFeeAmount,
  formatFeeDate,
  readNotice,
} from "../display";
import { paymentFormSchema, toPaymentPayload, type PaymentFormValues } from "../schemas";
import { FeeSummaryPanel } from "./FeeListPage";

export function FeeDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const access = useAccess();
  const queryClient = useQueryClient();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const notice = readNotice(location.state);
  const feeQuery = useQuery({
    queryKey: feeDetailKey(id),
    queryFn: () => fetchFee(id),
    enabled: Boolean(id),
  });
  const studentId = feeQuery.data?.student?.id;
  const academicYear = feeQuery.data?.academicYear;
  const summaryQuery = useQuery({
    queryKey: feeSummaryKey(studentId ?? "", academicYear),
    queryFn: () => fetchFeeSummary(studentId ?? "", academicYear || undefined),
    enabled: Boolean(studentId),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteFee(id),
    onSuccess: async (message) => {
      await queryClient.invalidateQueries({ queryKey: feeInvalidationKey });
      navigate("/app/fees", { replace: true, state: { notice: message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
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
  const canManage = canManageFees(access.context?.persona);
  const outstanding = feeOutstanding(fee);
  const rows = [
    ["Status", feeStatusLabel(fee.status)],
    ["Amount", formatFeeAmount(fee.amount)],
    ["Paid", formatFeeAmount(fee.paidAmount)],
    ["Outstanding", formatFeeAmount(outstanding)],
    ["Due date", formatFeeDate(fee.dueDate)],
    ["Paid date", formatFeeDate(fee.paidDate)],
    ["Academic year", fee.academicYear],
    ["Term", fee.term],
    ["Description", fee.description || "Not recorded"],
  ];

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-wide text-pine uppercase">Fee</p>
          <h1 className="mt-2 font-serif text-4xl">{fee.title}</h1>
          <p className="mt-2 text-slate-600">
            {fee.student ? (
              <Link to={`/app/students/${fee.student.id}`} className="hover:text-pine">
                {feeStudentLabel(fee.student)}
              </Link>
            ) : (
              feeStudentLabel(fee.student)
            )}
          </p>
        </div>
        {canManage ? (
          <Link to={`/app/fees/${fee.id}/edit`} className={buttonClass("primary")}>
            Edit fee
          </Link>
        ) : null}
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <dl className="grid gap-4 rounded-xl border border-line bg-white p-4 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-slate-600">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      {summaryQuery.data ? <FeeSummaryPanel summary={summaryQuery.data} academicYear={academicYear ?? ""} /> : null}
      {summaryQuery.error ? <ServerErrorAlert error={getApiErrorMessage(summaryQuery.error)} /> : null}
      {canManage && fee.status !== "paid" ? (
        <PaymentForm
          feeId={fee.id}
          outstanding={outstanding}
          onRecorded={async () => {
            setServerError(null);
            await queryClient.invalidateQueries({ queryKey: feeInvalidationKey });
          }}
        />
      ) : null}
      {canManage && fee.status === "paid" ? (
        <p className="text-sm text-slate-700">This fee is fully paid. Further payments are not accepted.</p>
      ) : null}
      {canManage ? (
        <div className="rounded-xl border border-rose-200 bg-white p-4">
          <h2 className="text-base font-medium text-ink">Delete fee</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">This removes the fee record. It does not delete the student profile.</p>
          {confirmingDelete ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="danger" busy={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
                {deleteMutation.isPending ? "Deleting" : "Confirm delete"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button type="button" variant="danger" className="mt-4" onClick={() => setConfirmingDelete(true)}>
              Delete fee
            </Button>
          )}
        </div>
      ) : null}
      <Link to="/app/fees" className={buttonClass("secondary")}>
        Back to fees
      </Link>
    </section>
  );
}

function PaymentForm({
  feeId,
  outstanding,
  onRecorded,
}: {
  feeId: string;
  outstanding: number;
  onRecorded: () => Promise<void>;
}) {
  const [notice, setNotice] = useState<string | null>(null);
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { paidAmount: outstanding > 0 ? outstanding : 1, paidDate: "" },
  });
  const mutation = useMutation({
    mutationFn: (values: PaymentFormValues) => recordFeePayment(feeId, toPaymentPayload(values)),
    onSuccess: async (message) => {
      setServerError(null);
      setNotice(message);
      form.reset({ paidAmount: 1, paidDate: "" });
      await onRecorded();
    },
    onError: (error) => {
      setNotice(null);
      setServerError(getApiErrorMessage(error));
    },
  });

  return (
    <form className="grid gap-4 rounded-xl border border-line bg-white p-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
      <div>
        <h2 className="text-base font-medium text-ink">Record a payment</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Outstanding balance: {formatFeeAmount(outstanding)}. A payment above that balance is recorded only up to the balance.
        </p>
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Amount paid"
          type="number"
          min={1}
          step="0.01"
          error={form.formState.errors.paidAmount?.message}
          {...form.register("paidAmount", { valueAsNumber: true })}
        />
        <TextField label="Paid date" type="date" error={form.formState.errors.paidDate?.message} {...form.register("paidDate")} />
      </div>
      <Button type="submit" busy={mutation.isPending}>
        {mutation.isPending ? "Saving" : "Record payment"}
      </Button>
    </form>
  );
}
