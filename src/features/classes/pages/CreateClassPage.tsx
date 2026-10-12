import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { createClass } from "../api";
import { ClassForm } from "./ClassForm";
import { toClassWritePayload, type ClassFormValues } from "../schemas";

const emptyClass: ClassFormValues = {
  name: "",
  section: "",
  grade: "",
  academicYear: "",
  capacity: "",
  teacherId: "",
  status: "active",
};

export function CreateClassPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const mutation = useMutation({
    mutationFn: (values: ClassFormValues) => createClass(toClassWritePayload(values)),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      navigate(`/app/classes/${result.classRecord.id}`, {
        replace: true,
        state: { notice: result.message },
      });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  return (
    <ClassForm
      heading="New class"
      description="A class can be saved without a teacher. This does not enroll students."
      initialValues={emptyClass}
      savedTeacher={null}
      cancelTo="/app/classes"
      submitLabel="Create class"
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
