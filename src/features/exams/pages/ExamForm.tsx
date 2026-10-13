import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { TextField } from "../../../components/ui/TextField";
import type { ParsedApiError } from "../../../services/api-error";
import { classListKey, fetchClasses } from "../../classes/api";
import { fetchTeachers, teacherListKey } from "../../teachers/api";
import { examStatusLabel } from "../display";
import { examFormSchema, type ExamFormValues } from "../schemas";
import { EXAM_STATUSES, type ExamClassRef, type ExamTeacherRef } from "../types";

export function ExamForm({
  heading,
  description,
  initialValues,
  savedClass,
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
  initialValues: ExamFormValues;
  savedClass: ExamClassRef | null;
  savedTeacher: ExamTeacherRef | null;
  cancelTo: string;
  submitLabel: string;
  pendingLabel: string;
  busy: boolean;
  serverError: ParsedApiError | null;
  onSubmit: (values: ExamFormValues) => void;
}) {
  const [classSearch, setClassSearch] = useState("");
  const [classQueryText, setClassQueryText] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [teacherQueryText, setTeacherQueryText] = useState("");
  const classesQuery = useQuery({
    queryKey: classListKey({ search: classQueryText, status: "", grade: "", academicYear: "", page: 1 }),
    queryFn: () => fetchClasses({ search: classQueryText, status: "", grade: "", academicYear: "", page: 1 }),
    enabled: classQueryText.length > 0,
  });
  const teachersQuery = useQuery({
    queryKey: teacherListKey({ search: teacherQueryText, status: "", page: 1 }),
    queryFn: () => fetchTeachers({ search: teacherQueryText, status: "", page: 1 }),
    enabled: teacherQueryText.length > 0,
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExamFormValues>({
    resolver: zodResolver(examFormSchema),
    defaultValues: initialValues,
  });
  const totalMarks = watch("totalMarks");
  const passingMarks = watch("passingMarks");
  const classChoices = (classesQuery.data?.classes ?? []).filter((classRecord) => classRecord.id !== savedClass?.id);
  const teacherChoices = (teachersQuery.data?.teachers ?? []).filter((teacher) => teacher.id !== savedTeacher?.id);

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-pine uppercase">Administrator</p>
        <h1 className="mt-2 font-serif text-4xl">{heading}</h1>
        <p className="mt-3 leading-7 text-slate-700">{description}</p>
      </div>
      <form className="grid gap-4" noValidate onSubmit={handleSubmit(onSubmit)}>
        {serverError ? <ServerErrorAlert error={serverError} /> : null}
        <TextField label="Title" error={errors.title?.message} {...register("title")} />
        <TextField label="Description" error={errors.description?.message} {...register("description")} />
        <TextField label="Subject" error={errors.subject?.message} {...register("subject")} hint="Stored as text. There is no separate subject list." />
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-60 flex-1">
            <TextField
              label="Find a class"
              name="classSearch"
              value={classSearch}
              onChange={(event) => setClassSearch(event.target.value)}
              hint="Required. The server does not check that this class is active."
            />
          </div>
          <Button type="button" variant="secondary" onClick={() => setClassQueryText(classSearch.trim())}>
            Find class
          </Button>
        </div>
        <SelectField
          label="Class"
          error={errors.classId?.message}
          {...register("classId", {
            onChange: (event) => {
              const selected = classesQuery.data?.classes.find((item) => item.id === event.target.value);
              if (selected?.teacher) setValue("teacherId", selected.teacher.id);
            },
          })}
        >
          <option value="">Select a class</option>
          {savedClass ? (
            <option value={savedClass.id}>
              {savedClass.name}, section {savedClass.section}
            </option>
          ) : null}
          {classChoices.map((classRecord) => (
            <option key={classRecord.id} value={classRecord.id}>
              {classRecord.name}, section {classRecord.section}
            </option>
          ))}
        </SelectField>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-60 flex-1">
            <TextField
              label="Find a teacher"
              name="teacherSearch"
              value={teacherSearch}
              onChange={(event) => setTeacherSearch(event.target.value)}
              hint="Required. The class teacher is selected when that class has one."
            />
          </div>
          <Button type="button" variant="secondary" onClick={() => setTeacherQueryText(teacherSearch.trim())}>
            Find teacher
          </Button>
        </div>
        <SelectField label="Teacher" error={errors.teacherId?.message} {...register("teacherId")}>
          <option value="">Select a teacher</option>
          {savedTeacher ? (
            <option value={savedTeacher.id}>
              {savedTeacher.firstName} {savedTeacher.lastName}
              {savedTeacher.teacherId ? ` · ${savedTeacher.teacherId}` : ""}
            </option>
          ) : null}
          {teacherChoices.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.firstName} {teacher.lastName} · {teacher.teacherId}
            </option>
          ))}
        </SelectField>
        <TextField label="Date" type="date" error={errors.date?.message} {...register("date")} />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Start time"
            error={errors.startTime?.message}
            {...register("startTime")}
            hint="Stored as the text you enter."
          />
          <TextField label="End time" error={errors.endTime?.message} {...register("endTime")} hint="Stored as the text you enter." />
        </div>
        <TextField
          label="Total marks"
          type="number"
          min={1}
          step="any"
          error={errors.totalMarks?.message}
          {...register("totalMarks", { valueAsNumber: true })}
        />
        <TextField
          label="Passing marks"
          type="number"
          min={1}
          step="any"
          error={errors.passingMarks?.message}
          hint="The server does not require this to stay within the total."
          {...register("passingMarks", { valueAsNumber: true })}
        />
        {Number.isFinite(totalMarks) && Number.isFinite(passingMarks) && passingMarks > totalMarks ? (
          <Alert tone="info" title="Passing marks are above the total">
            The server accepts this. It does not use these marks to calculate a result letter.
          </Alert>
        ) : null}
        <TextField label="Academic year" error={errors.academicYear?.message} {...register("academicYear")} />
        <SelectField label="Status" error={errors.status?.message} {...register("status")}>
          {EXAM_STATUSES.map((status) => (
            <option key={status} value={status}>
              {examStatusLabel(status)}
            </option>
          ))}
        </SelectField>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" busy={busy} disabled={busy}>
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
