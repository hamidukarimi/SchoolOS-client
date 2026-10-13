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
import { createStudent } from "../api";
import { studentStatusLabel } from "../display";
import { createStudentFormSchema, toStudentCreatePayload, type CreateStudentFormValues } from "../schemas";
import { STUDENT_GENDERS, STUDENT_STATUSES } from "../types";

const emptyValues: CreateStudentFormValues = {
  userId: "",
  studentId: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "female",
  phone: "",
  address: "",
  parentName: "",
  parentPhone: "",
  parentEmail: "",
  status: "active",
};

export function CreateStudentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const form = useForm<CreateStudentFormValues>({
    resolver: zodResolver(createStudentFormSchema),
    defaultValues: emptyValues,
  });
  const mutation = useMutation({
    mutationFn: (values: CreateStudentFormValues) => createStudent(toStudentCreatePayload(values)),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["students"] });
      navigate(`/app/students/${result.student.id}`, { replace: true, state: { notice: result.message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });
  const { errors } = form.formState;

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-pine uppercase">Administrator</p>
        <h1 className="mt-2 font-serif text-4xl">Add student</h1>
        <p className="mt-3 leading-7 text-slate-700">
          Link a student profile to an account that already exists. This does not create a login, and it does not enroll the student in a class. Use Enrollment after the profile is saved.
        </p>
      </div>
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
        <AccountPicker profile="student" selectedId={form.watch("userId")} onSelect={(account) => form.setValue("userId", account.id, { shouldValidate: true })} />
        {errors.userId ? <p className="text-sm text-rose-700">{errors.userId.message}</p> : null}
        <TextField label="Student ID" error={errors.studentId?.message} {...form.register("studentId")} />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="First name" error={errors.firstName?.message} {...form.register("firstName")} />
          <TextField label="Last name" error={errors.lastName?.message} {...form.register("lastName")} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Date of birth" type="date" error={errors.dateOfBirth?.message} {...form.register("dateOfBirth")} />
          <SelectField label="Gender" error={errors.gender?.message} {...form.register("gender")}>
            {STUDENT_GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </SelectField>
        </div>
        <TextField label="Phone" error={errors.phone?.message} {...form.register("phone")} />
        <TextField label="Address" error={errors.address?.message} {...form.register("address")} />
        <TextField label="Parent name" error={errors.parentName?.message} {...form.register("parentName")} />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Parent phone" error={errors.parentPhone?.message} {...form.register("parentPhone")} />
          <TextField label="Parent email" error={errors.parentEmail?.message} {...form.register("parentEmail")} />
        </div>
        <SelectField label="Status" error={errors.status?.message} {...form.register("status")}>
          {STUDENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {studentStatusLabel(status)}
            </option>
          ))}
        </SelectField>
        <p className="text-sm text-slate-600">The account role stays User. Signing in again shows the student home.</p>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" busy={mutation.isPending}>
            {mutation.isPending ? "Saving" : "Create student"}
          </Button>
          <Link to="/app/students" className={buttonClass("secondary")}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
