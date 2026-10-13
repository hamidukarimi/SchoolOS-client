import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { TextField } from "../../../components/ui/TextField";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { classDetailKey, classListKey, fetchClass, fetchClasses } from "../../classes/api";
import { fetchTeachers, teacherListKey } from "../../teachers/api";
import {
  attendanceInvalidationKey,
  classDateAttendanceKey,
  createAttendance,
  fetchClassDateAttendance,
} from "../api";
import { attendanceStatusLabel, canSubmitAttendance, formatAttendanceDate } from "../display";
import { recordAttendanceSchema, toAttendanceCreatePayload, type RecordAttendanceValues } from "../schemas";
import { ATTENDANCE_STATUSES } from "../types";

export function RecordAttendancePage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
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
  } = useForm<RecordAttendanceValues>({
    resolver: zodResolver(recordAttendanceSchema),
    defaultValues: { studentId: "", classId: "", teacherId: "", date: "", status: "present", note: "" },
  });
  const classId = watch("classId");
  const teacherId = watch("teacherId");
  const date = watch("date");
  const studentId = watch("studentId");
  const classQuery = useQuery({
    queryKey: classDetailKey(classId),
    queryFn: () => fetchClass(classId),
    enabled: Boolean(classId),
  });
  const markedQuery = useQuery({
    queryKey: classDateAttendanceKey(classId, date),
    queryFn: () => fetchClassDateAttendance(classId, date),
    enabled: Boolean(classId) && /^\d{4}-\d{2}-\d{2}$/.test(date),
  });
  const mutation = useMutation({
    mutationFn: (values: RecordAttendanceValues) => createAttendance(toAttendanceCreatePayload(values)),
    onSuccess: async (message) => {
      setServerError(null);
      setNotice(message);
      setValue("studentId", "");
      setValue("note", "");
      await queryClient.invalidateQueries({ queryKey: attendanceInvalidationKey });
    },
    onError: (error) => {
      setNotice(null);
      setServerError(getApiErrorMessage(error));
    },
  });

  const markedStudentIds = (markedQuery.data?.attendance ?? [])
    .map((item) => item.student?.id)
    .filter((id): id is string => Boolean(id));
  const roster = (classQuery.data?.students ?? []).filter((student) => !markedStudentIds.includes(student.id));
  const allowSubmit = canSubmitAttendance({
    pending: mutation.isPending,
    studentId,
    classId,
    teacherId,
    date,
    markedStudentIds,
  });

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-pine uppercase">Administrator</p>
        <h1 className="mt-2 font-serif text-4xl">Record attendance</h1>
        <p className="mt-3 leading-7 text-slate-700">
          Each student is saved as a separate request. The server rejects a second record for the same
          student, class, and date. It does not check that the student is on the class list.
        </p>
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <form
        className="grid gap-4"
        noValidate
        onSubmit={handleSubmit((values) => {
          if (
            !canSubmitAttendance({
              pending: mutation.isPending,
              studentId: values.studentId,
              classId: values.classId,
              teacherId: values.teacherId,
              date: values.date,
              markedStudentIds,
            })
          ) {
            return;
          }
          mutation.mutate(values);
        })}
      >
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-60 flex-1">
            <TextField
              label="Find a class"
              name="classSearch"
              value={classSearch}
              onChange={(event) => setClassSearch(event.target.value)}
            />
          </div>
          <Button type="button" variant="secondary" onClick={() => setClassQueryText(classSearch.trim())}>
            Find class
          </Button>
        </div>
        {classesQuery.data ? (
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
            {classesQuery.data.classes.map((classRecord) => (
              <option key={classRecord.id} value={classRecord.id}>
                {classRecord.name}, section {classRecord.section}
              </option>
            ))}
          </SelectField>
        ) : null}
        <TextField label="Date" type="date" error={errors.date?.message} {...register("date")} />
        {classQuery.data ? (
          <p className="text-sm text-slate-700">
            {classQuery.data.teacher
              ? `Assigned teacher: ${classQuery.data.teacher.firstName} ${classQuery.data.teacher.lastName}.`
              : "This class has no assigned teacher. Choose a teacher before saving."}
          </p>
        ) : null}
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-60 flex-1">
            <TextField
              label="Find a teacher"
              name="teacherSearch"
              value={teacherSearch}
              onChange={(event) => setTeacherSearch(event.target.value)}
              hint="Required by the attendance record. The class teacher is selected when the class has one."
            />
          </div>
          <Button type="button" variant="secondary" onClick={() => setTeacherQueryText(teacherSearch.trim())}>
            Find teacher
          </Button>
        </div>
        <SelectField label="Teacher" error={errors.teacherId?.message} {...register("teacherId")}>
          <option value="">Select a teacher</option>
          {classQuery.data?.teacher ? (
            <option value={classQuery.data.teacher.id}>
              {classQuery.data.teacher.firstName} {classQuery.data.teacher.lastName}
              {classQuery.data.teacher.teacherId ? ` · ${classQuery.data.teacher.teacherId}` : ""}
            </option>
          ) : null}
          {(teachersQuery.data?.teachers ?? [])
            .filter((teacher) => teacher.id !== classQuery.data?.teacher?.id)
            .map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.firstName} {teacher.lastName} · {teacher.teacherId}
              </option>
            ))}
        </SelectField>
        <SelectField label="Student" error={errors.studentId?.message} {...register("studentId")}>
          <option value="">Select a student on this class</option>
          {roster.map((student) => (
            <option key={student.id} value={student.id}>
              {student.firstName} {student.lastName}
              {student.studentId ? ` · ${student.studentId}` : ""}
            </option>
          ))}
        </SelectField>
        {classQuery.data && classQuery.data.students.length === 0 ? (
          <p className="text-sm text-slate-600">This class did not return student names, so a student cannot be chosen here.</p>
        ) : null}
        <SelectField label="Status" error={errors.status?.message} {...register("status")}>
          {ATTENDANCE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {attendanceStatusLabel(status)}
            </option>
          ))}
        </SelectField>
        <TextField label="Note" error={errors.note?.message} {...register("note")} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" busy={mutation.isPending} disabled={!allowSubmit && !mutation.isPending}>
            {mutation.isPending ? "Saving" : "Save attendance"}
          </Button>
          <Link to="/app/attendance" className={buttonClass("secondary")}>
            Back to attendance
          </Link>
        </div>
      </form>
      {markedQuery.data ? (
        <section className="rounded-xl border border-line bg-white p-4">
          <h2 className="text-base font-medium">Already recorded for this class and date</h2>
          {markedQuery.data.totalPages > 1 ? (
            <p className="mt-2 text-sm text-slate-600">
              More than {markedQuery.data.attendance.length} records exist. Use the attendance list to see the rest.
            </p>
          ) : null}
          {markedQuery.data.attendance.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No attendance is recorded for this class on this date.</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {markedQuery.data.attendance.map((item) => (
                <li key={item.id} className="text-sm">
                  <Link to={`/app/attendance/${item.id}`} className="underline decoration-line underline-offset-4">
                    {item.student ? `${item.student.firstName} ${item.student.lastName}` : "Student name not returned"} ·{" "}
                    {attendanceStatusLabel(item.status)} · {formatAttendanceDate(item.date)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </section>
  );
}
