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
import { classDetailKey, fetchClass } from "../../classes/api";
import { createGrade, examGradeKey, fetchExamGrades, fetchExamOptions, gradeExamOptionsKey, gradeInvalidationKey } from "../api";
import { canSubmitGrade, formatStoredGrade } from "../display";
import { recordGradeSchema, toGradeCreatePayload, type RecordGradeValues } from "../schemas";

export function RecordGradePage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const [examSearch, setExamSearch] = useState("");
  const [examQueryText, setExamQueryText] = useState<string | null>(null);
  const examsQuery = useQuery({
    queryKey: gradeExamOptionsKey(examQueryText ?? ""),
    queryFn: () => fetchExamOptions(examQueryText ?? ""),
    enabled: examQueryText !== null,
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RecordGradeValues>({
    resolver: zodResolver(recordGradeSchema),
    defaultValues: {
      studentId: "",
      examId: "",
      classId: "",
      teacherId: "",
      subject: "",
      marksObtained: 0,
      totalMarks: 1,
      academicYear: "",
      remarks: "",
    },
  });
  const examId = watch("examId");
  const classId = watch("classId");
  const teacherId = watch("teacherId");
  const subject = watch("subject");
  const academicYear = watch("academicYear");
  const studentId = watch("studentId");
  const marksObtained = watch("marksObtained");
  const totalMarks = watch("totalMarks");
  const selectedExam = examsQuery.data?.exams.find((exam) => exam.id === examId);
  const classQuery = useQuery({
    queryKey: classDetailKey(classId),
    queryFn: () => fetchClass(classId),
    enabled: Boolean(classId),
  });
  const gradedQuery = useQuery({
    queryKey: examGradeKey(examId),
    queryFn: () => fetchExamGrades(examId),
    enabled: Boolean(examId),
  });
  const mutation = useMutation({
    mutationFn: (values: RecordGradeValues) => createGrade(toGradeCreatePayload(values)),
    onSuccess: async (message) => {
      setServerError(null);
      setNotice(message);
      setValue("studentId", "");
      setValue("marksObtained", 0);
      setValue("remarks", "");
      await queryClient.invalidateQueries({ queryKey: gradeInvalidationKey });
    },
    onError: (error) => {
      setNotice(null);
      setServerError(getApiErrorMessage(error));
    },
  });

  const gradedStudentIds = (gradedQuery.data?.grades ?? [])
    .map((item) => item.student?.id)
    .filter((id): id is string => Boolean(id));
  const roster = (classQuery.data?.students ?? []).filter((student) => !gradedStudentIds.includes(student.id));
  const allowSubmit = canSubmitGrade({
    pending: mutation.isPending,
    studentId,
    examId,
    classId,
    teacherId,
    subject,
    academicYear,
    marksObtained,
    totalMarks,
    gradedStudentIds,
  });

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-pine uppercase">Administrator</p>
        <h1 className="mt-2 font-serif text-4xl">Record a result</h1>
        <p className="mt-3 leading-7 text-slate-700">
          Each student is saved as a separate request for one existing exam. The server rejects a second
          result for the same student and exam. It does not check that the student is on the class list,
          and it does not require the marks to stay within the total.
        </p>
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <form
        className="grid gap-4"
        noValidate
        onSubmit={handleSubmit((values) => {
          if (
            !canSubmitGrade({
              pending: mutation.isPending,
              studentId: values.studentId,
              examId: values.examId,
              classId: values.classId,
              teacherId: values.teacherId,
              subject: values.subject,
              academicYear: values.academicYear,
              marksObtained: values.marksObtained,
              totalMarks: values.totalMarks,
              gradedStudentIds,
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
              label="Find an exam"
              name="examSearch"
              value={examSearch}
              onChange={(event) => setExamSearch(event.target.value)}
              hint="Leave this blank to load the first exams, or enter a subject. Title search is not available."
            />
          </div>
          <Button type="button" variant="secondary" onClick={() => setExamQueryText(examSearch.trim())}>
            Find exam
          </Button>
        </div>
        {examsQuery.isLoading ? <p className="text-sm text-slate-600">Loading exams</p> : null}
        {examsQuery.error ? <ServerErrorAlert error={getApiErrorMessage(examsQuery.error)} /> : null}
        {examsQuery.data && examsQuery.data.exams.length === 0 ? (
          <p className="text-sm text-slate-600">
            No exams were returned. A result needs an existing exam. Creating exams is not part of this page.
          </p>
        ) : null}
        {examsQuery.data && examsQuery.data.exams.length > 0 ? (
          <SelectField
            label="Exam"
            error={errors.examId?.message}
            {...register("examId", {
              onChange: (event) => {
                const selected = examsQuery.data?.exams.find((item) => item.id === event.target.value);
                setValue("classId", selected?.classRef?.id ?? "");
                setValue("teacherId", selected?.teacher?.id ?? "");
                setValue("subject", selected?.subject ?? "");
                setValue("academicYear", selected?.academicYear ?? "");
                setValue("totalMarks", selected?.totalMarks ?? 1);
                setValue("studentId", "");
              },
            })}
          >
            <option value="">Select an exam</option>
            {examsQuery.data.exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title} · {exam.subject || "No subject"} · {exam.academicYear || "No year"}
              </option>
            ))}
          </SelectField>
        ) : null}
        {examsQuery.data && examsQuery.data.totalPages > 1 ? (
          <p className="text-sm text-slate-600">More exams exist than this list shows. Narrow the subject to find another exam.</p>
        ) : null}
        <input type="hidden" {...register("classId")} />
        <input type="hidden" {...register("teacherId")} />
        <input type="hidden" {...register("subject")} />
        <input type="hidden" {...register("academicYear")} />
        {selectedExam ? (
          <div className="rounded-xl border border-line bg-white p-4 text-sm leading-6 text-slate-700">
            <p>
              {selectedExam.classRef
                ? `${selectedExam.classRef.name}, section ${selectedExam.classRef.section}`
                : "This exam did not return a class, so a result cannot be saved from it here."}
            </p>
            <p>
              {selectedExam.teacher
                ? `${selectedExam.teacher.firstName} ${selectedExam.teacher.lastName}`
                : "This exam did not return a teacher, so a result cannot be saved from it here."}
            </p>
            <p>
              {selectedExam.subject || "No subject"} · {selectedExam.academicYear || "No academic year"} · total{" "}
              {selectedExam.totalMarks} · passing {selectedExam.passingMarks}
            </p>
            <p>The class, teacher, subject, year, and total marks are copied from the exam onto this result.</p>
          </div>
        ) : null}
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
        <TextField
          label="Marks obtained"
          type="number"
          min={0}
          step="any"
          error={errors.marksObtained?.message}
          {...register("marksObtained", { valueAsNumber: true })}
        />
        <TextField
          label="Total marks"
          type="number"
          min={1}
          step="any"
          error={errors.totalMarks?.message}
          hint="Copied from the exam. The server stores this number on the result and does not compare it with the exam again."
          {...register("totalMarks", { valueAsNumber: true })}
        />
        {Number.isFinite(marksObtained) && Number.isFinite(totalMarks) && totalMarks >= 1 && marksObtained > totalMarks ? (
          <Alert tone="info" title="Marks are above the total">
            The server accepts this. The stored letter uses the percentage, including values over 100.
          </Alert>
        ) : null}
        <TextField label="Remarks" error={errors.remarks?.message} {...register("remarks")} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" busy={mutation.isPending} disabled={!allowSubmit && !mutation.isPending}>
            {mutation.isPending ? "Saving" : "Save result"}
          </Button>
          <Link to="/app/grades" className={buttonClass("secondary")}>
            Back to results
          </Link>
        </div>
      </form>
      {gradedQuery.data ? (
        <section className="rounded-xl border border-line bg-white p-4">
          <h2 className="text-base font-medium">Already recorded for this exam</h2>
          {gradedQuery.data.totalPages > 1 ? (
            <p className="mt-2 text-sm text-slate-600">
              More than {gradedQuery.data.grades.length} results exist for this exam. A student missing from this list can still be
              rejected by the server.
            </p>
          ) : null}
          {gradedQuery.data.grades.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No results are recorded for this exam.</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {gradedQuery.data.grades.map((item) => (
                <li key={item.id} className="text-sm">
                  <Link to={`/app/grades/${item.id}`} className="underline decoration-line underline-offset-4">
                    {item.student ? `${item.student.firstName} ${item.student.lastName}` : "Student name not returned"} ·{" "}
                    {item.marksObtained}/{item.totalMarks} · {formatStoredGrade(item.grade)}
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
