import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { TextField } from "../../../components/ui/TextField";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { classDetailKey, fetchClass } from "../../classes/api";
import { classStatusLabel } from "../../classes/display";
import { fetchStudents, studentListKey } from "../../students/api";
import { enrollStudent, removeStudentFromClass } from "../api";
import { availableStudentChoices, canSubmitEnrollment, enrollmentInvalidationKey, isClassFull } from "../rules";
import { enrollStudentSchema, type EnrollStudentValues } from "../schemas";

export function EnrollmentManagePage() {
  const { classId = "" } = useParams();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentQueryText, setStudentQueryText] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const classQuery = useQuery({
    queryKey: classDetailKey(classId),
    queryFn: () => fetchClass(classId),
    enabled: Boolean(classId),
  });
  const loadedClass = classQuery.data;
  const classIsFull = loadedClass ? isClassFull(loadedClass.studentCount, loadedClass.capacity) : false;
  const studentsQuery = useQuery({
    queryKey: studentListKey({ search: studentQueryText, status: "", page: 1 }),
    queryFn: () => fetchStudents({ search: studentQueryText, status: "", page: 1 }),
    enabled: Boolean(loadedClass) && !classIsFull,
  });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EnrollStudentValues>({
    resolver: zodResolver(enrollStudentSchema),
    defaultValues: { studentId: "" },
  });
  const selectedStudentId = watch("studentId");

  async function refreshClasses() {
    await queryClient.invalidateQueries({ queryKey: enrollmentInvalidationKey });
  }

  const enrollMutation = useMutation({
    mutationFn: (studentId: string) => enrollStudent(classId, studentId),
    onSuccess: async (message) => {
      setServerError(null);
      setNotice(message);
      reset({ studentId: "" });
      await refreshClasses();
    },
    onError: (error) => {
      setNotice(null);
      setServerError(getApiErrorMessage(error));
    },
  });
  const removeMutation = useMutation({
    mutationFn: (studentId: string) => removeStudentFromClass(classId, studentId),
    onSuccess: async (message) => {
      setServerError(null);
      setNotice(message);
      setConfirmingId(null);
      await refreshClasses();
    },
    onError: (error) => {
      setNotice(null);
      setServerError(getApiErrorMessage(error));
    },
  });

  if (classQuery.isLoading) return <FullPageSpinner label="Loading enrollment" />;

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
        <Link to="/app/enrollments" className={buttonClass("secondary")}>
          Back to enrollment
        </Link>
      </section>
    );
  }

  const classRecord = classQuery.data;
  const enrolledIds = classRecord.students.map((student) => student.id);
  const full = isClassFull(classRecord.studentCount, classRecord.capacity);
  const choices = availableStudentChoices(
    (studentsQuery.data?.students ?? []).map((student) => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      studentId: student.studentId,
    })),
    enrolledIds,
  );
  const allowEnroll = canSubmitEnrollment({
    studentId: selectedStudentId,
    pending: enrollMutation.isPending,
    studentCount: classRecord.studentCount,
    capacity: classRecord.capacity,
    enrolledIds,
  });

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-pine uppercase">Administrator</p>
        <h1 className="mt-2 font-serif text-4xl">
          {classRecord.name}, section {classRecord.section}
        </h1>
        <p className="mt-3 leading-7 text-slate-700">
          Grade {classRecord.grade} · {classRecord.academicYear} · {classStatusLabel(classRecord.status)}.{" "}
          {classRecord.studentCount} of {classRecord.capacity} seats are filled. Adding or removing a
          student changes this class list only.
        </p>
      </div>
      {classRecord.status === "inactive" ? (
        <Alert tone="info">This class is inactive. The API still accepts students for an inactive class.</Alert>
      ) : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {serverError ? <ServerErrorAlert error={serverError} /> : null}

      <section className="rounded-xl border border-line bg-white p-4">
        <h2 className="text-base font-medium">Students on this class list</h2>
        {classRecord.students.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No students are listed on this class.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {classRecord.students.map((student) => (
              <li key={student.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span>
                  {student.firstName} {student.lastName}
                  {student.studentId ? ` · ${student.studentId}` : ""}
                </span>
                {confirmingId === student.id ? (
                  <span className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="danger"
                      busy={removeMutation.isPending}
                      onClick={() => removeMutation.mutate(student.id)}
                    >
                      {removeMutation.isPending ? "Removing" : "Confirm remove"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setConfirmingId(null)}>
                      Cancel
                    </Button>
                  </span>
                ) : (
                  <Button type="button" variant="secondary" onClick={() => setConfirmingId(student.id)}>
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {classRecord.studentCount > classRecord.students.length ? (
          <p className="mt-3 text-sm text-slate-600">
            {classRecord.studentCount - classRecord.students.length} listed{" "}
            {classRecord.studentCount - classRecord.students.length === 1 ? "student has" : "students have"} no name in this response.
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border border-line bg-white p-4">
        <h2 className="text-base font-medium">Add a student</h2>
        {full ? (
          <p className="mt-3 text-sm leading-6 text-slate-700">
            This class is at full capacity. Remove a student before adding another.
          </p>
        ) : (
          <form
            className="mt-4 grid gap-4"
            noValidate
            onSubmit={handleSubmit((values) => {
              if (
                !canSubmitEnrollment({
                  studentId: values.studentId,
                  pending: enrollMutation.isPending,
                  studentCount: classRecord.studentCount,
                  capacity: classRecord.capacity,
                  enrolledIds,
                })
              ) {
                return;
              }
              setNotice(null);
              setServerError(null);
              enrollMutation.mutate(values.studentId);
            })}
          >
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-60 flex-1">
                <TextField
                  label="Find a student"
                  name="studentSearch"
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  hint="Matches first name, last name, or student ID. Students already on this class are hidden."
                />
              </div>
              <Button type="button" variant="secondary" onClick={() => setStudentQueryText(studentSearch.trim())}>
                Find
              </Button>
            </div>
            {studentsQuery.isLoading ? <p className="text-sm text-slate-600">Loading students</p> : null}
            {studentsQuery.error ? <ServerErrorAlert error={getApiErrorMessage(studentsQuery.error)} /> : null}
            {studentsQuery.data && studentsQuery.data.totalPages > 1 ? (
              <p className="text-sm text-slate-600">Showing the first 20 matches. Search again to narrow the list.</p>
            ) : null}
            <SelectField label="Student" error={errors.studentId?.message} {...register("studentId")}>
              <option value="">Select a student</option>
              {choices.map((choice) => (
                <option key={choice.id} value={choice.id}>
                  {choice.label}
                </option>
              ))}
            </SelectField>
            <Button type="submit" busy={enrollMutation.isPending} disabled={!allowEnroll && !enrollMutation.isPending}>
              {enrollMutation.isPending ? "Adding" : "Add to class"}
            </Button>
          </form>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <Link to="/app/enrollments" className={buttonClass("secondary")}>
          Back to enrollment
        </Link>
        <Link to={`/app/classes/${classRecord.id}`} className={buttonClass("ghost")}>
          Open class
        </Link>
      </div>
    </section>
  );
}
