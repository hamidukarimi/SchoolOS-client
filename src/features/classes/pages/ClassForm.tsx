import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { TextField } from "../../../components/ui/TextField";
import type { ParsedApiError } from "../../../services/api-error";
import { fetchTeachers, teacherListKey } from "../../teachers/api";
import { classStatusLabel, teacherChoices } from "../display";
import { classFormSchema, type ClassFormValues } from "../schemas";
import { CLASS_STATUSES, type ClassTeacherSummary } from "../types";

export function ClassForm({
  heading,
  description,
  initialValues,
  savedTeacher,
  cancelTo,
  submitLabel,
  pendingLabel,
  busy,
  serverError,
  onSubmit,
}: {
  heading: string;
  description: string;
  initialValues: ClassFormValues;
  savedTeacher: ClassTeacherSummary | null;
  cancelTo: string;
  submitLabel: string;
  pendingLabel: string;
  busy: boolean;
  serverError: ParsedApiError | null;
  onSubmit: (values: ClassFormValues) => void;
}) {
  const [teacherSearch, setTeacherSearch] = useState("");
  const [teacherQueryText, setTeacherQueryText] = useState("");
  const teacherQuery = useQuery({
    queryKey: teacherListKey({ search: teacherQueryText, status: "", page: 1 }),
    queryFn: () => fetchTeachers({ search: teacherQueryText, status: "", page: 1 }),
  });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: initialValues,
  });
  const choices = teacherChoices(
    (teacherQuery.data?.teachers ?? []).map((teacher) => ({
      id: teacher.id,
      teacherId: teacher.teacherId,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      subject: teacher.subject,
    })),
    savedTeacher,
  );

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-pine uppercase">Administrator</p>
        <h1 className="mt-2 font-serif text-4xl">{heading}</h1>
        <p className="mt-3 leading-7 text-slate-700">{description}</p>
      </div>
      <form
        className="grid gap-4"
        noValidate
        onSubmit={handleSubmit((values) => {
          if (savedTeacher && !values.teacherId.trim()) {
            setError("teacherId", {
              message: "Choose a teacher, or keep the saved teacher. A blank choice does not remove the assignment.",
            });
            return;
          }
          onSubmit(values);
        })}
      >
        {serverError ? <ServerErrorAlert error={serverError} /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Class name" error={errors.name?.message} {...register("name")} />
          <TextField label="Section" error={errors.section?.message} {...register("section")} />
          <TextField label="Grade" error={errors.grade?.message} {...register("grade")} />
          <TextField label="Academic year" error={errors.academicYear?.message} {...register("academicYear")} />
          <TextField
            label="Capacity"
            inputMode="decimal"
            error={errors.capacity?.message}
            hint="At least 1."
            {...register("capacity")}
          />
          <SelectField label="Status" error={errors.status?.message} {...register("status")}>
            {CLASS_STATUSES.map((status) => (
              <option key={status} value={status}>
                {classStatusLabel(status)}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="grid gap-4 rounded-xl border border-line bg-white p-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-60 flex-1">
              <TextField
                label="Find a teacher"
                name="teacherSearch"
                value={teacherSearch}
                onChange={(event) => setTeacherSearch(event.target.value)}
                hint="Search uses the teacher list. Leave the class without a teacher only when none is assigned."
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setTeacherQueryText(teacherSearch.trim())}
            >
              Find
            </Button>
          </div>
          {teacherQuery.isLoading ? <p className="text-sm text-slate-600">Loading teachers</p> : null}
          {teacherQuery.error ? (
            <p className="text-sm text-rose-700">Teachers could not be loaded. You can still save a class that already has no teacher.</p>
          ) : null}
          {teacherQuery.data && teacherQuery.data.totalPages > 1 ? (
            <p className="text-sm text-slate-600">Showing the first 20 matches. Search again to narrow the list.</p>
          ) : null}
          <SelectField label="Teacher" error={errors.teacherId?.message} {...register("teacherId")}>
            <option value="">No teacher assigned</option>
            {choices.map((choice) => (
              <option key={choice.id} value={choice.id}>
                {choice.label}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" busy={busy}>
            {busy ? pendingLabel : submitLabel}
          </Button>
          <Link to={cancelTo} className={buttonClass("secondary")}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
