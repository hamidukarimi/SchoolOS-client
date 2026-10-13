import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { deleteStaff, fetchStaffMember, staffDetailKey, staffInvalidationKey } from "../api";
import {
  formatStaffAmount,
  formatStaffDate,
  readNotice,
  staffContractLabel,
  staffStatusLabel,
} from "../display";
import type { StaffRecord } from "../types";

export function StaffDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const notice = readNotice(location.state);
  const staffQuery = useQuery({
    queryKey: staffDetailKey(id),
    queryFn: () => fetchStaffMember(id),
    enabled: Boolean(id),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteStaff(id),
    onSuccess: async (message) => {
      await queryClient.invalidateQueries({ queryKey: staffInvalidationKey });
      navigate("/app/staff", { replace: true, state: { notice: message } });
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

  const staff = staffQuery.data;

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-wide text-pine uppercase">Staff</p>
          <h1 className="mt-2 font-serif text-4xl">
            {staff.firstName} {staff.lastName}
          </h1>
          <p className="mt-2 text-slate-600">
            {staff.staffId} · {staff.position} · {staffStatusLabel(staff.status)}
          </p>
        </div>
        <Link to={`/app/staff/${staff.id}/edit`} className={buttonClass("primary")}>
          Edit staff
        </Link>
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <StaffFacts staff={staff} />
      <div className="rounded-xl border border-rose-200 bg-white p-4">
        <h2 className="text-base font-medium text-ink">Delete staff record</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          This removes the staff record. It does not delete the linked user account, and it does not change that account&apos;s role.
        </p>
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
            Delete staff
          </Button>
        )}
      </div>
      <Link to="/app/staff" className={buttonClass("secondary")}>
        Back to staff
      </Link>
    </section>
  );
}

function StaffFacts({ staff }: { staff: StaffRecord }) {
  const rows = [
    ["Staff ID", staff.staffId],
    ["Status", staffStatusLabel(staff.status)],
    ["Department", staff.department],
    ["Position", staff.position],
    ["Contract", staffContractLabel(staff.contractType)],
    ["Salary", formatStaffAmount(staff.salary)],
    ["Date of birth", formatStaffDate(staff.dateOfBirth)],
    ["Gender", staff.gender],
    ["Phone", staff.phone || "Not recorded"],
    ["Address", staff.address || "Not recorded"],
    ["Linked account", staff.account?.email ?? "No account email was returned"],
    ["Join date", formatStaffDate(staff.joinDate)],
  ];

  return (
    <dl className="grid gap-4 rounded-xl border border-line bg-white p-4 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-sm text-slate-600">{label}</dt>
          <dd className="mt-1 text-sm font-medium text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
