import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ServerErrorAlert } from "../../../components/ui/Alert";
import { buttonClass } from "../../../components/ui/Button";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { classDetailKey, fetchClass, updateClass } from "../api";
import { toClassWritePayload, type ClassFormValues } from "../schemas";
import { ClassForm } from "./ClassForm";

export function EditClassPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const classQuery = useQuery({
    queryKey: classDetailKey(id),
    queryFn: () => fetchClass(id),
    enabled: Boolean(id),
  });
  const mutation = useMutation({
    mutationFn: (values: ClassFormValues) => updateClass(id, toClassWritePayload(values)),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      navigate(`/app/classes/${id}`, { replace: true, state: { notice: result.message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  if (classQuery.isLoading) return <FullPageSpinner label="Loading class" />;

  if (classQuery.error || !classQuery.data) {
    return (
      <section className="mx-auto grid max-w-3xl gap-4">
        <ServerErrorAlert
          error={
            classQuery.error
              ? getApiErrorMessage(classQuery.error)
              : { message: "This class could not be loaded.", errors: [] }
          }
        />
        <Link to="/app/classes" className={buttonClass("secondary")}>
          Back to classes
        </Link>
      </section>
    );
  }

  const classRecord = classQuery.data;
  const initialValues: ClassFormValues = {
    name: classRecord.name,
    section: classRecord.section,
    grade: classRecord.grade,
    academicYear: classRecord.academicYear,
    capacity: String(classRecord.capacity),
    teacherId: classRecord.teacher?.id ?? "",
    status: classRecord.status,
  };

  return (
    <ClassForm
      heading="Edit class"
      description={`${classRecord.name}, section ${classRecord.section}. Saving does not enroll or remove students. A saved teacher cannot be cleared from this form.`}
      initialValues={initialValues}
      savedTeacher={classRecord.teacher}
      cancelTo={`/app/classes/${classRecord.id}`}
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
