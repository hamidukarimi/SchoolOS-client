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
import { fetchTeacher, teacherDetailKey, updateTeacher } from "../api";
import { numberInputValue, teacherStatusLabel } from "../display";
import { teacherFormSchema, toTeacherUpdatePayload, type TeacherFormValues } from "../schemas";
import { TEACHER_GENDERS, TEACHER_STATUSES, type TeacherRecord } from "../types";

function toFormValues(teacher: TeacherRecord): TeacherFormValues {
  return {
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    dateOfBirth: toDateInputValue(teacher.dateOfBirth),
    gender: teacher.gender,
    phone: teacher.phone,
    address: teacher.address,
    subject: teacher.subject,
    qualification: teacher.qualification,
    experience: numberInputValue(teacher.experience),
    salary: numberInputValue(teacher.salary),
    joinDate: toDateInputValue(teacher.joinDate),
    status: teacher.status,
  };
}

export function EditTeacherPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const teacherQuery = useQuery({
    queryKey: teacherDetailKey(id),
    queryFn: () => fetchTeacher(id),
    enabled: Boolean(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: teacherQuery.data ? toFormValues(teacherQuery.data) : undefined,
  });

  useEffect(() => {
    if (!teacherQuery.data || isDirty) return;
    reset(toFormValues(teacherQuery.data));
  }, [teacherQuery.data, isDirty, reset]);

  const mutation = useMutation({
    mutationFn: (values: TeacherFormValues) => updateTeacher(id, toTeacherUpdatePayload(values)),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["teachers"] });
      navigate(`/app/teachers/${id}`, { replace: true, state: { notice: result.message } });
    },
    onError: (error) => {
      setServerError(getApiErrorMessage(error));
    },
  });

  if (teacherQuery.isLoading) {
    return <FullPageSpinner label="Loading teacher" />;
  }

  if (teacherQuery.error || !teacherQuery.data) {
    return (
      <section className="mx-auto grid max-w-3xl gap-4">
        <ServerErrorAlert
          error={
            teacherQuery.error
              ? getApiErrorMessage(teacherQuery.error)
              : { message: "This teacher could not be loaded.", errors: [] }
          }
        />
        <Link to="/app/teachers" className={buttonClass("secondary")}>
          Back to teachers
        </Link>
      </section>
    );
  }

  const teacher = teacherQuery.data;

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-pine uppercase">Administrator</p>
        <h1 className="mt-2 font-serif text-4xl">Edit teacher</h1>
        <p className="mt-3 leading-7 text-slate-700">
          {teacher.firstName} {teacher.lastName} · {teacher.teacherId} · {teacherStatusLabel(teacher.status)}
        </p>
      </div>
      <dl className="grid gap-4 rounded-xl border border-line bg-white p-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-slate-600">Teacher ID</dt>
          <dd className="mt-1 text-sm font-medium">{teacher.teacherId}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Linked account</dt>
          <dd className="mt-1 text-sm font-medium">{teacher.account?.email ?? "No account email was returned"}</dd>
        </div>
      </dl>
      <form
        className="grid gap-4"
        noValidate
        onSubmit={handleSubmit((values) => {
          let blocked = false;
          if (teacher.experience !== null && !values.experience.trim()) {
            setError("experience", {
              message: "Enter a number, or keep the saved value. A blank value is not accepted.",
            });
            blocked = true;
          }
          if (teacher.salary !== null && !values.salary.trim()) {
            setError("salary", {
              message: "Enter a number, or keep the saved value. A blank value is not accepted.",
            });
            blocked = true;
          }
          if (teacher.joinDate && !values.joinDate.trim()) {
            setError("joinDate", {
              message: "Enter a date, or keep the saved join date. A blank date is not accepted.",
            });
            blocked = true;
          }
          if (blocked) return;
          setServerError(null);
          mutation.mutate(values);
        })}
      >
        {serverError ? <ServerErrorAlert error={serverError} /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="First name" error={errors.firstName?.message} {...register("firstName")} />
          <TextField label="Last name" error={errors.lastName?.message} {...register("lastName")} />
          <TextField label="Date of birth" type="date" error={errors.dateOfBirth?.message} {...register("dateOfBirth")} />
          <SelectField label="Gender" error={errors.gender?.message} {...register("gender")}>
            {TEACHER_GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {gender === "male" ? "Male" : "Female"}
              </option>
            ))}
          </SelectField>
          <TextField label="Phone" error={errors.phone?.message} {...register("phone")} />
          <SelectField label="Status" error={errors.status?.message} {...register("status")}>
            {TEACHER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {teacherStatusLabel(status)}
              </option>
            ))}
          </SelectField>
          <TextField label="Subject" error={errors.subject?.message} {...register("subject")} />
          <TextField label="Qualification" error={errors.qualification?.message} {...register("qualification")} />
          <TextField
            label="Experience"
            inputMode="decimal"
            error={errors.experience?.message}
            hint="Use 0 or greater. Leave the saved number in place; a blank value is not accepted."
            {...register("experience")}
          />
          <TextField
            label="Salary"
            inputMode="decimal"
            error={errors.salary?.message}
            hint="Use 0 or greater. Leave the saved number in place; a blank value is not accepted."
            {...register("salary")}
          />
        </div>
        <TextField label="Address" error={errors.address?.message} {...register("address")} />
        <TextField
          label="Join date"
          type="date"
          error={errors.joinDate?.message}
          hint="Leave the saved date in place. The server does not accept a blank date."
          {...register("joinDate")}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" busy={mutation.isPending}>
            {mutation.isPending ? "Saving" : "Save changes"}
          </Button>
          <Link to={`/app/teachers/${teacher.id}`} className={buttonClass("secondary")}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
