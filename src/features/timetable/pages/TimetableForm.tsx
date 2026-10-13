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
import { classListKey, fetchClasses } from "../../classes/api";
import { fetchTeachers, teacherListKey } from "../../teachers/api";
import { timetableDayLabel, timetableStatusLabel } from "../display";
import { timetableFormSchema, type TimetableFormValues } from "../schemas";
import { TIMETABLE_DAYS, TIMETABLE_STATUSES, type TimetableClassRef, type TimetableTeacherRef } from "../types";

export function TimetableForm({
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
  initialValues: TimetableFormValues;
  savedClass: TimetableClassRef | null;
  savedTeacher: TimetableTeacherRef | null;
  cancelTo: string;
  submitLabel: string;
  pendingLabel: string;
  busy: boolean;
  serverError: ParsedApiError | null;
  onSubmit: (values: TimetableFormValues) => void;
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
    setValue,
    formState: { errors },
  } = useForm<TimetableFormValues>({
    resolver: zodResolver(timetableFormSchema),
    defaultValues: initialValues,
  });
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
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-60 flex-1">
            <TextField
              label="Find a class"
              name="classSearch"
              value={classSearch}
              onChange={(event) => setClassSearch(event.target.value)}
              hint="Required. The server does not check that this class is free at this time."
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
        <TextField label="Subject" error={errors.subject?.message} {...register("subject")} hint="Stored as text. There is no separate subject list." />
        <SelectField label="Day" error={errors.dayOfWeek?.message} {...register("dayOfWeek")}>
          {TIMETABLE_DAYS.map((day) => (
            <option key={day} value={day}>
              {timetableDayLabel(day)}
            </option>
          ))}
        </SelectField>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Start time"
            error={errors.startTime?.message}
            {...register("startTime")}
            hint="Stored as text. Overlap uses this text, so 09:00 and 9:00 are different."
          />
          <TextField label="End time" error={errors.endTime?.message} {...register("endTime")} hint="Stored as the text you enter." />
        </div>
        <TextField label="Room" error={errors.room?.message} {...register("room")} />
        <TextField label="Academic year" error={errors.academicYear?.message} {...register("academicYear")} />
        <SelectField label="Status" error={errors.status?.message} {...register("status")}>
          {TIMETABLE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {timetableStatusLabel(status)}
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
