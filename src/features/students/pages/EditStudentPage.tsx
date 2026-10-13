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
import { toDateInputValue } from "../../auth/schemas";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { fetchStudent, studentDetailKey, updateStudent } from "../api";
import { studentStatusLabel } from "../display";
import { studentFormSchema, toStudentUpdatePayload, type StudentFormValues } from "../schemas";
import { STUDENT_GENDERS, STUDENT_STATUSES, type StudentRecord } from "../types";

function toFormValues(student: StudentRecord): StudentFormValues {
  return {
    firstName: student.firstName,
    lastName: student.lastName,
    dateOfBirth: toDateInputValue(student.dateOfBirth),
    gender: student.gender,
    phone: student.phone,
    address: student.address,
    parentName: student.parentName,
    parentPhone: student.parentPhone,
    parentEmail: student.parentEmail,
    status: student.status,
  };
}

export function EditStudentPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const studentQuery = useQuery({
    queryKey: studentDetailKey(id),
    queryFn: () => fetchStudent(id),
    enabled: Boolean(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: studentQuery.data ? toFormValues(studentQuery.data) : undefined,
  });

  useEffect(() => {
    if (!studentQuery.data || isDirty) return;
    reset(toFormValues(studentQuery.data));
  }, [studentQuery.data, isDirty, reset]);

  const mutation = useMutation({
    mutationFn: (values: StudentFormValues) => updateStudent(id, toStudentUpdatePayload(values)),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["students"] });
      navigate(`/app/students/${id}`, { replace: true, state: { notice: result.message } });
    },
    onError: (error) => {
      setServerError(getApiErrorMessage(error));
    },
  });

  if (studentQuery.isLoading) {
    return <FullPageSpinner label="Loading student" />;
  }

  if (studentQuery.error || !studentQuery.data) {
    return (
      <section className="mx-auto grid max-w-3xl gap-4">
        <ServerErrorAlert
          error={
            studentQuery.error
              ? getApiErrorMessage(studentQuery.error)
              : { message: "This student could not be loaded.", errors: [] }
          }
        />
        <Link to="/app/students" className={buttonClass("secondary")}>
          Back to students
        </Link>
      </section>
    );
  }

  const student = studentQuery.data;

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-pine uppercase">Administrator</p>
        <h1 className="mt-2 font-serif text-4xl">Edit student</h1>
        <p className="mt-3 leading-7 text-slate-700">
          {student.firstName} {student.lastName} · {student.studentId} · {studentStatusLabel(student.status)}
        </p>
      </div>
      <dl className="grid gap-4 rounded-xl border border-line bg-white p-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-slate-600">Student ID</dt>
          <dd className="mt-1 text-sm font-medium">{student.studentId}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Linked account</dt>
          <dd className="mt-1 text-sm font-medium">{student.account?.email ?? "No account email was returned"}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Classes</dt>
          <dd className="mt-1 text-sm font-medium">Listed on the student profile from class enrollment. This form does not change them.</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Enrollment date</dt>
          <dd className="mt-1 text-sm font-medium">Shown on the student profile. It is not edited here.</dd>
        </div>
      </dl>
      <form
        className="grid gap-4"
        onSubmit={handleSubmit((values) => {
          if (!values.parentEmail.trim() && student.parentEmail) {
            setError("parentEmail", {
              message: "Enter an email, or keep the saved address. A blank address is not accepted.",
            });
            return;
          }
          setServerError(null);
          mutation.mutate(values);
        })}
        noValidate
      >
        {serverError ? <ServerErrorAlert error={serverError} /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="First name" error={errors.firstName?.message} {...register("firstName")} />
          <TextField label="Last name" error={errors.lastName?.message} {...register("lastName")} />
          <TextField label="Date of birth" type="date" error={errors.dateOfBirth?.message} {...register("dateOfBirth")} />
          <SelectField label="Gender" error={errors.gender?.message} {...register("gender")}>
            {STUDENT_GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {gender === "male" ? "Male" : "Female"}
              </option>
            ))}
          </SelectField>
          <TextField label="Phone" error={errors.phone?.message} {...register("phone")} />
          <SelectField label="Status" error={errors.status?.message} {...register("status")}>
            {STUDENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {studentStatusLabel(status)}
              </option>
            ))}
          </SelectField>
        </div>
        <TextField label="Address" error={errors.address?.message} {...register("address")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Parent or guardian" error={errors.parentName?.message} {...register("parentName")} />
          <TextField label="Parent phone" error={errors.parentPhone?.message} {...register("parentPhone")} />
        </div>
        <TextField
          label="Parent email"
          type="email"
          error={errors.parentEmail?.message}
          hint="Leave the saved address in place. The server does not accept a blank email."
          {...register("parentEmail")}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" busy={mutation.isPending}>
            {mutation.isPending ? "Saving" : "Save changes"}
          </Button>
          <Link to={`/app/students/${student.id}`} className={buttonClass("secondary")}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
