import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { gradeInvalidationKey } from "../../grades/api";
import { createExam, examInvalidationKey } from "../api";
import { ExamForm } from "./ExamForm";
import { toExamCreatePayload, type ExamFormValues } from "../schemas";

const emptyExam: ExamFormValues = {
  title: "",
  description: "",
  classId: "",
  subject: "",
  teacherId: "",
  date: "",
  startTime: "",
  endTime: "",
  totalMarks: 1,
  passingMarks: 1,
  academicYear: "",
  status: "scheduled",
};

export function CreateExamPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const mutation = useMutation({
    mutationFn: (values: ExamFormValues) => createExam(toExamCreatePayload(values)),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: examInvalidationKey });
      await queryClient.invalidateQueries({ queryKey: gradeInvalidationKey });
      navigate(`/app/exams/${result.exam.id}`, { replace: true, state: { notice: result.message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  return (
    <ExamForm
      heading="New exam"
      description="An exam needs a class and a teacher that already exist. Saving it does not record student results. The server does not reject a second exam with the same title."
      initialValues={emptyExam}
      savedClass={null}
      savedTeacher={null}
      cancelTo="/app/exams"
      submitLabel="Create exam"
      pendingLabel="Creating"
      busy={mutation.isPending}
      serverError={serverError}
      onSubmit={(values) => {
        setServerError(null);
        mutation.mutate(values);
      }}
    />
  );
}
