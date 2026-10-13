import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router";
import { ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { TextField } from "../../../components/ui/TextField";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { attendanceDetailKey, attendanceInvalidationKey, fetchAttendanceRecord, updateAttendance } from "../api";
import { attendanceStatusLabel, formatAttendanceDate } from "../display";
import { editAttendanceSchema, toAttendanceUpdatePayload, type EditAttendanceValues } from "../schemas";
import { ATTENDANCE_STATUSES } from "../types";

export function EditAttendancePage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const recordQuery = useQuery({
    queryKey: attendanceDetailKey(id),
    queryFn: () => fetchAttendanceRecord(id),
    enabled: Boolean(id),
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditAttendanceValues>({
    resolver: zodResolver(editAttendanceSchema),
    defaultValues: recordQuery.data
      ? { status: recordQuery.data.status, note: recordQuery.data.note }
      : undefined,
  });

  useEffect(() => {
    if (!recordQuery.data || isDirty) return;
    reset({ status: recordQuery.data.status, note: recordQuery.data.note });
  }, [recordQuery.data, isDirty, reset]);

  const mutation = useMutation({
    mutationFn: (values: EditAttendanceValues) => updateAttendance(id, toAttendanceUpdatePayload(values)),
    onSuccess: async (message) => {
      await queryClient.invalidateQueries({ queryKey: attendanceInvalidationKey });
      navigate(`/app/attendance/${id}`, { replace: true, state: { notice: message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  if (recordQuery.isLoading) return <FullPageSpinner label="Loading attendance" />;

  if (recordQuery.error || !recordQuery.data) {
    return (
      <section className="mx-auto grid max-w-3xl gap-4">
        <ServerErrorAlert
          error={
            recordQuery.error
              ? getApiErrorMessage(recordQuery.error)
              : { message: "This attendance record could not be loaded.", errors: [] }
          }
        />
        <Link to="/app/attendance" className={buttonClass("secondary")}>
          Back to attendance
        </Link>
      </section>
    );
  }

  const record = recordQuery.data;

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-pine uppercase">Administrator</p>
        <h1 className="mt-2 font-serif text-4xl">Edit attendance</h1>
        <p className="mt-3 leading-7 text-slate-700">
          {record.student ? `${record.student.firstName} ${record.student.lastName}` : "Student name not returned"} ·{" "}
          {formatAttendanceDate(record.date)}. The student, class, teacher, and date stay as they were recorded.
        </p>
      </div>
      <form
        className="grid gap-4"
        noValidate
        onSubmit={handleSubmit((values) => {
          setServerError(null);
          mutation.mutate(values);
        })}
      >
        {serverError ? <ServerErrorAlert error={serverError} /> : null}
        <SelectField label="Status" error={errors.status?.message} {...register("status")}>
          {ATTENDANCE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {attendanceStatusLabel(status)}
            </option>
          ))}
        </SelectField>
        <TextField label="Note" error={errors.note?.message} {...register("note")} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" busy={mutation.isPending}>
            {mutation.isPending ? "Saving" : "Save changes"}
          </Button>
          <Link to={`/app/attendance/${record.id}`} className={buttonClass("secondary")}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
