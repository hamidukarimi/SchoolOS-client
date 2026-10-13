import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { gradeInvalidationKey } from "../../grades/api";
import { examDetailKey, examInvalidationKey, fetchExam, updateExam } from "../api";
import { examDateInput } from "../display";
import { toExamUpdatePayload, type ExamFormValues } from "../schemas";
import { ExamForm } from "./ExamForm";

export function EditExamPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const examQuery = useQuery({
    queryKey: examDetailKey(id),
    queryFn: () => fetchExam(id),
    enabled: Boolean(id),
  });
  const exam = examQuery.data;
  const formValues: ExamFormValues | null = exam
    ? {
        title: exam.title,
        description: exam.description,
        classId: exam.classRef?.id ?? "",
        subject: exam.subject,
        teacherId: exam.teacher?.id ?? "",
        date: examDateInput(exam.date),
        startTime: exam.startTime,
        endTime: exam.endTime,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        academicYear: exam.academicYear,
        status: exam.status,
      }
    : null;

  const mutation = useMutation({
    mutationFn: (values: ExamFormValues) => updateExam(id, toExamUpdatePayload(values)),
    onSuccess: async (message) => {
      await queryClient.invalidateQueries({ queryKey: examInvalidationKey });
      await queryClient.invalidateQueries({ queryKey: gradeInvalidationKey });
      navigate(`/app/exams/${id}`, { replace: true, state: { notice: message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  if (examQuery.isLoading) return <FullPageSpinner label="Loading exam" />;

  if (examQuery.error || !exam || !formValues) {
    return (
      <section className="mx-auto grid max-w-3xl gap-4">
        <ServerErrorAlert
          error={
            examQuery.error
              ? getApiErrorMessage(examQuery.error)
              : { message: "This exam could not be loaded.", errors: [] }
          }
        />
        <Button type="button" variant="secondary" className="w-fit" onClick={() => examQuery.refetch()}>
          Try again
        </Button>
        <Link to="/app/exams" className={buttonClass("secondary")}>
          Back to exams
        </Link>
      </section>
    );
  }

  return (
    <ExamForm
      key={exam.id}
      heading="Edit exam"
      description="Class, teacher, subject, date, times, marks, and status can all be changed. Saving does not change result letters. A blank description clears the saved description."
      initialValues={formValues}
      savedClass={exam.classRef}
      savedTeacher={exam.teacher}
      cancelTo={`/app/exams/${exam.id}`}
      submitLabel="Save changes"
      pendingLabel="Saving"
      busy={mutation.isPending}
      serverError={serverError}
      onSubmit={(values) => {
        setServerError(null);
        mutation.mutate(values);
      }}
    />
  );
}
