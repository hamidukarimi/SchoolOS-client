import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { TextField } from "../../../components/ui/TextField";
import { AccountPicker } from "../../accounts/AccountPicker";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { createTeacher } from "../api";
import { teacherStatusLabel } from "../display";
import { createTeacherFormSchema, toTeacherCreatePayload, type CreateTeacherFormValues } from "../schemas";
import { TEACHER_GENDERS, TEACHER_STATUSES } from "../types";

const emptyValues: CreateTeacherFormValues = {
  userId: "",
  teacherId: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "female",
  phone: "",
  address: "",
  subject: "",
  qualification: "",
  experience: "",
  salary: "",
  joinDate: "",
  status: "active",
};

export function CreateTeacherPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const form = useForm<CreateTeacherFormValues>({
    resolver: zodResolver(createTeacherFormSchema),
    defaultValues: emptyValues,
  });
  const mutation = useMutation({
    mutationFn: (values: CreateTeacherFormValues) => createTeacher(toTeacherCreatePayload(values)),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["teachers"] });
      navigate(`/app/teachers/${result.teacher.id}`, { replace: true, state: { notice: result.message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });
  const { errors } = form.formState;

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-pine uppercase">Administrator</p>
        <h1 className="mt-2 font-serif text-4xl">Add teacher</h1>
        <p className="mt-3 leading-7 text-slate-700">
          Link a teaching profile to an account that already exists. This does not create a login, and it does not assign classes. Class assignment stays on the class record.
        </p>
      </div>
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
        <AccountPicker profile="teacher" selectedId={form.watch("userId")} onSelect={(account) => form.setValue("userId", account.id, { shouldValidate: true })} />
        {errors.userId ? <p className="text-sm text-rose-700">{errors.userId.message}</p> : null}
        <TextField label="Teacher ID" error={errors.teacherId?.message} {...form.register("teacherId")} />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="First name" error={errors.firstName?.message} {...form.register("firstName")} />
          <TextField label="Last name" error={errors.lastName?.message} {...form.register("lastName")} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Date of birth" type="date" error={errors.dateOfBirth?.message} {...form.register("dateOfBirth")} />
          <SelectField label="Gender" error={errors.gender?.message} {...form.register("gender")}>
            {TEACHER_GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </SelectField>
        </div>
        <TextField label="Phone" error={errors.phone?.message} {...form.register("phone")} />
        <TextField label="Address" error={errors.address?.message} {...form.register("address")} />
        <TextField label="Subject" error={errors.subject?.message} {...form.register("subject")} />
        <TextField label="Qualification" error={errors.qualification?.message} {...form.register("qualification")} />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Experience" error={errors.experience?.message} {...form.register("experience")} />
          <TextField label="Salary" error={errors.salary?.message} {...form.register("salary")} />
        </div>
        <TextField label="Join date" type="date" error={errors.joinDate?.message} {...form.register("joinDate")} />
        <SelectField label="Status" error={errors.status?.message} {...form.register("status")}>
          {TEACHER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {teacherStatusLabel(status)}
            </option>
          ))}
        </SelectField>
        <p className="text-sm text-slate-600">
          If this account also has a student profile, signing in shows the teacher home. The account role stays User.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" busy={mutation.isPending}>
            {mutation.isPending ? "Saving" : "Create teacher"}
          </Button>
          <Link to="/app/teachers" className={buttonClass("secondary")}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
