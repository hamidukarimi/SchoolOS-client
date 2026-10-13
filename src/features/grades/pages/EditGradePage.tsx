import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { TextField } from "../../../components/ui/TextField";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { fetchGrade, gradeDetailKey, gradeInvalidationKey, updateGrade } from "../api";
import { formatStoredGrade } from "../display";
import { editGradeSchema, toGradeUpdatePayload, type EditGradeValues } from "../schemas";

export function EditGradePage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const recordQuery = useQuery({
    queryKey: gradeDetailKey(id),
    queryFn: () => fetchGrade(id),
    enabled: Boolean(id),
  });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<EditGradeValues>({
    resolver: zodResolver(editGradeSchema),
    defaultValues: recordQuery.data
      ? {
          marksObtained: recordQuery.data.marksObtained,
          totalMarks: recordQuery.data.totalMarks,
          remarks: recordQuery.data.remarks,
        }
      : undefined,
  });
  const marksObtained = watch("marksObtained");
  const totalMarks = watch("totalMarks");

  useEffect(() => {
    if (!recordQuery.data || isDirty) return;
    reset({
      marksObtained: recordQuery.data.marksObtained,
      totalMarks: recordQuery.data.totalMarks,
      remarks: recordQuery.data.remarks,
    });
  }, [recordQuery.data, isDirty, reset]);

  const mutation = useMutation({
    mutationFn: (values: EditGradeValues) => updateGrade(id, toGradeUpdatePayload(values)),
    onSuccess: async (message) => {
      await queryClient.invalidateQueries({ queryKey: gradeInvalidationKey });
      navigate(`/app/grades/${id}`, { replace: true, state: { notice: message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  if (recordQuery.isLoading) return <FullPageSpinner label="Loading result" />;

  if (recordQuery.error || !recordQuery.data) {
    return (
      <section className="mx-auto grid max-w-3xl gap-4">
        <ServerErrorAlert
          error={
            recordQuery.error
              ? getApiErrorMessage(recordQuery.error)
              : { message: "This result could not be loaded.", errors: [] }
          }
        />
        <Link to="/app/grades" className={buttonClass("secondary")}>
          Back to results
        </Link>
      </section>
    );
  }

  const record = recordQuery.data;

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-pine uppercase">Administrator</p>
        <h1 className="mt-2 font-serif text-4xl">Edit result</h1>
        <p className="mt-3 leading-7 text-slate-700">
          {record.student ? `${record.student.firstName} ${record.student.lastName}` : "Student name not returned"} ·{" "}
          {record.exam?.title ?? "Exam name not returned"} · letter {formatStoredGrade(record.grade)}. The student, exam,
          class, teacher, subject, and academic year stay as they were recorded. Saving new marks does not recalculate the
          stored letter.
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
        <TextField
          label="Marks obtained"
          type="number"
          min={0}
          step="any"
          error={errors.marksObtained?.message}
          {...register("marksObtained", { valueAsNumber: true })}
        />
        <TextField
          label="Total marks"
          type="number"
          min={1}
          step="any"
          error={errors.totalMarks?.message}
          {...register("totalMarks", { valueAsNumber: true })}
        />
        {Number.isFinite(marksObtained) && Number.isFinite(totalMarks) && totalMarks >= 1 && marksObtained > totalMarks ? (
          <Alert tone="info" title="Marks are above the total">
            The server accepts this. The stored letter stays {formatStoredGrade(record.grade)}.
          </Alert>
        ) : null}
        <TextField label="Remarks" error={errors.remarks?.message} {...register("remarks")} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" busy={mutation.isPending}>
            {mutation.isPending ? "Saving" : "Save changes"}
          </Button>
          <Link to={`/app/grades/${record.id}`} className={buttonClass("secondary")}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
